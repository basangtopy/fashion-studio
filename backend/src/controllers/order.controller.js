import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import { getStockStatus } from "../utils/stockStatus.js";
import { uploadMultipleImages } from "../services/cloudinary.service.js";
import {
  notifyOrderPlaced,
  notifyOrderStatusChanged,
} from "../services/notification.service.js";

// ─── Status transition rules ───────────────────────────────────────────────

const ORDER_STATUS_TRANSITIONS = {
  PENDING_REVIEW: [
    "AWAITING_CLIENT_RESPONSE",
    "AGREED_AWAITING_PAYMENT",
    "CANCELLED",
  ],
  AWAITING_CLIENT_RESPONSE: ["AGREED_AWAITING_PAYMENT", "CANCELLED"],
  AGREED_AWAITING_PAYMENT: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["CUTTING", "CANCELLED"],
  CUTTING: ["SEWING", "CANCELLED"],
  SEWING: ["FINISHING", "CANCELLED"],
  FINISHING: [
    "AWAITING_FINAL_PAYMENT",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "CANCELLED",
  ],
  AWAITING_FINAL_PAYMENT: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_PICKUP: ["COMPLETED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [], // terminal
  CANCELLED: [], // terminal
};

// ─── Helper: build full order include ─────────────────────────────────────
// Reused in multiple queries — fetches all related data for a complete order view

const fullOrderInclude = {
  client: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      profilePicture: true,
    },
  },
  createdByAdmin: {
    select: { id: true, fullName: true },
  },
  style: {
    select: { id: true, name: true, category: true, images: true },
  },
  items: {
    include: {
      readyToWear: {
        select: {
          id: true,
          name: true,
          category: true,
          images: true,
          price: true,
        },
      },
    },
  },
  measurement: true,
  payments: {
    orderBy: { createdAt: "desc" },
  },
  statusHistory: {
    orderBy: { createdAt: "desc" },
    include: {
      changedBy: {
        select: { id: true, fullName: true, role: true },
      },
    },
  },
  portfolioEntry: {
    select: { id: true, isPublished: true, isFeatured: true },
  },
};

// ─── POST /orders — Client places an order ─────────────────────────────────

