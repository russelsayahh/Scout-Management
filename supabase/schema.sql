-- Scout Management System - Supabase schema
--
-- One table per domain, matching each TypeScript type field-for-field.
-- Column names are quoted camelCase to match the TS field names exactly -
-- src/lib/json-store.ts does no field-name translation, so "firstName" here
-- has to come back as `firstName` in JS, not `firstname`.
--
-- `id` is `text`, not a native `uuid`, because the app already generates a mix
-- of UUIDs (via node:crypto randomUUID) and readable slugs (patrol, troop and
-- equipment ids) and treats both as opaque strings everywhere.
--
-- No foreign keys, and only `id` is NOT NULL: every relationship and every
-- other invariant is already enforced in the application layer (see e.g.
-- src/lib/scouts/service.ts's troopPatrolMismatch), and this schema is a
-- storage-backend swap, not a data-integrity redesign.
--
-- Run this once in the Supabase SQL Editor for a new project, then the app
-- seeds every table itself on first read (see json-store.ts).

create table if not exists troops (
  id text primary key,
  name text,
  description text,
  "createdAt" text,
  "updatedAt" text
);

create table if not exists users (
  id text primary key,
  name text,
  email text,
  phone text,
  role text,
  avatar text,
  position text,
  "assignedPatrolIds" jsonb,
  "assignedTroopIds" jsonb,
  "passwordHash" text,
  "createdAt" text
);

create table if not exists patrols (
  id text primary key,
  name text,
  description text,
  "patrolLeaderId" text,
  status text,
  "troopId" text,
  archived boolean,
  "archivedAt" text,
  "archiveReason" text,
  "createdAt" text,
  "updatedAt" text
);

create table if not exists scouts (
  id text primary key,
  "firstName" text,
  "lastName" text,
  "dateOfBirth" text,
  gender text,
  avatar text,
  phone text,
  email text,
  address text,
  "emergencyContactName" text,
  "emergencyContactPhone" text,
  "medicalNotes" text,
  "joinDate" text,
  "troopId" text,
  "patrolId" text,
  status text,
  archived boolean,
  "archivedAt" text,
  "archiveReason" text,
  "createdAt" text,
  "updatedAt" text
);

create table if not exists activities (
  id text primary key,
  name text,
  description text,
  date text,
  "startTime" text,
  "endTime" text,
  location text,
  type text,
  "leaderId" text,
  "patrolIds" jsonb,
  "troopId" text,
  capacity integer,
  status text,
  "cancellationReason" text,
  "cancelledAt" text,
  "createdAt" text,
  "updatedAt" text
);

create table if not exists camps (
  id text primary key,
  name text,
  description text,
  location text,
  "startDate" text,
  "endDate" text,
  "registrationDeadline" text,
  "leaderIds" jsonb,
  "patrolIds" jsonb,
  "troopId" text,
  "maxParticipants" integer,
  status text,
  registrations jsonb,
  "registrationOpenedAt" text,
  "registrationClosedAt" text,
  "completedAt" text,
  "cancelledAt" text,
  "cancellationReason" text,
  "createdAt" text,
  "updatedAt" text
);

create table if not exists attendance (
  id text primary key,
  "eventKind" text,
  "eventId" text,
  "troopId" text,
  entries jsonb,
  "takenBy" text,
  "takenAt" text,
  "updatedBy" text,
  "updatedAt" text
);

create table if not exists equipment (
  id text primary key,
  name text,
  category text,
  quantity integer,
  damaged integer,
  lost integer,
  condition text,
  location text,
  "serialNumber" text,
  "purchaseDate" text,
  notes text,
  availability text,
  "retiredAt" text,
  "createdAt" text,
  "updatedAt" text
);

create table if not exists equipment_loans (
  id text primary key,
  "itemId" text,
  quantity integer,
  "holderKind" text,
  "holderId" text,
  "troopId" text,
  "checkedOutAt" text,
  "checkedOutBy" text,
  "dueBack" text,
  note text,
  "returnedAt" text,
  "returnedBy" text,
  "returnedGood" integer,
  "returnedDamaged" integer,
  "returnedLost" integer
);
