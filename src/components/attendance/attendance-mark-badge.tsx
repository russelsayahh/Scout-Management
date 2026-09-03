import { Badge, type BadgeTone } from "@/components/ui/badge";
import { attendanceMarkLabels, type AttendanceMark } from "@/lib/attendance/types";

/** Each mark carries its written label as well as a tone, never colour alone. */
export const markTones: Record<AttendanceMark, BadgeTone> = {
  present: "good",
  absent: "critical",
  excused: "info",
  late: "warning",
};

export function AttendanceMarkBadge({
  mark,
  className,
}: {
  mark: AttendanceMark;
  className?: string;
}) {
  return (
    <Badge tone={markTones[mark]} dot className={className}>
      {attendanceMarkLabels[mark]}
    </Badge>
  );
}
