import { Badge, type BadgeTone } from "@/components/ui/badge";
import { scoutStatusLabels, type ScoutStatus } from "@/lib/scouts/types";

/** Each status carries a written label as well as a tone, never colour alone. */
const statusTones: Record<ScoutStatus, BadgeTone> = {
  active: "good",
  inactive: "neutral",
  "waiting-list": "warning",
};

export function ScoutStatusBadge({
  status,
  archived = false,
}: {
  status: ScoutStatus;
  archived?: boolean;
}) {
  if (archived) {
    return (
      <Badge tone="neutral" dot>
        Archived
      </Badge>
    );
  }

  return (
    <Badge tone={statusTones[status]} dot>
      {scoutStatusLabels[status]}
    </Badge>
  );
}
