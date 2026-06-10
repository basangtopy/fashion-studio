import { format } from "@fast-csv/format";
import PDFDocument from "pdfkit";
import https from "https";
import http from "http";

// ─── Brand constants for PDF exports ───────────────────────────────────────
// Mirrors the relevant subset from the frontend branding config (branding.js).
// Update here if the business branding changes.
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

// ─── Logo cache ──────────────────────────────────────────────────────────────
// Fetched once on first PDF export, then reused for subsequent exports.
let _logoBuffer = null;
let _logoFetchAttempted = false;

/**
 * Fetches the brand logo from BRAND_LOGO_URL and caches it as a Buffer.
 * Resolves with the buffer, or null if unavailable/fetch fails.
 */
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
          console.warn(`[exportUtils] Logo fetch failed: HTTP ${res.statusCode}`);
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
        console.warn(`[exportUtils] Logo fetch error: ${err.message}`);
        resolve(null);
      });
  });
}

// All standard measurement fields in display order
const MEASUREMENT_FIELDS = [
  { key: "bust", label: "Bust" },
  { key: "waist", label: "Waist" },
  { key: "hips", label: "Hips" },
  { key: "shoulderWidth", label: "Shoulder" },
  { key: "sleeveLength", label: "Sleeve" },
  { key: "dressLength", label: "Dress Len" },
  { key: "thigh", label: "Thigh" },
  { key: "inseam", label: "Inseam" },
  { key: "neck", label: "Neck" },
  { key: "armLength", label: "Arm Len" },
  { key: "armCircumference", label: "Arm Circ" },
  { key: "ankleCircumference", label: "Ankle Circ" },
  { key: "wristCircumference", label: "Wrist Circ" },
  { key: "backLength", label: "Back Len" },
  { key: "frontLength", label: "Front Len" },
];

// ─── PDF Helpers ──────────────────────────────────────────────────────────

/**
 * Draws the branded header strip at the top of the current page.
 * @returns {number} The y-position below the header, ready for content.
 */
