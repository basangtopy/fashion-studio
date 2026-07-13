import prisma from "../config/prisma.js";

// Generates a human-readable order number: ORD-2026-0042
// Format: ORD-{YEAR}-{4-digit sequence padded with zeros}
// The sequence resets each year — so ORD-2026-0001 and ORD-2027-0001 can both exist
//
// Concurrency: takes a transaction-scoped Postgres advisory lock so concurrent
// order-creation transactions serialize here. A plain SELECT ... FOR UPDATE is
// not enough because it can't lock rows that don't exist yet — two concurrent
// FIRST orders of a year would both read "no rows" and both mint ...-0001.
// The advisory lock is released automatically when the transaction commits/rolls back.
//
// Must be called INSIDE a Prisma interactive transaction (pass the tx client)
// so the advisory lock is scoped to that transaction.

export const generateOrderNumber = async (tx) => {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;

  // Serialize all concurrent order-number generation on a single named lock.
  // Held until the surrounding transaction ends.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('order_number_gen'))`;

  // Fetch the highest existing order number for the current year.
  // Table is "orders" (Prisma @@map), not "Order".
  // $queryRaw returns an array of row objects.
  const rows = await tx.$queryRaw`
    SELECT "orderNumber"
    FROM "orders"
    WHERE "orderNumber" LIKE ${prefix + "%"}
    ORDER BY "orderNumber" DESC
    LIMIT 1
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

