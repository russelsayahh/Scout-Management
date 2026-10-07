import * as activityStore from "@/lib/activities/store";
import { activityTypeLabels, ACTIVITY_TYPES } from "@/lib/activities/types";
import { activityCounts, expectedAttendance } from "@/lib/activities/service";
import * as attendanceStore from "@/lib/attendance/store";
import { addMark, emptyTally } from "@/lib/attendance/types";
import { attendanceOverview } from "@/lib/attendance/service";
import type { TroopScope } from "@/lib/auth/troop-scope";
import { onLoanMap, openLoans, positionOf } from "@/lib/equipment/service";
import * as equipmentStore from "@/lib/equipment/store";
import { categoryLabels, conditionLabels, totalOwned } from "@/lib/equipment/types";
import * as patrolStore from "@/lib/patrols/store";
import * as scoutStore from "@/lib/scouts/store";
import { ageOn, genderLabels, scoutFullName } from "@/lib/scouts/types";
import { formatShortDate } from "@/lib/format";
import { reportMeta, REPORT_IDS, type ReportId, type ReportTable } from "@/lib/reports/types";

/**
 * Builds one report as a table, from `scope` and the domain services each
 * report topic already has - or, where nothing existed yet (attendance by
 * member, demographics, activities by type, participation), a small
 * aggregation written here rather than in the domain's own service, since
 * these exist only for reporting and would otherwise be dead weight on
 * modules that have no other reason to know about them.
 *
 * Node-only.
 */

function rate(value: number | null): string {
  return value === null ? "-" : `${value}%`;
}

/* -------------------------------- attendance ------------------------------- */

async function attendanceByMember(scope: TroopScope): Promise<Pick<ReportTable, "columns" | "rows">> {
  const [records, scouts, patrols] = await Promise.all([
    attendanceStore.attendanceInScope(scope),
    scoutStore.scoutsInScope(scope),
    patrolStore.patrolsInScope(scope),
  ]);

  const patrolNames = new Map(patrols.map((patrol) => [patrol.id, patrol.name]));
  const scoutById = new Map(scouts.map((scout) => [scout.id, scout]));
  const tallies = new Map<string, ReturnType<typeof emptyTally>>();

  for (const record of records) {
    for (const entry of record.entries) {
      if (!scoutById.has(entry.scoutId)) continue;
      let tally = tallies.get(entry.scoutId);
      if (!tally) {
        tally = emptyTally();
        tallies.set(entry.scoutId, tally);
      }
      addMark(tally, entry.mark);
    }
  }

  const rows = [...tallies.entries()]
    .map(([scoutId, tally]) => {
      const scout = scoutById.get(scoutId)!;
      return [
        scoutFullName(scout),
        scout.patrolId ? (patrolNames.get(scout.patrolId) ?? "Unknown patrol") : "Unassigned",
        tally.present,
        tally.absent,
        tally.excused,
        tally.late,
        tally.total,
        rate(tally.rate),
      ];
    })
    .sort((a, b) => (a[0] as string).localeCompare(b[0] as string));

  return {
    columns: ["Name", "Patrol", "Present", "Absent", "Excused", "Late", "Total", "Rate"],
    rows,
  };
}

async function attendanceByPatrolReport(
  scope: TroopScope,
  now: Date,
): Promise<Pick<ReportTable, "columns" | "rows">> {
  const overview = await attendanceOverview(scope, now);

  return {
    columns: ["Patrol", "Present", "Absent", "Excused", "Late", "Total", "Rate"],
    rows: overview.byPatrol.map((row) => [
      row.name,
      row.tally.present,
      row.tally.absent,
      row.tally.excused,
      row.tally.late,
      row.tally.total,
      rate(row.tally.rate),
    ]),
  };
}

async function attendanceOverTimeReport(
  scope: TroopScope,
  now: Date,
): Promise<Pick<ReportTable, "columns" | "rows">> {
  const overview = await attendanceOverview(scope, now);

  return {
    columns: ["Date", "Activity", "Rate"],
    rows: [...overview.trend].reverse().map((point) => [
      formatShortDate(point.date),
      point.name,
      rate(point.rate),
    ]),
  };
}

/* --------------------------------- members ---------------------------------- */

async function activeMembersReport(scope: TroopScope): Promise<Pick<ReportTable, "columns" | "rows">> {
  const [scouts, patrols] = await Promise.all([
    scoutStore.scoutsInScope(scope),
    patrolStore.patrolsInScope(scope),
  ]);
  const patrolNames = new Map(patrols.map((patrol) => [patrol.id, patrol.name]));
  const now = new Date();

  const active = scouts
    .filter((scout) => !scout.archived && scout.status === "active")
    .sort((a, b) => scoutFullName(a).localeCompare(scoutFullName(b)));

  return {
    columns: ["Name", "Patrol", "Joined", "Age"],
    rows: active.map((scout) => [
      scoutFullName(scout),
      scout.patrolId ? (patrolNames.get(scout.patrolId) ?? "Unknown patrol") : "Unassigned",
      formatShortDate(scout.joinDate),
      ageOn(scout.dateOfBirth, now) ?? "-",
    ]),
  };
}

