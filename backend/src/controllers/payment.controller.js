import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import { uploadImage } from "../services/cloudinary.service.js";
import {
  exportPaymentsToCSV,
  exportPaymentsToPDF,
} from "../utils/paymentExport.js";
import {
  notifyPaymentConfirmed,
  notifyPaymentRejected,
} from "../services/notification.service.js";

// ─── Helper: recalculate order.totalPaid ──────────────────────────────────
// Called after every payment confirmation
// Sums all CONFIRMED payments for the order and updates the order record

const recalculateTotalPaid = async (orderId) => {
  const result = await prisma.payment.aggregate({
    where: { orderId, status: "CONFIRMED" },
    _sum: { amount: true },
  });

  const totalPaid = result._sum.amount ?? 0;

  await prisma.order.update({
    where: { id: orderId },
    data: { totalPaid },
  });

  return totalPaid;
};

// ─── Helper: full payment include ─────────────────────────────────────────
const fullPaymentInclude = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      totalAgreedFee: true,
      totalPaid: true,
      status: true,
    },
  },
  client: { select: { id: true, fullName: true, email: true, phone: true } },
  confirmedBy: { select: { id: true, fullName: true } },
};

// ─── POST /payments — Client submits payment proof ─────────────────────────

export const submitPayment = async (req, res) => {
  const { orderId, amount, paymentType, notes } = req.validatedBody;

  // Verify the order belongs to this client
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      clientId: true,
      status: true,
      totalAgreedFee: true,
      totalPaid: true,
    },
  });

  if (!order) throw new AppError("Order not found", 404);

  if (order.clientId !== req.user.userId) {
    throw new AppError("Order not found", 404);
  }

  // Payment only makes sense on active orders
  const nonPayableStatuses = [
    "PENDING_REVIEW",
    "AWAITING_CLIENT_RESPONSE",
    "COMPLETED",
    "CANCELLED",
  ];
  if (nonPayableStatuses.includes(order.status)) {
    throw new AppError(
      `Payments cannot be submitted for orders with status: ${order.status}`,
      400,
    );
  }

  // Check if there's already a pending payment for this order
  // Prevent duplicate submissions while one is awaiting review
  const pendingPayment = await prisma.payment.findFirst({
    where: { orderId, status: "PENDING" },
  });

  if (pendingPayment) {
    throw new AppError(
      "You already have a payment pending review for this order. Please wait for confirmation before submitting another.",
      409,
    );
  }

  // Validate amount doesn't exceed outstanding balance
  if (order.totalAgreedFee) {
    const outstanding = Number(order.totalAgreedFee) - Number(order.totalPaid);
    if (Number(amount) > outstanding) {
      throw new AppError(
        `Amount exceeds outstanding balance. Outstanding: ₦${outstanding.toLocaleString()}`,
        400,
      );
    }
  }

  // Upload proof of payment if provided
  // Proof is optional — some clients may submit before uploading proof
  // Admin can request it via chat
  let proofUrl = null;
  if (req.file) {
    const result = await uploadImage(req.file.buffer, "payment-proofs", {
      folder: "payment-proofs",
    });
    proofUrl = result.secure_url;
  }

  const payment = await prisma.payment.create({
    data: {
      orderId,
      clientId: req.user.userId,
      amount,
      paymentType,
      proofUrl,
      notes: notes || null,
      status: "PENDING",
    },
    include: fullPaymentInclude,
  });

  return successResponse(
    res,
    201,
    "Payment submitted successfully. Awaiting confirmation.",
    {
      payment,
    },
  );
};

// ─── GET /payments/order/:orderId — Payment history for an order ───────────

export const getOrderPayments = async (req, res) => {
  const { orderId } = req.params;

  // Verify the order exists and the requester has access
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, clientId: true },
  });

  if (!order) throw new AppError("Order not found", 404);

  // Clients can only view payments for their own orders
  if (req.user.role === "CLIENT" && order.clientId !== req.user.userId) {
    throw new AppError("Order not found", 404);
  }

  const payments = await prisma.payment.findMany({
    where: { orderId },
    include: fullPaymentInclude,
    orderBy: { createdAt: "desc" },
  });

  return successResponse(res, 200, "Payments retrieved", {
    count: payments.length,
    payments,
  });
};

