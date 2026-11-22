import type { Attachment, AttachmentParentKind } from "@/lib/attachments/types";
import { inScope, type TroopScope } from "@/lib/auth/troop-scope";
import { createJsonStore } from "@/lib/json-store";

/**
 * Attachment repository - the records only. The files are handled in
 * `service.ts`.
 *
 * Node-only.
 */

const store = createJsonStore<Attachment>("attachments.json", () => [], { autoSeed: false });

/** Newest first. */
export async function attachmentsFor(
  parentKind: AttachmentParentKind,
  parentId: string,
): Promise<Attachment[]> {
  const all = await store.all();
  return all
    .filter((entry) => entry.parentKind === parentKind && entry.parentId === parentId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/** Standalone documents posted to the Camps or Activities page, newest first. */
export async function standaloneFor(
  parentKind: AttachmentParentKind,
  scope: TroopScope,
): Promise<Attachment[]> {
  const all = await store.all();
  return all
    .filter(
      (entry) =>
        entry.parentKind === parentKind &&
        !entry.parentId &&
        !!entry.troopId &&
        inScope(scope, entry.troopId),
    )
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function findAttachment(id: string): Promise<Attachment | null> {
  const all = await store.all();
  return all.find((entry) => entry.id === id) ?? null;
}

export async function addAttachment(attachment: Attachment): Promise<Attachment> {
  return store.mutate((items) => {
    items.push(attachment);
    return attachment;
  });
}

/** Returns the removed record, or null when it was already gone. */
export async function removeAttachment(id: string): Promise<Attachment | null> {
  return store.mutate((items) => {
    const index = items.findIndex((entry) => entry.id === id);
    if (index === -1) return null;
    const [removed] = items.splice(index, 1);
    return removed;
  });
}
