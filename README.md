# Trailhead - Scout Management Platform

Scout group management platform: application shell, navigation, a reusable
component library, a dashboard, and role-based authentication with user
management.

**Scope so far.** Authentication, roles, permissions and profiles are real and
enforced server-side. The ten section pages (Scouts, Camps, Attendance and the
rest) are still placeholders reading sample data from `src/data/`.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS v4, CSS custom properties for tokens |
| Icons | lucide-react |
| Utilities | clsx + tailwind-merge (`cn`) |
| Auth | Server Actions, signed httpOnly cookie, scrypt password hashing |
| Storage | JSON file under `.data/` (swap for a database via one module) |

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # eslint
```

On first run the user store seeds one account per role. All three use the
password `Trailhead!2026`, and the login page can fill them in for you:

| Email | Role |
|---|---|
| `admin@1striverside.org` | Administrator |
| `priya.raman@1striverside.org` | Scout Leader |
| `tom.nowak@1striverside.org` | Assistant Leader |

Delete `.data/` to reset back to these three accounts.

### Environment

`AUTH_SECRET` signs the session cookie. Development falls back to a built-in
key; **production refuses to start without one**, so forging a session is never
possible with a known default. Copy `.env.example` to `.env.local` and generate
a value:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Project structure

```
src/
  proxy.ts                  Route protection (the Next 16 middleware convention)

  app/
    layout.tsx              Root layout: fonts, metadata, theme bootstrap
    globals.css             Design tokens + Tailwind theme mapping
    not-found.tsx           404
    (auth)/                 Signed-out pages, split-panel chrome
      layout.tsx
      login/ register/
    (app)/                  Signed-in pages, app chrome
      layout.tsx            requireUser() -> SessionProvider -> AppShell
      loading.tsx           Skeleton for section transitions
      page.tsx              Dashboard
      profile/              Own details, picture and password
      users/                Account list and role changes (administrators)
      scouts/ leaders/ patrols/ activities/ camps/
      attendance/ equipment/ documents/ reports/ settings/

  components/
    auth/                   SessionProvider, login and register forms
    profile/                Profile details, password, access summary
    users/                  Account list with inline role editing
    layout/                 App shell: sidebar, top bar, search, menus
    dashboard/              Dashboard sections (stat grid, activity, events)
    shared/                 ModuleSection, ModulePlaceholder, AccessDenied
    theme/                  Theme provider, toggle, no-flash script
    ui/                     Design-system primitives

  config/
    site.ts                 Product name, tagline, organisation
    navigation.ts           Sidebar sections, items and their permissions
    modules.ts              Per-section copy, metrics, roadmap and permissions

  lib/auth/                 All authentication logic (see below)
  data/                     Sample data (replace with real queries later)
  hooks/                    Outside click, media query, stored value, field errors
  lib/                      cn(), formatting helpers, avatar image resizing
  types/                    Shared domain and UI types