// ─── GET /admin/payments — All payments (admin) ────────────────────────────

export const getAdminPayments = async (req, res) => {
  const {
    status,
    orderId,
    clientId,
    from,
    to,
    page = 1,
    limit = 20,
  } = req.query;

  const where = {};
  if (status) where.status = status;
  if (orderId) where.orderId = orderId;
  if (clientId) where.clientId = clientId;

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      include: fullPaymentInclude,
      // PENDING first so admin sees what needs action immediately
      orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "asc" }],
      skip,
      take,
    }),
  ]);

  return successResponse(res, 200, "Payments retrieved", {
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / take),
    payments,
  });
};

// ─── PUT /admin/payments/:id/confirm ──────────────────────────────────────

export const confirmPayment = async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: { order: { select: { id: true, totalAgreedFee: true } } },
  });

  if (!payment) throw new AppError("Payment not found", 404);

  if (payment.status !== "PENDING") {
    throw new AppError(
      `Payment is already ${payment.status.toLowerCase()}`,
      400,
    );
  }

  // Atomic: confirm payment + recalculate totalPaid in a single transaction
  const { confirmed, newTotalPaid } = await prisma.$transaction(async (tx) => {
    const confirmedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "CONFIRMED",
        confirmedById: req.user.userId,
        confirmedAt: new Date(),
      },
      include: fullPaymentInclude,
    });

    // Recalculate order.totalPaid from all confirmed payments
    const result = await tx.payment.aggregate({
      where: { orderId: payment.orderId, status: "CONFIRMED" },
      _sum: { amount: true },
    });
    const totalPaid = result._sum.amount ?? 0;

    await tx.order.update({
      where: { id: payment.orderId },
      data: { totalPaid },
    });

    return { confirmed: confirmedPayment, newTotalPaid: totalPaid };
  });

  const client = await prisma.user.findUnique({
    where: { id: confirmed.clientId },
    select: { id: true, fullName: true, email: true, phone: true },
  });
  await notifyPaymentConfirmed({
    payment: confirmed,
    order: confirmed.order,
    client,
  });

  return successResponse(res, 200, "Payment confirmed", {
    payment: confirmed,
    orderTotalPaid: newTotalPaid,
    // Useful for the frontend to update the order display without a separate fetch
  });
};

// ─── PUT /admin/payments/:id/reject ───────────────────────────────────────

export const rejectPayment = async (req, res) => {
  const { rejectionReason } = req.validatedBody;

  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    select: { id: true, status: true, orderId: true },
  });

  if (!payment) throw new AppError("Payment not found", 404);

  if (payment.status !== "PENDING") {
    throw new AppError(
      `Payment is already ${payment.status.toLowerCase()}`,
      400,
    );
  }

  const rejected = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "REJECTED", rejectionReason },
    include: fullPaymentInclude,
  });

  const client = await prisma.user.findUnique({
    where: { id: rejected.clientId },
    select: { id: true, fullName: true, email: true, phone: true },
  });
  await notifyPaymentRejected({
    payment: rejected,
    order: rejected.order,
    client,
  });

  return successResponse(res, 200, "Payment rejected", { payment: rejected });
};

// ─── POST /admin/payments/offline — Log offline payment ───────────────────