function drawBrandedHeader(doc, title, logoBuffer = null) {
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - margin * 2;

  // ── Dark header strip ──
  const stripHeight = 50;
  doc.rect(0, 0, pageWidth, stripHeight).fill(BRAND.colors.secondary);

  // Business name / logo (left)
  if (logoBuffer) {
    // Draw logo image — constrain to fit within the strip with some padding
    doc.image(logoBuffer, margin, 7, { height: 36, fit: [160, 36] });
  } else {
    doc
      .fontSize(17)
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.headerText)
      .text(BRAND.name, margin, 14, {
        width: contentWidth * 0.55,
        lineBreak: false,
      });
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

  // Accent line below strip
  doc
    .moveTo(0, stripHeight)
    .lineTo(pageWidth, stripHeight)
    .lineWidth(2.5)
    .strokeColor(BRAND.colors.primary)
    .stroke();

  // ── Title + date below the strip ──
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
    .text(`Generated on ${dateStr}`, margin, titleY + 18, {
      width: contentWidth,
    });

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
 * Draws a compact branded header for continuation pages (no title/date).
 * @returns {number} The y-position below the mini header.
 */
function drawContinuationHeader(doc, logoBuffer = null) {
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - margin * 2;

  // Thin coloured bar
  const barHeight = 24;
  doc.rect(0, 0, pageWidth, barHeight).fill(BRAND.colors.secondary);

  if (logoBuffer) {
    doc.image(logoBuffer, margin, 3, { height: 18, fit: [80, 18] });
  } else {
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.headerText)
      .text(BRAND.name, margin, 7, {
        width: contentWidth * 0.5,
        lineBreak: false,
      });
  }

  doc
    .fontSize(7)
    .font("Helvetica")
    .fillColor("#9090A0")
    .text("Client Measurements Report (continued)", margin, 9, {
      width: contentWidth,
      align: "right",
      lineBreak: false,
    });

  // Accent line
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
  // Position footer well above the bottom margin boundary (page.height - 30)
  // to prevent pdfkit from auto-creating blank pages on each doc.text() call.
  const footerY = doc.page.height - 45;

  for (let i = 0; i < count; i++) {
    doc.switchToPage(i);

    // Thin border line
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

/**
 * Draws a table header row and returns the y-position after it.
 */
function drawTableHeaderRow(doc, columns, y) {
  const margin = doc.page.margins.left;
  const tableWidth = doc.page.width - margin * 2;
  const rowHeight = 20;

  // Header background
  doc.rect(margin, y, tableWidth, rowHeight).fill(BRAND.colors.secondary);

  // Small accent on the left edge of the header
  doc.rect(margin, y, 3, rowHeight).fill(BRAND.colors.primary);

  let x = margin;
  for (const col of columns) {
    doc
      .fontSize(7)
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.headerText)
      .text(col.label, x + 4, y + 6, {
        width: col.width - 6,
        lineBreak: false,
      });
    x += col.width;
  }

  return y + rowHeight;
}

// ─── CSV Export ────────────────────────────────────────────────────────────

export const exportMeasurementsToCSV = (
  res,
  measurements,
  filename = "measurements",
) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.csv"`,
  );

  const csvStream = format({ headers: true });
  csvStream.pipe(res);

  for (const m of measurements) {
    csvStream.write({
      "Client Name": m.client?.fullName || "N/A",
      Email: m.client?.email || "N/A",
      Phone: m.client?.phone || "N/A",
      "Bust (cm)": m.bust ?? "",
      "Waist (cm)": m.waist ?? "",
      "Hips (cm)": m.hips ?? "",
      "Shoulder Width (cm)": m.shoulderWidth ?? "",
      "Sleeve Length (cm)": m.sleeveLength ?? "",
      "Dress Length (cm)": m.dressLength ?? "",
      "Thigh (cm)": m.thigh ?? "",
      "Inseam (cm)": m.inseam ?? "",
      "Neck (cm)": m.neck ?? "",
      "Arm Length (cm)": m.armLength ?? "",
      "Arm Circumference (cm)": m.armCircumference ?? "",
      "Ankle Circumference (cm)": m.ankleCircumference ?? "",
      "Wrist Circumference (cm)": m.wristCircumference ?? "",
      "Back Length (cm)": m.backLength ?? "",
      "Front Length (cm)": m.frontLength ?? "",
      "Custom Params": m.customParams ? JSON.stringify(m.customParams) : "",
      "Last Updated": m.updatedAt?.toISOString() || "",
      "Last Updated By": m.updatedByRole || "",
    });
  }

  csvStream.end();
};

// ─── PDF Export ────────────────────────────────────────────────────────────

export const exportMeasurementsToPDF = async (
  res,
  measurements,
  filename = "measurements",
) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.pdf"`,
  );

  // Fetch the brand logo once (cached after first call)
  const logoBuffer = await fetchLogoBuffer();

  const isSingle = measurements.length === 1;

  const doc = new PDFDocument({
    margin: 30,
    size: "A4",
    layout: isSingle ? "portrait" : "landscape",
    bufferPages: true,
  });

  doc.pipe(res);

  if (isSingle) {
    drawSingleClientPDF(doc, measurements[0], logoBuffer);
  } else {
    drawMultiClientPDF(doc, measurements, logoBuffer);
  }

  // ── Branded footers on every page ──
  drawBrandedFooters(doc);

  doc.end();
};

// ─── Single Client Layout (Portrait) ──────────────────────────────────────

