import Link from "next/link";
import { MapPin, Users } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { upcomingEvents } from "@/data/events";
import { splitDateParts } from "@/lib/format";
import type { EventKind } from "@/types";

/** Each kind ships a written label as well as a tone, so color never stands alone. */
const kindBadge: Record<EventKind, { label: string; tone: BadgeTone }> = {
  meeting: { label: "Meeting", tone: "neutral" },
  activity: { label: "Activity", tone: "info" },
  camp: { label: "Camp", tone: "brand" },
  training: { label: "Training", tone: "good" },
  deadline: { label: "Deadline", tone: "warning" },
};

export function UpcomingEvents() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Upcoming events</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">Next four weeks</p>
        </div>
        <Link
          href="/activities"
          className="shrink-0 text-[12.5px] font-medium text-brand-text hover:underline"
        >
          Full calendar
        </Link>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ul className="divide-y divide-line">
          {upcomingEvents.map((event) => {
            const { day, month, weekday } = splitDateParts(event.date);
            const badge = kindBadge[event.kind];

            return (
              <li key={event.id}>
                <Link
                  href="/activities"
                  className="flex gap-3.5 px-5 py-3.5 transition-colors hover:bg-surface-muted"
                >
                  <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-surface-muted">
                    <span className="text-[9.5px] font-medium tracking-wide text-ink-muted uppercase">
                      {weekday}
                    </span>
                    <span className="text-[15px] leading-none font-semibold text-ink">
                      {day}
                    </span>
                    <span className="text-[9.5px] font-medium tracking-wide text-ink-muted uppercase">
                      {month}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[13.5px] font-medium text-ink">
                        {event.title}
                      </p>
                      <Badge tone={badge.tone} dot className="shrink-0">
                        {badge.label}
                      </Badge>
                    </div>

                    <p className="mt-1 text-[12px] text-ink-secondary">{event.time}</p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-muted">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" strokeWidth={2} aria-hidden />
                        {event.location}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Users className="size-3" strokeWidth={2} aria-hidden />
                        {event.attendees}/{event.capacity} attending
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