export const createOrder = async (req, res) => {
  const {
    orderType,
    styleId,
    customStyleDescription,
    items,
    clientProvidesFabric,
    fabricNotes,
    useSavedMeasurements,
    fulfillmentMethod,
    deliveryAddress,
    clientNotes,
  } = req.validatedBody;

  const clientId = req.user.userId;

  // ── Upload custom style images if provided ──
  let customStyleImageUrls = [];
  if (req.files && req.files.length > 0) {
    const results = await uploadMultipleImages(req.files, "custom-styles");
    customStyleImageUrls = results.map((r) => r.secure_url);
  }

  // ── Validate referenced records exist ──

  if (styleId) {
    const style = await prisma.style.findUnique({
      where: { id: styleId, isActive: true },
    });
    if (!style)
      throw new AppError(
        "Selected style not found or no longer available",
        404,
      );

    if (orderType === "MODEL_1" && !style.availableForModel1) {
      throw new AppError("This style is not available for Model 1 orders", 400);
    }
    if (orderType === "MODEL_2" && !style.availableForModel2) {
      throw new AppError("This style is not available for Model 2 orders", 400);
    }
  }

  // ── Get client's measurement record if they want to use it ──

  let measurementId = null;
  if (useSavedMeasurements && orderType !== "MODEL_3") {
    const measurement = await prisma.measurement.findFirst({
      where: { clientId },
      select: { id: true },
    });
    if (measurement) {
      measurementId = measurement.id;
    }
  }

  // ── Create the order and items in a transaction ──
  // Order number AND stock validation happen INSIDE the transaction
  // to prevent race conditions where two concurrent orders both pass
  // the stock check before either decrements.

  const order = await prisma.$transaction(async (tx) => {
    // Validate items and stock atomically inside the transaction
    const validatedItems = [];
    let totalAgreedFee = null;

    if (orderType === "MODEL_3" && items && items.length > 0) {
      totalAgreedFee = 0;
      for (const reqItem of items) {
        const dbItem = await tx.readyToWear.findUnique({
          where: { id: reqItem.readyToWearId, isActive: true },
        });
        if (!dbItem)
          throw new AppError(
            "Selected item not found or no longer available",
            404,
          );

        if (
          dbItem.stockStatus === "OUT_OF_STOCK" ||
          dbItem.stockCount < reqItem.quantity
        ) {
          throw new AppError(`Not enough stock for "${dbItem.name}"`, 400);
        }

        if (!dbItem.availableSizes.includes(reqItem.selectedSize)) {
          throw new AppError(
            `Size ${reqItem.selectedSize} is not available for "${dbItem.name}"`,
            400,
          );
        }

        validatedItems.push({
          readyToWearId: dbItem.id,
          selectedSize: reqItem.selectedSize,
          quantity: reqItem.quantity,
          priceAtPurchase: dbItem.price,
        });

        totalAgreedFee += Number(dbItem.price) * reqItem.quantity;
      }
    }

    const orderNumber = await generateOrderNumber(tx);

    // MODEL_3 (ready-to-wear) has fixed prices — skip PENDING_REVIEW
    const initialStatus = orderType === "MODEL_3" ? "AGREED_AWAITING_PAYMENT" : "PENDING_REVIEW";

    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        clientId,
        orderType,
        styleId: styleId || null,
        customStyleDescription: customStyleDescription || null,
        customStyleImages: customStyleImageUrls,
        clientProvidesFabric: clientProvidesFabric ?? orderType === "MODEL_1",
        fabricNotes: fabricNotes || null,
        measurementId,
        fulfillmentMethod,
        deliveryAddress: deliveryAddress || null,
        clientNotes: clientNotes || null,
        status: initialStatus,
        totalAgreedFee, // Populated automatically for Model 3
        totalPaid: 0,
        items:
          validatedItems.length > 0 ? { create: validatedItems } : undefined,
      },
      include: fullOrderInclude,
    });

    // Log the initial status
    await tx.orderStatusHistory.create({
      data: {
        orderId: newOrder.id,
        status: initialStatus,
        changedById: clientId,
        note: orderType === "MODEL_3"
          ? "Ready-to-wear order placed — awaiting payment"
          : "Order placed by client",
      },
    });

    // Decrease stock count for Model 3
    if (validatedItems.length > 0) {
      for (const item of validatedItems) {
        const currentItem = await tx.readyToWear.findUnique({
          where: { id: item.readyToWearId },
          select: { stockCount: true },
        });

        const newCount = Math.max(0, currentItem.stockCount - item.quantity);

        await tx.readyToWear.update({
          where: { id: item.readyToWearId },
          data: { stockCount: newCount, stockStatus: getStockStatus(newCount) },
        });
      }
    }

    return newOrder;
  });

  await notifyOrderPlaced({ order, client: order.client });

  return successResponse(res, 201, "Order placed successfully", { order });
};

// ─── GET /orders — Client's own orders ────────────────────────────────────

export const getClientOrders = async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;

  const where = { clientId: req.user.userId };
  if (status) where.status = status;
  if (type) where.orderType = type;

  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * Math.min(parseInt(limit) || 20, 100);
  const take = Math.min(parseInt(limit) || 20, 100);

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        style: { select: { id: true, name: true, images: true } },
        items: {
          include: {
            readyToWear: { select: { id: true, name: true, images: true } },
          },
        },
        payments: { where: { status: "CONFIRMED" }, select: { amount: true } },
        chatMessages: {
          where: { OR: [{ senderRole: "STAFF_ADMIN", isRead: false }, { senderRole: "SUPER_ADMIN", isRead: false }] },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  const formattedOrders = orders.map((order) => {
    const { chatMessages, ...rest } = order;
    return {
      ...rest,
      unreadMessages: chatMessages?.length || 0,
    };
  });

  return successResponse(res, 200, "Orders retrieved", {
    total,
    page: Math.max(parseInt(page) || 1, 1),
    totalPages: Math.ceil(total / take),
    orders: formattedOrders,
  });
};

// ─── GET /orders/:id — Single order detail (client: own only) ─────────────

export const getClientOrder = async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: fullOrderInclude,
  });

  if (!order) throw new AppError("Order not found", 404);

  // Clients can only view their own orders
  if (req.user.role === "CLIENT" && order.clientId !== req.user.userId) {
    throw new AppError("Order not found", 404);
    // Return 404 rather than 403 — don't confirm that the order exists
  }

  return successResponse(res, 200, "Order retrieved", { order });
};

// ─── PUT /orders/:id/accept-quote — Client accepts admin's quote ───────────

