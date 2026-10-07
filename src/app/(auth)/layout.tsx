import Image from "next/image";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { siteConfig } from "@/config/site";

/**
 * Chrome for the signed-out pages: one full-bleed photographic backdrop with
 * the form floating on it as a glass card, on the right from `lg` up and
 * centred below that.
 *
 * Deliberately not theme-reactive - light or dark, this page always looks the
 * same, so it is built from fixed colours rather than the `ink`/`surface`
 * tokens the rest of the app uses.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-brand-900">
      {/* Backdrop: the group's own camp photo, shown in full rather than
          cropped - it's portrait and this page is not, so `contain` plus a
          backdrop close to the photo's own night tones is what keeps the
          letterboxing from reading as empty bars. A dark wash keeps white
          text and the glass card legible over it. */}
      <div className="absolute inset-0 bg-[#050b1c]" aria-hidden>
        <Image
          src="/auth-background.jpg"
          alt=""
          fill
          sizes="100vw"
          quality={100}
          className="object-contain"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-black/45" />
      </div>

      {/* Brand mark, top left, over the backdrop */}
      <Link
        href="/login"
        className="absolute top-5 left-5 z-10 flex items-center gap-2.5 sm:top-8 sm:left-8"
        aria-label={siteConfig.name}
      >
        <BrandMark className="ring-1 ring-white/25" />
        <span>
          <span className="block text-[14px] leading-tight font-semibold text-white">
            {siteConfig.name}
          </span>
          <span className="block text-[11px] leading-tight text-white/60">
            {siteConfig.tagline}
          </span>
        </span>
      </Link>

      <p className="absolute bottom-5 left-5 z-10 hidden text-[11px] text-white/45 sm:block sm:left-8">
        {siteConfig.organisation} · v{siteConfig.version}
      </p>

      {/* Card */}
      <main className="relative z-10 flex min-h-dvh items-center justify-center px-5 py-12 lg:justify-end lg:px-16 xl:px-24">
        <div className="w-full max-w-[26rem] rounded-2xl border border-white/15 bg-white/7 p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
          {children}
        </div>
      </main>
    </div>
  );
}
