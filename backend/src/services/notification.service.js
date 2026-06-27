import prisma from "../config/prisma.js";
import { sendToUser } from "../utils/sseManager.js";
import { sendEmail } from "./email.service.js";
import { sendWhatsApp } from "./whatsapp.service.js";
import {
  orderPlacedTemplate,
  orderStatusTemplate,
  paymentConfirmedTemplate,
  paymentRejectedTemplate,
  appointmentConfirmedTemplate,
  appointmentCancelledTemplate,
} from "../utils/emailTemplates.js";

// ─── Core notification creator ─────────────────────────────────────────────
// Creates a DB record AND pushes via SSE if the user is currently connected

const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedOrderId = null,
}) => {
  // 1. Persist to database — user will see this even if they were offline
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, relatedOrderId, isRead: false },
  });

  // 2. Push in real time via SSE if the user is currently connected
  sendToUser(userId, "notification", {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedOrderId: notification.relatedOrderId,
    isRead: false,
    createdAt: notification.createdAt,
  });

  return notification;
};

// ─── Order placed ──────────────────────────────────────────────────────────

export const notifyOrderPlaced = async ({ order, client }) => {
  await createNotification({
    userId: client.id,
    type: "ORDER_PLACED",
    title: "Order Received",
    message: `Your order ${order.orderNumber} has been received and is under review.`,
    relatedOrderId: order.id,
  });

  // Notify all admins so the bell badge rings
  const admins = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "STAFF_ADMIN"] } },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: "ORDER_PLACED",
        title: "New Order Received",
        message: `${client.fullName} placed order ${order.orderNumber}.`,
        relatedOrderId: order.id,
      }),
    ),
  );

  await sendEmail({
    to: client.email,
    subject: `Order Received — ${order.orderNumber}`,
    html: orderPlacedTemplate({
      clientName: client.fullName,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      styleName: order.style?.name,
      styleImages: order.style?.images,
      customStyleDescription: order.customStyleDescription,
      customStyleImages: order.customStyleImages,
      items: order.items,
      fulfillmentMethod: order.fulfillmentMethod,
      deliveryAddress: order.deliveryAddress,
      totalAgreedFee: order.totalAgreedFee,
      createdAt: order.createdAt,
    }),
  });
};

// ─── Order status changed ──────────────────────────────────────────────────

export const notifyOrderStatusChanged = async ({
  order,
  client,
  newStatus,
  note,
}) => {
  const statusMessages = {
    AWAITING_CLIENT_RESPONSE:
      "A quote has been sent for your order. Please review and respond.",
    AGREED_AWAITING_PAYMENT:
      "Great! Your order is confirmed. Please proceed with payment.",
    IN_PROGRESS: "Work has begun on your order!",
    CUTTING: "Your fabric is being cut.",
    SEWING: "Your garment is being sewn.",
    FINISHING: "Your garment is in the finishing stage.",
    AWAITING_FINAL_PAYMENT:
      "Your garment is ready! Please complete your final payment.",
    READY_FOR_PICKUP: "Your order is ready for pickup!",
    OUT_FOR_DELIVERY: "Your order is on its way!",
    COMPLETED: "Your order is complete. Thank you!",
    CANCELLED: "Your order has been cancelled.",
  };

  const message =
    statusMessages[newStatus] ||
    `Your order status has been updated to ${newStatus}.`;

  await createNotification({
    userId: client.id,
    type: "ORDER_STATUS_UPDATED",
    title: `Order Update — ${order.orderNumber}`,
    message: note ? `${message} Note: ${note}` : message,
    relatedOrderId: order.id,
  });

  // Email for all status changes
  await sendEmail({
    to: client.email,
    subject: `Order Update — ${order.orderNumber}`,
    html: orderStatusTemplate({
      clientName: client.fullName,
      orderNumber: order.orderNumber,
      message,
      note,
      newStatus,
      orderType: order.orderType,
      fulfillmentMethod: order.fulfillmentMethod,
      totalAgreedFee: order.totalAgreedFee,
      totalPaid: order.totalPaid,
    }),
  });

  // WhatsApp only for high-importance milestones
  const whatsappTriggers = [
    "IN_PROGRESS",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
  ];
  if (whatsappTriggers.includes(newStatus) && client.phone) {
    await sendWhatsApp({
      to: client.phone,
      body: `Hi ${client.fullName}! Update on your order *${order.orderNumber}*: ${message}`,
    });
  }
};

