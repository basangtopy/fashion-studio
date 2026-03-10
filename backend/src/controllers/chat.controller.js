import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import { uploadMultipleImages } from "../services/cloudinary.service.js";
import { sendToUsers } from "../utils/sseManager.js";
import { notifyNewMessage } from "../services/notification.service.js";

// ─── Helper: verify order access ──────────────────────────────────────────
// Returns the order if the requester has access to it

const getOrderWithAccess = async (orderId, user) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, clientId: true, orderNumber: true },
  });

  if (!order) throw new AppError("Order not found", 404);

  // Clients can only access their own order's chat
  if (user.role === "CLIENT" && order.clientId !== user.userId) {
    throw new AppError("Order not found", 404);
  }

  return order;
};

// ─── GET /chat/:orderId — Get all messages for an order ───────────────────

export const getMessages = async (req, res) => {
  const order = await getOrderWithAccess(req.params.orderId, req.user);

  const messages = await prisma.chatMessage.findMany({
    where: { orderId: order.id },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
    orderBy: { createdAt: "asc" }, // oldest first for chat display
  });

  return successResponse(res, 200, "Messages retrieved", {
    count: messages.length,
    messages,
  });
};

// ─── POST /chat/:orderId — Send a message ─────────────────────────────────

export const sendMessage = async (req, res) => {
  const order = await getOrderWithAccess(req.params.orderId, req.user);

  const messageText = req.body.message?.trim() || null;

  // Must have either text content or attachments
  if (!messageText && (!req.files || req.files.length === 0)) {
    throw new AppError(
      "Message must have text content or at least one attachment",
      400,
    );
  }

  // Upload attachments to Cloudinary if any
  let attachmentUrls = [];
  if (req.files && req.files.length > 0) {
    const results = await uploadMultipleImages(req.files, "chat-attachments");
    attachmentUrls = results.map((r) => r.secure_url);
  }

  const message = await prisma.chatMessage.create({
    data: {
      orderId: order.id,
      senderId: req.user.userId,
      senderRole: req.user.role,
      message: messageText,
      attachments: attachmentUrls,
      isRead: false,
    },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  });

  // ── Push new message via SSE to both parties ──
  // Determine who gets the push: client + all admins who might be viewing

  const admins = await prisma.user.findMany({
    where: { role: { in: ["STAFF_ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });

  const adminIds = admins.map((a) => a.id);
  const allPartyIds = [order.clientId, ...adminIds].filter(
    (id) => id !== req.user.userId, // don't push to the sender — they already see it
  );

  sendToUsers(allPartyIds, "chat_message", {
    orderId: order.id,
    orderNumber: order.orderNumber,
    message,
  });

  // ── Create notification for the recipient(s) ──
  // Notify all admins when a client sends a message, or the client when admin sends
  // Also sends notifications for image-only messages (not just text)
  if (req.user.role === "CLIENT") {
    // Notify all admins
    for (const adminId of adminIds) {
      await notifyNewMessage({
        message: messageText || "Sent an image",
        recipientId: adminId,
        senderName: message.sender.fullName,
        orderNumber: order.orderNumber,
        orderId: order.id,
      });
    }
  } else if (order.clientId) {
    // Admin sending to client
    await notifyNewMessage({
      message: messageText || "Sent an image",
      recipientId: order.clientId,
      senderName: message.sender.fullName,
      orderNumber: order.orderNumber,
      orderId: order.id,
    });
  }

  return successResponse(res, 201, "Message sent", { message });
};

// ─── PUT /chat/:orderId/read — Mark messages as read ──────────────────────

export const markAsRead = async (req, res) => {
  const order = await getOrderWithAccess(req.params.orderId, req.user);

  // Mark all messages NOT sent by this user as read
  const updated = await prisma.chatMessage.updateMany({
    where: {
      orderId: order.id,
      senderId: { not: req.user.userId }, // only messages FROM the other party
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  if (updated.count > 0) {
    // Notify the other party that their messages were read
    const admins = await prisma.user.findMany({
      where: { role: { in: ["STAFF_ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });

    const adminIds = admins.map((a) => a.id);
    const allPartyIds = [order.clientId, ...adminIds].filter(
      (id) => id !== req.user.userId,
    );

    sendToUsers(allPartyIds, "chat_read", {
      orderId: order.id,
      readBy: req.user.userId,
    });
  }

  return successResponse(res, 200, `${updated.count} messages marked as read`);
};

// ─── GET /admin/chat — Admin unified inbox ────────────────────────────────

export const getAdminInbox = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Get all orders that have at least one chat message
  // Ordered by most recent message first
  const [total, orders] = await Promise.all([
    prisma.order.count({
      where: { chatMessages: { some: {} } },
    }),
    prisma.order.findMany({
      where: { chatMessages: { some: {} } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        client: { select: { id: true, fullName: true } },
        chatMessages: {
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          take: 1, // only the most recent message per order
          select: {
            id: true,
            message: true,
            senderRole: true,
            isRead: true,
            createdAt: true,
            attachments: true,
          },
        },
        // Count unread messages from clients (admin hasn't read yet)
        _count: {
          select: {
            chatMessages: true,
          },
        },
      },
      orderBy: [
        // Orders with recent messages appear first
        // Prisma doesn't support ordering by a relation field directly,
        // so we sort in JS after fetching
        { updatedAt: "desc" }, { id: "asc" }],
      skip,
      take,
    }),
  ]);

  // Calculate unread count per order (messages from CLIENT that are unread)
  const inboxItems = await Promise.all(
    orders.map(async (order) => {
      const unreadCount = await prisma.chatMessage.count({
        where: {
          orderId: order.id,
          senderRole: "CLIENT",
          isRead: false,
        },
      });

      return {
        ...order,
        latestMessage: order.chatMessages[0] || null,
        unreadCount,
        chatMessages: undefined, // remove the raw array from the response
      };
    }),
  );

  return successResponse(res, 200, "Inbox retrieved", {
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / take),
    inbox: inboxItems,
  });
};