export const logOfflinePayment = async (req, res) => {
  const { orderId, amount, paymentType, notes } = req.validatedBody;

  // Verify the order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      totalAgreedFee: true,
      totalPaid: true,
      clientId: true,
    },
  });

  if (!order) throw new AppError("Order not found", 404);

  const nonPayableStatuses = [
    "PENDING_REVIEW",
    "AWAITING_CLIENT_RESPONSE",
    "COMPLETED",
    "CANCELLED",
  ];
  if (nonPayableStatuses.includes(order.status)) {
    throw new AppError(
      `Payments cannot be logged for orders with status: ${order.status}`,
      400,
    );
  }

  // Offline payments are created as CONFIRMED immediately
  // No proof upload — admin is confirming they received it in person
  const payment = await prisma.payment.create({
    data: {
      orderId,
      clientId: order.clientId,
      amount,
      paymentType,
      proofUrl: null,
      notes: notes || "Offline payment logged by admin",
      status: "CONFIRMED",
      confirmedById: req.user.userId,
      confirmedAt: new Date(),
    },
    include: fullPaymentInclude,
  });

  // Immediately recalculate totalPaid
  const newTotalPaid = await recalculateTotalPaid(orderId);

  return successResponse(res, 201, "Offline payment logged and confirmed", {
    payment,
    orderTotalPaid: newTotalPaid,
  });
};

// ─── GET /admin/payments/export ───────────────────────────────────────────

export const exportPayments = async (req, res) => {
  // Validate query params via Zod manually (query params need different handling)
  const { format, status, orderId, from, to, withSummary } = req.query;

  if (!format || !["csv", "pdf"].includes(format)) {
    throw new AppError("format query param is required: csv or pdf", 400);
  }

  const where = {};
  if (status) where.status = status;
  if (orderId) where.orderId = orderId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const payments = await prisma.payment.findMany({
    where,
    include: fullPaymentInclude,
    orderBy: { createdAt: "desc" },
  });

  if (payments.length === 0) {
    throw new AppError("No payments found matching the filter criteria", 404);
  }

  const dateStamp = new Date().toISOString().split("T")[0];
  const filename = `payments-${dateStamp}`;

  if (format === "csv") {
    return exportPaymentsToCSV(res, payments, filename);
  }

  // PDF — optionally include a summary block at the top
  let summary = null;
  if (withSummary === "true") {
    const [totalRevenue, counts] = await Promise.all([
      prisma.payment.aggregate({
        where: { ...where, status: "CONFIRMED" },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
      }),
    ]);

    const countMap = {};
    for (const row of counts) {
      countMap[row.status] = row._count.status;
    }

    summary = {
      totalRevenue: totalRevenue._sum.amount ?? 0,
      totalPending: await prisma.payment
        .aggregate({
          where: { ...where, status: "PENDING" },
          _sum: { amount: true },
        })
        .then((r) => r._sum.amount ?? 0),
      totalCount: payments.length,
      confirmedCount: countMap["CONFIRMED"] ?? 0,
      pendingCount: countMap["PENDING"] ?? 0,
      rejectedCount: countMap["REJECTED"] ?? 0,
    };
  }

  return exportPaymentsToPDF(res, payments, filename, summary);
};

// ─── GET /admin/finance/summary ───────────────────────────────────────────

