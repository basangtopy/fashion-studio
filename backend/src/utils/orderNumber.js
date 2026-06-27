import prisma from "../config/prisma.js";

// Generates a human-readable order number: ORD-2026-0042
// Format: ORD-{YEAR}-{4-digit sequence padded with zeros}
// The sequence resets each year — so ORD-2026-0001 and ORD-2027-0001 can both exist
// Uses SELECT ... FOR UPDATE via a raw query to serialize concurrent generation
// and prevent two transactions from reading the same "last" value simultaneously.
//
// Accepts an optional transaction client (tx) so it can be called INSIDE
// a Prisma interactive transaction — this prevents race conditions where
// two concurrent requests generate the same order number.

export const generateOrderNumber = async (tx) => {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;

  // Lock the matching rows so concurrent transactions queue here instead of
  // both reading the same last sequence number.
  // $queryRaw returns an array of row objects.
  const rows = await tx.$queryRaw`
    SELECT "orderNumber"
    FROM "Order"
    WHERE "orderNumber" LIKE ${prefix + "%"}
    ORDER BY "orderNumber" DESC
    LIMIT 1
    FOR UPDATE
  `;

  let nextSequence = 1;
  if (rows.length > 0) {
    const lastSequence = parseInt(rows[0].orderNumber.split("-")[2], 10);
    nextSequence = lastSequence + 1;
  }

  // Pad to 4 digits: 1 → "0001", 42 → "0042", 1000 → "1000"
  const padded = String(nextSequence).padStart(4, "0");
  
  return `${prefix}${padded}`;
};

