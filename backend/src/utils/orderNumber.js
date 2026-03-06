import prisma from "../config/prisma.js";

// Generates a human-readable order number: ORD-2026-0042
// Format: ORD-{YEAR}-{4-digit sequence padded with zeros}
// The sequence resets each year — so ORD-2026-0001 and ORD-2027-0001 can both exist
//
// Accepts an optional transaction client (tx) so it can be called INSIDE
// a Prisma interactive transaction — this prevents race conditions where
// two concurrent requests generate the same order number.

export const generateOrderNumber = async (tx = prisma) => {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;

  // Find the highest existing order number for this year
  const lastOrder = await tx.order.findFirst({
    where: {
      orderNumber: { startsWith: prefix },
    },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  let nextSequence = 1;

  if (lastOrder) {
    // Extract the numeric part from e.g. "ORD-2026-0042" → 42
    const lastSequence = parseInt(lastOrder.orderNumber.split("-")[2], 10);
    nextSequence = lastSequence + 1;
  }

  // Pad to 4 digits: 1 → "0001", 42 → "0042", 1000 → "1000"
  const padded = String(nextSequence).padStart(4, "0");

  return `${prefix}${padded}`;
};

