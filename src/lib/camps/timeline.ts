import {
  deadlinePassed,
  hasFinished,
  hasStarted,
  type Camp,
} from "@/lib/camps/types";

/**
 * The camp's milestones, in order.
 *
 * Built from what was recorded rather than inferred from the current status:
 * the camp stores when registration actually opened and closed, so the timeline
 * is history rather than a reconstruction. Milestones still ahead are shown as
 * planned, which is what makes it useful while a camp is being organised.
 */

export type MilestoneState = "done" | "current" | "upcoming" | "missed";

export interface CampMilestone {
  key: string;
  label: string;
  /** ISO day or datetime; formatted by the component. */
  date: string;
  state: MilestoneState;
  detail?: string;
}

/** Day-only comparison, so "today" means the whole day. */
function dayOf(iso: string): number {
  return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`).getTime();
}

function todayOf(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function campTimeline(camp: Camp, now: Date): CampMilestone[] {
  const today = todayOf(now);
  const milestones: CampMilestone[] = [];

  milestones.push({
    key: "created",
    label: "Camp added to the programme",
    date: camp.createdAt,
    state: "done",
  });

  if (camp.registrationOpenedAt) {
    milestones.push({
      key: "registration-opened",
      label: "Registration opened",
      date: camp.registrationOpenedAt,
      state: "done",
    });
  } else if (camp.status === "planning") {
    milestones.push({
      key: "registration-opens",
      label: "Registration opens",
      date: camp.createdAt,
      state: "upcoming",
      detail: "Still being planned - open it when the details are settled.",
    });
  }

  const deadlineDay = dayOf(camp.registrationDeadline);
  milestones.push({
    key: "deadline",
    label: "Registration deadline",
    date: camp.registrationDeadline,
    state: deadlinePassed(camp, now)
      ? "done"
      : deadlineDay === today
        ? "current"
        : "upcoming",
    detail:
      camp.status === "cancelled"
        ? undefined
        : deadlinePassed(camp, now)
          ? "Late additions are still possible."
          : undefined,
  });

  if (camp.registrationClosedAt) {
    milestones.push({
      key: "registration-closed",
      label: "Registration closed",
      date: camp.registrationClosedAt,
      state: "done",
    });
  }

  const startDay = dayOf(camp.startDate);
  const endDay = dayOf(camp.endDate);
  const running = hasStarted(camp, now) && !hasFinished(camp, now);

  milestones.push({
    key: "start",
    label: "Camp starts",
    date: camp.startDate,
    state:
      camp.status === "cancelled"
        ? "missed"
        : hasStarted(camp, now)
          ? startDay === today
            ? "current"
            : "done"
          : "upcoming",
  });

  milestones.push({
    key: "end",
    label: "Camp ends",
    date: camp.endDate,
    state:
      camp.status === "cancelled"
        ? "missed"
        : hasFinished(camp, now)
          ? "done"
          : endDay === today || running
            ? "current"
            : "upcoming",
  });

  if (camp.completedAt) {
    milestones.push({
      key: "completed",
      label: "Marked as completed",
      date: camp.completedAt,
      state: "done",
    });
  }

  if (camp.cancelledAt) {
    milestones.push({
      key: "cancelled",
      label: "Camp cancelled",
      date: camp.cancelledAt,
      state: "done",
      detail: camp.cancellationReason || undefined,
    });
  }

  return milestones;
}
