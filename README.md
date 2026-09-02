# Trailhead - Scout Management Platform

Scout group management platform: application shell, navigation, a reusable
component library, a dashboard, and role-based authentication with user
management.

**Scope so far.** Authentication, roles, permissions and profiles are real and
enforced server-side, as are the **Scouts** and **Patrols** modules. The
remaining section pages (Leaders, Activities, Camps, Attendance, Equipment,
Documents, Reports) are still placeholders reading sample data from `src/data/`.

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
      scouts/               list, new, [id], [id]/edit   (real)
      patrols/              list, new, [id], [id]/edit   (real)
      activities/           list + calendar, new, [id], [id]/edit  (real)
      camps/                list, new, [id], [id]/edit   (real)
      attendance/           dashboard, [activityId]      (real)
      equipment/            store, new, [id], [id]/edit  (real)
      leaders/ documents/ reports/ settings/             (placeholders)

  components/
    auth/                   SessionProvider, login and register forms
    profile/                Profile details, password, access summary
    users/                  Account list with inline role editing
    layout/                 App shell: sidebar, top bar, search, menus
    scouts/                 Register table, filters, form, profile, actions
    patrols/                Patrol grid, detail panels, member list, dialogs
    activities/             Programme table, calendar, filters, form, dialogs
    attendance/             Register, mark picker, stats panels, scout history
    camps/                  Camp grid, dashboard, timeline, roster, dialogs
    equipment/              Store table, filters, form, loan lists, dialogs
    dashboard/              Dashboard sections (stat grid, upcoming, activity)
    shared/                 AccessDenied, ModulePlaceholder, patrol + leader pickers
    shared/                 ModuleSection, ModulePlaceholder, AccessDenied
    theme/                  Theme provider, toggle, no-flash script
    ui/                     Design-system primitives

  config/
    site.ts                 Product name, tagline, organisation
    navigation.ts           Sidebar sections, items and their permissions
    modules.ts              Per-section copy, metrics, roadmap and permissions

  lib/
    auth/                   All authentication logic (see below)
    scouts/                 Scout register: types, validation, query, store,
                            service, actions
    patrols/                Patrols: types, validation, store, service,
                            actions, sample attendance insights
    activities/             Programme: types, validation, query, calendar,
                            store, service, actions
    attendance/             Registers: types, store, service, actions
    camps/                  Camps: types, validation, timeline, store,
                            service, actions
    equipment/              Store: types, validation, query, store,
                            service, actions
    json-store.ts           JSON-file collection: seeding, locking, migration
    validation.ts           Field validators shared by every form
    form-state.ts           useActionState shape shared by every form
    format.ts utils.ts image.ts

  data/                     Sample data for the not-yet-built sections
  hooks/                    Outside click, media query, stored value, field errors
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
| Change which activity status changes are allowed | `lib/activities/types.ts` |
| Change which camp status changes are allowed | `lib/camps/types.ts` |
| Change the attendance target or the flag threshold | `lib/attendance/types.ts` |
| Add an equipment category or condition | `lib/equipment/types.ts` |
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

## The domain modules

Scouts, Patrols, Activities, Attendance, Camps and Equipment all follow the
same shape:
`types` -> `validation` -> `store` -> `service` -> `actions`, with pages and
components sitting on top. Storage is a JSON file per collection under `.data/`
(gitignored, seeded on first run).

### One patrol per scout

A scout carries a single `patrolId`; patrols do not carry a member list.
Membership is always derived by querying scouts for that id, which makes
"a scout belongs to at most one patrol" **structural rather than a rule anyone
has to remember to enforce**:

- Assigning a scout who is already in another patrol *moves* them. There is no
  state in which two patrols both claim the same scout.
- The "Add scouts" picker only offers scouts with no patrol, so a second
  membership is never even offered. Moving someone between patrols is done from
  their own record, where the change reads as what it is.
- Member counts, the sidebar badge and the register all read the same field, so
  they cannot drift apart.

If the organisation ever needs multi-patrol membership, this is the seam to
change: replace `Scout.patrolId` with a join collection and reimplement the
membership functions in `lib/scouts/store.ts`. Nothing above the service layer
assumes a single patrol beyond the wording in the UI.

### Other patrol rules

- A patrol leader must be one of that patrol's own members. Removing the leader
  from the patrol vacates the post rather than leaving a dangling reference.
- Archiving a patrol releases its members back to unassigned instead of
  stranding them, and the confirmation dialog says how many that is.
- Patrol names are unique, case-insensitively.
- Archiving is reversible everywhere; nothing is deleted.

### Sample data still inside these modules

Nothing is generated at read time any more. Both panels on a patrol page are
real: **Recent activities** reads completed activities the patrol took part in,
and **Attendance summary** reads the registers for those sessions. The
"Sample data" badges are gone, and `lib/patrols/insights.ts` with them.

What remains is **seed** data, which is a different thing: the scouts, patrols,
programme, registers and camps written into `.data/` on first run are invented,
in the same way the scouts themselves are. Everything read back out of them is
a real query over real records.

