import {
  FolderOpen,
  Settings,
} from "lucide-react";

import type { ModuleConfig } from "@/types";

/**
 * Metadata for every section page that is still a placeholder. Each page
 * renders `<ModulePlaceholder />` against one entry here, so a section's copy
 * and roadmap live in one place and the pages themselves stay a few lines
 * long. Leaders has no entry here any more - it is a fully built section with
 * its own real page, not a placeholder.
 */
export const modules = {
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
    plannedFeatures: [
      { title: "Document library", description: "Folders, tags and search across every file." },
      { title: "Version history", description: "Keep prior revisions and see what changed." },
      { title: "Permission forms", description: "Templates that generate consent requests per event." },
      { title: "Access control", description: "Decide which roles can view or edit each folder." },
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
    plannedFeatures: [
      { title: "Group profile", description: "Name, district, meeting place and contact details." },
      { title: "Sections and terms", description: "Define sections, term dates and meeting nights." },
      { title: "Roles and permissions", description: "Control what each role can see and change." },
      { title: "Notifications", description: "Choose what the group is emailed about, and when." },
    ],
  },
} satisfies Record<string, ModuleConfig>;

export type ModuleKey = keyof typeof modules;
