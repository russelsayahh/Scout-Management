import * as activityStore from "@/lib/activities/store";
import * as attachmentStore from "@/lib/attachments/store";
import type { Attachment, AttachmentParentKind } from "@/lib/attachments/types";
import type { TroopScope } from "@/lib/auth/troop-scope";
import { can } from "@/lib/auth/permissions";
import { inScope, resolveTroopScope } from "@/lib/auth/troop-scope";
import type { SessionUser } from "@/lib/auth/types";
import * as campStore from "@/lib/camps/store";
import { supabase } from "@/lib/supabase";

/**
 * Documents on camps and activities: access rules and file storage.
 *
 * Node-only.
 */

export const ATTACHMENT_BUCKET = "attachments";

export interface ParentAccess {
  /** May see the parent's page, and so its documents. */
  view: boolean;
  /** May add and remove documents on it. */
  manage: boolean;
}

const NONE: ParentAccess = { view: false, manage: false };

/**
 * What `user` may do with the documents on one camp or activity - exactly what
 * they may do on its page: the role permission for the section, the troop
 * scope, and for activities, drafts stay hidden from anyone who cannot manage
 * them.
 */
export async function parentAccess(
  user: SessionUser,
  parentKind: AttachmentParentKind,
  parentId: string,
): Promise<ParentAccess> {
  const scope = await resolveTroopScope(user);

  if (parentKind === "camp") {
    if (!can(user.role, "camps.view")) return NONE;
    const camp = await campStore.findCamp(parentId);
    if (!camp || !inScope(scope, camp.troopId)) return NONE;
    return { view: true, manage: can(user.role, "camps.manage") };
  }

  if (!can(user.role, "activities.view")) return NONE;
  const activity = await activityStore.findActivity(parentId);
  if (!activity || !inScope(scope, activity.troopId)) return NONE;
  const manage = can(user.role, "activities.manage");
  if (activity.status === "draft" && !manage) return NONE;
  return { view: true, manage };
}

/**
 * What `user` may do in a whole section (Camps or Activities) for one troop -
 * the rule for standalone documents, which have no camp or activity to defer to.
 */
export async function standaloneAccess(
  user: SessionUser,
  parentKind: AttachmentParentKind,
  troopId: string,
): Promise<ParentAccess> {
  const section = parentKind === "camp" ? "camps" : "activities";
  if (!can(user.role, `${section}.view`)) return NONE;
  if (!inScope(await resolveTroopScope(user), troopId)) return NONE;
  return { view: true, manage: can(user.role, `${section}.manage`) };
}

/** Access to one stored document, whichever kind it is. */
export function attachmentAccess(user: SessionUser, attachment: Attachment): Promise<ParentAccess> {
  if (attachment.parentId) {
    return parentAccess(user, attachment.parentKind, attachment.parentId);
  }
  if (!attachment.troopId) return Promise.resolve(NONE);
  return standaloneAccess(user, attachment.parentKind, attachment.troopId);
}

let bucketReady: Promise<void> | null = null;

/**
 * Creates the private bucket on first use, so a new Supabase project needs no
 * manual Storage setup. Retried on the next call if it fails.
 */
export function ensureBucket(): Promise<void> {
  bucketReady ??= (async () => {
    const storage = supabase().storage;
    const { data } = await storage.getBucket(ATTACHMENT_BUCKET);
    if (data) return;

    const { error } = await storage.createBucket(ATTACHMENT_BUCKET, { public: false });
    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`Creating the "${ATTACHMENT_BUCKET}" storage bucket failed: ${error.message}`);
    }
  })().catch((error: unknown) => {
    bucketReady = null;
    throw error;
  });
  return bucketReady;
}

/** A one-off URL the browser uploads the file to directly, bypassing the app server. */
export async function createUploadUrl(storagePath: string): Promise<string> {
  await ensureBucket();
  const { data, error } = await supabase()
    .storage.from(ATTACHMENT_BUCKET)
    .createSignedUploadUrl(storagePath);
  if (error || !data) throw new Error(error?.message ?? "No upload URL was returned.");
  return data.signedUrl;
}

export async function fileExists(storagePath: string): Promise<boolean> {
  const { data } = await supabase().storage.from(ATTACHMENT_BUCKET).exists(storagePath);
  return data === true;
}

/**
 * A short-lived link to the file. PDFs open in the browser's viewer; Word
 * files download under their original name, since a browser cannot show them.
 */
export async function createDownloadUrl(storagePath: string, fileName: string): Promise<string> {
  const inline = storagePath.endsWith(".pdf");
  const { data, error } = await supabase()
    .storage.from(ATTACHMENT_BUCKET)
    .createSignedUrl(storagePath, 60, inline ? undefined : { download: fileName });
  if (error || !data) throw new Error(error?.message ?? "No download URL was returned.");
  return data.signedUrl;
}

export async function deleteFile(storagePath: string): Promise<void> {
  await supabase().storage.from(ATTACHMENT_BUCKET).remove([storagePath]);
}

/**
 * The documents for one parent, or `null` when the attachments table has not
 * been created yet - so a missing setup step shows as a message on the card
 * instead of breaking the whole camp or activity page.
 */
export async function listAttachments(parentKind: AttachmentParentKind, parentId: string) {
  try {
    return await attachmentStore.attachmentsFor(parentKind, parentId);
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** Standalone documents for a section, or `null` when the table is not set up. */
export async function listStandalone(parentKind: AttachmentParentKind, scope: TroopScope) {
  try {
    return await attachmentStore.standaloneFor(parentKind, scope);
  } catch (error) {
    console.error(error);
    return null;
  }
}
