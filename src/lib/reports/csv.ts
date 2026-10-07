import type { ReportTable } from "@/lib/reports/types";

/** Quotes a cell only when it needs it - a comma, a quote, or a newline. */
function csvCell(value: string | number): string {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

/** A report as CSV text, UTF-8 BOM included so Excel opens it without mangling it. */
export function toCsv(table: ReportTable): string {
  const lines = [
    table.columns.map(csvCell).join(","),
    ...table.rows.map((row) => row.map(csvCell).join(",")),
  ];
  return `﻿${lines.join("\r\n")}`;
}