function drawSingleClientPDF(doc, m, logoBuffer = null) {
  const margin = doc.page.margins.left;
  const contentWidth = doc.page.width - margin * 2;

  let y = drawBrandedHeader(doc, "Client Measurement Record", logoBuffer);

  // ── Client info card ──
  const cardPadding = 12;
  const cardHeight = 62;

  // Card background
  doc
    .roundedRect(margin, y, contentWidth, cardHeight, 4)
    .fill(BRAND.colors.accent);

  // Small coloured left border on the card
  doc.rect(margin, y, 3, cardHeight).fill(BRAND.colors.primary);

  y += cardPadding;

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(BRAND.colors.secondary)
    .text(m.client?.fullName || "Unknown Client", margin + cardPadding + 4, y);

  y += 18;

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(BRAND.colors.labelText)
    .text(
      `Email: ${m.client?.email || "N/A"}    •    Phone: ${m.client?.phone || "N/A"}`,
      margin + cardPadding + 4,
      y,
    );

  y += 13;

  const updatedDate = m.updatedAt
    ? m.updatedAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(BRAND.colors.mutedText)
    .text(
      `Last updated: ${updatedDate} by ${m.updatedByRole || "N/A"}`,
      margin + cardPadding + 4,
      y,
    );

  y += 28;

  // ── Section: Standard Measurements ──
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor(BRAND.colors.secondary)
    .text("Body Measurements", margin, y);

  // Accent underline for section title
  y += 15;
  doc
    .moveTo(margin, y)
    .lineTo(margin + 120, y)
    .lineWidth(2)
    .strokeColor(BRAND.colors.primary)
    .stroke();

  y += 8;

  // Two-column measurement grid
  const colWidth = (contentWidth - 16) / 2;
  const rowHeight = 22;
  let col = 0;
  let rowStartY = y;
  let rowIndex = 0;

  for (const field of MEASUREMENT_FIELDS) {
    const value = m[field.key];
    if (value === null || value === undefined) continue;

    const x = margin + col * (colWidth + 16);

    if (col === 0) {
      rowStartY = y;
      // Alternating row background
      if (rowIndex % 2 === 0) {
        doc
          .roundedRect(margin, y - 3, contentWidth, rowHeight, 2)
          .fill(BRAND.colors.accent);
      }
      rowIndex++;
    }

    const labelX = x + 8;
    const drawY = col === 0 ? y : rowStartY;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.labelText)
      .text(`${field.label}:`, labelX, drawY + 2, {
        continued: true,
        width: colWidth * 0.55,
      });

    doc
      .font("Helvetica")
      .fillColor(BRAND.colors.bodyText)
      .text(` ${value} cm`);

    if (col === 0) {
      col = 1;
    } else {
      col = 0;
      y += rowHeight;
    }
  }

  // If we ended on the left column, advance y
  if (col === 1) y += rowHeight;

  // ── Section: Custom Measurements ──
  if (m.customParams && Object.keys(m.customParams).length > 0) {
    y += 14;

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.secondary)
      .text("Additional Measurements", margin, y);

    y += 15;
    doc
      .moveTo(margin, y)
      .lineTo(margin + 150, y)
      .lineWidth(2)
      .strokeColor(BRAND.colors.primary)
      .stroke();

    y += 8;

    let customIndex = 0;
    for (const [key, value] of Object.entries(m.customParams)) {
      if (customIndex % 2 === 0) {
        doc
          .roundedRect(margin, y - 3, contentWidth, rowHeight, 2)
          .fill(BRAND.colors.accent);
      }

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(BRAND.colors.labelText)
        .text(`${key}:`, margin + 8, y + 2, {
          continued: true,
          width: colWidth * 0.55,
        });

      doc
        .font("Helvetica")
        .fillColor(BRAND.colors.bodyText)
        .text(` ${value} cm`);

      y += rowHeight;
      customIndex++;
    }
  }

  // ── Notes ──
  if (m.notes) {
    y += 14;
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.secondary)
      .text("Notes", margin, y);

    y += 15;
    doc
      .moveTo(margin, y)
      .lineTo(margin + 40, y)
      .lineWidth(2)
      .strokeColor(BRAND.colors.primary)
      .stroke();

    y += 8;

    doc
      .roundedRect(margin, y - 2, contentWidth, 30, 3)
      .fill(BRAND.colors.accent);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(BRAND.colors.bodyText)
      .text(m.notes, margin + 8, y + 4, { width: contentWidth - 16 });
  }
}

