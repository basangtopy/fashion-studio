import { format } from "@fast-csv/format";
import PDFDocument from "pdfkit";

// ─── Shared data formatter ─────────────────────────────────────────────────
// Converts a payment record into a flat object for export
// Used by both CSV and PDF exporters

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

// ─── CSV Export ────────────────────────────────────────────────────────────

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

// ─── PDF Export ────────────────────────────────────────────────────────────

export const exportPaymentsToPDF = (
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

  // Create PDF document — pipe directly to response (no disk write)
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  // ── Header ──
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("Payment Report", { align: "center" });

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(
      `Generated: ${new Date().toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`,
      { align: "center" },
    );

  doc.moveDown(1);

  // ── Summary block (if provided) ──
  if (summary) {
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Summary", { underline: true });

    doc.fontSize(10).font("Helvetica");
    doc.text(
      `Total Revenue:    ₦${Number(summary.totalRevenue).toLocaleString()}`,
    );
    doc.text(
      `Total Pending:    ₦${Number(summary.totalPending).toLocaleString()}`,
    );
    doc.text(`Total Payments:   ${summary.totalCount}`);
    doc.text(`Confirmed:        ${summary.confirmedCount}`);
    doc.text(`Pending:          ${summary.pendingCount}`);
    doc.text(`Rejected:         ${summary.rejectedCount}`);
    doc.moveDown(1);
  }

  // ── Column definitions ──
  const columns = [
    { label: "Order #", width: 90, key: "Order Number" },
    { label: "Client", width: 100, key: "Client Name" },
    { label: "Amount (₦)", width: 80, key: "Amount (₦)" },
    { label: "Type", width: 70, key: "Type" },
    { label: "Status", width: 65, key: "Status" },
    { label: "Date", width: 80, key: "Date Submitted" },
  ];

  const tableTop = doc.y;
  const rowHeight = 20;
  const startX = doc.page.margins.left;
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);

  // ── Table header row ──
  doc.fontSize(9).font("Helvetica-Bold");

  // Header background
  doc.rect(startX, tableTop, tableWidth, rowHeight).fill("#1A1A2E");

  doc.fillColor("white");

  let currentX = startX;
  for (const col of columns) {
    doc.text(col.label, currentX + 4, tableTop + 6, {
      width: col.width - 8,
      ellipsis: true,
    });
    currentX += col.width;
  }

  doc.fillColor("black");

  // ── Data rows ──
  doc.fontSize(8).font("Helvetica");

  let currentY = tableTop + rowHeight;

  for (let i = 0; i < payments.length; i++) {
    const row = formatPaymentRow(payments[i]);
    const isEven = i % 2 === 0;

    // Check if we need a new page
    if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    // Alternating row background
    if (isEven) {
      doc.rect(startX, currentY, tableWidth, rowHeight).fill("#F5F5F5");
    }

    doc.fillColor("black");

    currentX = startX;
    for (const col of columns) {
      const value = String(row[col.key] || "");
      doc.text(value, currentX + 4, currentY + 6, {
        width: col.width - 8,
        ellipsis: true,
      });
      currentX += col.width;
    }

    // Row bottom border
    doc
      .moveTo(startX, currentY + rowHeight)
      .lineTo(startX + tableWidth, currentY + rowHeight)
      .strokeColor("#DDDDDD")
      .lineWidth(0.5)
      .stroke();

    currentY += rowHeight;
  }

  // ── Footer ──
  doc.moveDown(2);
  doc
    .fontSize(8)
    .fillColor("#666666")
    .text(`Total records: ${payments.length}`, { align: "right" });

  doc.end(); // finalise and flush the PDF to the response
};
