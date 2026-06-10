import { format } from "@fast-csv/format";
import PDFDocument from "pdfkit";
import https from "https";
import http from "http";

// ─── Brand constants ────────────────────────────────────────────────────────
// Keep in sync with exportUtils.js
const BRAND = {
  name: "Deshé Fashion",
  tagline: "Designed for you. Crafted in Nigeria. Made to last.",
  address: "Abeokuta, Ogun State, Nigeria",
  email: "hello@yourstudio.com",
  phone: "+234 000 000 0000",
  colors: {
    primary: "#C2185B",
    secondary: "#1A1A2E",
    accent: "#F8E8F0",
    headerText: "#FFFFFF",
    bodyText: "#222222",
    labelText: "#555555",
    mutedText: "#999999",
    rowAlt: "#FAF7FC",
    border: "#E0D8E8",
  },
};

// ─── Logo cache ─────────────────────────────────────────────────────────────
// Fetched once on first PDF export then reused — mirrors exportUtils.js
let _logoBuffer = null;
let _logoFetchAttempted = false;

function fetchLogoBuffer() {
  if (_logoFetchAttempted) return Promise.resolve(_logoBuffer);
  _logoFetchAttempted = true;

  const url = process.env.BRAND_LOGO_URL;
  if (!url) return Promise.resolve(null);

  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          console.warn(`[paymentExport] Logo fetch failed: HTTP ${res.statusCode}`);
          return resolve(null);
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          _logoBuffer = Buffer.concat(chunks);
          resolve(_logoBuffer);
        });
      })
      .on("error", (err) => {
        console.warn(`[paymentExport] Logo fetch error: ${err.message}`);
        resolve(null);
      });
  });
}

// ─── PDF helpers ─────────────────────────────────────────────────────────────

/**
 * Draws the branded header strip on the current page.
 * @returns {number} y-position ready for content below the header.
 */
function drawBrandedHeader(doc, title, logoBuffer = null) {
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - margin * 2;
  const stripHeight = 50;

  // Dark background strip
  doc.rect(0, 0, pageWidth, stripHeight).fill(BRAND.colors.secondary);

  // Logo or business name (left)
  if (logoBuffer) {
    doc.image(logoBuffer, margin, 7, { height: 36, fit: [160, 36] });
  } else {
    doc
      .fontSize(17)
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.headerText)
      .text(BRAND.name, margin, 14, { width: contentWidth * 0.55, lineBreak: false });
  }

  // Tagline (right)
  doc
    .fontSize(7)
    .font("Helvetica-Oblique")
    .fillColor("#B0B0C0")
    .text(BRAND.tagline, margin, 18, {
      width: contentWidth,
      align: "right",
      lineBreak: false,
    });

  // Contact line (right, below tagline)
  doc
    .fontSize(6.5)
    .font("Helvetica")
    .fillColor("#9090A0")
    .text(`${BRAND.phone}  •  ${BRAND.email}`, margin, 28, {
      width: contentWidth,
      align: "right",
      lineBreak: false,
    });

  // Primary accent line under strip
  doc
    .moveTo(0, stripHeight)
    .lineTo(pageWidth, stripHeight)
    .lineWidth(2.5)
    .strokeColor(BRAND.colors.primary)
    .stroke();

  // Title + date below strip
  const titleY = stripHeight + 14;

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(BRAND.colors.secondary)
    .text(title, margin, titleY, { width: contentWidth });

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  doc
    .fontSize(8.5)
    .font("Helvetica")
    .fillColor(BRAND.colors.mutedText)
    .text(`Generated on ${dateStr}`, margin, titleY + 18, { width: contentWidth });

  // Thin separator
  const sepY = titleY + 34;
  doc
    .moveTo(margin, sepY)
    .lineTo(pageWidth - margin, sepY)
    .lineWidth(0.5)
    .strokeColor(BRAND.colors.border)
    .stroke();

  return sepY + 10;
}

/**
 * Draws a compact continuation header for subsequent pages.
 * @returns {number} y-position ready for content.
 */
