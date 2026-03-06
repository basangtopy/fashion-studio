import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";

// ─── Public: GET /testimonials ───────────────────────────────────────────────
// Returns only APPROVED testimonials, featured first, paginated

export const getPublicTestimonials = async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const [testimonials, total, ratingAgg] = await Promise.all([
    prisma.testimonial.findMany({
      where: { status: "APPROVED" },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      select: {
        id: true,
        clientName: true,
        rating: true,
        review: true,
        photoUrl: true,
        isFeatured: true,
        createdAt: true,
        // clientId excluded — public endpoint shouldn't expose internal IDs
      },
    }),
    prisma.testimonial.count({ where: { status: "APPROVED" } }),
    prisma.testimonial.aggregate({
      where: { status: "APPROVED" },
      _avg: { rating: true },
    }),
  ]);

  const globalAvgRating = ratingAgg._avg.rating || 0;

  return successResponse(res, 200, "Testimonials retrieved", {
    testimonials,
    globalAvgRating,
    globalTotal: total,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// ─── Client: POST /testimonials ──────────────────────────────────────────────
// Authenticated client submits their own testimonial (starts as PENDING)

export const submitTestimonial = async (req, res) => {
  const { rating, review, photoUrl } = req.validatedBody;
  const userId = req.user.userId;

  // Fetch client name for the testimonial display
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const testimonial = await prisma.testimonial.create({
    data: {
      clientId: userId,
      clientName: user.fullName,
      rating,
      review,
      photoUrl,
      source: "CLIENT_SUBMITTED",
      status: "PENDING", // requires admin approval
    },
  });

  return successResponse(res, 201, "Testimonial submitted for review", {
    testimonial,
  });
};

// ─── Admin: GET /admin/testimonials ──────────────────────────────────────────
// All testimonials (any status), filterable by status

export const getAdminTestimonials = async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const where = {};
  if (req.query.status) {
    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    if (validStatuses.includes(req.query.status)) {
      where.status = req.query.status;
    }
  }

  const [testimonials, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
      include: {
        client: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.testimonial.count({ where }),
  ]);

  return successResponse(res, 200, "Testimonials retrieved", {
    testimonials,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// ─── Admin: POST /admin/testimonials ─────────────────────────────────────────
// Admin creates a testimonial on behalf of a client (goes straight to APPROVED)

export const adminCreateTestimonial = async (req, res) => {
  const { clientName, rating, review, photoUrl, isFeatured } =
    req.validatedBody;

  const testimonial = await prisma.testimonial.create({
    data: {
      // clientId is null — admin-added for anonymous/offline clients
      clientName,
      rating,
      review,
      photoUrl,
      isFeatured,
      source: "ADMIN_ADDED",
      status: "APPROVED", // no moderation needed — admin is creating it
    },
  });

  return successResponse(res, 201, "Testimonial created", { testimonial });
};

// ─── Admin: PUT /admin/testimonials/:id ──────────────────────────────────────
// Admin approves, rejects, or toggles featured

export const updateTestimonialStatus = async (req, res) => {
  const { id } = req.params;
  const { status, isFeatured } = req.validatedBody;

  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Testimonial not found", 404);
  }

  // Build update data — only include fields that were provided
  const updateData = {};
  if (status !== undefined) updateData.status = status;
  if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

  // No-op detection
  if (Object.keys(updateData).length === 0) {
    return successResponse(res, 200, "No changes made", {
      testimonial: existing,
    });
  }

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: updateData,
  });

  return successResponse(res, 200, "Testimonial updated", { testimonial });
};
