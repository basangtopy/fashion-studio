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
    .detail-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .detail-table td { padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #F0F0F0; }
    .detail-table td:first-child { color: #888888; font-weight: 500; width: 40%; }
    .detail-table td:last-child { color: #333333; font-weight: 600; }
    .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .items-table th { padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #888888; border-bottom: 2px solid #EEEEEE; text-align: left; }
    .items-table td { padding: 10px 12px; font-size: 14px; color: #333333; border-bottom: 1px solid #F0F0F0; }
    .items-table .total-row td { border-top: 2px solid #EEEEEE; font-weight: 700; color: ${process.env.PRIMARY_COLOR || "#C2185B"}; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
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
    ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <div class="wrapper">
    <div class="container">

      <!-- Header -->
      <div class="header">
        ${process.env.BRAND_LOGO_URL ? `<img src="${process.env.BRAND_LOGO_URL}" alt="${process.env.EMAIL_FROM_NAME || "Fashion Studio"}" height="60" style="max-height:60px;width:auto;margin-bottom:8px;" />` : ""}
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

// ─── Label helpers ──────────────────────────────────────────────────────────

const ORDER_TYPE_LABELS = {
  MODEL_1: "Bespoke — Client Provides Fabric",
  MODEL_2: "Bespoke — Designer Sources Fabric",
  MODEL_3: "Ready-to-Wear Purchase",
};

const STATUS_LABELS = {
  PENDING_REVIEW: "Pending Review",
  AWAITING_CLIENT_RESPONSE: "Awaiting Your Response",
  AGREED_AWAITING_PAYMENT: "Agreed — Awaiting Payment",
  IN_PROGRESS: "In Progress",
  CUTTING: "Cutting",
  SEWING: "Sewing",
  FINISHING: "Finishing",
  AWAITING_FINAL_PAYMENT: "Awaiting Final Payment",
  READY_FOR_PICKUP: "Ready for Pickup",
  OUT_FOR_DELIVERY: "Out for Delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const formatCurrency = (amount) =>
  amount != null ? `₦${Number(amount).toLocaleString()}` : "—";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

// ─── Reusable order summary block ───────────────────────────────────────────
// Builds an HTML detail table from an array of { label, value } rows.
// Rows with falsy values are automatically skipped.

const buildDetailRows = (rows) =>
  rows
    .filter((r) => r.value != null && r.value !== "" && r.value !== false)
    .map(
      (r) => `
      <tr>
        <td>${r.label}</td>
        <td>${r.value}</td>
      </tr>`,
    )
    .join("");

// Builds item rows for MODEL_3 (ready-to-wear) orders
const buildItemsTable = (items) => {
  if (!items || items.length === 0) return "";

  const rows = items
    .map(
      (item) => `
      <tr>
        ${item.readyToWear?.images?.[0] ? `<td><img src="${item.readyToWear.images[0]}" alt="${item.readyToWear?.name || "Item"}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;vertical-align:middle;" /></td>` : `<td></td>`}
        <td>${item.readyToWear?.name || "Item"}</td>
        <td>${item.selectedSize}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.priceAtPurchase)}</td>
      </tr>`,
    )
    .join("");

  return `
    <table class="items-table">
      <thead>
        <tr>
          <th></th>
          <th>Item</th>
          <th>Size</th>
          <th>Qty</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

// Renders a single image thumbnail for style/reference images in emails.
// Uses a constrained size, rounded corners, and a descriptive alt text
// so the email remains readable when images are blocked by the email client.
const buildStyleImage = (url, altText = "Style reference") => {
  if (!url) return "";
  return `
    <div style="margin:16px 0;text-align:center;">
      <img
        src="${url}"
        alt="${altText}"
        width="220"
        style="max-width:220px;height:auto;border-radius:8px;border:1px solid #EEEEEE;"
      />
    </div>
  `;
};

// ─── Templates ─────────────────────────────────────────────────────────────

export const orderPlacedTemplate = ({
  clientName,
  orderNumber,
  orderType,
  styleName,
  styleImages,
  customStyleDescription,
  customStyleImages,
  items,
  fulfillmentMethod,
  deliveryAddress,
  totalAgreedFee,
  createdAt,
}) => {
  // Determine style display based on what's available
  const hasCustomStyle = !styleName && customStyleDescription;
  const styleLabel = styleName || (hasCustomStyle ? "Custom Style" : null);
  const styleImageUrl = styleName
    ? styleImages?.[0]              // catalogue style image
    : customStyleImages?.[0] || null; // client's reference image
  const styleAlt = styleName
    ? `Style: ${styleName}`
    : "Your reference image";

  return baseTemplate({
    title: `Order Received — ${orderNumber}`,
    preheader: `Your order ${orderNumber} has been received and is under review.`,
    body: `
      <p class="greeting">Hi ${clientName} 👋</p>
      <div class="content">
        <p>Thank you for your order! We've received it and it's currently under review. You'll hear from us shortly with next steps.</p>
        <div class="highlight-box">
          <p>Order Reference: <strong class="order-tag">${orderNumber}</strong></p>
        </div>

        <table class="detail-table">
          ${buildDetailRows([
            { label: "Order Type", value: ORDER_TYPE_LABELS[orderType] || orderType },
            { label: "Style", value: styleLabel },
            { label: "Fulfillment", value: fulfillmentMethod === "DELIVERY" ? "Delivery" : "Pickup" },
            { label: "Delivery Address", value: fulfillmentMethod === "DELIVERY" ? deliveryAddress : null },
            { label: "Estimated Total", value: totalAgreedFee ? formatCurrency(totalAgreedFee) : null },
            { label: "Date Placed", value: formatDate(createdAt) },
          ])}
        </table>

        ${hasCustomStyle ? `
        <div class="highlight-box" style="background-color:#F0F7FF;border-left-color:#1976D2;">
          <p style="font-weight:600;color:#1976D2;margin-bottom:8px;">Your Style Description</p>
          <p style="color:#333333;">${customStyleDescription}</p>
        </div>
        ` : ""}

        ${styleImageUrl ? buildStyleImage(styleImageUrl, styleAlt) : ""}

        ${orderType === "MODEL_3" && items && items.length > 0 ? buildItemsTable(items) : ""}

        <p>You can track the progress of your order from your dashboard at any time.</p>
      </div>
    `,
  });
};

export const orderStatusTemplate = ({
  clientName,
  orderNumber,
  message,
  note,
  newStatus,
  orderType,
  fulfillmentMethod,
  totalAgreedFee,
  totalPaid,
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
          ${newStatus ? `<p style="margin-top:10px;">Status: <span class="status-badge" style="background-color:#F0F0F0;">${STATUS_LABELS[newStatus] || newStatus}</span></p>` : ""}
          <p style="margin-top:10px;">${message}</p>
          ${note ? `<p style="margin-top:8px;font-style:italic;color:#777777;">${note}</p>` : ""}
        </div>

        ${orderType || totalAgreedFee != null ? `
        <table class="detail-table">
          ${buildDetailRows([
            { label: "Order Type", value: orderType ? (ORDER_TYPE_LABELS[orderType] || orderType) : null },
            { label: "Fulfillment", value: fulfillmentMethod ? (fulfillmentMethod === "DELIVERY" ? "Delivery" : "Pickup") : null },
            { label: "Total Fee", value: totalAgreedFee ? formatCurrency(totalAgreedFee) : null },
            { label: "Total Paid", value: totalPaid != null && Number(totalPaid) > 0 ? formatCurrency(totalPaid) : null },
            { label: "Remaining Balance", value: totalAgreedFee && totalPaid != null ? formatCurrency(Number(totalAgreedFee) - Number(totalPaid)) : null },
          ])}
        </table>
        ` : ""}

        <p>Log in to your dashboard to view full details and respond if needed.</p>
      </div>
    `,
  });

export const paymentConfirmedTemplate = ({
  clientName,
  orderNumber,
  amount,
  paymentType,
  totalPaid,
  totalAgreedFee,
}) =>
  baseTemplate({
    title: `Payment Confirmed — ${orderNumber}`,
    preheader: `Your payment of ${formatCurrency(amount)} has been confirmed.`,
    body: `
      <p class="greeting">Hi ${clientName},</p>
      <div class="content">
        <p>Great news — your payment has been confirmed! ✅</p>
        <div class="highlight-box">
          <p>Order: <strong class="order-tag">${orderNumber}</strong></p>
          <p style="margin-top:8px;">Amount Confirmed: <strong>${formatCurrency(amount)}</strong></p>
        </div>

        <table class="detail-table">
          ${buildDetailRows([
            { label: "Payment Type", value: paymentType === "INSTALLMENT" ? "Installment" : "Full Payment" },
            { label: "Total Paid So Far", value: totalPaid != null ? formatCurrency(totalPaid) : null },
            { label: "Total Order Fee", value: totalAgreedFee ? formatCurrency(totalAgreedFee) : null },
            { label: "Remaining Balance", value: totalAgreedFee && totalPaid != null ? formatCurrency(Math.max(0, Number(totalAgreedFee) - Number(totalPaid))) : null },
          ])}
        </table>

        <p>We'll keep you updated as your order progresses.</p>
      </div>
    `,
  });

export const paymentRejectedTemplate = ({
  clientName,
  orderNumber,
  reason,
  amount,
  totalAgreedFee,
}) =>
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

        <table class="detail-table">
          ${buildDetailRows([
            { label: "Amount Submitted", value: amount ? formatCurrency(amount) : null },
            { label: "Total Order Fee", value: totalAgreedFee ? formatCurrency(totalAgreedFee) : null },
          ])}
        </table>

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
