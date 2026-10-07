import { randomUUID } from "node:crypto";

import * as userStore from "@/lib/auth/store";
import { inScope, type TroopScope } from "@/lib/auth/troop-scope";
import type { Camp, CampDetails, CampRegistration, CampStatus } from "@/lib/camps/types";
import { campSlug } from "@/lib/camps/types";
import { createJsonStore } from "@/lib/json-store";
import { PATROL_TROOP_BY_SLUG, patrolTroopName } from "@/lib/patrols/store";
import { patrolSlug } from "@/lib/patrols/types";
import * as scoutStore from "@/lib/scouts/store";
import { troopSlug } from "@/lib/troops/types";

/**
 * Camp repository - the only module that knows how camps are persisted.
 *
 * Node-only.
 */

/** Days before the deadline that a camp is first written up, and announced. */
const PLANNED_BEFORE_DEADLINE = 56;
const OPENED_BEFORE_DEADLINE = 28;

function shiftDays(isoDay: string, days: number, time: string): string {
  const date = new Date(`${isoDay}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.toISOString().slice(0, 10)}T${time}`;
}

/** ISO timestamps sort as strings, so the earlier of two is the smaller one. */
function earliest(a: string, b: string): string {
  return a < b ? a : b;
}

/** Stable non-negative hash, so a reseed produces the same roster. */
function hash(value: string): number {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) % 1_000_003;
  }
  return total;
}

const ADMIN = "admin@1striverside.org";
const LEADER = "priya.raman@1striverside.org";
const ASSISTANT = "tom.nowak@1striverside.org";

interface SeedCamp {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  /** Emails, resolved to user ids when seeding. */
  leaderEmails: string[];
  /** Troop name; resolved via `troopSlug()` when seeding. Every patrol below must belong to it. */
  troop: string;
  /** Patrol names; an empty list means the whole troop is invited. */
  patrols: string[];
  maxParticipants: number;
  status: CampStatus;
  /** Roughly what share of the eligible scouts signed up, 0 to 1. */
  fill: number;
  cancellationReason?: string;
}

/**
 * A year of camps either side of the seeded "today", covering every status so
 * the list, the dashboard and the timeline all have something to show.
 */
const SEED: SeedCamp[] = [
  {
    name: "Spring Adventure Camp",
    description:
      "Three days of climbing, caving and a night hike, run jointly with the district team.",
    location: "Gilwell Park",
    startDate: "2026-04-17",
    endDate: "2026-04-19",
    registrationDeadline: "2026-04-03",
    leaderEmails: [LEADER, ASSISTANT],
    troop: "Louveteaux",
    patrols: [],
    maxParticipants: 60,
    status: "completed",
    fill: 0.82,
  },
  {
    name: "Summer Expedition",
    description:
      "Five days in Snowdonia: two days of hill walking, a summit attempt and a wild camp.",
    location: "Snowdonia National Park",
    startDate: "2026-07-24",
    endDate: "2026-07-28",
    registrationDeadline: "2026-06-26",
    leaderEmails: [ADMIN, LEADER],
    troop: "Scouts",
    patrols: ["Badger"],
    maxParticipants: 24,
    status: "completed",
    fill: 0.9,
  },
  {
    name: "Water Activities Weekend",
    description: "Kayaking, raft building and open water swimming at the activity centre.",
    location: "Riverside Activity Centre",
    startDate: "2026-08-14",
    endDate: "2026-08-16",
    registrationDeadline: "2026-07-31",
    leaderEmails: [LEADER],
    troop: "Guides",
    patrols: ["Otter"],
    maxParticipants: 16,
    status: "cancelled",
    fill: 0.5,
    cancellationReason:
      "River levels stayed too high after the July storms. Rebooked for next spring.",
  },
  {
    name: "District Autumn Challenge",
    description:
      "Overnight inter-group challenge: pioneering, navigation and an incident hike.",
    location: "Beacon Hill Campsite",
    startDate: "2026-09-05",
    endDate: "2026-09-06",
    registrationDeadline: "2026-08-21",
    leaderEmails: [ADMIN],
    troop: "Scouts",
    patrols: ["Heron"],
    maxParticipants: 18,
    status: "registration-closed",
    fill: 1,
  },
  {
    name: "Autumn Survival Camp",
    description:
      "The big one. Shelter building, backwoods cooking, fire lighting and a wide game after dark. Full kit list goes out with the permission form.",
    location: "Gilwell Park",
    startDate: "2026-09-18",
    endDate: "2026-09-20",
    registrationDeadline: "2026-09-11",
    leaderEmails: [LEADER, ASSISTANT, ADMIN],
    troop: "Caravelles",
    patrols: [],
    maxParticipants: 60,
    status: "registration-open",
    fill: 0.62,
  },
  {
    name: "County Camporee",
    description:
      "Weekend camp with groups from across the county, finishing with the county flag competition.",
    location: "Ashdown Woods",
    startDate: "2026-10-09",
    endDate: "2026-10-11",
    registrationDeadline: "2026-09-30",
    leaderEmails: [ADMIN, ASSISTANT],
    troop: "Routiers",
    patrols: [],
    maxParticipants: 45,
    status: "registration-open",
    fill: 0.31,
  },
  {
    name: "Winter Bothy Night",
    description:
      "Still being planned: a hill walk in to a bothy, one night, out again the next morning. Older scouts only.",
    location: "Brecon Beacons",
    startDate: "2026-11-14",
    endDate: "2026-11-15",
    registrationDeadline: "2026-11-01",
    leaderEmails: [ADMIN],
    troop: "Caravelles",
    patrols: ["Peregrine"],
    maxParticipants: 12,
    status: "planning",
    fill: 0,
  },
  {
    name: "New Year Sleepover",
    description: "Games, a film and a midnight cocoa in the hut. Being costed.",
    location: "Riverside Scout Hut",
    startDate: "2026-12-30",
    endDate: "2026-12-31",
    registrationDeadline: "2026-12-18",
    leaderEmails: [ASSISTANT],
    troop: "Jeannettes",
    patrols: [],
    maxParticipants: 40,
    status: "planning",
    fill: 0,
  },
];