On the dashboard, the **Upcoming activities**, **Upcoming camps** and
**Attendance rate** tiles are counted from those records; **Total scouts** and
**Total leaders** are still sample figures from `src/data/stats.ts`, waiting on
the Leaders module. Where a tile's value is real but its history is not, it
ships without a trend line rather than with an invented one.

### Activity status

Status is not a form field. It moves through named transitions, each of which is
its own decision with its own rule:

```
draft --publish--> published --complete--> completed
  |                    |
  +------cancel--------+--> cancelled --reinstate--> draft
```

- **Draft is private to the leaders who manage the programme.** That is enforced
  in the query layer, not by hiding a row: a read-only role gets no draft in the
  list, none on the calendar, no Draft option in the status filter, and a 404 on
  a draft's URL.
- **Completing is only offered once the end time has passed.** Marking next
  month's hike as completed would be nonsense, and it would put a completed
  activity in the "still to come" figures.
- **Cancelling is reversible, but reinstating returns it to draft**, so somebody
  has to decide to announce it again rather than it silently reappearing on
  everyone's calendar.
- Creating offers "Save as draft" or "Publish"; editing never changes status, so
  a routine correction to a location cannot publish something that was not ready.

The whole table lives in `allowedTransitions` in `lib/activities/types.ts`.

### Who an activity is for

An activity names zero or more patrols. **Naming none means the whole troop**,
which is the common case, so it is the default rather than a separate switch.

The expected head count is *derived from the register*, not recorded: it is the
number of active, non-archived scouts in the participating patrols, or in the
whole troop. There is no sign-up module yet, so this is who is **eligible**
rather than who has said yes - and every surface that shows the figure says so.
It is what the capacity warning compares against.

### List and calendar

Both views read the same filtered set and diverge only afterwards. Everything is
in the URL - search, status, type, patrol, period, sort, page, view and month -
so a filtered programme is shareable and the back button works.

The calendar is a month grid from `md` up. Below `md` a seven-column grid would
give each activity about forty pixels, so the same month is listed as an agenda:
day by day, only the days with something on, under the same month heading and
the same links. Both are server-rendered and need no JavaScript to navigate.

### Other activity rules

- End time must be after start time; the message names that, rather than
  complaining about the field on its own.
- Dates in the past are allowed - a programme is often written up after the event.
- An archived patrol cannot be added to an activity, but one archived later stays
  on the activities it already took part in. Rewriting history to tidy up a
  patrol would lose the record of what actually happened.
- Times are stored as an ISO day plus two 24-hour clock times, not as instants.
  A troop night is "Tuesday at 19:00" wherever you read it.

## Attendance

### One register per event

A register is stored as a single record holding an entry per scout, not a row
per scout. That is how a register is actually taken - all at once, in one
sitting - so saving is one write and a half-finished register cannot exist.

Two rules live in the service rather than the UI:

- **A register can only be taken once the event has started.** Marking a scout
  present at next month's hike would be a guess, not a record.
- **The roster is the union of who is eligible now and who was marked when the
  register was taken.** A scout who has since left the section or moved patrol
  keeps their mark, labelled as no longer on the roster, because deleting it
  would rewrite what happened.

### What the percentage means

`present` and `late` both count as having turned up: late is worth recording,
but it is not the same as missing the session. Excused absences stay in the
denominator, so the rate answers *"how often was this scout there"* rather than
*"how often were they at fault"*. Every surface that shows the figure says so.

The target (85%) and the flag threshold (60%, over at least three sessions) are
constants in `lib/attendance/types.ts`.

### Taking it on a phone

The register is built for a leader holding a phone in a scout hut, not for a
desk: full-width thumb targets at least 44px tall, patrol by patrol, a running
count that never leaves the screen and a save bar pinned to the bottom. The
desktop layout is the same register with the controls moved alongside the names.
"Mark all present" works on the whole hall or on one patrol, and every mark
always shows its word - the colour is reinforcement, not the signal.

## Camps

### Registration, not an audience

The difference between a camp and an activity is registration. An activity's
audience is *derived* - whoever is in the patrols invited - because nobody signs
up for a troop night. A camp has beds, tents and a minibus, so who is coming is
**recorded one scout at a time**, and capacity is a rule rather than a warning:

- The capacity check runs inside the store's write lock, so two leaders taking
  the last place at the same moment cannot both succeed.
- The register-scouts dialog will not let you select more scouts than there are
  places, and says so rather than failing on submit.
- Lowering the maximum below the number already signed up is refused.

**Invited patrols are an invitation, not a fence.** The dialog offers scouts
from the invited patrols first, with one checkbox to show the rest of the troop;
anybody registered from outside is labelled as such on the roster. Making a
leader invite a whole patrol in order to bring one scout from it would be worse
than letting them choose.

### Camp status

```
planning --open--> registration-open --close--> registration-closed --> ongoing
   ^                      |                          |    ^                |
   |                      |                          +----+  (reopen)      |
   |                      v                          v                     v
   +---- reinstate --- cancelled <--------------- cancelled           completed
```

- Only a **finished or cancelled** camp refuses roster changes. Everything else
  is ordinary admin a leader is trusted to do, including adding somebody after
  the deadline - the page states where things stand instead of blocking them.
