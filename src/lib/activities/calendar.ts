import { sortActivities } from "@/lib/activities/query";
import type { Activity } from "@/lib/activities/types";

/**
 * Builds the month grid behind the calendar view.
 *
 * Pure, and computed entirely in UTC so a day never shifts under a reader in a
 * different time zone. Weeks start on Monday, which is what a UK Scout group
 * expects when it looks at a term.
 */

export interface CalendarDay {
  /** ISO day. */
  date: string;
  dayOfMonth: number;
  /** False for the leading and trailing days that pad the grid. */
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  activities: Activity[];
}

export interface CalendarMonth {
  /** "YYYY-MM". */
  month: string;
  /** "September 2026". */
  label: string;
  previousMonth: string;
  nextMonth: string;
  /** Whole weeks, Monday first, padded from the neighbouring months. */
  weeks: CalendarDay[][];
  /** Only the days in this month that have something on, for the agenda. */
  daysWithActivities: CalendarDay[];
  /** Activities falling inside this month, however the grid pads out. */
  total: number;
}

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** "YYYY-MM" for the month containing `date`. */
export function monthOf(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Falls back to the month containing `today` for anything unparseable. */
export function resolveMonth(value: string, today: Date): string {
  return MONTH_PATTERN.test(value) ? value : monthOf(today);
}

function shiftMonth(month: string, delta: number): string {
  const [year, index] = month.split("-").map(Number);
  return monthOf(new Date(Date.UTC(year, index - 1 + delta, 1)));
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function monthLabel(month: string): string {
  const [year, index] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, index - 1, 1)));
}

/**
 * `activities` should already be filtered; this only groups them onto days.
 * Days carry their activities in chronological order regardless of the list
 * view's sort, because a calendar cell only ever reads by time.
 */
export function buildCalendarMonth(
  month: string,
  activities: Activity[],
  today: Date,
): CalendarMonth {
  const [year, index] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, index - 1, 1));

  const byDay = new Map<string, Activity[]>();
  for (const activity of activities) {
    const day = byDay.get(activity.date);
    if (day) day.push(activity);
    else byDay.set(activity.date, [activity]);
  }
  for (const [day, entries] of byDay) {
    byDay.set(day, sortActivities(entries, "date", "asc"));
  }

  // Monday-first: JavaScript's Sunday is 0, so rotate it to the end.
  const leading = (first.getUTCDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setUTCDate(gridStart.getUTCDate() - leading);

  const todayIso = isoDay(today);
  const weeks: CalendarDay[][] = [];
  const cursor = new Date(gridStart);

  // Six rows always, so the grid does not change height between months.
  for (let week = 0; week < 6; week += 1) {
    const days: CalendarDay[] = [];

    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = isoDay(cursor);
      const weekdayIndex = cursor.getUTCDay();

      days.push({
        date,
        dayOfMonth: cursor.getUTCDate(),
        inMonth: cursor.getUTCMonth() === index - 1,
        isToday: date === todayIso,
        isWeekend: weekdayIndex === 0 || weekdayIndex === 6,
        activities: byDay.get(date) ?? [],
      });

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    weeks.push(days);
  }

  const inMonthDays = weeks.flat().filter((day) => day.inMonth);

  return {
    month,
    label: monthLabel(month),
    previousMonth: shiftMonth(month, -1),
    nextMonth: shiftMonth(month, 1),
    weeks,
    daysWithActivities: inMonthDays.filter((day) => day.activities.length > 0),
    total: inMonthDays.reduce((sum, day) => sum + day.activities.length, 0),
  };
}