/**
 * Records written before troops existed carried no `troopId`. Resolved the
 * same way `migrateScout` does: from the first invited patrol's troop, falling
 * back to Scouts for a whole-troop record with nothing to go on.
 */
function migrateCamp(record: Camp): Camp {
  if (record.troopId !== undefined) return record;

  const troopId = record.patrolIds[0]
    ? (PATROL_TROOP_BY_SLUG[record.patrolIds[0]] ?? patrolTroopName(""))
    : patrolTroopName("");

  return { ...record, troopId };
}

const store = createJsonStore<Camp>(
  "camps.json",
  async () => {
    const [users, scouts] = await Promise.all([userStore.listUsers(), scoutStore.allScouts()]);
    const nowIso = new Date().toISOString();

    const byEmail = new Map(users.map((user) => [user.email, user.id]));
    const fallback = users[0]?.id ?? "";
    const eligible = scouts.filter((scout) => !scout.archived && scout.status === "active");

    return SEED.map((entry) => {
      const id = campSlug(entry.name);
      const patrolIds = entry.patrols.map(patrolSlug);
      const leaderIds = entry.leaderEmails.map((email) => byEmail.get(email) ?? fallback);

      const invited = eligible.filter(
        (scout) =>
          patrolIds.length === 0 ||
          (scout.patrolId !== null && patrolIds.includes(scout.patrolId)),
      );

      // A camp is written up about eight weeks out and announced four weeks
      // later, so the timeline reads in the order things actually happen. Both
      // are held back to today: a camp far enough ahead would otherwise claim to
      // have been added next month.
      const createdAt = earliest(
        shiftDays(entry.registrationDeadline, -PLANNED_BEFORE_DEADLINE, "09:00:00.000Z"),
        nowIso,
      );
      const openedAt =
        entry.status === "planning"
          ? null
          : earliest(
              shiftDays(entry.registrationDeadline, -OPENED_BEFORE_DEADLINE, "09:00:00.000Z"),
              nowIso,
            );

      // Deterministic roster: the same scouts sign up on every reseed.
      const wanted = Math.min(
        entry.maxParticipants,
        Math.round(invited.length * entry.fill),
      );
      const registrations: CampRegistration[] = invited
        .map((scout) => ({ scout, roll: hash(`${id}:${scout.id}`) }))
        .sort((a, b) => a.roll - b.roll)
        .slice(0, wanted)
        .map(({ scout, roll }) => {
          // Signed up across the weeks after the announcement rather than all at
          // once, and never later than today.
          const offered = openedAt ?? createdAt;
          const signedUp = shiftDays(offered.slice(0, 10), roll % 21, "12:00:00.000Z");

          return {
            scoutId: scout.id,
            registeredAt: earliest(signedUp, nowIso),
            registeredBy: leaderIds[roll % leaderIds.length] ?? fallback,
          };
        });

      const closedAt =
        entry.status === "registration-closed" ||
        entry.status === "ongoing" ||
        entry.status === "completed"
          ? `${entry.registrationDeadline}T23:00:00.000Z`
          : null;

      return {
        id,
        name: entry.name,
        description: entry.description,
        location: entry.location,
        startDate: entry.startDate,
        endDate: entry.endDate,
        registrationDeadline: entry.registrationDeadline,
        troopId: troopSlug(entry.troop),
        leaderIds,
        patrolIds,
        maxParticipants: entry.maxParticipants,
        status: entry.status,
        registrations,
        registrationOpenedAt: openedAt,
        registrationClosedAt: closedAt,
        completedAt: entry.status === "completed" ? `${entry.endDate}T18:00:00.000Z` : null,
        cancelledAt: entry.status === "cancelled" ? openedAt : null,
        cancellationReason: entry.cancellationReason ?? "",
        createdAt,
        updatedAt: createdAt,
      };
    });
  },
  { migrate: migrateCamp, autoSeed: false },
);