export const acceptQuote = async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { id: true, clientId: true, status: true, totalAgreedFee: true },
  });

  if (!order) throw new AppError("Order not found", 404);

  if (order.clientId !== req.user.userId) {
    throw new AppError("Order not found", 404);
  }

  if (order.status !== "AWAITING_CLIENT_RESPONSE") {
    throw new AppError("This order is not awaiting your response", 400);
  }

  if (!order.totalAgreedFee) {
    throw new AppError("No quote has been set for this order yet", 400);
  }

  // Atomic: update status + log history in a single transaction
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({
      where: { id: req.params.id },
      data: { status: "AGREED_AWAITING_PAYMENT" },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "AGREED_AWAITING_PAYMENT",
        changedById: req.user.userId,
        note: "Client accepted the quote",
      },
    });

    return result;
  });

  return successResponse(res, 200, "Quote accepted successfully", {
    order: updated,
  });
};

// ─── PUT /orders/:id/decline-quote — Client declines/negotiates ────────────

export const declineQuote = async (req, res) => {
  const { negotiationNote } = req.validatedBody;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { id: true, clientId: true, status: true, totalAgreedFee: true },
  });

  if (!order) throw new AppError("Order not found", 404);

  if (order.clientId !== req.user.userId) {
    throw new AppError("Order not found", 404);
  }

  if (order.status !== "AWAITING_CLIENT_RESPONSE") {
    throw new AppError("This order is not awaiting your response", 400);
  }

  // Move back to PENDING_REVIEW so admin knows to re-evaluate
  // The negotiation note goes into the status history for the admin to read
  // Atomic: update status + log history in a single transaction
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: req.params.id },
      data: { status: "PENDING_REVIEW" },
    });

    const formattedFee = Number(order.totalAgreedFee).toLocaleString();
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "PENDING_REVIEW",
        changedById: req.user.userId,
        note: negotiationNote
          ? `Client declined the quote of ₦${formattedFee}. Note: ${negotiationNote}`
          : `Client declined the quote of ₦${formattedFee}`,
      },
    });
  });

  return successResponse(
    res,
    200,
    "Quote declined. The studio will review and get back to you.",
    { status: "PENDING_REVIEW" },
  );
};

// ─── GET /admin/orders — All orders (admin) ────────────────────────────────

export const getAdminOrders = async (req, res) => {
  const { status, type, clientId, from, to, search, page = 1, limit = 20, sortBy = "createdAt", sortDir = "desc" } = req.query;

  const where = {};

  // Multi-status support: "PENDING_REVIEW,IN_PROGRESS" → array
  if (status) {
    const statuses = status.split(",").map(s => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      where.status = statuses[0];
    } else if (statuses.length > 1) {
      where.status = { in: statuses };
    }
  }

  if (type) where.orderType = type;
  if (clientId) where.clientId = clientId;

  // Search by order number or client name
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { client: { fullName: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Date range filter
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setUTCHours(23, 59, 59, 999);  // include the full end day
      where.createdAt.lte = toDate;
    }
  }

  // Pagination
  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * Math.min(parseInt(limit) || 20, 100);
  const take = Math.min(parseInt(limit) || 20, 100);

  // Sortable columns whitelist
  const allowedSortFields = ["createdAt", "totalAgreedFee", "orderNumber", "status", "orderType"];
  const orderField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const orderDirection = sortDir === "asc" ? "asc" : "desc";

  // Run count and data queries in parallel
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        client: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        style: { select: { id: true, name: true } },
        items: {
          include: { readyToWear: { select: { id: true, name: true } } },
        },
        payments: { where: { status: "CONFIRMED" }, select: { amount: true } },
      },
      orderBy: [{ [orderField]: orderDirection }, { id: "asc" }],
      skip,
      take,
    }),
  ]);

  return successResponse(res, 200, "Orders retrieved", {
    total,
    page: Math.max(parseInt(page) || 1, 1),
    totalPages: Math.ceil(total / take),
    orders,
  });
};

// ─── GET /admin/orders/:id — Full order detail (admin) ────────────────────

export const getAdminOrder = async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: fullOrderInclude,
  });

  if (!order) throw new AppError("Order not found", 404);

  return successResponse(res, 200, "Order retrieved", { order });
};

// ─── PUT /admin/orders/:id/status — Update order status ───────────────────

