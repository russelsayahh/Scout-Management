import { Badge, type BadgeTone } from "@/components/ui/badge";
import { campStatusLabels, type CampStatus } from "@/lib/camps/types";

/** Each status carries its written label as well as a tone, never colour alone. */
const statusTones: Record<CampStatus, BadgeTone> = {
  planning: "neutral",
  "registration-open": "good",
  "registration-closed": "warning",
  ongoing: "brand",
  completed: "info",
  cancelled: "critical",
};

export function CampStatusBadge({
  status,
  className,
}: {
  status: CampStatus;
  className?: string;
}) {
  return (
    <Badge tone={statusTones[status]} dot className={className}>
      {campStatusLabels[status]}
    </Badge>
  );
}