async function membersByPatrolReport(scope: TroopScope): Promise<Pick<ReportTable, "columns" | "rows">> {
  const [scouts, patrols] = await Promise.all([
    scoutStore.scoutsInScope(scope),
    patrolStore.patrolsInScope(scope),
  ]);

  const current = scouts.filter((scout) => !scout.archived);

  const rows = patrols
    .filter((patrol) => !patrol.archived)
    .map((patrol) => {
      const members = current.filter((scout) => scout.patrolId === patrol.id);
      const active = members.filter((scout) => scout.status === "active");
      return [patrol.name, members.length, active.length];
    })
    .sort((a, b) => (b[1] as number) - (a[1] as number));

  const unassigned = current.filter((scout) => scout.patrolId === null);
  if (unassigned.length > 0) {
    rows.push([
      "Unassigned",
      unassigned.length,
      unassigned.filter((scout) => scout.status === "active").length,
    ]);
  }

  return { columns: ["Patrol", "Members", "Active"], rows };
}

const AGE_BANDS: [label: string, min: number, max: number][] = [
  ["Under 8", 0, 7],
  ["8-10", 8, 10],
  ["11-13", 11, 13],
  ["14-17", 14, 17],
  ["18 and over", 18, 200],
];

function ageBandOf(age: number | null): string {
  if (age === null) return "Unknown";
  const band = AGE_BANDS.find(([, min, max]) => age >= min && age <= max);
  return band ? band[0] : "Unknown";
}

async function demographicsReport(scope: TroopScope): Promise<Pick<ReportTable, "columns" | "rows">> {
  const scouts = (await scoutStore.scoutsInScope(scope)).filter((scout) => !scout.archived);
  const now = new Date();

  const byGender = new Map<string, number>();
  for (const scout of scouts) {
    byGender.set(genderLabels[scout.gender], (byGender.get(genderLabels[scout.gender]) ?? 0) + 1);
  }

  const byAgeBand = new Map<string, number>();
  for (const scout of scouts) {
    const band = ageBandOf(ageOn(scout.dateOfBirth, now));
    byAgeBand.set(band, (byAgeBand.get(band) ?? 0) + 1);
  }

  const rows: (string | number)[][] = [];
  for (const [group, count] of byGender) rows.push(["Gender", group, count]);
  for (const [label] of AGE_BANDS) rows.push(["Age", label, byAgeBand.get(label) ?? 0]);
  if (byAgeBand.has("Unknown")) rows.push(["Age", "Unknown", byAgeBand.get("Unknown")!]);

  return { columns: ["Dimension", "Group", "Members"], rows };
}

/* -------------------------------- equipment --------------------------------- */

async function equipmentPositions() {
  const [items, onLoan] = await Promise.all([equipmentStore.allItems(), onLoanMap()]);
  return items
    .filter((item) => item.condition !== "retired")
    .map((item) => ({ item, position: positionOf(item, onLoan.get(item.id) ?? 0) }));
}

async function equipmentAvailableReport(): Promise<Pick<ReportTable, "columns" | "rows">> {
  const positions = await equipmentPositions();
  const rows = positions
    .filter(
      ({ item, position }) =>
        item.availability === "available" && item.condition !== "damaged" && position.available > 0,
    )
    .map(({ item, position }) => [
      item.name,
      categoryLabels[item.category],
      conditionLabels[item.condition],
      item.location || "-",
      position.available,
    ])
    .sort((a, b) => (a[0] as string).localeCompare(b[0] as string));

  return { columns: ["Item", "Category", "Condition", "Location", "Available"], rows };
}

async function equipmentAssignedReport(
  scope: TroopScope,
  now: Date,
): Promise<Pick<ReportTable, "columns" | "rows">> {
  const loans = await openLoans(scope, now);

  return {
    columns: ["Item", "Holder", "Quantity", "Checked out", "Due back", "Overdue"],
    rows: loans.map((row) => [
      row.item.name,
      row.holder.name,
      row.loan.quantity,
      formatShortDate(row.loan.checkedOutAt),
      row.loan.dueBack ? formatShortDate(row.loan.dueBack) : "Open-ended",
      row.overdue ? "Yes" : "No",
    ]),
  };
}

async function equipmentDamagedReport(): Promise<Pick<ReportTable, "columns" | "rows">> {
  const items = await equipmentStore.allItems();
  const rows = items
    .filter((item) => item.condition === "damaged" || item.damaged > 0)
    .map((item) => [
      item.name,
      categoryLabels[item.category],
      item.damaged,
      item.location || "-",
      item.notes || "-",
    ])
    .sort((a, b) => (b[2] as number) - (a[2] as number));

  return { columns: ["Item", "Category", "Damaged units", "Location", "Notes"], rows };
}

