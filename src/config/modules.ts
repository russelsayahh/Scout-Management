import {
  BarChart3,
  FolderOpen,
  Settings,
  ShieldCheck,
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
