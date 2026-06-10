import { format } from "@fast-csv/format";
import PDFDocument from "pdfkit";
import https from "https";
import http from "http";

// ─── Brand constants ────────────────────────────────────────────────────────
// Keep in sync with exportUtils.js and paymentExport.js
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
          console.warn(`[dashboardExport] Logo fetch failed: HTTP ${res.statusCode}`);
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
        console.warn(`[dashboardExport] Logo fetch error: ${err.message}`);
        resolve(null);
      });
  });
}

// ─── Label maps ─────────────────────────────────────────────────────────────

const STATUS_SHORT_LABELS = {
  PENDING_REVIEW: "Pending",
  AWAITING_CLIENT_RESPONSE: "Awaiting",
  AGREED_AWAITING_PAYMENT: "Agreed",
  IN_PROGRESS: "In Progress",
  CUTTING: "Cutting",
  SEWING: "Sewing",
  FINISHING: "Finishing",
  AWAITING_FINAL_PAYMENT: "Final Pay",
  READY_FOR_PICKUP: "Pickup",
  OUT_FOR_DELIVERY: "Delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS = {
  COMPLETED: "#4CAF50",
  READY_FOR_PICKUP: "#66BB6A",
  OUT_FOR_DELIVERY: "#00BCD4",
  IN_PROGRESS: "#C2185B",
  CUTTING: "#9C27B0",
  SEWING: "#673AB7",
  FINISHING: "#3F51B5",
  AWAITING_FINAL_PAYMENT: "#009688",
  AGREED_AWAITING_PAYMENT: "#2196F3",
  PENDING_REVIEW: "#FF9800",
  AWAITING_CLIENT_RESPONSE: "#FFC107",
  CANCELLED: "#EF5350",
};

const ORDER_TYPE_LABELS = {
  MODEL_1: "Bespoke\n(Client Fabric)",
  MODEL_2: "Bespoke\n(Studio Fabric)",
  MODEL_3: "Ready-to-Wear",
};

const ORDER_TYPE_COLORS = {
  MODEL_1: "#C2185B",
  MODEL_2: "#1A1A2E",
  MODEL_3: "#7B1FA2",
};

// ─── PDF Helpers ─────────────────────────────────────────────────────────────

/**
 * Draws the branded header strip. Returns the y-position below the header.
 */
function drawBrandedHeader(doc, title, logoBuffer = null) {
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - margin * 2;
  const stripHeight = 50;

  doc.rect(0, 0, pageWidth, stripHeight).fill(BRAND.colors.secondary);

  if (logoBuffer) {
    doc.image(logoBuffer, margin, 7, { height: 36, fit: [160, 36] });
  } else {
    doc
      .fontSize(17)
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.headerText)
      .text(BRAND.name, margin, 14, { width: contentWidth * 0.55, lineBreak: false });
  }

  doc
    .fontSize(7)
    .font("Helvetica-Oblique")
    .fillColor("#B0B0C0")
    .text(BRAND.tagline, margin, 18, {
      width: contentWidth,
      align: "right",
      lineBreak: false,
    });

  doc
    .fontSize(6.5)
    .font("Helvetica")
    .fillColor("#9090A0")
    .text(`${BRAND.phone}  •  ${BRAND.email}`, margin, 28, {
      width: contentWidth,
      align: "right",
      lineBreak: false,
    });

  doc
    .moveTo(0, stripHeight)
    .lineTo(pageWidth, stripHeight)
    .lineWidth(2.5)
    .strokeColor(BRAND.colors.primary)
    .stroke();

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
 * Draws branded footers on every buffered page (must be called before doc.end()).
 */
function drawBrandedFooters(doc) {
  const { count } = doc.bufferedPageRange();
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - margin * 2;
  const footerY = doc.page.height - 45;

  for (let i = 0; i < count; i++) {
    doc.switchToPage(i);

    doc
      .moveTo(margin, footerY - 4)
      .lineTo(pageWidth - margin, footerY - 4)
      .lineWidth(0.5)
      .strokeColor(BRAND.colors.border)
      .stroke();

    doc
      .moveTo(margin, footerY - 4)
      .lineTo(margin + 40, footerY - 4)
      .lineWidth(1.5)
      .strokeColor(BRAND.colors.primary)
      .stroke();

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

// ─── Chart & Layout Helpers ──────────────────────────────────────────────────

/**
 * Draws a bold section title with a primary-colour underline.
 * Returns the y-position after the title + underline + gap.
 */
function drawSectionTitle(doc, title, x, y, contentWidth) {
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor(BRAND.colors.secondary)
    .text(title, x, y, { width: contentWidth });
  const lineY = y + 14;
  doc
    .moveTo(x, lineY)
    .lineTo(x + Math.min(title.length * 6.5, 140), lineY)
    .lineWidth(1.5)
    .strokeColor(BRAND.colors.primary)
    .stroke();
  return lineY + 8;
}

/**
 * Draws a row of KPI cards.
 * @param {Array<{label: string, value: string}>} cards
 * @returns {number} y-position after all card rows
 */
function drawKPICards(doc, cards, x, y, contentWidth) {
  const cols = 3;
  const gap = 8;
  const cardWidth = (contentWidth - gap * (cols - 1)) / cols;
  const cardHeight = 56;

  cards.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = x + col * (cardWidth + gap);
    const cy = y + row * (cardHeight + gap);

    // Card background + left accent bar
    doc.roundedRect(cx, cy, cardWidth, cardHeight, 4).fill(BRAND.colors.accent);
    doc.rect(cx, cy, 3, cardHeight).fill(BRAND.colors.primary);

    // Label
    doc
      .fontSize(6.5)
      .font("Helvetica")
      .fillColor(BRAND.colors.mutedText)
      .text(card.label.toUpperCase(), cx + 10, cy + 9, {
        width: cardWidth - 14,
        lineBreak: false,
      });

    // Value
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.secondary)
      .text(String(card.value), cx + 10, cy + 22, {
        width: cardWidth - 14,
        lineBreak: false,
      });
  });

  const rows = Math.ceil(cards.length / cols);
  return y + rows * (cardHeight + gap);
}