function drawContinuationHeader(doc, logoBuffer = null) {
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - margin * 2;
  const barHeight = 24;

  doc.rect(0, 0, pageWidth, barHeight).fill(BRAND.colors.secondary);

  if (logoBuffer) {
    doc.image(logoBuffer, margin, 3, { height: 18, fit: [80, 18] });
  } else {
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.headerText)
      .text(BRAND.name, margin, 7, { width: contentWidth * 0.5, lineBreak: false });
  }

  doc
    .fontSize(7)
    .font("Helvetica")
    .fillColor("#9090A0")
    .text("Payment Report (continued)", margin, 9, {
      width: contentWidth,
      align: "right",
      lineBreak: false,
    });

  doc
    .moveTo(0, barHeight)
    .lineTo(pageWidth, barHeight)
    .lineWidth(2)
    .strokeColor(BRAND.colors.primary)
    .stroke();

  return barHeight + 10;
}

/**
 * Draws branded footers on every buffered page.
 * Must be called after all content is written and before doc.end().
 */
function drawBrandedFooters(doc) {
  const { count } = doc.bufferedPageRange();
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - margin * 2;
  const footerY = doc.page.height - 45;

  for (let i = 0; i < count; i++) {
    doc.switchToPage(i);

    // Border line
    doc
      .moveTo(margin, footerY - 4)
      .lineTo(pageWidth - margin, footerY - 4)
      .lineWidth(0.5)
      .strokeColor(BRAND.colors.border)
      .stroke();

    // Small accent dash
    doc
      .moveTo(margin, footerY - 4)
      .lineTo(margin + 40, footerY - 4)
      .lineWidth(1.5)
      .strokeColor(BRAND.colors.primary)
      .stroke();

    // Left: brand info
    doc
      .fontSize(6.5)
      .font("Helvetica")
      .fillColor(BRAND.colors.mutedText)
      .text(
        `${BRAND.name}  •  ${BRAND.address}  •  ${BRAND.phone}`,
        margin,
        footerY,
        { width: contentWidth * 0.7, lineBreak: false },
      );

    // Right: page + confidentiality
    doc
      .fontSize(6.5)
      .font("Helvetica")
      .fillColor(BRAND.colors.mutedText)
      .text(`Confidential  •  Page ${i + 1} of ${count}`, margin, footerY, {
        width: contentWidth,
        align: "right",
        lineBreak: false,
      });
  }
}

// ─── Shared data formatter ──────────────────────────────────────────────────
// Converts a payment record into a flat object for export.
// Used by both CSV and PDF exporters.

const formatPaymentRow = (payment) => ({
  "Order Number": payment.order?.orderNumber || "N/A",
  "Client Name": payment.client?.fullName || "N/A",
  "Client Email": payment.client?.email || "N/A",
  "Amount (₦)": Number(payment.amount).toLocaleString(),
  Type: payment.paymentType,
  Status: payment.status,
  "Confirmed By": payment.confirmedBy?.fullName || "N/A",
  "Confirmed At": payment.confirmedAt
    ? new Date(payment.confirmedAt).toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A",
  "Rejection Reason": payment.rejectionReason || "N/A",
  "Date Submitted": new Date(payment.createdAt).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }),
});

// ─── CSV Export ─────────────────────────────────────────────────────────────

export const exportPaymentsToCSV = (res, payments, filename = "payments") => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.csv"`,
  );

  const csvStream = format({ headers: true });
  csvStream.pipe(res);

  for (const payment of payments) {
    csvStream.write(formatPaymentRow(payment));
  }

  csvStream.end();
};

// ─── PDF Export ─────────────────────────────────────────────────────────────

