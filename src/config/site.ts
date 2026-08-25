export const siteConfig = {
  name: "Trailhead",
  tagline: "Scout Management Platform",
  description:
    "Manage scouts, leaders, patrols, activities, camps, attendance, equipment and documents in one place.",
  /** The organisation currently in context. Replaced by real data later. */
  organisation: "1st Riverside Scout Group",
  version: "0.1.0",
} as const;

export type SiteConfig = typeof siteConfig;
