import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";

// ─── GET /notifications ────────────────────────────────────────────────────

export const getNotifications = async (req, res) => {
  const { unreadOnly, page = 1, limit = 30 } = req.query;

  const where = { userId: req.user.userId };
  if (unreadOnly === "true") where.isRead = false;

  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * Math.min(parseInt(limit) || 30, 100);
  const take = Math.min(parseInt(limit) || 30, 100);

  const [total, unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: req.user.userId, isRead: false },
    }),
    prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip,
      take,
    }),
  ]);

  return successResponse(res, 200, "Notifications retrieved", {
    total,
    unreadCount, // always returned regardless of unreadOnly filter — used for badge
    page: parseInt(page),
    totalPages: Math.ceil(total / take),
    notifications,
  });
};

// ─── PUT /notifications/:id/read ──────────────────────────────────────────

export const markOneRead = async (req, res) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id },
    select: { id: true, userId: true },
  });

  if (!notification) throw new AppError("Notification not found", 404);

  // Users can only mark their own notifications as read
  if (notification.userId !== req.user.userId) {
    throw new AppError("Notification not found", 404);
  }

  await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });

  return successResponse(res, 200, "Notification marked as read");
};

// ─── PUT /notifications/read-all ──────────────────────────────────────────

export const markAllRead = async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: { userId: req.user.userId, isRead: false },
    data: { isRead: true },
  });

  return successResponse(
    res,
    200,
    `${result.count} notifications marked as read`,
  );
};
