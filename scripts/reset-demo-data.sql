-- Removes every seeded demo record and the three seeded/test accounts,
-- keeping the six troops (real org structure, not demo content) and every
-- account that was actually registered through the app.
--
-- Safe to run once. After this, the app's auto-seed-on-empty behavior is
-- disabled for every table below (src/lib/*/store.ts pass `autoSeed: false`)
-- - so these stay empty rather than quietly repopulating with demo content
-- on the next server restart or deploy.
--
-- Run this in the Supabase SQL Editor.

delete from equipment_loans;
delete from equipment;
delete from attendance;
delete from camps;
delete from activities;
delete from patrols;
delete from scouts;

delete from users
where email in (
  'priya.raman@1striverside.org',
  'tom.nowak@1striverside.org'
)
or email like 'chieftest%@example.com';
