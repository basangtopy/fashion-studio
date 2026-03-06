import { format } from "@fast-csv/format";
import PDFDocument from "pdfkit";

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

export const exportMeasurementsToPDF = (
  res,
  measurements,
  filename = "measurements",
) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.pdf"`,
  );

  // Create PDF document and pipe directly to response
  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
    layout: measurements.length === 1 ? "portrait" : "landscape",
    // Portrait for a single client (more readable), landscape for multiple (fits more columns)
  });

  doc.pipe(res);

  // ── Header ──
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Client Measurements Report", { align: "center" });

  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#666666")
    .text(
      `Generated on ${new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`,
      { align: "center" },
    );

  doc.moveDown(1.5);

  // ── Single client: detailed layout ────────────────────────────────────
  if (measurements.length === 1) {
    const m = measurements[0];

    // Client info block
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text(m.client?.fullName || "Unknown Client");

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#444444")
      .text(`Email: ${m.client?.email || "N/A"}`)
      .text(`Phone: ${m.client?.phone || "N/A"}`)
      .text(
        `Last updated: ${m.updatedAt?.toLocaleDateString("en-GB") || "N/A"} by ${m.updatedByRole || "N/A"}`,
      );

    doc.moveDown(1);

    // Measurements in a clean two-column layout
    const measurementPairs = [
      ["Bust", m.bust],
      ["Waist", m.waist],
      ["Hips", m.hips],
      ["Shoulder Width", m.shoulderWidth],
      ["Sleeve Length", m.sleeveLength],
      ["Dress Length", m.dressLength],
      ["Thigh", m.thigh],
      ["Inseam", m.inseam],
      ["Neck", m.neck],
      ["Arm Length", m.armLength],
      ["Arm Circumference", m.armCircumference],
      ["Ankle Circumference", m.ankleCircumference],
      ["Wrist Circumference", m.wristCircumference],
      ["Back Length", m.backLength],
      ["Front Length", m.frontLength],
    ];

    const pageWidth = doc.page.width - 80; // subtract margins
    const colWidth = pageWidth / 2;
    let col = 0;
    let rowStartY = doc.y;

    doc.fontSize(11);

    for (const [label, value] of measurementPairs) {
      if (value === null || value === undefined) continue;

      const x = 40 + col * colWidth;
      const y = col === 0 ? doc.y : rowStartY;

      // Alternating row background for readability
      if (col === 0) {
        doc.rect(40, y - 2, pageWidth, 18).fill("#F8F8F8");
        rowStartY = y;
      }

      doc
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text(`${label}:`, x, y, { continued: true, width: colWidth * 0.55 })
        .font("Helvetica")
        .fillColor("#000000")
        .text(`${value} cm`);

      col = col === 0 ? 1 : 0;
      if (col === 0) doc.moveDown(0.2);
    }

    // Custom params if present
    if (m.customParams && Object.keys(m.customParams).length > 0) {
      doc.moveDown(1);
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Additional Measurements");

      doc.moveDown(0.3);

      for (const [key, value] of Object.entries(m.customParams)) {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#333333")
          .text(`${key}:`, { continued: true })
          .font("Helvetica")
          .fillColor("#000000")
          .text(` ${value} cm`);
      }
    }

    // ── Multiple clients: table layout ────────────────────────────────────
  } else {
    const columns = [
      { label: "Name", key: "clientName", width: 100 },
      { label: "Bust", key: "bust", width: 45 },
      { label: "Waist", key: "waist", width: 45 },
      { label: "Hips", key: "hips", width: 45 },
      { label: "Shoulder", key: "shoulderWidth", width: 55 },
      { label: "Sleeve", key: "sleeveLength", width: 50 },
      { label: "Dress Len", key: "dressLength", width: 55 },
      { label: "Neck", key: "neck", width: 45 },
      { label: "Arm Len", key: "armLength", width: 50 },
      { label: "Thigh", key: "thigh", width: 45 },
    ];

    const tableTop = doc.y;
    const rowHeight = 22;
    let x = 40;

    // Table header
    doc.rect(40, tableTop, doc.page.width - 80, rowHeight).fill("#1A1A2E");

    for (const col of columns) {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#FFFFFF")
        .text(col.label, x + 4, tableTop + 6, {
          width: col.width,
          lineBreak: false,
        });
      x += col.width;
    }

    // Table rows
    measurements.forEach((m, index) => {
      const y = tableTop + rowHeight + index * rowHeight;

      // Check if we need a new page
      if (y + rowHeight > doc.page.height - 60) {
        doc.addPage();
        return;
      }

      // Alternating row colours
      const rowColor = index % 2 === 0 ? "#FFFFFF" : "#F5F5F5";
      doc.rect(40, y, doc.page.width - 80, rowHeight).fill(rowColor);

      // Draw a subtle bottom border
      doc
        .moveTo(40, y + rowHeight)
        .lineTo(doc.page.width - 40, y + rowHeight)
        .strokeColor("#E0E0E0")
        .lineWidth(0.5)
        .stroke();

      x = 40;
      const rowData = {
        clientName: m.client?.fullName || "N/A",
        bust: m.bust ?? "—",
        waist: m.waist ?? "—",
        hips: m.hips ?? "—",
        shoulderWidth: m.shoulderWidth ?? "—",
        sleeveLength: m.sleeveLength ?? "—",
        dressLength: m.dressLength ?? "—",
        neck: m.neck ?? "—",
        armLength: m.armLength ?? "—",
        thigh: m.thigh ?? "—",
      };

      for (const col of columns) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#222222")
          .text(String(rowData[col.key]), x + 4, y + 6, {
            width: col.width - 8,
            lineBreak: false,
          });
        x += col.width;
      }
    });
  }

  // ── Footer ──
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#999999")
      .text(
        `Page ${i + 1} of ${pageCount}  •  Fashion Studio — Confidential`,
        40,
        doc.page.height - 30,
        { align: "center", width: doc.page.width - 80 },
      );
  }

  doc.end(); // finalises and flushes the PDF to the response
};
