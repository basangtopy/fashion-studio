import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import {
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
} from "../services/notification.service.js";

// ─── POST /appointments ───────────────────────────────────────────────────
// Client requests a measurement appointment
export const createAppointment = async (req, res) => {
  const { requestedDate, clientNotes } = req.validatedBody;

  // Prevent a client from having multiple open appointment requests
  const existingOpen = await prisma.measurementAppointment.findFirst({
    where: {
      clientId: req.user.userId,
      status: { in: ["REQUESTED", "CONFIRMED"] }
    },
  });

  if (existingOpen) {
    throw new AppError(
      "You already have a pending appointment request. Please wait for the studio to respond before making another.",
      409,
    );
  }

  const appointment = await prisma.measurementAppointment.create({
    data: {
      clientId: req.user.userId,
      requestedDate: requestedDate ? new Date(requestedDate) : null,
      clientNotes: clientNotes || null,
      status: "REQUESTED",
    },
  });

  return successResponse(
    res,
    201,
    "Appointment request submitted successfully",
    {
      appointment,
    },
  );
};

// ─── GET /appointments/own ────────────────────────────────────────────────
// Client views their own appointment
export const getOwnAppointments = async (req, res) => {
  const appointments = await prisma.measurementAppointment.findMany({
    where: { clientId: req.user.userId },
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!appointments) {
    throw new AppError("Appointments not found", 404);
  }

  return successResponse(res, 200, "Appointments retrieved", {
    count: appointments.length,
    appointments,
  });
};

// ─── GET /appointments ────────────────────────────────────────────────────
// Admin views all appointments — filterable by status
export const getAppointments = async (req, res) => {
  const { status, clientId } = req.query;

  // Build dynamic where clause based on query params
  const where = {};
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;

  const appointments = await prisma.measurementAppointment.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(res, 200, "Appointments retrieved", {
    count: appointments.length,
    appointments,
  });
};

// ─── PUT /appointments/:id ────────────────────────────────────────────────
// Admin confirms, completes, or cancels an appointment
export const updateAppointment = async (req, res) => {
  const { id } = req.params;
  const { status, confirmedDate, adminNotes, cancelReason } = req.validatedBody;

  const appointment = await prisma.measurementAppointment.findUnique({
    where: { id },
    include: {
      client: { select: { fullName: true, email: true } },
    },
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  // Validate status transitions — you can't confirm a completed appointment, etc.
  const validTransitions = {
    REQUESTED: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["COMPLETED", "CANCELLED"],
    COMPLETED: [], // terminal state
    CANCELLED: [], // terminal state
  };

  if (!validTransitions[appointment.status].includes(status)) {
    throw new AppError(
      `Cannot transition appointment from ${appointment.status} to ${status}`,
      400,
    );
  }

  const updated = await prisma.measurementAppointment.update({
    where: { id },
    data: {
      status,
      confirmedDate: confirmedDate
        ? new Date(confirmedDate)
        : appointment.confirmedDate,
      adminNotes: adminNotes || appointment.adminNotes,
      cancelReason: cancelReason || appointment.cancelReason,
    },
    include: {
      client: { select: { fullName: true, email: true } },
    },
  });

  if (status === "CONFIRMED") {
    const client = await prisma.user.findUnique({
      where: { id: appointment.clientId },
      select: { id: true, fullName: true, email: true, phone: true },
    });
    await notifyAppointmentConfirmed({ appointment: updated, client });
  }

  if (status === "CANCELLED") {
    const client = await prisma.user.findUnique({
      where: { id: appointment.clientId },
      select: { id: true, fullName: true, email: true, phone: true },
    });
    await notifyAppointmentCancelled({ appointment: updated, client });
  }

  return successResponse(
    res,
    200,
    `Appointment ${status.toLowerCase()} successfully`,
    {
      appointment: updated,
    },
  );
};
