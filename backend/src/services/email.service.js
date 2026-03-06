import nodemailer from "nodemailer";

// Create transporter once — reused across all calls
// In production: use Resend's SMTP or another transactional provider
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_PORT === "465", // true for port 465 (SSL), false for 587 (TLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  // In development, skip sending and just log
  if (process.env.NODE_ENV === "development") {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    return { skipped: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Fashion Studio"}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ""), // strip HTML tags for plain text fallback
    });

    return info;
  } catch (error) {
    // Log but don't throw — a failed email should never crash a payment confirmation
    // or status update. The in-app notification and SSE push will still go through.
    console.error("[EMAIL ERROR]", error.message);
    return { error: error.message };
  }
};