/* --------------------------------- queries -------------------------------- */

export async function allCamps(): Promise<Camp[]> {
  return store.all();
}

/** Camps visible under `scope` - every camp for an admin, or just the caller's troop(s) otherwise. */
export async function campsInScope(scope: TroopScope): Promise<Camp[]> {
  const camps = await store.all();
  return camps.filter((camp) => inScope(scope, camp.troopId));
}

export async function findCamp(id: string): Promise<Camp | null> {
  const camps = await store.all();
  return camps.find((camp) => camp.id === id) ?? null;
}

/* -------------------------------- mutations ------------------------------- */

export async function createCamp(details: CampDetails): Promise<Camp> {
  return store.mutate((camps) => {
    const now = new Date().toISOString();
    const camp: Camp = {
      ...details,
      name: details.name.trim(),
      description: details.description.trim(),
      location: details.location.trim(),
      leaderIds: [...details.leaderIds],
      patrolIds: [...details.patrolIds],
      id: randomUUID(),
      status: "planning",
      registrations: [],
      registrationOpenedAt: null,
      registrationClosedAt: null,
      completedAt: null,
      cancelledAt: null,
      cancellationReason: "",
      createdAt: now,
      updatedAt: now,
    };

    camps.push(camp);
    return camp;
  });
}

/** Returns the updated camp, or null when the id no longer exists. */
export async function updateCamp(
  id: string,
  changes: Partial<Omit<Camp, "id" | "createdAt">>,
): Promise<Camp | null> {
  return store.mutate((camps) => {
    const index = camps.findIndex((camp) => camp.id === id);
    if (index === -1) return null;

    const next: Camp = {
      ...camps[index],
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    if (changes.name !== undefined) next.name = changes.name.trim();
    if (changes.description !== undefined) next.description = changes.description.trim();
    if (changes.location !== undefined) next.location = changes.location.trim();

    camps[index] = next;
    return next;
  });
}

/**
 * Adds scouts to a camp's roster in one write.
 *
 * The capacity check happens inside the lock, so two leaders signing up the
 * last place at the same moment cannot both succeed.
 */
export async function addRegistrations(
  id: string,
  scoutIds: string[],
  registeredBy: string,
): Promise<{ camp: Camp; added: number } | { overBy: number } | null> {
  return store.mutate((camps) => {
    const index = camps.findIndex((camp) => camp.id === id);
    if (index === -1) return null;

    const camp = camps[index];
    const existing = new Set(camp.registrations.map((entry) => entry.scoutId));
    const fresh = scoutIds.filter((scoutId) => !existing.has(scoutId));

    const room = camp.maxParticipants - camp.registrations.length;
    if (fresh.length > room) return { overBy: fresh.length - room };

    const now = new Date().toISOString();
    const next: Camp = {
      ...camp,
      registrations: [
        ...camp.registrations,
        ...fresh.map((scoutId) => ({ scoutId, registeredAt: now, registeredBy })),
      ],
      updatedAt: now,
    };

    camps[index] = next;
    return { camp: next, added: fresh.length };
  });
}

export async function removeRegistration(
  id: string,
  scoutId: string,
): Promise<Camp | null> {
  return store.mutate((camps) => {
    const index = camps.findIndex((camp) => camp.id === id);
    if (index === -1) return null;

    const camp = camps[index];
    const next: Camp = {
      ...camp,
      registrations: camp.registrations.filter((entry) => entry.scoutId !== scoutId),
      updatedAt: new Date().toISOString(),
    };

    camps[index] = next;
    return next;
  });
}