- **Completed is final**: the details, the roster and the leaders are a record.
- **Reinstating returns a cancelled camp to planning**, not straight to open, so
  it has to be announced again deliberately. Everyone registered keeps their
  place.

The table lives in `allowedTransitions` in `lib/camps/types.ts`.

### The timeline

Milestones are recorded as they happen - `registrationOpenedAt`,
`registrationClosedAt`, `completedAt`, `cancelledAt` are fields on the camp -
so the timeline is history rather than a reconstruction from the current status.
Milestones still ahead are shown as planned, which is what makes it useful while
a camp is being organised.

### Other camp rules

- The end date cannot precede the start; the deadline has to fall on or before
  the first day. Both messages name the relationship, not the field.
- A camp needs at least one responsible leader. They can be changed from the
  camp's own page as well as in the form, because who is running a camp changes
  more often than its dates do.
- Leaders count towards "total participants" - they need a bed too - but the
  maximum is a limit on **scout** places, which is what the meter measures.

## Equipment

### An item is a stock line

"20 tent pegs" is **one record with a quantity of 20**, not twenty records.
That is what lets the same model cover a box of pegs and a single GPS unit, and
it is why a loan takes out a *number of units* rather than an item. Serial
numbers only mean anything on a line of one, so the field is optional and the
form says as much.

Three counts live on an item, and units only ever move between them through a
named operation, in a single write:

| Count | Means |
|---|---|
| `quantity` | Owned and serviceable |
| `damaged` | Owned but broken, waiting on repair or a write-off |
| `lost` | Written off for good, kept as a running total |

**Availability is derived, never stored.** How many units are out is arithmetic
over the open loans; the item only records the quartermaster's *decision* -
available, reserved, or out of service. Keeping the two apart is what stops the
figures drifting: there is no second copy of "how many are out" to go stale.

### Loans

A loan goes to a **leader, an activity or a camp**. Assigning the patrol boxes
to a camp is the common case, and naming the camp rather than one leader is what
a quartermaster actually writes down. Only events still to come are offered -
booking a stove out to last month's meeting is a mistake nobody meant to make.

The available count is recomputed **inside the store's write lock**, so two
quartermasters taking the last stove at the same moment cannot both succeed.

Booking kit back in is where damage and loss are recorded. The three numbers
have to add up to what went out, because anything unaccounted for would quietly
vanish from the store: the leader types only the exceptions, the good count is
whatever is left, and the running total is on screen. Damaged and lost units
leave `quantity` in the same write that records them.

Damage noticed in the store rather than on a return goes through the same
service call from the item's page, and a repair moves units back the other way.

### Removing is retiring

Loans point at items, and the history of what went where is most of the value of
an inventory, so nothing is deleted. Retiring checks that **nothing is still out
on loan**, drops the item from the default list, and blocks any further
check-out. It is reversible, and every loan against the item is kept.

### Other rules

- Cutting an item's quantity below what is currently out on loan is refused.
- Damaged and retired kit cannot go out at all, whatever its availability says.
  The book-out button is disabled with the reason on it rather than hidden -
  "why can't I lend this" is worth answering in place.
- Categories are told apart by **icon**, conditions and availability by tone.
  Colour is reserved for the two things worth noticing at a glance, so nine
  categories are carried by shape instead.

## Schema migrations

`createJsonStore` takes an optional `migrate` hook, applied on read, so a file
written by an older schema keeps working and self-heals on its next write.
Two stores use it: `lib/scouts/store.ts` maps the pre-Patrols `patrol` name
string onto `patrolId`, and `lib/attendance/store.ts` fills in `updatedBy` for
registers written before edits were tracked separately from who took them.

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

Three section pages are still placeholders with no tables, record forms or real
queries behind them: Leaders, Documents and Reports. The sample data in
`src/data/` defines the shapes those features should return.

**Leaders is the one the others lean on.** Until it exists, a "leader" is a user
account: that is what a responsible leader on an activity or a camp points at,
and what the register records as having been taken by.

Within Patrols: patrol points and inter-patrol competition standings.

Within Activities: no sign-up or booking, so "expected" is derived from the
register rather than recorded; no recurrence, so a weekly meeting is entered (or
duplicated) one date at a time; no risk assessments or kit lists.

Within Attendance: **registers are taken against activities only.** The record
already carries an `eventKind` of `activity | camp`, so a camp register slots
in against the existing collection rather than needing a second one - but the
route, the roster (a camp's registered participants rather than the whole troop)
and whether a multi-day camp wants one register or one per day are not built.

Within Camps: no waiting list when a camp fills, no permission forms, no costing
or payment tracking, no kit lists, and no attendance as above.

Within Equipment: no per-unit tracking, so a line of six bow saws cannot say
which one is out; no barcodes or QR codes; no maintenance schedule or service
history beyond the condition and the notes; no purchase cost or depreciation;
and no stocktake flow to reconcile the counts against a physical count.

Also outstanding on the auth side: email verification, password reset, account
deactivation, and rate limiting on sign-in attempts.
