import Link from "next/link";
import { CalendarDays, ClipboardCheck, ShieldCheck, Users } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { siteConfig } from "@/config/site";

const highlights = [
  { icon: Users, title: "One register", body: "Every scout, leader and patrol in a single record." },
  { icon: CalendarDays, title: "Programme planning", body: "Meetings, activities and camps on one calendar." },
  { icon: ClipboardCheck, title: "Attendance in seconds", body: "Take the register from a phone at the door." },
  { icon: ShieldCheck, title: "Role-based access", body: "Leaders see what they need, and nothing more." },
];

/**
 * Chrome for the signed-out pages: a brand panel from `lg` up, and the form on
 * its own below that.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-800 p-10 text-white lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.22), transparent 45%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.14), transparent 40%)",
          }}
          aria-hidden
        />

        <div className="relative">
          <Link href="/login" className="flex items-center gap-3" aria-label={siteConfig.name}>
            <BrandMark className="bg-white/15 backdrop-blur-sm" />
            <span>
              <span className="block text-[15px] leading-tight font-semibold">
                {siteConfig.name}
              </span>
              <span className="block text-[11px] leading-tight text-white/70">
                {siteConfig.tagline}
              </span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-[28px] leading-tight font-semibold tracking-tight text-balance">
            Everything your group runs on, in one place.
          </h2>

          <ul className="mt-8 space-y-5">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/12">
                  <item.icon className="size-4.5" strokeWidth={1.8} aria-hidden />
                </span>
                <span>
                  <span className="block text-[13.5px] font-medium">{item.title}</span>
                  <span className="block text-[12.5px] leading-snug text-white/70">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11.5px] text-white/55">
          {siteConfig.organisation} · v{siteConfig.version}
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col bg-page">
        <div className="flex h-16 shrink-0 items-center justify-between px-5 sm:px-8">
          <Link href="/login" className="flex items-center gap-2.5 lg:invisible" aria-label={siteConfig.name}>
            <BrandMark className="size-8" />
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              {siteConfig.name}
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-start justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-[26rem] py-4 sm:py-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
