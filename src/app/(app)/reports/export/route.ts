import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { resolveTroopScope } from "@/lib/auth/troop-scope";
import { toCsv } from "@/lib/reports/csv";
import { toPdfBuffer } from "@/lib/reports/pdf";
import { buildReportTable } from "@/lib/reports/service";
import { REPORT_IDS, type ReportId } from "@/lib/reports/types";

/**
 * Downloads one report as CSV or PDF.
 *
 * A plain GET endpoint rather than a Server Action, because a file download is
 * a navigation the browser handles itself - the report id and format live in
 * the URL, which is also what makes the export link shareable and bookmarkable.
 * Authorization is re-checked here exactly as it would be on the page: nothing
 * about who may see the report is inferred from the request having reached
 * this far.
 */
export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in to download reports.", { status: 401 });
  if (!can(user.role, "reports.view")) {
    return new Response("You do not have permission to view reports.", { status: 403 });
  }

  const url = new URL(request.url);
  const reportId = url.searchParams.get("report");
  const format = url.searchParams.get("format");

  if (!reportId || !REPORT_IDS.includes(reportId as ReportId)) {
    return new Response("Unknown report.", { status: 404 });
  }
  if (format !== "csv" && format !== "pdf") {
    return new Response("Unknown export format.", { status: 400 });
  }

  const scope = await resolveTroopScope(user);
  const table = await buildReportTable(reportId as ReportId, scope, new Date());

  const filename = `${reportId}-${table.generatedAt.slice(0, 10)}.${format}`;

  if (format === "csv") {
    return new Response(toCsv(table), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const pdf = await toPdfBuffer(table);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
