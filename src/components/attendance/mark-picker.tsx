"use client";

import {
  ATTENDANCE_MARKS,
  attendanceMarkLabels,
  type AttendanceMark,
} from "@/lib/attendance/types";
import { cn } from "@/lib/utils";

/**
 * The four-way choice, one scout at a time.
 *
 * Built for a thumb first: four equal columns filling the row, each at least
 * 44px tall, because a leader is holding a phone in a scout hut rather than
 * pointing a mouse. Every option always shows its word - the colour is a
 * reinforcement, not the signal - and the whole thing is a radio group so it
 * works from a keyboard and reads correctly to a screen reader.
 */

const selectedStyles: Record<AttendanceMark, string> = {
  present: "border-status-good bg-status-good/12 text-[#006300] dark:text-[#0ca30c]",
  absent: "border-status-critical bg-status-critical/12 text-[#b02a26] dark:text-[#f08a8a]",
  excused: "border-viz-accent bg-viz-accent/12 text-[#1c5cab] dark:text-[#86b6ef]",
  late: "border-status-warning bg-status-warning/16 text-[#7a5200] dark:text-[#fab219]",
};

export function MarkPicker({
  value,
  onChange,
  name,
  scoutName,
  disabled = false,
}: {
  value: AttendanceMark | null;
  onChange: (mark: AttendanceMark) => void;
  /** Unique radio-group name, so one scout's choice does not clear another's. */
  name: string;
  /** Used for the accessible label on each option. */
  scoutName: string;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={`Attendance for ${scoutName}`}
      className="grid w-full grid-cols-4 gap-1"
    >
      {ATTENDANCE_MARKS.map((mark) => {
        const selected = value === mark;

        return (
          <label
            key={mark}
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-1 text-center text-[12px] font-medium transition-colors select-none",
              "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
              selected
                ? selectedStyles[mark]
                : "border-line bg-surface text-ink-secondary hover:bg-surface-hover hover:text-ink",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="radio"
              name={name}
              value={mark}
              checked={selected}
              onChange={() => onChange(mark)}
              disabled={disabled}
              aria-label={`${attendanceMarkLabels[mark]} - ${scoutName}`}
              className="sr-only"
            />
            {attendanceMarkLabels[mark]}
          </label>
        );
      })}
    </div>
  );
}
