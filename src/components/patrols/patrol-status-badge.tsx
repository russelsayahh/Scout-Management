import { Badge, type BadgeTone } from "@/components/ui/badge";
import { patrolStatusLabels, type PatrolStatus } from "@/lib/patrols/types";

/** Each status carries a written label as well as a tone, never colour alone. */
const statusTones: Record<PatrolStatus, BadgeTone> = {
  active: "good",
  forming: "info",
  inactive: "neutral",
};

export function PatrolStatusBadge({
  status,
  archived = false,
}: {
  status: PatrolStatus;
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
      {patrolStatusLabels[status]}
    </Badge>
  );
}
