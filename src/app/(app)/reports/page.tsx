import type { Metadata } from "next";

import { ModuleSection } from "@/components/shared/module-section";
import { modules } from "@/config/modules";

const module_ = modules.reports;

export const metadata: Metadata = {
  title: module_.name,
  description: module_.description,
};

export default function ReportsPage() {
  return <ModuleSection module={module_} />;
}