async function equipmentMaintenanceReport(): Promise<Pick<ReportTable, "columns" | "rows">> {
  const positions = await equipmentPositions();
  const rows = positions
    .filter(({ item }) => item.condition === "needs-maintenance")
    .map(({ item }) => [
      item.name,
      categoryLabels[item.category],
      totalOwned(item),
      item.location || "-",
      item.notes || "-",
    ])
    .sort((a, b) => (a[0] as string).localeCompare(b[0] as string));

  return { columns: ["Item", "Category", "Units owned", "Location", "Notes"], rows };
}

/* -------------------------------- activities --------------------------------- */

async function activitiesCountReport(
  scope: TroopScope,
  now: Date,
): Promise<Pick<ReportTable, "columns" | "rows">> {
  const counts = await activityCounts(scope, now);

  return {
    columns: ["Status", "Total", "Upcoming"],
    rows: (Object.keys(counts.byStatus) as (keyof typeof counts.byStatus)[]).map((status) => [
      status[0].toUpperCase() + status.slice(1),
      counts.byStatus[status],
      counts.upcomingByStatus[status],
    ]),
  };
}

async function activitiesByTypeReport(scope: TroopScope): Promise<Pick<ReportTable, "columns" | "rows">> {
  const activities = await activityStore.activitiesInScope(scope);

  const byType = new Map<string, number>();
  for (const activity of activities) {
    byType.set(activity.type, (byType.get(activity.type) ?? 0) + 1);
  }

  return {
    columns: ["Type", "Count"],
    rows: ACTIVITY_TYPES.map((type) => [activityTypeLabels[type], byType.get(type) ?? 0]).sort(
      (a, b) => (b[1] as number) - (a[1] as number),
    ),
  };
}

async function participationReport(scope: TroopScope): Promise<Pick<ReportTable, "columns" | "rows">> {
  const [activities, records] = await Promise.all([
    activityStore.activitiesInScope(scope),
    attendanceStore.attendanceInScope(scope),
  ]);

  const withRegisters = activities.filter((activity) =>
    records.some((record) => record.eventId === activity.id),
  );
  const expected = await expectedAttendance(withRegisters);
  const recordByActivity = new Map(records.map((record) => [record.eventId, record]));

  const rows = withRegisters
    .map((activity) => {
      const record = recordByActivity.get(activity.id)!;
      const tally = emptyTally();
      for (const entry of record.entries) addMark(tally, entry.mark);

      return [
        activity.name,
        formatShortDate(activity.date),
        activityTypeLabels[activity.type],
        expected[activity.id] ?? 0,
        tally.attended,
        rate(tally.rate),
      ];
    })
    .sort((a, b) => (b[1] as string).localeCompare(a[1] as string));

  return { columns: ["Activity", "Date", "Type", "Expected", "Attended", "Rate"], rows };
}

/* --------------------------------- dispatch ---------------------------------- */

async function buildBody(
  id: ReportId,
  scope: TroopScope,
  now: Date,
): Promise<Pick<ReportTable, "columns" | "rows">> {
  switch (id) {
    case "attendance-by-member":
      return attendanceByMember(scope);
    case "attendance-by-patrol":
      return attendanceByPatrolReport(scope, now);
    case "attendance-over-time":
      return attendanceOverTimeReport(scope, now);
    case "members-active":
      return activeMembersReport(scope);
    case "members-by-patrol":
      return membersByPatrolReport(scope);
    case "members-demographics":
      return demographicsReport(scope);
    case "equipment-available":
      return equipmentAvailableReport();
    case "equipment-assigned":
      return equipmentAssignedReport(scope, now);
    case "equipment-damaged":
      return equipmentDamagedReport();
    case "equipment-maintenance":
      return equipmentMaintenanceReport();
    case "activities-count":
      return activitiesCountReport(scope, now);
    case "activities-by-type":
      return activitiesByTypeReport(scope);
    case "activities-participation":
      return participationReport(scope);
  }
}

const emptyMessages: Record<ReportId, string> = {
  "attendance-by-member": "No registers have been taken yet.",
  "attendance-by-patrol": "No registers have been taken yet.",
  "attendance-over-time": "No registers have been taken yet.",
  "members-active": "No active members on the register.",
  "members-by-patrol": "There are no patrols to report on.",
  "members-demographics": "There are no members to report on.",
  "equipment-available": "Nothing in the store is currently available.",
  "equipment-assigned": "Nothing is currently checked out.",
  "equipment-damaged": "No equipment is recorded as damaged.",
  "equipment-maintenance": "Nothing needs maintenance.",
  "activities-count": "There is no programme yet.",
  "activities-by-type": "There is no programme yet.",
  "activities-participation": "No activity has a register taken yet.",
};

export async function buildReportTable(
  id: ReportId,
  scope: TroopScope,
  now: Date,
): Promise<ReportTable> {
  const body = await buildBody(id, scope, now);

  return {
    meta: reportMeta[id],
    generatedAt: now.toISOString(),
    emptyMessage: emptyMessages[id],
    ...body,
  };
}

/** Every report a caller in `scope` can see, built together for the landing page. */
export async function buildAllReports(scope: TroopScope, now: Date): Promise<ReportTable[]> {
  return Promise.all(REPORT_IDS.map((id) => buildReportTable(id, scope, now)));
}
