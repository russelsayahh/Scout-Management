import { Download, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { ReportTable } from "@/lib/reports/types";

/**
 * One report: its table, and the CSV/PDF export links.
 *
 * The links point straight at the export route - a plain navigation is all a
 * file download needs, and it is what makes the link shareable.
 */
export function ReportCard({ table }: { table: ReportTable }) {
  return (
    <Card>
      <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{table.meta.title}</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">{table.meta.description}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          <a
            href={`/reports/export?report=${table.meta.id}&format=csv`}
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            <Download className="size-3.5" strokeWidth={2} aria-hidden />
            CSV
          </a>
          <a
            href={`/reports/export?report=${table.meta.id}&format=pdf`}
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            <FileText className="size-3.5" strokeWidth={2} aria-hidden />
            PDF
          </a>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {table.rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-ink-secondary">
            {table.emptyMessage}
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <THead className="sticky top-0">
                <TR>
                  {table.columns.map((column) => (
                    <TH key={column}>{column}</TH>
                  ))}
                </TR>
              </THead>
              <TBody>
                {table.rows.map((row, index) => (
                  // Reports are read-only snapshots with no stable row id, so
                  // position in an unchanging list is a safe key here.
                  <TR key={index}>
                    {row.map((cell, cellIndex) => (
                      <TD key={cellIndex} className="tabular-nums whitespace-nowrap">
                        {cell}
                      </TD>
                    ))}
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