/**
 * Draws a vertical bar chart.
 * @param {Array<{label: string, value: number, color?: string}>} entries
 * @returns {number} y-position after the chart
 */
function drawVerticalBarChart(doc, entries, x, y, chartWidth, chartHeight) {
  if (!entries || entries.length === 0) {
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(BRAND.colors.mutedText)
      .text("No data available", x, y + chartHeight / 2, {
        width: chartWidth,
        align: "center",
      });
    return y + chartHeight;
  }

  const maxValue = Math.max(...entries.map((e) => e.value), 1);
  const labelAreaH = 22; // below x-axis
  const valueAreaH = 14; // above tallest bar
  const barAreaH = chartHeight - labelAreaH - valueAreaH;

  const totalBars = entries.length;
  const groupW = chartWidth / totalBars;
  const barW = Math.min(groupW * 0.55, 36);

  // X axis
  const axisY = y + valueAreaH + barAreaH;
  doc
    .moveTo(x, axisY)
    .lineTo(x + chartWidth, axisY)
    .lineWidth(0.5)
    .strokeColor(BRAND.colors.border)
    .stroke();

  for (let i = 0; i < entries.length; i++) {
    const { label, value, color } = entries[i];
    const barX = x + i * groupW + (groupW - barW) / 2;
    const barH = value > 0 ? (value / maxValue) * barAreaH : 0;
    const barY = axisY - barH;
    const fillColor = color || BRAND.colors.primary;

    // Bar
    if (barH > 0) {
      doc.roundedRect(barX, barY, barW, barH, 2).fill(fillColor);
    } else {
      // Empty slot marker
      doc
        .moveTo(barX + barW / 2, axisY)
        .lineTo(barX + barW / 2, axisY - 3)
        .lineWidth(0.5)
        .strokeColor(BRAND.colors.border)
        .stroke();
    }

    // Value label above bar
    doc
      .fontSize(6.5)
      .font("Helvetica-Bold")
      .fillColor(BRAND.colors.bodyText)
      .text(String(value), barX - 2, barY - 11, {
        width: barW + 4,
        align: "center",
        lineBreak: false,
      });

    // X-axis label (truncate long labels)
    const shortLabel =
      label.length > 8 ? label.substring(0, 7) + "…" : label;
    doc
      .fontSize(5.5)
      .font("Helvetica")
      .fillColor(BRAND.colors.labelText)
      .text(shortLabel, barX - 4, axisY + 4, {
        width: barW + 8,
        align: "center",
        lineBreak: false,
      });
  }

  return y + chartHeight;
}

/**
 * Draws a single horizontal progress bar row.
 * @returns {number} y-position after the row
 */
function drawHorizontalBarRow(doc, label, value, maxValue, fillColor, x, y, totalWidth) {
  const labelW = 110;
  const valueW = 95;
  const barAreaW = totalWidth - labelW - valueW - 20;
  const barH = 10;
  const rowH = 24;

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(BRAND.colors.labelText)
    .text(label, x, y + 6, { width: labelW, lineBreak: false });

  // Track background
  doc.roundedRect(x + labelW + 8, y + 6, barAreaW, barH, 2).fill("#EEEEEE");

  // Filled bar
  const filledW = maxValue > 0 ? (value / maxValue) * barAreaW : 0;
  if (filledW > 2) {
    doc.roundedRect(x + labelW + 8, y + 6, filledW, barH, 2).fill(fillColor);
  }

  // Value
  const formattedValue =
    typeof value === "number"
      ? `₦${value.toLocaleString()}`
      : String(value);
  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor(BRAND.colors.bodyText)
    .text(formattedValue, x + labelW + barAreaW + 14, y + 6, {
      width: valueW,
      lineBreak: false,
    });

  return y + rowH;
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

/**
 * Exports dashboard summary data as a CSV file.
 * @param {object} data  Normalised dashboard data (see exportDashboard controller)
 */
export const exportDashboardToCSV = (res, data, filename = "dashboard") => {
  const {
    periodLabel,
    totalClients,
    totalOrders,
    activeOrders,
    totalRevenue,
    ordersInPeriod,
    revenueInPeriod,
    newClientsInPeriod,
    ordersByStatus,
    ordersByType,
  } = data;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.csv"`,
  );

  const csvStream = format({ headers: true });
  csvStream.pipe(res);

  csvStream.write({ Metric: "Period", Value: periodLabel });
  csvStream.write({ Metric: "Total Clients", Value: totalClients });
  csvStream.write({ Metric: "Total Orders", Value: totalOrders });
  csvStream.write({ Metric: "Active Orders", Value: activeOrders });
  csvStream.write({ Metric: "Total Revenue", Value: totalRevenue });
  csvStream.write({ Metric: "Orders in Period", Value: ordersInPeriod });
  csvStream.write({ Metric: "Revenue in Period", Value: revenueInPeriod });
  csvStream.write({ Metric: "New Clients in Period", Value: newClientsInPeriod });

  for (const row of ordersByStatus) {
    csvStream.write({ Metric: `Orders — ${row.status}`, Value: row._count });
  }
  for (const row of ordersByType) {
    csvStream.write({ Metric: `Orders — ${row.orderType}`, Value: row._count });
  }

  csvStream.end();
};

