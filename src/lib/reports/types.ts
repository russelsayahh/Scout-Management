/**
 * Reports reduce to one shape: a table. Whatever the source - attendance
 * registers, the equipment store, the programme - every report ends as
 * columns and rows, because that is both what renders on screen and what
 * exports to CSV or PDF. There is no second, richer representation to keep in
 * sync with the first.
 */

export type ReportCategory = "attendance" | "members" | "equipment" | "activities";

export type ReportId =
  | "attendance-by-member"
  | "attendance-by-patrol"
  | "attendance-over-time"
  | "members-active"
  | "members-by-patrol"
  | "members-demographics"
  | "equipment-available"
  | "equipment-assigned"
  | "equipment-damaged"
  | "equipment-maintenance"
  | "activities-count"
  | "activities-by-type"
  | "activities-participation";

export const REPORT_IDS: readonly ReportId[] = [
  "attendance-by-member",
  "attendance-by-patrol",
  "attendance-over-time",
  "members-active",
  "members-by-patrol",
  "members-demographics",
  "equipment-available",
  "equipment-assigned",
  "equipment-damaged",
  "equipment-maintenance",
  "activities-count",
  "activities-by-type",
  "activities-participation",
];

export type ExportFormat = "csv" | "pdf";

export interface ReportMeta {
  id: ReportId;
  category: ReportCategory;
  title: string;
  description: string;
}

export const reportMeta: Record<ReportId, ReportMeta> = {
  "attendance-by-member": {
    id: "attendance-by-member",
    category: "attendance",
    title: "Attendance by member",
    description: "Every scout's turnout across every register taken.",
  },
  "attendance-by-patrol": {
    id: "attendance-by-patrol",
    category: "attendance",
    title: "Attendance by patrol",
    description: "Turnout totalled by each patrol's current membership.",
  },
  "attendance-over-time": {
    id: "attendance-over-time",
    category: "attendance",
    title: "Attendance over time",
    description: "The rate at each of the last ten registers taken.",
  },
  "members-active": {
    id: "members-active",
    category: "members",
    title: "Active members",
    description: "Everyone currently attending, with their patrol and join date.",
  },
  "members-by-patrol": {
    id: "members-by-patrol",
    category: "members",
    title: "Members by patrol",
    description: "How the register is spread across patrols.",
  },
  "members-demographics": {
    id: "members-demographics",
    category: "members",
    title: "Member demographics",
    description: "The register broken down by gender and by age.",
  },
  "equipment-available": {
    id: "equipment-available",
    category: "equipment",
    title: "Available equipment",
    description: "Serviceable stock free to take out right now.",
  },
  "equipment-assigned": {
    id: "equipment-assigned",
    category: "equipment",
    title: "Assigned equipment",
    description: "Everything currently checked out, and to whom.",
  },
  "equipment-damaged": {
    id: "equipment-damaged",
    category: "equipment",
    title: "Damaged equipment",
    description: "Stock recorded as damaged and awaiting repair or write-off.",
  },
  "equipment-maintenance": {
    id: "equipment-maintenance",
    category: "equipment",
    title: "Equipment needing maintenance",
    description: "Usable, but flagged as needing attention before long.",
  },
  "activities-count": {
    id: "activities-count",
    category: "activities",
    title: "Number of activities",
    description: "The programme, totalled by status.",
  },
  "activities-by-type": {
    id: "activities-by-type",
    category: "activities",
    title: "Activities by type",
    description: "The programme broken down by what kind of activity it is.",
  },
  "activities-participation": {
    id: "activities-participation",
    category: "activities",
    title: "Participation",
    description: "Expected versus actual turnout for each activity with a register.",
  },
};

export const reportCategoryLabels: Record<ReportCategory, string> = {
  attendance: "Attendance report",
  members: "Member report",
  equipment: "Equipment report",
  activities: "Activity report",
};

export const REPORT_CATEGORIES: readonly ReportCategory[] = [
  "attendance",
  "members",
  "equipment",
  "activities",
];

export function reportsInCategory(category: ReportCategory): ReportMeta[] {
  return REPORT_IDS.map((id) => reportMeta[id]).filter((meta) => meta.category === category);
}

/**
 * A rendered report - what shows on screen and what an export is built from.
 * Cells are pre-formatted strings/numbers, not raw domain values, so the
 * table, the CSV and the PDF never disagree about how something reads.
 */
export interface ReportTable {
  meta: ReportMeta;
  generatedAt: string;
  columns: string[];
  rows: (string | number)[][];
  /** Shown above the table when there is nothing to report, instead of an empty grid. */
  emptyMessage: string;
}
