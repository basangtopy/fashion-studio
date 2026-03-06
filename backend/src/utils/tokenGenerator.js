import crypto from "crypto";

// ─── Token Generation ──────────────────────────────────────────────────────
// Uses Node.js built-in crypto module (no npm install needed).
//
// Pattern:
//   1. Generate a random 32-byte token → rawToken  (sent via email)
//   2. SHA-256 hash it                 → hashedToken (stored in DB)
//
// Why hash? Same reason we hash passwords — if an attacker reads the DB,
// they can't use stored tokens to reset anyone's password.

export const generateToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex"); // 64-char hex string
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  return { rawToken, hashedToken };
};

// Used when verifying — hash the incoming raw token to compare against DB
export const hashToken = (rawToken) => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};
