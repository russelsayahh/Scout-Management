import {
  Backpack,
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Flag,
  FolderOpen,
  Settings,
  ShieldCheck,
  Tent,
} from "lucide-react";

import type { ModuleConfig } from "@/types";

/**
 * Metadata for every section page. Each page renders `<ModulePlaceholder />`
 * against one entry here, so a section's copy, metrics and roadmap live in one
 * place and the pages themselves stay a few lines long.
 */
export const modules = {
  leaders: {
    key: "leaders",
    name: "Leaders",
    href: "/leaders",
    icon: ShieldCheck,
    permission: "leaders.view",
    managePermission: "leaders.manage",
    description: "Adult volunteers, roles, training and safeguarding checks.",
    summary:
      "Leader records will cover appointments, warrants, safeguarding status and training modules, with reminders raised as renewals fall due.",
    metrics: [
      { label: "Active leaders", value: "32" },
      { label: "Warranted", value: "21" },
      { label: "Renewals due", value: "3" },
    ],
    plannedFeatures: [
      { title: "Leader directory", description: "Roles, sections and contact details for every adult volunteer." },
      { title: "Training records", description: "Module completion, wood badge progress and validation dates." },
      { title: "Safeguarding checks", description: "Track disclosure status and renewal deadlines." },
      { title: "Role assignment", description: "Assign leaders to sections, patrols and individual events." },
    ],
  },
  patrols: {
    key: "patrols",
    name: "Patrols",
    href: "/patrols",
    icon: Flag,
    permission: "patrols.view",
    managePermission: "patrols.manage",
    description: "Patrol structure, leadership and membership.",
    summary:
      "Patrols will be managed as first-class groups - membership, patrol leader and assistant, points and standing across the term.",
    metrics: [
      { label: "Patrols", value: "14" },
      { label: "Average size", value: "8" },
      { label: "Patrol leaders", value: "14" },
    ],
    plannedFeatures: [
      { title: "Patrol builder", description: "Create patrols and move members between them." },
      { title: "Leadership roles", description: "Assign patrol leaders and assistant patrol leaders." },
      { title: "Patrol points", description: "Running totals for inter-patrol competitions." },
      { title: "Patrol view", description: "Attendance and progress rolled up per patrol." },
    ],
  },
  activities: {
    key: "activities",
    name: "Activities",
    href: "/activities",
    icon: CalendarDays,
    permission: "activities.view",
    managePermission: "activities.manage",
    description: "Weekly programme, sessions and activity planning.",
    summary:
      "The programme planner will hold weekly meetings and one-off activities, each with a plan, required kit, risk assessment and assigned leaders.",
    metrics: [
      { label: "Scheduled", value: "12" },
      { label: "This month", value: "5" },
      { label: "Needs a plan", value: "2" },
    ],
    plannedFeatures: [
      { title: "Programme calendar", description: "Term view of meetings, activities and events." },
      { title: "Session plans", description: "Objectives, timings, kit lists and leader assignments." },
      { title: "Risk assessments", description: "Attach and approve assessments before an activity runs." },
      { title: "Badge links", description: "Map activities to the badge requirements they satisfy." },
    ],
  },
  camps: {
    key: "camps",
    name: "Camps",
    href: "/camps",
    icon: Tent,
    permission: "camps.view",
    managePermission: "camps.manage",
    description: "Residential events, bookings, permissions and logistics.",
    summary:
      "Camp management will cover the whole cycle - site booking, costing, permission collection, kit lists, catering numbers and a final nominal roll.",
    metrics: [
      { label: "Upcoming camps", value: "4" },
      { label: "Places booked", value: "126" },
      { label: "Awaiting consent", value: "18" },
    ],
    plannedFeatures: [
      { title: "Camp setup", description: "Dates, site, cost per head and capacity in one record." },
      { title: "Bookings", description: "Track who is attending, deposits and outstanding payments." },
      { title: "Permission forms", description: "Issue, chase and record consent from guardians." },
      { title: "Nominal roll", description: "Generate the roll, dietary needs and medical summary." },
    ],
  },
  attendance: {
    key: "attendance",
    name: "Attendance",
    href: "/attendance",
    icon: ClipboardCheck,
    permission: "attendance.view",
    managePermission: "attendance.record",
    description: "Register taking, trends and follow-up.",
    summary:
      "Attendance will be taken per session in a few taps, then rolled up into per-scout, per-patrol and per-term trends that highlight who is drifting away.",
    metrics: [
      { label: "Attendance rate", value: "87.4%" },
      { label: "Registers this term", value: "24" },
      { label: "Flagged scouts", value: "7" },
    ],
    plannedFeatures: [
      { title: "Quick register", description: "Take a register on a phone at the start of a meeting." },
      { title: "Trends", description: "Attendance over time by scout, patrol and section." },
      { title: "Absence follow-up", description: "Flag repeated absence and log the contact made." },
      { title: "Term reports", description: "Export attendance summaries for the group executive." },
    ],
  },
  equipment: {
    key: "equipment",
    name: "Equipment",
    href: "/equipment",
    icon: Backpack,
    permission: "equipment.view",
    managePermission: "equipment.manage",
    description: "Group kit, condition, loans and stocktakes.",
    summary:
      "The quartermaster store will track every item - tents, stoves, ropes and camp kit - with condition, location, loan history and service dates.",
    metrics: [
      { label: "Items tracked", value: "412" },
      { label: "On loan", value: "37" },
      { label: "Needs repair", value: "9" },
    ],
    plannedFeatures: [
      { title: "Inventory", description: "Catalogue kit by category, location and condition." },
      { title: "Loans", description: "Check equipment out to a camp, patrol or leader and back in." },
      { title: "Maintenance", description: "Log damage, repairs and inspection dates." },
      { title: "Stocktake", description: "Guided count with a reconciliation report." },
    ],
  },
  documents: {
    key: "documents",
    name: "Documents",
    href: "/documents",
    icon: FolderOpen,
    permission: "documents.view",
    managePermission: "documents.manage",
    description: "Policies, forms, permissions and shared files.",
    summary:
      "A single library for policies, risk assessments, permission forms and newsletters, with versioning and control over who can see each folder.",
    metrics: [
      { label: "Documents", value: "186" },
      { label: "Shared folders", value: "11" },
      { label: "Pending review", value: "6" },
    ],
    plannedFeatures: [
      { title: "Document library", description: "Folders, tags and search across every file." },
      { title: "Version history", description: "Keep prior revisions and see what changed." },
      { title: "Permission forms", description: "Templates that generate consent requests per event." },
      { title: "Access control", description: "Decide which roles can view or edit each folder." },
    ],
  },
  reports: {
    key: "reports",
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    permission: "reports.view",
    description: "Census figures, trends and exports for the group.",
    summary:
      "Reporting will turn register, attendance and programme data into the figures the group needs - census returns, retention, growth and finance summaries.",
    metrics: [
      { label: "Report templates", value: "9" },
      { label: "Scheduled", value: "3" },
      { label: "Last census", value: "Jan 2026" },
    ],
    plannedFeatures: [
      { title: "Census return", description: "Assemble the annual return from live membership data." },
      { title: "Retention analysis", description: "Joiners, leavers and retention by section and term." },
      { title: "Custom reports", description: "Build a report from any combination of fields." },
      { title: "Scheduled exports", description: "Email a report to the executive on a schedule." },
    ],
  },
  settings: {
    key: "settings",
    name: "Settings",
    href: "/settings",
    icon: Settings,
    permission: "settings.view",
    managePermission: "settings.manage",
    description: "Group profile, sections, roles and preferences.",
    summary:
      "Configuration for the whole platform - group details, section structure, custom fields, notification preferences and who can do what.",
    metrics: [
      { label: "Sections", value: "4" },
      { label: "Roles", value: "6" },
      { label: "Members", value: "280" },
    ],
    plannedFeatures: [
      { title: "Group profile", description: "Name, district, meeting place and contact details." },
      { title: "Sections and terms", description: "Define sections, term dates and meeting nights." },
      { title: "Roles and permissions", description: "Control what each role can see and change." },
      { title: "Notifications", description: "Choose what the group is emailed about, and when." },
    ],
  },
} satisfies Record<string, ModuleConfig>;

export type ModuleKey = keyof typeof modules;