// ─── PDF Export ──────────────────────────────────────────────────────────────

/**
 * Exports dashboard summary data as a branded PDF with charts.
 * @param {object} data  Normalised dashboard data (see exportDashboard controller)
 */
export const exportDashboardToPDF = async (res, data, filename = "dashboard") => {
  const {
    periodLabel,
    totalClients,
    totalOrders,
    activeOrders,
    totalRevenue,
    ordersInPeriod,
    revenueInPeriod,
    newClientsInPeriod,
    ordersByStatus,
    ordersByType,
  } = data;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.pdf"`,
  );

  const logoBuffer = await fetchLogoBuffer();

  // margin: 30 matches exportUtils.js — keeps footerY (height-45) safely
  // within the auto-pagination boundary (height-30), preventing phantom pages.
  const doc = new PDFDocument({ margin: 30, size: "A4", bufferPages: true });
  doc.pipe(res);

  const margin = doc.page.margins.left;
  const contentWidth = doc.page.width - margin * 2;

  // ── Branded header ──
  let y = drawBrandedHeader(doc, "Dashboard Report", logoBuffer);

  // Period sub-label
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(BRAND.colors.mutedText)
    .text(`Period: ${periodLabel}`, margin, y);
  y += 16;

  // ── Section 1: KPI Cards ──────────────────────────────────────────────────
  y = drawSectionTitle(doc, "Key Metrics", margin, y, contentWidth);

  const kpiCards = [
    { label: "Total Clients", value: totalClients.toLocaleString() },
    { label: "Active Orders", value: activeOrders.toLocaleString() },
    { label: "All-Time Revenue", value: `₦${totalRevenue.toLocaleString()}` },
    { label: "Orders in Period", value: ordersInPeriod.toLocaleString() },
    { label: "Revenue in Period", value: `₦${revenueInPeriod.toLocaleString()}` },
    { label: "New Clients in Period", value: newClientsInPeriod.toLocaleString() },
  ];

  y = drawKPICards(doc, kpiCards, margin, y, contentWidth);
  y += 16;

  // ── Section 2: Orders by Status (bar chart) ───────────────────────────────
  y = drawSectionTitle(doc, "Orders by Status", margin, y, contentWidth);

  const statusEntries = ordersByStatus.map((row) => ({
    label: STATUS_SHORT_LABELS[row.status] || row.status,
    value: row._count,
    color: STATUS_COLORS[row.status] || BRAND.colors.primary,
  }));

  y = drawVerticalBarChart(doc, statusEntries, margin, y, contentWidth, 100);
  y += 14;

  // ── Section 3: Orders by Type (bar chart) ─────────────────────────────────
  y = drawSectionTitle(doc, "Orders by Type", margin, y, contentWidth);

  const typeEntries = ordersByType.map((row) => ({
    label: (ORDER_TYPE_LABELS[row.orderType] || row.orderType).split("\n")[0],
    value: row._count,
    color: ORDER_TYPE_COLORS[row.orderType] || BRAND.colors.secondary,
  }));

  y = drawVerticalBarChart(doc, typeEntries, margin, y, contentWidth, 100);
  y += 14;

  // ── Section 4: Revenue Overview (horizontal bars) ─────────────────────────
  y = drawSectionTitle(doc, "Revenue Overview", margin, y, contentWidth);

  const maxRevenue = Math.max(totalRevenue, 1);
  y = drawHorizontalBarRow(
    doc,
    "All-Time Revenue",
    totalRevenue,
    maxRevenue,
    BRAND.colors.primary,
    margin,
    y,
    contentWidth,
  );
  y = drawHorizontalBarRow(
    doc,
    `Revenue (${periodLabel})`,
    revenueInPeriod,
    maxRevenue,
    BRAND.colors.secondary,
    margin,
    y,
    contentWidth,
  );

  // ── Branded footers ───────────────────────────────────────────────────────
  drawBrandedFooters(doc);
  doc.end();
};
