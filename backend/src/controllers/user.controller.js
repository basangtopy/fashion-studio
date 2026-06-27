import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import { isUserOnline } from "../utils/sseManager.js";
import { uploadImage, deleteImages } from "../services/cloudinary.service.js";

// Reuse the same sanitize helper as auth
const sanitizeUser = (user) => {
  const {
    passwordHash,
    refreshToken,
    refreshTokenExpiry,
    emailVerifyToken,
    resetToken,
    resetTokenExpiry,
    ...safeUser
  } = user;
  return safeUser;
};

// ─── PUT /users/profile ───────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  const { fullName, phone, sex, dateOfBirth, address } = req.validatedBody;

  // Build update object — only include fields that were actually provided
  // This way a client can update just their phone without affecting other fields
  const updateData = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (phone !== undefined) updateData.phone = phone;
  if (sex !== undefined) updateData.sex = sex;
  if (address !== undefined) updateData.address = address;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);

  const updated = await prisma.user.update({
    where: { id: req.user.userId },
    data: updateData,
  });

  return successResponse(res, 200, "Profile updated successfully", {
    user: sanitizeUser(updated),
  });
};

// ─── PUT /users/password ──────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.validatedBody;

  // Fetch full user record including passwordHash
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  // OAuth users have no password — they can't use this endpoint
  if (!user.passwordHash) {
    throw new AppError(
      "Your account uses social login. Password change is not available.",
      400,
    );
  }

  // Verify the current password is correct
  const isCurrentValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );
  if (!isCurrentValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  // Hash and save the new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: req.user.userId },
    data: {
      passwordHash: newPasswordHash,
      // Invalidate all existing refresh tokens when password changes
      // Forces re-login on all devices — important security measure
      refreshToken: null,
      refreshTokenExpiry: null,
    },
  });

  return successResponse(
    res,
    200,
    "Password changed successfully. Please log in again.",
  );
};

// ─── PUT /users/profile-picture ───────────────────────────────────────────
export const updateProfilePicture = async (req, res) => {
  if (!req.file) {
    throw new AppError("No image file provided", 400);
  }

  // Find existing user to get old profile picture URL
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { profilePicture: true },
  });

  // Upload new image to Cloudinary 'avatars' folder
  const result = await uploadImage(req.file.buffer, "avatars");
  const newProfilePictureUrl = result.secure_url;

  // If user had an existing Cloudinary avatar, delete it to save space
  if (user.profilePicture) {
    try {
      await deleteImages([user.profilePicture]);
    } catch (err) {
      console.error("Failed to delete old profile picture from Cloudinary:", err);
    }
  }

  const updated = await prisma.user.update({
    where: { id: req.user.userId },
    data: { profilePicture: newProfilePictureUrl },
  });

  return successResponse(res, 200, "Profile picture updated successfully", {
    profilePicture: updated.profilePicture,
  });
};

// ─── Admin: GET /admin/clients ───────────────────────────────────────────────
// Admin views all clients — filterable and paginated
export const getAllClients = async (req, res) => {
  const {
    search, // search by name or email
    page = 1,
    limit = 20,
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  // Build the where clause dynamically
  const where = {
    role: "CLIENT", // only return clients, not other admins
  };

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  // Run count and data queries in parallel for efficiency
  const [total, clients] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        sex: true,
        profilePicture: true,
        authProvider: true,
        isEmailVerified: true,
        createdAt: true,
        // Include a summary of their orders
        _count: {
          select: { orders: true },
        },
        payments: {
          where: { status: "CONFIRMED" },
          select: { amount: true },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip,
      take: Number(limit),
    }),
  ]);

  const clientsWithStatus = clients.map((c) => {
    const totalPaid = (c.payments || []).reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const { payments, ...rest } = c;
    return { ...rest, totalPaid, online: isUserOnline(c.id) };
  });

  return successResponse(res, 200, "Clients retrieved", {
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    clients: clientsWithStatus,
  });
};

// ─── Admin: GET /admin/clients/:id ──────────────────────────────────────────
export const getClientById = async (req, res) => {
  const { id } = req.params;

  const client = await prisma.user.findUnique({
    where: { id, role: "CLIENT" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      sex: true,
      dateOfBirth: true,
      address: true,
      profilePicture: true,
      authProvider: true,
      isEmailVerified: true,
      createdAt: true,
      measurements: true,
      _count: {
        select: { orders: true, payments: true },
      },
    },
  });

  if (!client) {
    throw new AppError("Client not found", 404);
  }

  return successResponse(res, 200, "Client retrieved", {
    client: {
      ...client,
      online: isUserOnline(client.id),
    },
  });
};