```

### Where to make common changes

| Task | File |
|---|---|
| Add a sidebar section | `config/navigation.ts`, then a page under `app/(app)/` |
| Change a section's copy or roadmap | `config/modules.ts` |
| Change the product name | `config/site.ts` |
| Change colors, radii, surfaces | `app/globals.css` |
| Swap sample data for real data | `src/data/*` |
| Change what a role may do | `lib/auth/permissions.ts` |
| Change password or field rules | `lib/auth/validation.ts` |
| Replace the JSON store with a database | `lib/auth/store.ts` |

## Adding a section

1. Add the permissions to `Permission` and the role tables in
   `lib/auth/permissions.ts`.
2. Add an entry to `modules` in `config/modules.ts`, naming its `permission`
   and (optionally) `managePermission`.
3. Add a `NavItem` to `config/navigation.ts` with the same view permission.
4. Create `src/app/(app)/<slug>/page.tsx`:

```tsx
import type { Metadata } from "next";

import { ModuleSection } from "@/components/shared/module-section";
import { modules } from "@/config/modules";

const module_ = modules.<key>;

export const metadata: Metadata = { title: module_.name };

export default function Page() {
  return <ModuleSection module={module_} />;
}
```

`ModuleSection` performs the permission check, so a new page cannot forget it.

## Component library

`src/components/ui/` holds the primitives every screen is built from:

- **Button** - `primary` / `secondary` / `ghost` / `subtle` / `outline`, five sizes.
  `buttonStyles()` exports the class string so links can adopt the look.
- **Card** + `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`
- **Badge** - `neutral` / `brand` / `info` / `good` / `warning` / `serious` / `critical`
- **Avatar** - profile picture, falling back to initials with a per-name tint
- **Popover** - anchored menu, closes on outside press and Escape
- **PageHeader** - eyebrow, title, description, actions
- **StatCard** - label, value, signed delta, caption, 12-point trend
- **Sparkline**, **Meter** - the data marks used by the dashboard
- **TextField** / **PasswordField** / **SelectField** - label, control, hint and
  error text with `aria-invalid` and `aria-describedby` wired up
- **Callout** - `info` / `success` / `warning` / `error` form-level messages
- **Spinner** - in-button progress while an action runs

Prefer composing these over new one-off markup. Anything reached for twice
belongs here.

## Authentication and roles

All authentication logic lives in `src/lib/auth/`. Components never hash a
password, read a cookie or query the store - they call a Server Action.

| Module | Responsibility |
|---|---|
| `types.ts` | `Role`, `StoredUser`, `SessionUser`, role labels |
| `permissions.ts` | `Permission` union, role -> permission table, `can()` |
| `validation.ts` | Field rules, shared by browser and server |
| `password.ts` | scrypt hashing and constant-time verification (Node) |
| `session.ts` | Signed cookie payload (Web Crypto, Edge-safe) |
| `store.ts` | The only module that knows how users are persisted |
| `service.ts` | Account rules: register, authenticate, update, change role |
| `current-user.ts` | `getCurrentUser`, `requireUser`, `requireGuest` for pages |
| `actions.ts` | Server Actions - the sole bridge from UI to the above |

### How a request is protected

Two layers, deliberately split:

1. **`proxy.ts`** does the cheap, optimistic check the Next.js docs recommend
   for this layer: is the cookie signed and unexpired? If not, redirect to
   `/login?from=...`. It never touches the store, so it stays Edge-safe.
2. **Layouts and pages** do the real work. `(app)/layout.tsx` calls
   `requireUser()`, which reloads the user from the store on every request.
   Pages then check `can(user.role, permission)`.

Because authorisation reads the user fresh rather than trusting a role baked
into the cookie, a role change applies on that person's very next request.

### Roles

| | Administrator | Scout Leader | Assistant Leader |
|---|---|---|---|
| Dashboard | view | view | view |
| Scouts, Patrols, Activities, Camps, Equipment, Documents | manage | manage | view |
| Leaders | manage | view | - |
| Attendance | take register | take register | take register |
| Reports | view | view | - |
| Settings | manage | - | - |
| User accounts | manage | - | - |

Permission drives three things at once: which sidebar items render, whether a
typed URL reaches the page or an explanation, and whether a section offers
editing controls or a "View only" badge.

Registration only offers Scout Leader and Assistant Leader. Administrator is
granted by an existing administrator on `/users`, which also refuses to let
anyone change their own role or demote the last administrator.

### Session

A session is a base64url JSON payload (`sub`, `iat`, `exp`) with an HMAC-SHA256
signature, stored in an `httpOnly`, `sameSite=lax` cookie that is `secure` in
production and lasts 7 days. That cookie is what survives a refresh - there is
no token in `localStorage` for a script to read.

### Profile pictures

Chosen images are centre-cropped and re-encoded to a 256px JPEG in the browser
before upload, so a multi-megabyte photo becomes roughly 20 KB and is stored
inline on the user record.

## Layout behaviour

| Breakpoint | Navigation |
|---|---|
| `< lg` (1024px) | Off-canvas drawer, opened from the top bar |
| `>= lg` | Persistent sidebar, collapsible to a 68px icon rail |

The collapsed state persists in `localStorage`. The KPI grid steps 1 -> 2 -> 3 -> 5
columns; the dashboard body is a single column until `lg`, then 2/3 + 1/3.

## Theming

Light and dark are both first-class. Tokens are defined once on `:root` and
redefined on `.dark` in `globals.css`, then mapped into Tailwind via
`@theme inline`, so components reference roles (`bg-surface`, `text-ink-muted`,
`border-line`) rather than raw colors.

Theme preference is read straight from `localStorage` and the OS setting through
`useStoredValue` / `usePrefersDark` rather than mirrored into state, and an inline
script in `<head>` applies the class before first paint so there is no flash.

## Data visualisation

Chart colors come from a validated palette rather than being picked by eye:

- Data marks use the categorical slot-1 blue (`--viz-accent`), with dark-mode
  steps chosen for the dark surface, not flipped automatically.
- Status colors (`good` / `warning` / `serious` / `critical`) are reserved and
  always ship with an icon or a text label, never hue alone.
- Deltas pair a direction arrow and a signed number with the color.
- Both modes were validated against the app's own surfaces for the lightness
  band, chroma floor, CVD separation and contrast.

Keep that contract when adding charts: one axis, no rainbow ramps, and a legend
whenever two or more series share a plot.

## Conventions

- Server Components by default; `"use client"` only where interaction requires it
  (sidebar state, popovers, search, theme, forms).
- Forms post to Server Actions and render `useActionState`: `pending` drives the
  button, `fieldErrors` sit under their inputs, `message` becomes a callout.
- Validation runs on the client for immediate feedback and again on the server,
  which is the authority - a bypassed form cannot write invalid data.
- Relative timestamps are stored pre-formatted in sample data, and dates are
  formatted with a pinned locale and UTC, so server and client markup match.
- Paths use the `@/*` alias.
- `npm run lint` must pass; the React Compiler rules are on, so preferences are
  read through external stores instead of being synced in effects.

## Not included yet

Per-module business logic: the ten section pages are still placeholders, with no
tables, record forms or real queries behind them. The sample data in
`src/data/` defines the shapes those features should return.

Also outstanding on the auth side: email verification, password reset, account
deactivation, and rate limiting on sign-in attempts.