export const updateOrderStatus = async (req, res) => {
  const { status, note, cancellationReason } = req.validatedBody;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { id: true, status: true, orderType: true, clientId: true },
  });

  if (!order) throw new AppError("Order not found", 404);

  // Validate the transition is allowed
  const allowed = ORDER_STATUS_TRANSITIONS[order.status];
  if (!allowed.includes(status)) {
    throw new AppError(
      `Cannot transition order from ${order.status} to ${status}. ` +
      `Allowed transitions: ${allowed.join(", ") || "none (terminal state)"}`,
      400,
    );
  }

  const updateData = { status };
  if (cancellationReason && status === "CANCELLED") {
    updateData.cancellationReason = cancellationReason;
  }

  // Atomic: update status + log history in a single transaction
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({
      where: { id: req.params.id },
      data: updateData,
      include: fullOrderInclude,
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status,
        changedById: req.user.userId,
        note: note || null,
      },
    });

    return result;
  });

  const client = await prisma.user.findUnique({
    where: { id: order.clientId },
    select: { id: true, fullName: true, email: true, phone: true },
  });
  await notifyOrderStatusChanged({
    order: updated,
    client,
    newStatus: status,
    note,
  });

  return successResponse(res, 200, "Order status updated", { order: updated });
};

// ─── PUT /admin/orders/:id/quote — Admin proposes a fee ───────────────────

export const setOrderQuote = async (req, res) => {
  const { totalAgreedFee, adminNotes } = req.validatedBody;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { id: true, status: true, orderType: true },
  });

  if (!order) throw new AppError("Order not found", 404);

  // Quotes only apply to Model 1 and Model 2
  if (order.orderType === "MODEL_3") {
    throw new AppError(
      "Model 3 orders have fixed prices — quotes are not applicable",
      400,
    );
  }

  // Can only set quote when the order is under review or already has a quote
  if (!["PENDING_REVIEW", "AWAITING_CLIENT_RESPONSE"].includes(order.status)) {
    throw new AppError(
      "Quote can only be set when the order is pending review or awaiting client response",
      400,
    );
  }

  // Atomic: update order + log history in a single transaction
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({
      where: { id: req.params.id },
      data: {
        totalAgreedFee,
        adminNotes: adminNotes || undefined,
        status: "AWAITING_CLIENT_RESPONSE",
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "AWAITING_CLIENT_RESPONSE",
        changedById: req.user.userId,
        note: `Quote set: ₦${Number(totalAgreedFee).toLocaleString()}`,
      },
    });

    return result;
  });

  return successResponse(res, 200, "Quote sent to client", { order: updated });
};

// ─── PUT /admin/orders/:id/delivery-fee — Set delivery fee ────────────────

export const setDeliveryFee = async (req, res) => {
  const { deliveryFee, deliveryAddress } = req.validatedBody;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { id: true, fulfillmentMethod: true },
  });

  if (!order) throw new AppError("Order not found", 404);

  if (order.fulfillmentMethod !== "DELIVERY") {
    throw new AppError(
      "This order is for pickup — delivery fee is not applicable",
      400,
    );
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      deliveryFee,
      ...(deliveryAddress && { deliveryAddress }),
    },
  });

  return successResponse(res, 200, "Delivery fee set", { order: updated });
};

// ─── PUT /admin/orders/:id/admin-notes — Set admin notes ───────────────

export const setAdminNotes = async (req, res) => {
  const { adminNotes } = req.validatedBody;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { id: true, adminNotes: true },
  });

  if (!order) throw new AppError("Order not found", 404);

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      adminNotes: adminNotes ?? order.adminNotes ?? "",
    },
  });

  return successResponse(res, 200, "Admin notes added", { order: updated });
};

// ─── POST /admin/orders/:clientId — Admin creates order for walk-in client ─

