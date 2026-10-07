export const siteConfig = {
  name: "Groupe Saint Roch",
  tagline: "Scouts de Secours Libanais · Kleiat",
  description:
    "Manage scouts, leaders, patrols, activities, camps, attendance, equipment and documents in one place.",
  /** The organisation currently in context. Replaced by real data later. */
  organisation: "Scouts de Secours Libanais - Groupe College Saint Roch, Kleiat",
  version: "0.1.0",
} as const;

export type SiteConfig = typeof siteConfig;
