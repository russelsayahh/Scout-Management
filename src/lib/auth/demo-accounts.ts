import type { Role } from "@/lib/auth/types";

/**
 * Seed accounts, one per role, so the platform is usable the moment it starts.
 *
 * Deliberately free of server-only imports: the login page reads this to offer
 * one-click sign-in while the store reads it to seed the user file.
 */
export interface DemoAccount {
  name: string;
  email: string;
  phone: string;
  role: Role;
  /** Troop ids this account can access. Ignored for an administrator. */
  assignedTroopIds: string[];
}

export const DEMO_PASSWORD = "Trailhead!2026";

export const demoAccounts: DemoAccount[] = [
  {
    name: "Rowan Whitfield",
    email: "admin@1striverside.org",
    phone: "+44 7700 900112",
    role: "administrator",
    assignedTroopIds: [],
  },
  {
    name: "Priya Raman",
    email: "priya.raman@1striverside.org",
    phone: "+44 7700 900341",
    role: "scout-leader",
    assignedTroopIds: ["guides", "scouts"],
  },
  {
    name: "Tomasz Nowak",
    email: "tom.nowak@1striverside.org",
    phone: "+44 7700 900876",
    role: "assistant-leader",
    assignedTroopIds: ["jeannettes", "louveteaux", "caravelles", "routiers"],
  },
];