export const exportPaymentsToPDF = async (
  res,
  payments,
  filename = "payments",
  summary = null,
) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.pdf"`,
  );

  // Fetch the brand logo once (cached after first call)
  const logoBuffer = await fetchLogoBuffer();

  const doc = new PDFDocument({ margin: 30, size: "A4", bufferPages: true });
  doc.pipe(res);

  // ── Branded header ──
  let currentY = drawBrandedHeader(doc, "Payment Report", logoBuffer);

  // ── Summary block (if provided) ──
  if (summary) {
    const margin = doc.page.margins.left;
    const contentWidth = doc.page.width - margin * 2;

    // Summary card background
    doc
      .roundedRect(margin, currentY, contentWidth, 72, 4)
      .fill(BRAND.colors.accent);
    doc.rect(margin, currentY, 3, 72).fill(BRAND.colors.primary);

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.secondary)
      .text("Summary", margin + 12, currentY + 8);

    doc.fontSize(8.5).font("Helvetica").fillColor(BRAND.colors.bodyText);

    const col1X = margin + 12;
    const col2X = margin + contentWidth / 2;
    let sy = currentY + 22;

    // Left column
    doc.text(`Total Revenue:`, col1X, sy, { continued: true, width: 90 });
    doc
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.primary)
      .text(`  ₦${Number(summary.totalRevenue).toLocaleString()}`);

    doc
      .font("Helvetica")
      .fillColor(BRAND.colors.bodyText)
      .text(`Total Pending:`, col1X, sy + 14, { continued: true, width: 90 });
    doc
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.labelText)
      .text(`  ₦${Number(summary.totalPending).toLocaleString()}`);

    doc
      .font("Helvetica")
      .fillColor(BRAND.colors.bodyText)
      .text(`Total Records:`, col1X, sy + 28, { continued: true, width: 90 });
    doc
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.bodyText)
      .text(`  ${summary.totalCount}`);

    // Right column
    doc
      .font("Helvetica")
      .fillColor(BRAND.colors.bodyText)
      .text(`Confirmed:`, col2X, sy, { continued: true, width: 80 });
    doc
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.bodyText)
      .text(`  ${summary.confirmedCount}`);

    doc
      .font("Helvetica")
      .fillColor(BRAND.colors.bodyText)
      .text(`Pending:`, col2X, sy + 14, { continued: true, width: 80 });
    doc
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.bodyText)
      .text(`  ${summary.pendingCount}`);

    doc
      .font("Helvetica")
      .fillColor(BRAND.colors.bodyText)
      .text(`Rejected:`, col2X, sy + 28, { continued: true, width: 80 });
    doc
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.bodyText)
      .text(`  ${summary.rejectedCount}`);

    currentY += 82; // card height + gap
  }

  // ── Column definitions ──
  const columns = [
    { label: "Order #",     width: 90,  key: "Order Number" },
    { label: "Client",      width: 100, key: "Client Name" },
    { label: "Amount (₦)", width: 80,  key: "Amount (₦)" },
    { label: "Type",        width: 70,  key: "Type" },
    { label: "Status",      width: 65,  key: "Status" },
    { label: "Date",        width: 80,  key: "Date Submitted" },
  ];

  const margin = doc.page.margins.left;
  const rowHeight = 20;
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const footerReserve = 55;

  // ── Table header row helper ──
  const drawTableHeader = (y) => {
    doc.rect(margin, y, tableWidth, rowHeight).fill(BRAND.colors.secondary);
    doc.rect(margin, y, 3, rowHeight).fill(BRAND.colors.primary);

    let x = margin;
    for (const col of columns) {
      doc
        .fontSize(7)
        .font("Helvetica-Bold")
        .fillColor(BRAND.colors.headerText)
        .text(col.label, x + 4, y + 6, { width: col.width - 6, lineBreak: false });
      x += col.width;
    }
    return y + rowHeight;
  };

  currentY = drawTableHeader(currentY);

  // ── Data rows ──
  for (let i = 0; i < payments.length; i++) {
    const row = formatPaymentRow(payments[i]);

    // Page overflow — new page with continuation header + re-draw table header
    if (currentY + rowHeight > doc.page.height - footerReserve) {
      doc.addPage();
      currentY = drawContinuationHeader(doc, logoBuffer);
      currentY = drawTableHeader(currentY);
    }

    // Alternating row background
    const rowColor = i % 2 === 0 ? "#FFFFFF" : BRAND.colors.rowAlt;
    doc.rect(margin, currentY, tableWidth, rowHeight).fill(rowColor);

    // Row bottom border
    doc
      .moveTo(margin, currentY + rowHeight)
      .lineTo(margin + tableWidth, currentY + rowHeight)
      .strokeColor(BRAND.colors.border)
      .lineWidth(0.3)
      .stroke();

    let x = margin;
    for (const col of columns) {
      const isName = col.key === "Client Name";
      doc
        .fontSize(7.5)
        .font(isName ? "Helvetica-Bold" : "Helvetica")
        .fillColor(isName ? BRAND.colors.secondary : BRAND.colors.bodyText)
        .text(String(row[col.key] || ""), x + 4, currentY + 6, {
          width: col.width - 6,
          lineBreak: false,
          ellipsis: true,
        });
      x += col.width;
    }

    currentY += rowHeight;
  }

  // Table closing border
  doc
    .moveTo(margin, currentY)
    .lineTo(margin + tableWidth, currentY)
    .strokeColor(BRAND.colors.secondary)
    .lineWidth(0.5)
    .stroke();

  // ── Branded footers on every page ──
  drawBrandedFooters(doc);

  doc.end();
};
