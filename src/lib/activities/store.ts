import { randomUUID } from "node:crypto";

import type { Activity, ActivityDetails, ActivityStatus, ActivityType } from "@/lib/activities/types";
import * as userStore from "@/lib/auth/store";
import { createJsonStore } from "@/lib/json-store";
import { patrolSlug } from "@/lib/patrols/types";

/**
 * Activity repository - the only module that knows how activities are
 * persisted.
 *
 * Node-only.
 */

const SEEDED_AT = "2026-08-01T09:00:00.000Z";

/** Readable ids for the seeded programme, so the URLs are legible. */
function slug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

interface SeedEntry {
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: ActivityType;
  /** Email of the responsible leader; resolved to a user id when seeding. */
  leaderEmail: string;
  /** Patrol names; an empty list means the whole troop. */
  patrols: string[];
  capacity: number | null;
  status: ActivityStatus;
  cancellationReason?: string;
}

const ADMIN = "admin@1striverside.org";
const LEADER = "priya.raman@1striverside.org";
const ASSISTANT = "tom.nowak@1striverside.org";

/**
 * A term's programme either side of the seeded "today", so the calendar, the
 * upcoming list and the completed record all have something in them.
 */
const SEED: SeedEntry[] = [
  /* ------------------------------- completed ------------------------------ */
  {
    name: "Knots and Lashings Relay",
    description:
      "Patrol relay through the six basic knots, finishing with a square lashing race.",
    date: "2026-08-04",
    startTime: "19:00",
    endTime: "21:00",
    location: "Riverside Scout Hut",
    type: "meeting",
    leaderEmail: LEADER,
    patrols: [],
    capacity: 64,
    status: "completed",
  },
  {
    name: "Kayaking Taster",
    description: "Introduction to paddling on the calm stretch above the weir.",
    date: "2026-08-08",
    startTime: "09:30",
    endTime: "13:00",
    location: "Riverside Activity Centre",
    type: "outdoor",
    leaderEmail: LEADER,
    patrols: ["Otter"],
    capacity: 12,
    status: "completed",
  },
  {
    name: "Backwoods Cooking",
    description: "Twists, foil parcels and a dessert on the embers.",
    date: "2026-08-11",
    startTime: "19:00",
    endTime: "21:00",
    location: "Riverside Scout Hut",
    type: "meeting",
    leaderEmail: ASSISTANT,
    patrols: [],
    capacity: 64,
    status: "completed",
  },
  {
    name: "District Pioneering Challenge",
    description:
      "Two patrols entered the district challenge. Kestrel placed second overall.",
    date: "2026-08-15",
    startTime: "10:00",
    endTime: "16:30",
    location: "Gilwell Park",
    type: "competition",
    leaderEmail: ADMIN,
    patrols: ["Kestrel", "Falcon"],
    capacity: 16,
    status: "completed",
  },
  {
    name: "Map and Compass Basics",
    description: "Grid references, setting a map and taking a bearing.",
    date: "2026-08-18",
    startTime: "19:00",
    endTime: "21:00",
    location: "Riverside Scout Hut",
    type: "skills",
    leaderEmail: LEADER,
    patrols: [],
    capacity: 64,
    status: "completed",
  },
  {
    name: "Riverside Litter Pick",
    description: "Community service morning along the towpath with the parish council.",
    date: "2026-08-22",
    startTime: "09:00",
    endTime: "12:00",
    location: "Riverside Towpath",
    type: "service",
    leaderEmail: ASSISTANT,
    patrols: [],
    capacity: 40,
    status: "completed",
  },
  {
    name: "Patrol Planning Night",
    description: "Each patrol set its own goals for the autumn term.",
    date: "2026-08-25",
    startTime: "19:00",
    endTime: "21:00",
    location: "Riverside Scout Hut",
    type: "meeting",
    leaderEmail: LEADER,
    patrols: [],
    capacity: 64,
    status: "completed",
  },

  /* ------------------------------- published ------------------------------ */
  {
    name: "Beacon Hill Walk",
    description:
      "Six-mile walk with navigation legs led by each patrol in turn. Packed lunch and boots needed.",
    date: "2026-08-29",
    startTime: "09:00",
    endTime: "16:00",
    location: "Beacon Hill",
    type: "outdoor",
    leaderEmail: LEADER,
    patrols: [],
    capacity: 40,
    status: "published",
  },
  {
    name: "Autumn Term Opening Night",
    description: "Welcome back, new patrol assignments and the term programme.",
    date: "2026-09-01",
    startTime: "19:00",
    endTime: "21:00",
    location: "Riverside Scout Hut",
    type: "meeting",
    leaderEmail: ADMIN,
    patrols: [],
    capacity: 64,
    status: "published",
  },
  {
    name: "Navigation and Map Skills",
    description:
      "Full day working towards the Navigator badge, finishing with a short orienteering course.",
    date: "2026-09-05",
    startTime: "09:30",
    endTime: "15:00",
    location: "Beacon Hill",
    type: "skills",
    leaderEmail: LEADER,
    patrols: [],
    capacity: 48,
    status: "published",
  },
  {
    name: "Fire Lighting and Camp Cooking",
    description: "Flint and steel, feather sticks and a one-pot meal over the fire.",
    date: "2026-09-08",
    startTime: "19:00",
    endTime: "21:00",
    location: "Riverside Scout Hut",
    type: "meeting",
    leaderEmail: ASSISTANT,
    patrols: ["Kingfisher"],
    capacity: null,
    status: "published",
  },
  {
    name: "Climbing at Hollow Quarry",
    description: "Top-roped climbing and abseiling with the district climbing team.",
    date: "2026-09-12",
    startTime: "10:00",
    endTime: "16:00",
    location: "Hollow Quarry",
    type: "outdoor",
    leaderEmail: ADMIN,
    patrols: ["Peregrine"],
    capacity: 12,
    status: "published",
  },
  {
    name: "First Aid Refresher",
    description: "Recovery position, bandaging and what to do while help is on its way.",
    date: "2026-09-15",
    startTime: "19:00",
    endTime: "21:00",
    location: "Riverside Scout Hut",
    type: "skills",
    leaderEmail: LEADER,
    patrols: ["Heron"],
    capacity: null,
    status: "published",
  },
  {
    name: "Inter-Patrol Cooking Competition",
    description:
      "Three courses per patrol on a single stove. Judged on taste, teamwork and clearing up.",
    date: "2026-09-19",
    startTime: "10:00",
    endTime: "15:00",
    location: "Riverside Scout Hut",
    type: "competition",
    leaderEmail: LEADER,
    patrols: [],
    capacity: 60,
    status: "published",
  },
  {
    name: "Camp Kit Check",
    description: "Everyone brings their kit list for the survival camp and packs it properly.",
    date: "2026-09-22",
    startTime: "19:00",
    endTime: "21:00",
    location: "Riverside Scout Hut",
    type: "meeting",
    leaderEmail: ASSISTANT,
    patrols: [],
    capacity: 64,
    status: "published",
  },
  {
    name: "Young Leader Training Day",
    description: "Modules A to C for young leaders, run at district headquarters.",
    date: "2026-09-26",
    startTime: "10:00",
    endTime: "16:00",
    location: "District Headquarters",
    type: "training",
    leaderEmail: ADMIN,
    patrols: [],
    capacity: 20,
    status: "published",
  },
  {
    name: "Wide Game Night",
    description: "Capture the flag in the lower field. Dark clothing and a torch.",
    date: "2026-09-29",
    startTime: "19:00",
    endTime: "21:00",
    location: "Lower Field",
    type: "meeting",
    leaderEmail: ASSISTANT,
    patrols: [],
    capacity: 64,
    status: "published",
  },
  {
    name: "Autumn Survival Day",
    description: "Shelter building, water purification and fire without matches.",
    date: "2026-10-03",
    startTime: "09:30",
    endTime: "16:30",
    location: "Gilwell Park",
    type: "outdoor",
    leaderEmail: LEADER,
    patrols: [],
    capacity: 45,
    status: "published",
  },
  {
    name: "Badge Workshop",
    description: "Catch-up night for outstanding badge requirements across the troop.",
    date: "2026-10-06",
    startTime: "19:00",
    endTime: "21:00",
    location: "Riverside Scout Hut",
    type: "skills",
    leaderEmail: LEADER,
    patrols: [],
    capacity: 64,
    status: "published",
  },

  /* --------------------------------- draft -------------------------------- */
  {
    name: "Night Hike and Astronomy",
    description:
      "Still to confirm: evening hike up to the ridge with the district astronomy group.",
    date: "2026-10-10",
    startTime: "18:00",
    endTime: "22:00",
    location: "Beacon Ridge",
    type: "outdoor",
    leaderEmail: ADMIN,
    patrols: ["Badger"],
    capacity: 20,
    status: "draft",
  },
  {
    name: "Halloween Wide Game",
    description: "Being planned. Costumes optional, torches essential.",
    date: "2026-10-13",
    startTime: "19:00",
    endTime: "21:00",
    location: "Lower Field",
    type: "meeting",
    leaderEmail: ASSISTANT,
    patrols: [],
    capacity: null,
    status: "draft",
  },
  {
    name: "Group Family Barbecue",
    description: "End-of-term social for scouts, leaders and families. Waiting on a date.",
    date: "2026-10-17",
    startTime: "12:00",
    endTime: "16:00",
    location: "Riverside Scout Hut",
    type: "social",
    leaderEmail: ADMIN,
    patrols: [],
    capacity: 150,
    status: "draft",
  },

  /* ------------------------------- cancelled ------------------------------ */
  {
    name: "Raft Building at the Weir",
    description: "Building and racing barrel rafts on the lower river.",
    date: "2026-08-30",
    startTime: "10:00",
    endTime: "15:00",
    location: "Riverside Activity Centre",
    type: "outdoor",
    leaderEmail: LEADER,
    patrols: ["Otter"],
    capacity: 16,
    status: "cancelled",
    cancellationReason: "River levels too high after last week's rain. Rearranging for spring.",
  },
  {
    name: "District Swimming Gala",
    description: "Inter-group gala at the leisure centre.",
    date: "2026-09-09",
    startTime: "18:30",
    endTime: "20:30",
    location: "Riverside Leisure Centre",
    type: "competition",
    leaderEmail: ADMIN,
    patrols: [],
    capacity: 30,
    status: "cancelled",
    cancellationReason: "Pool closed for unplanned maintenance. The district is rescheduling.",
  },
];

