import prisma from "../config/prisma.js";
import { Prisma } from "../../prisma/generated/prisma/client.ts";
import { successResponse } from "../utils/apiResponse.js";
import { exportDashboardToCSV, exportDashboardToPDF } from "../utils/dashboardExport.js";
import { getOnlineUserIds } from "../utils/sseManager.js";

// ─── GET /admin/dashboard ─────────────────────────────────────────────────
// Returns aggregated business metrics. Accepts optional ?from=&to= for
// period-based filtering. Includes time-series data for charts.

export const getDashboardStats = async (req, res) => {
  const { from, to } = req.query;

  // Build date filter for period-based metrics — supports from-only, to-only, or both
  const dateFilter = {};
  if (from || to) {
    dateFilter.createdAt = {};
    if (from) dateFilter.createdAt.gte = new Date(from);
    if (to) dateFilter.createdAt.lte = new Date(to);
  }

  const paymentDateFilter = {};
  if (from || to) {
    paymentDateFilter.confirmedAt = {};
    if (from) paymentDateFilter.confirmedAt.gte = new Date(from);
    if (to) paymentDateFilter.confirmedAt.lte = new Date(to);
  }

  // ── Run all queries in parallel ──────────────────────────────────────────
  const [
    totalClients,
    totalOrders,
    activeOrders,
    pendingPayments,
    pendingTestimonials,
    appointmentsPending,
    totalRevenue,
    ordersInPeriod,
    revenueInPeriod,
    newClientsInPeriod,
    ordersByStatus,
    ordersByType,
    recentOrders,
    unreadChats,
  ] = await Promise.all([
    // Snapshot counts (always current)
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.order.count(),
    prisma.order.count({
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
    }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.testimonial.count({ where: { status: "PENDING" } }),
    prisma.measurementAppointment.count({ where: { status: "REQUESTED" } }),

    // All-time revenue
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "CONFIRMED" },
    }),

    // Period-based counts
    prisma.order.count({ where: dateFilter }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "CONFIRMED", ...paymentDateFilter },
    }),
    prisma.user.count({ where: { role: "CLIENT", ...dateFilter } }),

    // Breakdowns (filtered by period)
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
      where: dateFilter,
    }),
    prisma.order.groupBy({
      by: ["orderType"],
      _count: true,
      where: dateFilter,
    }),

    // Recent orders (last 10)
    prisma.order.findMany({
      take: 10,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        orderNumber: true,
        orderType: true,
        status: true,
        totalAgreedFee: true,
        totalPaid: true,
        createdAt: true,
        customStyleDescription: true,
        clientProvidesFabric: true,
        fulfillmentMethod: true,
        deliveryAddress: true,
        client: { select: { fullName: true, email: true, phone: true } },
        style: { select: { name: true } },
        items: { select: { readyToWear: { select: { name: true } }, quantity: true } },
        payments: {
          select: { amount: true },
          where: { status: "CONFIRMED" }
        }
      },
    }),

    // Unread chat messages (sent by clients, not yet read)
    prisma.chatMessage.count({
      where: { senderRole: "CLIENT", isRead: false },
    }),
  ]);

  // ── Determine chart time-series grouping ────────────────────────────────
  // Dynamic granularity: daily (≤31d), weekly (≤90d), monthly (default)
  let granularity = "month";
  if (from && to) {
    const diffMs = new Date(to) - new Date(from);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays <= 31) {
      granularity = "day";
    } else if (diffDays <= 90) {
      granularity = "week";
    }
  }

  // ── Build parameterized time-series queries ──────────────────────────────
  // Uses Prisma.sql tagged templates for safe parameterization.
  // sqlFormat is safe (hardcoded from our own logic, not user input).

  const formatMap = {
    day: "YYYY-MM-DD",
    week: "IYYY-IW",
    month: "YYYY-MM",
  };
  const sqlFormat = formatMap[granularity];

  let revenueQuery;
  let ordersQuery;

  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date format for 'from' or 'to'" });
    }

    revenueQuery = Prisma.sql`
      SELECT
        TO_CHAR("confirmedAt", ${sqlFormat}) AS period,
        COALESCE(SUM(amount), 0) AS revenue
      FROM payments
      WHERE status = 'CONFIRMED'
        AND "confirmedAt" >= ${fromDate}::timestamp
        AND "confirmedAt" <= ${toDate}::timestamp
      GROUP BY period
      ORDER BY period ASC
    `;

    ordersQuery = Prisma.sql`
      SELECT
        TO_CHAR("createdAt", ${sqlFormat}) AS period,
        COUNT(*)::int AS count
      FROM orders
      WHERE 1=1
        AND "createdAt" >= ${fromDate}::timestamp
        AND "createdAt" <= ${toDate}::timestamp
      GROUP BY period
      ORDER BY period ASC
    `;
  } else {
    revenueQuery = Prisma.sql`
      SELECT
        TO_CHAR("confirmedAt", ${sqlFormat}) AS period,
        COALESCE(SUM(amount), 0) AS revenue
      FROM payments
      WHERE status = 'CONFIRMED'
        AND "confirmedAt" >= NOW() - INTERVAL '12 months'
      GROUP BY period
      ORDER BY period ASC
    `;

    ordersQuery = Prisma.sql`
      SELECT
        TO_CHAR("createdAt", ${sqlFormat}) AS period,
        COUNT(*)::int AS count
      FROM orders
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY period
      ORDER BY period ASC
    `;
  }

  // ── Run chart + outstanding queries in parallel ──────────────────────────
  const [
    revenueTimeSeries,
    ordersTimeSeries,
    outstandingOrders,
  ] = await Promise.all([
    prisma.$queryRaw(revenueQuery),
    prisma.$queryRaw(ordersQuery),

    // Outstanding Orders
    prisma.order.findMany({
      where: {
        status: {
          notIn: [
            "CANCELLED",
            "COMPLETED",
            "PENDING_REVIEW",
            "AWAITING_CLIENT_RESPONSE",
          ],
        },
        totalAgreedFee: { not: null },
      },
      select: {
        totalAgreedFee: true,
        totalPaid: true,
      },
    }),
  ]);

  // ── Format response ────────────────────────────────────────────────────
  const statusBreakdown = {};
  for (const row of ordersByStatus) {
    statusBreakdown[row.status] = row._count;
  }

  const typeBreakdown = {};
  for (const row of ordersByType) {
    typeBreakdown[row.orderType] = row._count;
  }

  // Build period label
  let periodLabel = "All time";
  if (from && to) {
    periodLabel = `${new Date(from).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${new Date(to).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }

  return successResponse(res, 200, "Dashboard stats retrieved", {
    // Snapshot counts
    totalClients,
    activeOrders,
    pendingPayments,
    pendingTestimonials,
    appointmentsPending,
    unreadChats,
    outstandingBalance: outstandingOrders.reduce((sum, o) => {
      const remaining = Number(o.totalAgreedFee) - Number(o.totalPaid || 0);
      return remaining > 0 ? sum + remaining : sum;
    }, 0),

    // Period-based metrics
    periodLabel,
    ordersInPeriod,
    revenueInPeriod: Number(revenueInPeriod._sum.amount || 0),
    newClientsInPeriod,

    // All-time totals
    totalOrders,
    totalRevenue: Number(totalRevenue._sum.amount || 0),

    // Breakdowns
    ordersByStatus: statusBreakdown,
    ordersByType: typeBreakdown,

    // Time-series (chart-ready)
    chartGranularity: granularity,
    revenueTimeSeries: revenueTimeSeries.map((r) => ({
      period: r.period,
      revenue: Number(r.revenue),
    })),
    ordersTimeSeries: ordersTimeSeries.map((r) => ({
      period: r.period,
      count: Number(r.count),
    })),

    // Recent activity
    recentOrders,
  });
};

// ─── GET /admin/dashboard/export ──────────────────────────────────────────
// Exports dashboard data as CSV or PDF.
// Query params: ?format=csv|pdf&from=&to=

export const exportDashboard = async (req, res) => {
  const { format, from, to } = req.query;

  if (!format || !["csv", "pdf"].includes(format)) {
    return res.status(400).json({
      success: false,
      message: "format query parameter is required (csv or pdf)",
    });
  }

  // Build date filter
  const dateFilter =
    from && to ? { createdAt: { gte: new Date(from), lte: new Date(to) } } : {};

  const paymentDateFilter =
    from && to
      ? { confirmedAt: { gte: new Date(from), lte: new Date(to) } }
      : {};

  // Get key stats
  const [
    totalClients,
    totalOrders,
    activeOrders,
    totalRevenue,
    ordersInPeriod,
    revenueInPeriod,
    newClientsInPeriod,
    ordersByStatus,
    ordersByType,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.order.count(),
    prisma.order.count({
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "CONFIRMED" },
    }),
    prisma.order.count({ where: dateFilter }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "CONFIRMED", ...paymentDateFilter },
    }),
    prisma.user.count({ where: { role: "CLIENT", ...dateFilter } }),
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
      where: dateFilter,
    }),
    prisma.order.groupBy({
      by: ["orderType"],
      _count: true,
      where: dateFilter,
    }),
  ]);

  const periodLabel =
    from && to
      ? `${new Date(from).toLocaleDateString()} – ${new Date(to).toLocaleDateString()}`
      : "All time";

  // ── Normalise Prisma aggregates and dispatch to export utility ──
  const data = {
    periodLabel,
    totalClients,
    totalOrders,
    activeOrders,
    totalRevenue: Number(totalRevenue._sum.amount || 0),
    ordersInPeriod,
    revenueInPeriod: Number(revenueInPeriod._sum.amount || 0),
    newClientsInPeriod,
    ordersByStatus,
    ordersByType,
  };
  const filename = `dashboard-${new Date().toISOString().split("T")[0]}`;

  if (format === "csv") {
    return exportDashboardToCSV(res, data, filename);
  } else {
    return await exportDashboardToPDF(res, data, filename);
  }
};

// ─── GET /admin/dashboard/online-count ────────────────────────────────────────
// Returns the count of currently online CLIENT-role users (excludes admins).
// Driven by the in-memory SSE registry — no DB round-trip for the presence
// check itself, but we do a single DB query to filter out admin connections.

export const getOnlineClientsCount = async (req, res) => {
  const onlineIds = getOnlineUserIds();

  if (onlineIds.length === 0) {
    return successResponse(res, 200, "Online clients count", { onlineClients: 0 });
  }

  // Filter to only CLIENT-role users among the connected IDs
  const onlineClients = await prisma.user.count({
    where: {
      id: { in: onlineIds },
      role: "CLIENT",
    },
  });

  return successResponse(res, 200, "Online clients count", { onlineClients });
};

// ─── GET /admin/dashboard/search ──────────────────────────────────────────────
// Global search for the Admin Command Palette

export const globalSearch = async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== "string" || q.trim().length === 0) {
    return successResponse(res, 200, "Search results", {
      orders: [],
      clients: [],
      styles: [],
      rtw: [],
    });
  }

  const query = q.trim();

  try {
    const [orders, clients, styles, rtw] = await Promise.all([
      // 1. Orders matching order number
      prisma.order.findMany({
        where: {
          orderNumber: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          client: { select: { fullName: true } }
        },
        take: 5,
      }),
      // 2. Clients matching name or email
      prisma.user.findMany({
        where: {
          role: "CLIENT",
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } }
          ],
        },
        select: {
          id: true,
          fullName: true,
          email: true,
        },
        take: 5,
      }),
      // 3. Styles matching name
      prisma.style.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
        take: 5,
      }),
      // 4. RTW matching name
      prisma.readyToWear.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
        take: 5,
      })
    ]);

    return successResponse(res, 200, "Search results", {
      orders,
      clients,
      styles,
      rtw,
    });
  } catch (error) {
    console.error("Global search error:", error);
    return res.status(500).json({ status: "error", message: "Failed to perform global search" });
  }
};