// ─── Payment confirmed ─────────────────────────────────────────────────────

export const notifyPaymentConfirmed = async ({ payment, order, client }) => {
  const msg = `Your payment of ₦${Number(payment.amount).toLocaleString()} for order ${order.orderNumber} has been confirmed.`;

  await createNotification({
    userId: client.id,
    type: "PAYMENT_CONFIRMED",
    title: "Payment Confirmed",
    message: msg,
    relatedOrderId: order.id,
  });

  await sendEmail({
    to: client.email,
    subject: `Payment Confirmed — ${order.orderNumber}`,
    html: paymentConfirmedTemplate({
      clientName: client.fullName,
      orderNumber: order.orderNumber,
      amount: payment.amount,
      paymentType: payment.paymentType,
      totalPaid: order.totalPaid,
      totalAgreedFee: order.totalAgreedFee,
    }),
  });
};

// ─── Payment rejected ──────────────────────────────────────────────────────

export const notifyPaymentRejected = async ({ payment, order, client }) => {
  const msg = `Your payment for order ${order.orderNumber} could not be confirmed. Reason: ${payment.rejectionReason}`;

  await createNotification({
    userId: client.id,
    type: "PAYMENT_REJECTED",
    title: "Payment Not Confirmed",
    message: msg,
    relatedOrderId: order.id,
  });

  await sendEmail({
    to: client.email,
    subject: `Payment Issue — ${order.orderNumber}`,
    html: paymentRejectedTemplate({
      clientName: client.fullName,
      orderNumber: order.orderNumber,
      reason: payment.rejectionReason,
      amount: payment.amount,
      totalAgreedFee: order.totalAgreedFee,
    }),
  });
};

// ─── New chat message ──────────────────────────────────────────────────────

export const notifyNewMessage = async ({
  message,
  recipientId,
  senderName,
  orderNumber,
  orderId,
}) => {
  await createNotification({
    userId: recipientId,
    type: "NEW_MESSAGE",
    title: `New message from ${senderName}`,
    message: `Re: Order ${orderNumber} — ${message.length > 60 ? message.slice(0, 60) + "…" : message}`,
    relatedOrderId: orderId,
  });

  // No email for chat — in-app + SSE is sufficient for messages
  // Email would be too noisy for back-and-forth chat
};

// ─── Appointment confirmation ──────────────────────────────────────────────

export const notifyAppointmentConfirmed = async ({ appointment, client }) => {
  const dateStr = appointment.confirmedDate
    ? new Date(appointment.confirmedDate).toLocaleDateString("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "a date to be communicated";

  const msg = `Your measurement appointment has been confirmed for ${dateStr}.`;

  await createNotification({
    userId: client.id,
    type: "MEASUREMENT_APPOINTMENT",
    title: "Appointment Confirmed",
    message: msg,
  });

  await sendEmail({
    to: client.email,
    subject: "Measurement Appointment Confirmed",
    html: appointmentConfirmedTemplate({
      clientName: client.fullName,
      dateStr,
    }),
  });

  // WhatsApp for appointment confirmation
  if (client.phone) {
    await sendWhatsApp({
      to: client.phone,
      body: `Hi ${client.fullName}! Your measurement appointment has been confirmed for *${dateStr}*. See you then! 🎉`,
    });
  }
};

// ─── Appointment cancelled ─────────────────────────────────────────────────

export const notifyAppointmentCancelled = async ({ appointment, client }) => {
  const msg =
    "Your measurement appointment has been cancelled. Please request a new one at your convenience.";

  await createNotification({
    userId: client.id,
    type: "MEASUREMENT_APPOINTMENT",
    title: "Appointment Cancelled",
    message: msg,
  });

  await sendEmail({
    to: client.email,
    subject: "Measurement Appointment Cancelled",
    html: appointmentCancelledTemplate({ clientName: client.fullName }),
  });

  if (client.phone) {
    await sendWhatsApp({
      to: client.phone,
      body: `Hi ${client.fullName}, your measurement appointment has been cancelled. Please visit the app to book a new one.`,
    });
  }
};