// ─── Admin: GET /admin/clients/:id/online ──────────────────────────────────────────
export const getClientOnlineStatus = async (req, res) => {
  const exists = await prisma.user.findUnique({
    where: { id: req.params.id, role: "CLIENT" },
    select: { id: true },
  });

  if (!exists) throw new AppError("Client not found", 404);

  return successResponse(res, 200, "Status retrieved", {
    userId: req.params.id,
    online: isUserOnline(req.params.id),
  });
};

// ─── Admin: POST /admin/clients ──────────────────────────────────────────────
// Creates an account for a walk-in/offline client
export const createClientAccount = async (req, res) => {
  const { fullName, email, phone, sex, dateOfBirth, address } =
    req.validatedBody;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const client = await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      sex,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      address: address || null,
      role: "CLIENT",
      authProvider: "LOCAL",
      isEmailVerified: true, // admin-created accounts are pre-verified
      createdById: req.user.userId,
      // No password — client sets their own via password reset email
    },
  });

  return successResponse(res, 201, "Client account created successfully", {
    client: sanitizeUser(client),
  });
};

// ─── Admin: PUT /admin/clients/:id ──────────────────────────────────────────────
export const updateClientAccount = async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, sex, dateOfBirth, address } = req.validatedBody;

  const existing = await prisma.user.findUnique({
    where: { id, role: "CLIENT" },
  });

  if (!existing) {
    throw new AppError("Client not found", 404);
  }

  const updateData = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (phone !== undefined) updateData.phone = phone;
  if (sex !== undefined) updateData.sex = sex;
  if (address !== undefined) updateData.address = address;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return successResponse(res, 200, "Client account updated successfully", {
    client: sanitizeUser(updated),
  });
};

// ─── Super Admin: GET /admin/staff ────────────────────────────────────────────
// Lists all staff admin users (for role management)
export const getStaffAdmins = async (req, res) => {
  const { search } = req.query;

  const where = { role: "STAFF_ADMIN" };

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const staff = await prisma.user.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      email: true,
      profilePicture: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return successResponse(res, 200, "Staff admins retrieved", { staff });
};

// ─── Super Admin: PATCH /admin/users/:id/role ────────────────────────────────
// Changes a user's role — requires password re-confirmation
export const changeUserRole = async (req, res) => {
  const { id } = req.params;
  const { newRole, confirmPassword } = req.validatedBody;

  // 1. Only SUPER_ADMIN can change roles (enforced by middleware too, but double-check)
  if (req.user.role !== "SUPER_ADMIN") {
    throw new AppError("Only a Super Admin can change user roles", 403);
  }

  // 2. Prevent changing your own role
  if (id === req.user.userId) {
    throw new AppError("You cannot change your own role", 400);
  }

  // 3. Re-authenticate: verify the super admin's password
  const superAdmin = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { passwordHash: true },
  });

  if (!superAdmin || !superAdmin.passwordHash) {
    throw new AppError("Unable to verify your identity", 400);
  }

  const isPasswordValid = await bcrypt.compare(confirmPassword, superAdmin.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Incorrect password. Role change denied.", 403);
  }

  // 4. Find the target user
  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, fullName: true, email: true },
  });

  if (!targetUser) {
    throw new AppError("User not found", 404);
  }

  // 5. Prevent changing a SUPER_ADMIN's role
  if (targetUser.role === "SUPER_ADMIN") {
    throw new AppError("Cannot change the role of another Super Admin", 400);
  }

  // 6. Prevent setting role to SUPER_ADMIN
  if (newRole === "SUPER_ADMIN") {
    throw new AppError("Cannot promote a user to Super Admin", 400);
  }

  // 7. No-op check
  if (targetUser.role === newRole) {
    throw new AppError(`User is already a ${newRole === "STAFF_ADMIN" ? "Staff Admin" : "Client"}`, 400);
  }

  // 8. Update the role
  const updated = await prisma.user.update({
    where: { id },
    data: { role: newRole },
  });

  return successResponse(res, 200, `Role updated to ${newRole === "STAFF_ADMIN" ? "Staff Admin" : "Client"} successfully`, {
    user: sanitizeUser(updated),
  });
};
