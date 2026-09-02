"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Check, CheckCheck, MessageSquare, MessageSquareText } from "lucide-react";

import { MarkPicker } from "@/components/attendance/mark-picker";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/input";
import { saveRegisterAction } from "@/lib/attendance/actions";
import {
  ATTENDANCE_MARKS,
  NOTE_MAX,
  attendanceMarkLabels,
  type AttendanceEntry,
  type AttendanceMark,
} from "@/lib/attendance/types";
import { cn } from "@/lib/utils";

/**
 * Taking the register.
 *
 * Built for a phone in a scout hut: full-width thumb targets, patrol by patrol,
 * a running count that never leaves the screen and a save bar pinned to the
 * bottom. Nothing here needs a wide viewport - the desktop layout is the same
 * register with the controls moved alongside the names.
 *
 * Marks are held in one piece of state and written in a single save, so a
 * half-finished register never reaches the store.
 */

export interface RegisterRow {
  id: string;
  name: string;
  avatar: string | null;
  mark: AttendanceMark | null;
  note: string;
  /** Marked when the register was taken, but no longer on the roster. */
  carriedOver: boolean;
}

export interface RegisterGroup {
  key: string;
  name: string;
  scouts: RegisterRow[];
}

type Marks = Record<string, AttendanceMark | null>;
type Notes = Record<string, string>;

/** One string standing for the whole register, for comparing against the baseline. */
function serialise(marks: Marks, notes: Notes): string {
  return Object.keys(marks)
    .sort()
    .map((id) => `${id}:${marks[id] ?? "-"}:${notes[id]?.trim() ?? ""}`)
    .join("|");
}

const markTallyStyles: Record<AttendanceMark, string> = {
  present: "text-[#006300] dark:text-[#0ca30c]",
  absent: "text-[#b02a26] dark:text-[#f08a8a]",
  excused: "text-[#1c5cab] dark:text-[#86b6ef]",
  late: "text-[#7a5200] dark:text-[#fab219]",
};

