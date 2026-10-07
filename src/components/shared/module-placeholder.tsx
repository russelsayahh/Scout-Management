import { Plus, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import type { ModuleConfig } from "@/types";

/**
 * Body shared by every section page. Each route passes its entry from
 * `config/modules.ts`, so the sections stay consistent and a new one is a
 * config entry plus a three-line page.
 */
export function ModulePlaceholder({
  module,
  canManage = false,
}: {
  module: ModuleConfig;
  /** Editing controls are only offered to roles that can change this section. */
  canManage?: boolean;
}) {
  const Icon = module.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title={module.name}
        description={module.description}
        actions={
          <>
            <Badge tone="brand" dot>
              In development
            </Badge>
            {canManage ? (
              <>
                <Button variant="secondary" size="md" disabled>
                  Export
                </Button>
                <Button size="md" disabled>
                  <Plus className="size-4" strokeWidth={2.2} aria-hidden />
                  New
                </Button>
              </>
            ) : (
              <Badge tone="neutral">View only</Badge>
            )}
          </>
        }
      />

      {/* At-a-glance figures, where there is real data behind the section to show. */}
      {module.metrics && module.metrics.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {module.metrics.map((metric) => (
            <Card key={metric.label} className="px-5 py-4">
              <p className="text-[12.5px] text-ink-secondary">{metric.label}</p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
                {metric.value}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
              <Icon className="size-4.5" strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <CardTitle>What this section will do</CardTitle>
              <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-secondary">
                {module.summary}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {module.plannedFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-3 rounded-lg border border-line bg-surface-muted p-3.5"
              >
                <Sparkles
                  className="mt-0.5 size-4 shrink-0 text-brand-text"
                  strokeWidth={1.9}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink">{feature.title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-ink-secondary">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-[12px] text-ink-muted">
        This is a UI placeholder. No data is loaded and no records can be changed yet.
      </p>
    </div>
  );
}
