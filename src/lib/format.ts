/**
 * Formatting helpers.
 *
 * Every formatter pins its locale and time zone so the server and the client
 * produce byte-identical output. Anything relative ("2 hours ago") is stored
 * pre-formatted in the sample data instead of being derived from `Date.now()`.
 */

const LOCALE = "en-GB";
const TIME_ZONE = "UTC";

/** 1284 -> "1,284"; 12900 -> "12.9K". */
export function formatCompactNumber(value: number): string {
  if (Math.abs(value) < 10_000) return value.toLocaleString(LOCALE);
  return new Intl.NumberFormat(LOCALE, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** 87.4 -> "87.4%". */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/** 12 -> "+12"; -3 -> "-3". Percentage points get "pp". */
export function formatDelta(
  value: number,
  unit: "absolute" | "percentage-point" = "absolute",
): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const magnitude = Math.abs(value);
  const body =
    unit === "percentage-point"
      ? `${magnitude.toFixed(1)}pp`
      : formatCompactNumber(magnitude);
  return `${sign}${body}`;
}

/** "2026-09-14" -> { day: "14", month: "Sep", weekday: "Mon" }. */
export function splitDateParts(iso: string): {
  day: string;
  month: string;
  weekday: string;
} {
  const date = new Date(iso);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: TIME_ZONE }).format(date);

  return {
    day: part({ day: "numeric" }),
    month: part({ month: "short" }),
    weekday: part({ weekday: "short" }),
  };
}

/** "2026-08-25T10:00:00.000Z" -> "25 August 2026". */
export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}
