import type { Metadata } from "next";

import { ModuleSection } from "@/components/shared/module-section";
import { modules } from "@/config/modules";

const module_ = modules.settings;

export const metadata: Metadata = {
  title: module_.name,
  description: module_.description,
};

export default function SettingsPage() {
  return <ModuleSection module={module_} />;
}