export const getFinanceSummary = async (req, res) => {
  const { from, to, type } = req.query;

  // Build date filter
  const dateFilter = {};
  if (from || to) {
    dateFilter.createdAt = {};
    if (from) dateFilter.createdAt.gte = new Date(from);
    if (to) dateFilter.createdAt.lte = new Date(to);
  }

  // Order type filter (applied to the order, not the payment)
  const orderFilter = type ? { order: { orderType: type } } : {};

  const confirmedFilter = {
    status: "CONFIRMED",
    ...dateFilter,
    ...orderFilter,
  };

  // Run all summary queries in parallel
  const [
    totalRevenue,
    pendingAmount,
    paymentsByType,
    revenueByOrderType,
    recentPayments,
    outstandingOrders,
    confirmedPaymentsRaw,
    orderStatusCounts,
  ] = await Promise.all([
    // Total confirmed revenue
    prisma.payment.aggregate({
      where: confirmedFilter,
      _sum: { amount: true },
      _count: { id: true },
    }),

    // Total pending (submitted but not yet confirmed)
    prisma.payment.aggregate({
      where: { status: "PENDING", ...dateFilter },
      _sum: { amount: true },
      _count: { id: true },
    }),

    // Revenue broken down by payment type (INSTALLMENT vs FULL)
    prisma.payment.groupBy({
      by: ["paymentType"],
      where: confirmedFilter,
      _sum: { amount: true },
      _count: { id: true },
    }),

    // Revenue broken down by order type (MODEL_1, MODEL_2, MODEL_3)
    // groupBy doesn't support nested relations, so we query orders directly
    prisma.order.findMany({
      where: {
        payments: { some: { status: "CONFIRMED", ...dateFilter } },
        ...(type ? { orderType: type } : {}),
      },
      select: {
        orderType: true,
        payments: {
          where: { status: "CONFIRMED" },
          select: { amount: true },
        },
      },
    }),

    // 5 most recent confirmed payments for a "recent activity" widget
    prisma.payment.findMany({
      where: confirmedFilter,
      include: {
        client: { select: { fullName: true } },
        order: { select: { orderNumber: true } },
      },
      orderBy: { confirmedAt: "desc" },
      take: 5,
    }),

    // Orders with outstanding balances (totalPaid < totalAgreedFee and not cancelled/completed)
    prisma.order
      .findMany({
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
          ...(type ? { orderType: type } : {}),
        },
        select: {
          id: true,
          orderNumber: true,
          orderType: true,
          totalAgreedFee: true,
          totalPaid: true,
          client: { select: { fullName: true } },
        },
      })
      .then((orders) =>
        // Filter in JS since Prisma can't compare two columns directly
        orders.filter((o) => Number(o.totalPaid) < Number(o.totalAgreedFee)),
      ),

    // Revenue time-series: fetch all confirmed payments with their dates
    // for building daily revenue breakdown
    prisma.payment.findMany({
      where: confirmedFilter,
      select: { amount: true, confirmedAt: true, createdAt: true },
      orderBy: { confirmedAt: "asc" },
    }),

    // Orders by status: count orders grouped by status (within date range if specified)
    prisma.order.groupBy({
      by: ["status"],
      where: {
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
        ...(type ? { orderType: type } : {}),
      },
      _count: { id: true },
    }),
  ]);

  // Process revenue by order type
  const revenueByType = { MODEL_1: 0, MODEL_2: 0, MODEL_3: 0 };
  for (const order of revenueByOrderType) {
    const orderTotal = order.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    revenueByType[order.orderType] =
      (revenueByType[order.orderType] || 0) + orderTotal;
  }

  // Process payment type breakdown
  const byPaymentType = {};
  for (const row of paymentsByType) {
    byPaymentType[row.paymentType] = {
      amount: row._sum.amount ?? 0,
      count: row._count.id,
    };
  }

  // Build revenue time-series (grouped by day)
  const revenueMap = {};
  for (const p of confirmedPaymentsRaw) {
    const dateKey = (p.confirmedAt || p.createdAt)
      .toISOString()
      .split("T")[0];
    revenueMap[dateKey] = (revenueMap[dateKey] || 0) + Number(p.amount);
  }
  const revenueTimeSeries = Object.entries(revenueMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totalRevenue]) => ({ date, totalRevenue }));

  // Build orders-by-status array for pie/donut chart
  const ordersByStatus = orderStatusCounts.map((row) => ({
    name: row.status,
    value: row._count.id,
  }));

  // Compute outstanding balance (sum of what's owed across all outstanding orders)
  const outstandingBalance = outstandingOrders.reduce(
    (sum, o) => sum + (Number(o.totalAgreedFee) - Number(o.totalPaid)),
    0,
  );

  return successResponse(res, 200, "Finance summary retrieved", {
    summary: {
      totalRevenue: totalRevenue._sum.amount ?? 0,
      totalConfirmed: totalRevenue._count.id,
      totalPending: pendingAmount._sum.amount ?? 0,
      pendingCount: pendingAmount._count.id,
      outstandingBalance,
    },
    byPaymentType,
    byOrderType: revenueByType,
    revenueTimeSeries,
    ordersByStatus,
    recentPayments,
    outstandingOrders: {
      count: outstandingOrders.length,
      orders: outstandingOrders,
    },
  });
};