export function RegisterForm({
  activityId,
  groups,
  canRecord,
  alreadyTaken,
}: {
  activityId: string;
  groups: RegisterGroup[];
  canRecord: boolean;
  /** True when a register already exists, so the wording is "edit" not "take". */
  alreadyTaken: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [justSaved, setJustSaved] = useState(false);

  const rows = useMemo(() => groups.flatMap((group) => group.scouts), [groups]);

  const [marks, setMarks] = useState<Marks>(() =>
    Object.fromEntries(rows.map((row) => [row.id, row.mark])),
  );
  const [notes, setNotes] = useState<Notes>(() =>
    Object.fromEntries(rows.map((row) => [row.id, row.note])),
  );
  // Notes start open where there is already something to read.
  const [openNotes, setOpenNotes] = useState<string[]>(() =>
    rows.filter((row) => row.note).map((row) => row.id),
  );

  const [baseline, setBaseline] = useState(() =>
    serialise(
      Object.fromEntries(rows.map((row) => [row.id, row.mark])),
      Object.fromEntries(rows.map((row) => [row.id, row.note])),
    ),
  );

  const dirty = serialise(marks, notes) !== baseline;

  const tally = useMemo(() => {
    const counts: Record<AttendanceMark, number> = { present: 0, absent: 0, excused: 0, late: 0 };
    let marked = 0;

    for (const row of rows) {
      const mark = marks[row.id];
      if (!mark) continue;
      counts[mark] += 1;
      marked += 1;
    }

    return { counts, marked, unmarked: rows.length - marked };
  }, [marks, rows]);

  function setMark(scoutId: string, mark: AttendanceMark) {
    setJustSaved(false);
    setMarks((previous) => ({ ...previous, [scoutId]: mark }));
  }

  function setNote(scoutId: string, note: string) {
    setJustSaved(false);
    setNotes((previous) => ({ ...previous, [scoutId]: note.slice(0, NOTE_MAX) }));
  }

  function toggleNote(scoutId: string) {
    setOpenNotes((previous) =>
      previous.includes(scoutId)
        ? previous.filter((id) => id !== scoutId)
        : [...previous, scoutId],
    );
  }

  /** Marks a set of scouts present in one go - the whole hall, or one patrol. */
  function markAllPresent(scoutIds: string[]) {
    setJustSaved(false);
    setMarks((previous) => {
      const next = { ...previous };
      for (const id of scoutIds) next[id] = "present";
      return next;
    });
  }

  function save() {
    setError(undefined);

    const entries: AttendanceEntry[] = rows
      .filter((row) => marks[row.id])
      .map((row) => ({
        scoutId: row.id,
        mark: marks[row.id] as AttendanceMark,
        note: notes[row.id] ?? "",
      }));

    if (entries.length === 0) {
      setError("Mark at least one scout before saving.");
      return;
    }

    startTransition(async () => {
      const result = await saveRegisterAction(activityId, entries);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setBaseline(serialise(marks, notes));
      setJustSaved(true);
      router.refresh();
    });
  }

  const allIds = rows.map((row) => row.id);

  return (
    <div className="space-y-4">
      {/* Running count. Stays above the register so it is read before the list. */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] text-ink-secondary">
                <span className="text-[20px] font-semibold text-ink tabular-nums">
                  {tally.marked}
                </span>
                <span className="text-ink-muted"> of {rows.length} marked</span>
              </p>
            </div>

            {canRecord && (
              <Button variant="secondary" onClick={() => markAllPresent(allIds)} disabled={pending}>
                <CheckCheck className="size-4" strokeWidth={2} aria-hidden />
                Mark all present
              </Button>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-4 gap-2">
            {ATTENDANCE_MARKS.map((mark) => (
              <div
                key={mark}
                className="rounded-lg border border-line bg-surface-muted px-2 py-2 text-center"
              >
                <dt className="text-[11px] text-ink-muted">{attendanceMarkLabels[mark]}</dt>
                <dd
                  className={cn(
                    "mt-0.5 text-[17px] font-semibold tabular-nums",
                    tally.counts[mark] > 0 ? markTallyStyles[mark] : "text-ink-muted",
                  )}
                >
                  {tally.counts[mark]}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {error && <Callout tone="error">{error}</Callout>}
      {justSaved && !dirty && (
        <Callout tone="success">
          Register saved. {tally.marked} of {rows.length} scouts marked.
        </Callout>
      )}

      {/* The register itself, patrol by patrol. */}
      {groups.map((group) => {
        const groupIds = group.scouts.map((scout) => scout.id);
        const groupMarked = groupIds.filter((id) => marks[id]).length;

        return (
          <Card key={group.key} className="overflow-hidden">
            <CardHeader className="px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <CardTitle className="truncate">{group.name}</CardTitle>
                <p className="mt-0.5 text-[12px] text-ink-muted tabular-nums">
                  {groupMarked} of {group.scouts.length} marked
                </p>
              </div>

              {canRecord && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllPresent(groupIds)}
                  disabled={pending}
                  title={`Mark every scout in ${group.name} present`}
                >
                  <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                  All present
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-0">
              <ul className="divide-y divide-line">
                {group.scouts.map((row) => {
                  const noteOpen = openNotes.includes(row.id);
                  const note = notes[row.id] ?? "";

                  return (
                    <li key={row.id} className="px-4 py-3 sm:px-5">
                      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <Avatar name={row.name} src={row.avatar} size="sm" />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-medium text-ink">
                              {row.name}
                            </p>
                            {row.carriedOver && (
                              <span className="text-[11px] text-ink-muted">
                                No longer on this roster
                              </span>
                            )}
                          </div>

                          {canRecord && (
                            <button
                              type="button"
                              onClick={() => toggleNote(row.id)}
                              aria-expanded={noteOpen}
                              aria-label={
                                note ? `Edit note for ${row.name}` : `Add a note for ${row.name}`
                              }
                              title={note ? "Edit note" : "Add a note"}
                              className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                                note
                                  ? "border-brand-border bg-brand-soft text-brand-text"
                                  : "border-line text-ink-muted hover:bg-surface-hover hover:text-ink",
                              )}
                            >
                              {note ? (
                                <MessageSquareText className="size-4" strokeWidth={1.9} aria-hidden />
                              ) : (
                                <MessageSquare className="size-4" strokeWidth={1.9} aria-hidden />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="shrink-0 sm:w-80">
                          {canRecord ? (
                            <MarkPicker
                              value={marks[row.id] ?? null}
                              onChange={(mark) => setMark(row.id, mark)}
                              name={`mark-${row.id}`}
                              scoutName={row.name}
                              disabled={pending}
                            />
                          ) : (
                            <div className="flex sm:justify-end">
                              {marks[row.id] ? (
                                <Badge tone="neutral">
                                  {attendanceMarkLabels[marks[row.id] as AttendanceMark]}
                                </Badge>
                              ) : (
                                <span className="text-[12px] text-ink-muted">Not marked</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {noteOpen && canRecord && (
                        <div className="mt-2.5">
                          <Textarea
                            rows={2}
                            value={note}
                            onChange={(event) => setNote(row.id, event.target.value)}
                            placeholder={`Anything worth recording about ${row.name.split(" ")[0]}...`}
                            aria-label={`Note for ${row.name}`}
                            maxLength={NOTE_MAX}
                            disabled={pending}
                            className="text-[13px]"
                          />
                        </div>
                      )}

                      {noteOpen && !canRecord && note && (
                        <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-[12.5px] text-ink-secondary">
                          {note}
                        </p>
                      )}

                      {!canRecord && !noteOpen && note && (
                        <p className="mt-2 text-[12px] text-ink-muted">{note}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        );
      })}

      {/* Save bar. Pinned to the bottom so it is in reach without scrolling back. */}
      {canRecord && (
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5 sm:shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px] text-ink-secondary">
              {tally.unmarked > 0 ? (
                <>
                  <span className="font-medium text-ink tabular-nums">{tally.unmarked}</span> not
                  marked - they are left off the register
                </>
              ) : dirty ? (
                "Everyone is marked."
              ) : (
                "No unsaved changes."
              )}
            </p>

            <Button onClick={save} disabled={pending || !dirty} className="min-h-11">
              {pending && <Spinner label="Saving register" />}
              {/* "Saved" only once there is something saved to be true about -
                  an untouched, never-taken register has not been saved. */}
              {pending
                ? "Saving..."
                : !dirty && alreadyTaken
                  ? "Saved"
                  : alreadyTaken
                    ? "Save changes"
                    : "Save register"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
