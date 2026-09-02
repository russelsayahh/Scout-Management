import { Badge, type BadgeTone } from "@/components/ui/badge";
import { activityStatusLabels, type ActivityStatus } from "@/lib/activities/types";

/** Each status carries a written label as well as a tone, never colour alone. */
const statusTones: Record<ActivityStatus, BadgeTone> = {
  draft: "neutral",
  published: "good",
  completed: "info",
  cancelled: "critical",
};

export function ActivityStatusBadge({
  status,
  className,
}: {
  status: ActivityStatus;
  className?: string;
}) {
  return (
    <Badge tone={statusTones[status]} dot className={className}>
      {activityStatusLabels[status]}
    </Badge>
  );
}