export const adminCreateOrder = async (req, res) => {
  const { clientId } = req.params;

  // Verify the client exists
  const client = await prisma.user.findUnique({
    where: { id: clientId, role: "CLIENT" },
    select: { id: true, fullName: true, email: true, phone: true },
  });

  if (!client) throw new AppError("Client not found", 404);

  const {
    orderType,
    styleId,
    customStyleDescription,
    items,
    clientProvidesFabric,
    fabricNotes,
    useSavedMeasurements,
    fulfillmentMethod,
    deliveryAddress,
    clientNotes,
  } = req.validatedBody;

  // ── Upload custom style images if provided ──
  let customStyleImageUrls = [];
  if (req.files && req.files.length > 0) {
    const results = await uploadMultipleImages(req.files, "custom-styles");
    customStyleImageUrls = results.map((r) => r.secure_url);
  }

  // Same style validation as createOrder
  if (styleId) {
    const style = await prisma.style.findUnique({
      where: { id: styleId, isActive: true },
    });
    if (!style)
      throw new AppError(
        "Selected style not found or no longer available",
        404,
      );
    if (orderType === "MODEL_1" && !style.availableForModel1)
      throw new AppError("This style is not available for Model 1 orders", 400);
    if (orderType === "MODEL_2" && !style.availableForModel2)
      throw new AppError("This style is not available for Model 2 orders", 400);
  }


  // Get client's saved measurements
  let measurementId = null;
  if (useSavedMeasurements && orderType !== "MODEL_3") {
    const measurement = await prisma.measurement.findFirst({
      where: { clientId },
      select: { id: true },
    });
    if (measurement) measurementId = measurement.id;
  }

  // Create the order and items in a transaction
  // Order number generated INSIDE to prevent race conditions
  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber(tx);

     // Pre-validate items and stock for Model 3
    const validatedItems = [];
    let totalAgreedFee = null;

    if (orderType === "MODEL_3" && items && items.length > 0) {
      totalAgreedFee = 0;
      for (const reqItem of items) {
        const dbItem = await tx.readyToWear.findUnique({
          where: { id: reqItem.readyToWearId, isActive: true },
        });
        if (!dbItem)
          throw new AppError(
            "Selected item not found or no longer available",
            404,
          );

        if (
          dbItem.stockStatus === "OUT_OF_STOCK" ||
          dbItem.stockCount < reqItem.quantity
        ) {
          throw new AppError(`Not enough stock for "${dbItem.name}"`, 400);
        }

        if (!dbItem.availableSizes.includes(reqItem.selectedSize)) {
          throw new AppError(
            `Size ${reqItem.selectedSize} is not available for "${dbItem.name}"`,
            400,
          );
        }

        validatedItems.push({
          readyToWearId: dbItem.id,
          selectedSize: reqItem.selectedSize,
          quantity: reqItem.quantity,
          priceAtPurchase: dbItem.price,
        });

        totalAgreedFee += Number(dbItem.price) * reqItem.quantity;
      }
    }

    // MODEL_3 (ready-to-wear) has fixed prices — skip PENDING_REVIEW
    const initialStatus = orderType === "MODEL_3" ? "AGREED_AWAITING_PAYMENT" : "PENDING_REVIEW";

    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        clientId, // the client the order is FOR
        createdByAdminId: req.user.userId, // the admin who created it
        orderType,
        styleId: styleId || null,
        customStyleDescription: customStyleDescription || null,
        customStyleImages: customStyleImageUrls,
        clientProvidesFabric: clientProvidesFabric ?? orderType === "MODEL_1",
        fabricNotes: fabricNotes || null,
        measurementId,
        fulfillmentMethod,
        deliveryAddress: deliveryAddress || null,
        clientNotes: clientNotes || null,
        status: initialStatus,
        totalAgreedFee, // Populated automatically for Model 3
        totalPaid: 0,
        items:
          validatedItems.length > 0 ? { create: validatedItems } : undefined,
      },
      include: fullOrderInclude,
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: newOrder.id,
        status: initialStatus,
        changedById: req.user.userId,
        note: orderType === "MODEL_3"
          ? `Ready-to-wear order created by admin on behalf of ${client.fullName}`
          : `Order created by admin on behalf of ${client.fullName}`,
      },
    });

    // Stock decrease for Model 3
    if (validatedItems.length > 0) {
      for (const item of validatedItems) {
        const currentItem = await tx.readyToWear.findUnique({
          where: { id: item.readyToWearId },
          select: { stockCount: true },
        });

        const newCount = Math.max(0, currentItem.stockCount - item.quantity);

        await tx.readyToWear.update({
          where: { id: item.readyToWearId },
          data: { stockCount: newCount, stockStatus: getStockStatus(newCount) },
        });
      }
    }

    return newOrder;
  });

  // Issue 18: Send notification when admin creates order on behalf of client
  await notifyOrderPlaced({ order, client });

  return successResponse(
    res,
    201,
    "Order created successfully on behalf of client",
    { order },
  );
};