/**
 * Seeding resolves leaders by email rather than by id, because user ids are
 * generated when the user file is seeded and are not knowable up front.
 */
const store = createJsonStore<Activity>("activities.json", async () => {
  const users = await userStore.listUsers();
  const byEmail = new Map(users.map((user) => [user.email, user.id]));
  const fallback = users[0]?.id ?? "";

  return SEED.map((entry) => ({
    id: slug(entry.name),
    name: entry.name,
    description: entry.description,
    date: entry.date,
    startTime: entry.startTime,
    endTime: entry.endTime,
    location: entry.location,
    type: entry.type,
    leaderId: byEmail.get(entry.leaderEmail) ?? fallback,
    patrolIds: entry.patrols.map(patrolSlug),
    capacity: entry.capacity,
    status: entry.status,
    cancellationReason: entry.cancellationReason ?? "",
    cancelledAt: entry.status === "cancelled" ? SEEDED_AT : null,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  }));
});

/* --------------------------------- queries -------------------------------- */

export async function allActivities(): Promise<Activity[]> {
  return store.all();
}

export async function findActivity(id: string): Promise<Activity | null> {
  const activities = await store.all();
  return activities.find((activity) => activity.id === id) ?? null;
}

/* -------------------------------- mutations ------------------------------- */

export async function createActivity(
  details: ActivityDetails,
  status: ActivityStatus,
): Promise<Activity> {
  return store.mutate((activities) => {
    const now = new Date().toISOString();
    const activity: Activity = {
      ...details,
      name: details.name.trim(),
      description: details.description.trim(),
      location: details.location.trim(),
      patrolIds: [...details.patrolIds],
      id: randomUUID(),
      status,
      cancellationReason: "",
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    };

    activities.push(activity);
    return activity;
  });
}

/** Returns the updated activity, or null when the id no longer exists. */
export async function updateActivity(
  id: string,
  changes: Partial<Omit<Activity, "id" | "createdAt">>,
): Promise<Activity | null> {
  return store.mutate((activities) => {
    const index = activities.findIndex((activity) => activity.id === id);
    if (index === -1) return null;

    const next: Activity = {
      ...activities[index],
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    if (changes.name !== undefined) next.name = changes.name.trim();
    if (changes.description !== undefined) next.description = changes.description.trim();
    if (changes.location !== undefined) next.location = changes.location.trim();

    activities[index] = next;
    return next;
  });
}
