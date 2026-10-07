import PDFDocument from "pdfkit";

import type { ReportTable } from "@/lib/reports/types";

const MARGIN = 40;
const ROW_HEIGHT = 22;
const HEADER_HEIGHT = 24;
const FONT_SIZE = 9;

/**
 * A report as a simple tabular PDF: title, generated timestamp, then one row
 * per record with a repeated header on every page. Cells are truncated to one
 * line rather than wrapped, which keeps row height constant and the table
 * predictable - a report is read for the numbers, not typeset for a brochure.
 */
export function toPdfBuffer(table: ReportTable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGIN, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - MARGIN * 2;
    const colWidth = pageWidth / table.columns.length;

    function drawHeader(): number {
      doc.font("Helvetica-Bold").fontSize(14).fillColor("#0f1613");
      doc.text(table.meta.title, MARGIN, MARGIN);
      doc.font("Helvetica").fontSize(9).fillColor("#57605a");
      doc.text(
        `Generated ${new Date(table.generatedAt).toLocaleString("en-GB")}`,
        MARGIN,
        MARGIN + 20,
      );
      return MARGIN + 44;
    }

    function drawColumnHeaderRow(y: number): number {
      doc.rect(MARGIN, y, pageWidth, HEADER_HEIGHT).fill("#eef2ef");
      doc.font("Helvetica-Bold").fontSize(FONT_SIZE).fillColor("#0f1613");
      table.columns.forEach((column, index) => {
        doc.text(column, MARGIN + index * colWidth + 4, y + 7, {
          width: colWidth - 8,
          height: HEADER_HEIGHT,
          ellipsis: true,
          lineBreak: false,
        });
      });
      return y + HEADER_HEIGHT;
    }

    let y = drawColumnHeaderRow(drawHeader());
    const bottom = doc.page.height - MARGIN;

    doc.font("Helvetica").fontSize(FONT_SIZE).fillColor("#0f1613");

    if (table.rows.length === 0) {
      doc.fillColor("#57605a").text(table.emptyMessage, MARGIN, y + 8);
    }

    for (const row of table.rows) {
      if (y + ROW_HEIGHT > bottom) {
        doc.addPage();
        y = drawColumnHeaderRow(MARGIN);
        doc.font("Helvetica").fontSize(FONT_SIZE).fillColor("#0f1613");
      }

      doc.moveTo(MARGIN, y + ROW_HEIGHT).lineTo(MARGIN + pageWidth, y + ROW_HEIGHT).strokeColor("#e2e7e3").stroke();

      row.forEach((cell, index) => {
        doc.text(String(cell), MARGIN + index * colWidth + 4, y + 6, {
          width: colWidth - 8,
          height: ROW_HEIGHT,
          ellipsis: true,
          lineBreak: false,
        });
      });

      y += ROW_HEIGHT;
    }

    doc.end();
  });
}
