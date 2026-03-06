// Base layout — wraps all emails in consistent branded structure
const baseTemplate = ({ title, preheader, body }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #F4F4F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .wrapper { width: 100%; background-color: #F4F4F4; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background-color: ${process.env.PRIMARY_COLOR || "#C2185B"}; padding: 32px 40px; text-align: center; }
    .header-title { color: #FFFFFF; font-size: 22px; font-weight: 700; margin: 8px 0 0 0; letter-spacing: 0.5px; }
    .body { padding: 40px; color: #333333; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
    .content { font-size: 15px; line-height: 1.7; color: #555555; }
    .highlight-box { background-color: #F8E8F0; border-left: 4px solid ${process.env.PRIMARY_COLOR || "#C2185B"}; padding: 16px 20px; border-radius: 0 6px 6px 0; margin: 24px 0; }
    .highlight-box p { margin: 0; font-size: 14px; color: #333333; }
    .highlight-box strong { color: ${process.env.PRIMARY_COLOR || "#C2185B"}; }
    .cta-button { display: inline-block; background-color: ${process.env.PRIMARY_COLOR || "#C2185B"}; color: #FFFFFF !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 600; margin: 24px 0; }
    .divider { border: none; border-top: 1px solid #EEEEEE; margin: 32px 0; }
    .footer { background-color: #FAFAFA; padding: 24px 40px; text-align: center; border-top: 1px solid #EEEEEE; }
    .footer p { margin: 4px 0; font-size: 12px; color: #999999; line-height: 1.6; }
    .footer a { color: ${process.env.PRIMARY_COLOR || "#C2185B"}; text-decoration: none; }
    .order-tag { display: inline-block; background-color: #F0F0F0; color: #555555; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; font-family: monospace; }
    @media only screen and (max-width: 600px) {
      .container { border-radius: 0; }
      .body { padding: 24px; }
      .header { padding: 24px; }
      .footer { padding: 20px 24px; }
    }
  </style>
</head>
<body>
  <!-- Preheader text (shows in email client preview) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <div class="wrapper">
    <div class="container">

      <!-- Header -->
      <div class="header">
        <div class="header-title">${process.env.EMAIL_FROM_NAME || "Fashion Studio"}</div>
      </div>

      <!-- Body -->
      <div class="body">
        ${body}
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>You're receiving this because you have an account with <strong>${process.env.EMAIL_FROM_NAME || "Fashion Studio"}</strong>.</p>
        <p>Questions? Reply to this email or contact us at <a href="mailto:${process.env.EMAIL_FROM}">${process.env.EMAIL_FROM}</a></p>
        <p style="margin-top:12px; color:#BBBBBB;">&copy; ${new Date().getFullYear()} ${process.env.EMAIL_FROM_NAME || "Fashion Studio"}. All rights reserved.</p>
      </div>

    </div>
  </div>
</body>
</html>
`;

// ─── Templates ─────────────────────────────────────────────────────────────

export const orderPlacedTemplate = ({ clientName, orderNumber }) =>
  baseTemplate({
    title: `Order Received — ${orderNumber}`,
    preheader: `Your order ${orderNumber} has been received and is under review.`,
    body: `
      <p class="greeting">Hi ${clientName} 👋</p>
      <div class="content">
        <p>Thank you for your order! We've received it and it's currently under review. You'll hear from us shortly with next steps.</p>
        <div class="highlight-box">
          <p>Order Reference: <strong class="order-tag">${orderNumber}</strong></p>
        </div>
        <p>You can track the progress of your order from your dashboard at any time.</p>
      </div>
    `,
  });

export const orderStatusTemplate = ({
  clientName,
  orderNumber,
  message,
  note,
}) =>
  baseTemplate({
    title: `Order Update — ${orderNumber}`,
    preheader: message,
    body: `
      <p class="greeting">Hi ${clientName},</p>
      <div class="content">
        <p>There's an update on your order:</p>
        <div class="highlight-box">
          <p>Order: <strong class="order-tag">${orderNumber}</strong></p>
          <p style="margin-top:10px;">${message}</p>
          ${note ? `<p style="margin-top:8px;font-style:italic;color:#777777;">${note}</p>` : ""}
        </div>
        <p>Log in to your dashboard to view full details and respond if needed.</p>
      </div>
    `,
  });

export const paymentConfirmedTemplate = ({ clientName, orderNumber, amount }) =>
  baseTemplate({
    title: `Payment Confirmed — ${orderNumber}`,
    preheader: `Your payment of ₦${Number(amount).toLocaleString()} has been confirmed.`,
    body: `
      <p class="greeting">Hi ${clientName},</p>
      <div class="content">
        <p>Great news — your payment has been confirmed! ✅</p>
        <div class="highlight-box">
          <p>Order: <strong class="order-tag">${orderNumber}</strong></p>
          <p style="margin-top:8px;">Amount Confirmed: <strong>₦${Number(amount).toLocaleString()}</strong></p>
        </div>
        <p>We'll keep you updated as your order progresses.</p>
      </div>
    `,
  });

export const paymentRejectedTemplate = ({ clientName, orderNumber, reason }) =>
  baseTemplate({
    title: `Payment Issue — ${orderNumber}`,
    preheader: `Your payment for order ${orderNumber} could not be confirmed.`,
    body: `
      <p class="greeting">Hi ${clientName},</p>
      <div class="content">
        <p>Unfortunately, we were unable to confirm your payment for the following reason:</p>
        <div class="highlight-box">
          <p>Order: <strong class="order-tag">${orderNumber}</strong></p>
          <p style="margin-top:8px;color:#D32F2F;"><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>Please resubmit your payment proof or reach out to us via chat on your order page and we'll help resolve this quickly.</p>
      </div>
    `,
  });

export const appointmentConfirmedTemplate = ({ clientName, dateStr }) =>
  baseTemplate({
    title: "Measurement Appointment Confirmed",
    preheader: `Your appointment is confirmed for ${dateStr}.`,
    body: `
      <p class="greeting">Hi ${clientName},</p>
      <div class="content">
        <p>Your measurement appointment has been confirmed! 🎉</p>
        <div class="highlight-box">
          <p>📅 <strong>Date:</strong> ${dateStr}</p>
        </div>
        <p>Please come in at the scheduled time. If you need to reschedule, please let us know as soon as possible via your dashboard or by replying to this email.</p>
      </div>
    `,
  });

export const appointmentCancelledTemplate = ({ clientName }) =>
  baseTemplate({
    title: "Appointment Cancelled",
    preheader: "Your measurement appointment has been cancelled.",
    body: `
      <p class="greeting">Hi ${clientName},</p>
      <div class="content">
        <p>Your measurement appointment has been cancelled.</p>
        <p>You can request a new appointment at any time from your dashboard. We're sorry for any inconvenience.</p>
      </div>
    `,
  });

export const passwordResetTemplate = ({ clientName, resetUrl }) =>
  baseTemplate({
    title: "Reset Your Password",
    preheader:
      "You requested a password reset. Click the link below to set a new password.",
    body: `
      <p class="greeting">Hi ${clientName},</p>
      <div class="content">
        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
        <div style="text-align:center;">
          <a href="${resetUrl}" class="cta-button">Reset Password</a>
        </div>
        <div class="highlight-box">
          <p>⏰ This link expires in <strong>1 hour</strong>.</p>
          <p style="margin-top:8px;">If you didn't request this, you can safely ignore this email — your password will not be changed.</p>
        </div>
      </div>
    `,
  });

export const emailVerificationTemplate = ({ clientName, verifyUrl }) =>
  baseTemplate({
    title: "Verify Your Email Address",
    preheader: "Please verify your email to complete your account setup.",
    body: `
      <p class="greeting">Hi ${clientName} 👋</p>
      <div class="content">
        <p>Welcome to ${process.env.EMAIL_FROM_NAME || "Fashion Studio"}! Please verify your email address to get the most out of your account:</p>
        <div style="text-align:center;">
          <a href="${verifyUrl}" class="cta-button">Verify Email</a>
        </div>
        <div class="highlight-box">
          <p>Once verified, you'll have full access to all features including placing orders and managing your profile.</p>
        </div>
      </div>
    `,
  });