// ─── Multi-Client Layout (Landscape) ──────────────────────────────────────

function drawMultiClientPDF(doc, measurements, logoBuffer = null) {
  const margin = doc.page.margins.left;
  const contentWidth = doc.page.width - margin * 2;
  const rowHeight = 20;
  const footerReserve = 55; // space reserved for footer (matches drawBrandedFooters positioning)

  // ── Discover all unique custom param keys across all measurements ──
  const customKeySet = new Set();
  for (const m of measurements) {
    if (m.customParams && typeof m.customParams === "object") {
      for (const key of Object.keys(m.customParams)) {
        customKeySet.add(key);
      }
    }
  }
  const customKeys = Array.from(customKeySet).sort();

  // ── Build column definitions dynamically ──
  const totalFields = MEASUREMENT_FIELDS.length + customKeys.length;
  const nameColWidth = 88;
  const remainingWidth = contentWidth - nameColWidth;
  const fieldColWidth = Math.floor(remainingWidth / totalFields);

  const columns = [
    { label: "Client Name", key: "clientName", width: nameColWidth },
    ...MEASUREMENT_FIELDS.map((f) => ({
      label: f.label,
      key: f.key,
      width: fieldColWidth,
    })),
    ...customKeys.map((key) => ({
      label: key.length > 8 ? key.substring(0, 7) + "…" : key,
      key: `custom_${key}`,
      width: fieldColWidth,
    })),
  ];

  // ── Page 1: full branded header ──
  let currentY = drawBrandedHeader(doc, "Client Measurements Report", logoBuffer);

  // Summary line
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(BRAND.colors.mutedText)
    .text(`Total clients: ${measurements.length}`, margin, currentY);

  currentY += 14;

  // Draw first table header
  currentY = drawTableHeaderRow(doc, columns, currentY);

  // ── Render each row with proper pagination ──
  for (let i = 0; i < measurements.length; i++) {
    const m = measurements[i];

    // ── Page overflow check ──
    if (currentY + rowHeight > doc.page.height - footerReserve) {
      doc.addPage();

      // Draw continuation header on the new page
      currentY = drawContinuationHeader(doc, logoBuffer);

      // Redraw the table header
      currentY = drawTableHeaderRow(doc, columns, currentY);
    }

    // ── Draw row ──
    const rowColor = i % 2 === 0 ? "#FFFFFF" : BRAND.colors.rowAlt;
    doc.rect(margin, currentY, contentWidth, rowHeight).fill(rowColor);

    // Subtle bottom border
    doc
      .moveTo(margin, currentY + rowHeight)
      .lineTo(doc.page.width - margin, currentY + rowHeight)
      .strokeColor(BRAND.colors.border)
      .lineWidth(0.3)
      .stroke();

    // Build row data — standard fields
    const rowData = {
      clientName: m.client?.fullName || "N/A",
    };
    for (const field of MEASUREMENT_FIELDS) {
      rowData[field.key] = m[field.key] ?? "—";
    }
    // Custom param fields
    for (const key of customKeys) {
      rowData[`custom_${key}`] =
        m.customParams && m.customParams[key] != null
          ? m.customParams[key]
          : "—";
    }

    // Render each cell
    let x = margin;
    for (const col of columns) {
      const isName = col.key === "clientName";
      doc
        .fontSize(7.5)
        .font(isName ? "Helvetica-Bold" : "Helvetica")
        .fillColor(isName ? BRAND.colors.secondary : BRAND.colors.bodyText)
        .text(String(rowData[col.key]), x + 4, currentY + 6, {
          width: col.width - 6,
          lineBreak: false,
        });
      x += col.width;
    }

    currentY += rowHeight;
  }

  // ── Table closing border ──
  doc
    .moveTo(margin, currentY)
    .lineTo(doc.page.width - margin, currentY)
    .strokeColor(BRAND.colors.secondary)
    .lineWidth(0.5)
    .stroke();
}
