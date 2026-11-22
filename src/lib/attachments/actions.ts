"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import * as service from "@/lib/attachments/service";
import * as attachmentStore from "@/lib/attachments/store";
import {
  MAX_DOCUMENT_BYTES,
  documentTypeFor,
  extensionOf,
  type Attachment,
  type AttachmentParentKind,
} from "@/lib/attachments/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { ActionResult } from "@/lib/form-state";

/**
 * Uploading is two steps so the file never passes through the app server -
 * Vercel caps a request body at 4.5 MB, and a scanned permission form is
 * easily bigger:
 *
 *   1. `prepareAttachmentUploadAction` checks permission and returns a signed
 *      URL the browser PUTs the file to, straight into Supabase Storage.
 *   2. `confirmAttachmentUploadAction` checks the file really arrived and
 *      records it.
 *
 * Both re-check access; nothing from step 1 is trusted in step 2 beyond a
 * storage path that must sit under the target's own folder.
 *
 * A target is either one camp or activity (`parentId`), or a whole section
 * for one troop (`troopId`) - a standalone document that shows on the Camps
 * or Activities page next to the camps and activities themselves.
 */

export type UploadTarget =
  | { parentKind: AttachmentParentKind; parentId: string }
  | { parentKind: AttachmentParentKind; troopId: string; title: string };

const PARENT_KINDS: AttachmentParentKind[] = ["camp", "activity"];

function sectionPath(parentKind: AttachmentParentKind): string {
  return parentKind === "camp" ? "/camps" : "/activities";
}

function revalidateFor(attachment: Pick<Attachment, "parentKind" | "parentId">) {
  const section = sectionPath(attachment.parentKind);
  revalidatePath(section);
  if (attachment.parentId) revalidatePath(`${section}/${attachment.parentId}`);
}

function folderFor(target: UploadTarget): string {
  return "parentId" in target
    ? `${target.parentKind}/${target.parentId}/`
    : `${target.parentKind}/troop-${target.troopId}/`;
}

async function manageCheck(
  target: UploadTarget,
): Promise<{ ok: true; userId: string } | { ok: false; message: string }> {
  if (!PARENT_KINDS.includes(target.parentKind)) return { ok: false, message: "Unknown section." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has ended. Sign in again." };

  const access =
    "parentId" in target
      ? await service.parentAccess(user, target.parentKind, target.parentId)
      : await service.standaloneAccess(user, target.parentKind, target.troopId);
  if (!access.manage) {
    return { ok: false, message: "You do not have permission to add documents here." };
  }
  return { ok: true, userId: user.id };
}

function validateTarget(target: UploadTarget): string | null {
  if ("parentId" in target) return target.parentId ? null : "Unknown record.";
  if (!target.troopId) return "Choose which troop this document is for.";
  if (!target.title.trim()) return "Give the document a title.";
  return null;
}

function validateFile(fileName: string, size: number): string | null {
  if (!documentTypeFor(fileName)) return "Only Word (.doc, .docx) and PDF files can be added.";
  if (!Number.isFinite(size) || size <= 0) return "That file is empty.";
  if (size > MAX_DOCUMENT_BYTES) return "That file is over the 20 MB limit.";
  return null;
}

export async function prepareAttachmentUploadAction(
  target: UploadTarget,
  fileName: string,
  size: number,
): Promise<{ ok: true; uploadUrl: string; storagePath: string } | { ok: false; message: string }> {
  const invalid = validateTarget(target) ?? validateFile(fileName, size);
  if (invalid) return { ok: false, message: invalid };

  const check = await manageCheck(target);
  if (!check.ok) return check;

  const storagePath = `${folderFor(target)}${randomUUID()}.${extensionOf(fileName)}`;

  try {
    const uploadUrl = await service.createUploadUrl(storagePath);
    return { ok: true, uploadUrl, storagePath };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "File storage is not available right now. Try again shortly." };
  }
}

export async function confirmAttachmentUploadAction(
  target: UploadTarget,
  storagePath: string,
  fileName: string,
  size: number,
): Promise<ActionResult> {
  const invalid = validateTarget(target) ?? validateFile(fileName, size);
  if (invalid) return { ok: false, message: invalid };

  const check = await manageCheck(target);
  if (!check.ok) return check;

  const folder = folderFor(target);
  const name = storagePath.slice(folder.length);
  if (!storagePath.startsWith(folder) || !/^[0-9a-f-]{36}\.(pdf|docx?)$/.test(name)) {
    return { ok: false, message: "That upload could not be matched to this record." };
  }

  if (!(await service.fileExists(storagePath))) {
    return { ok: false, message: "The upload did not finish. Try adding the file again." };
  }

  const attachment: Attachment = {
    id: randomUUID(),
    parentKind: target.parentKind,
    parentId: "parentId" in target ? target.parentId : null,
    title: "title" in target ? target.title.trim().slice(0, 120) : null,
    troopId: "troopId" in target ? target.troopId : null,
    fileName: fileName.trim().slice(0, 200),
    contentType: documentTypeFor(fileName)!,
    size,
    storagePath,
    uploadedBy: check.userId,
    uploadedAt: new Date().toISOString(),
  };

  try {
    await attachmentStore.addAttachment(attachment);
  } catch (error) {
    console.error(error);
    await service.deleteFile(storagePath);
    return {
      ok: false,
      message:
        "The file uploaded but could not be saved. Has the attachments table been updated in Supabase?",
    };
  }

  revalidateFor(attachment);
  return { ok: true };
}

export async function deleteAttachmentAction(attachmentId: string): Promise<ActionResult> {
  const attachment = await attachmentStore.findAttachment(attachmentId);
  if (!attachment) return { ok: false, message: "That document has already been removed." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has ended. Sign in again." };

  const access = await service.attachmentAccess(user, attachment);
  if (!access.manage) {
    return { ok: false, message: "You do not have permission to remove this document." };
  }

  await attachmentStore.removeAttachment(attachment.id);
  await service.deleteFile(attachment.storagePath);

  revalidateFor(attachment);
  return { ok: true };
}
