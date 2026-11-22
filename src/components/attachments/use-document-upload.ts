"use client";

import { useState } from "react";

import {
  confirmAttachmentUploadAction,
  prepareAttachmentUploadAction,
  type UploadTarget,
} from "@/lib/attachments/actions";
import { MAX_DOCUMENT_BYTES, documentTypeFor } from "@/lib/attachments/types";

/**
 * Uploads Word and PDF files, to one camp or activity or as standalone documents.
 *
 * The file goes straight from the browser to Supabase Storage on a signed URL
 * (see `lib/attachments/actions.ts`), so its size is not limited by the app
 * server's request cap.
 */
export function useDocumentUpload() {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  async function uploadOne(target: UploadTarget, file: File): Promise<boolean> {
    const contentType = documentTypeFor(file.name);
    if (!contentType) {
      setError(`${file.name}: only Word (.doc, .docx) and PDF files can be added.`);
      return false;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError(`${file.name} is over the 20 MB limit.`);
      return false;
    }

    setUploading(file.name);
    try {
      const prepared = await prepareAttachmentUploadAction(target, file.name, file.size);
      if (!prepared.ok) {
        setError(prepared.message);
        return false;
      }

      const response = await fetch(prepared.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType, "x-upsert": "false" },
        body: file,
      });
      if (!response.ok) {
        setError(`${file.name} did not upload. Check your connection and try again.`);
        return false;
      }

      const confirmed = await confirmAttachmentUploadAction(
        target,
        prepared.storagePath,
        file.name,
        file.size,
      );
      if (!confirmed.ok) {
        setError(confirmed.message);
        return false;
      }
      return true;
    } catch {
      setError(`${file.name} did not upload. Check your connection and try again.`);
      return false;
    } finally {
      setUploading(null);
    }
  }

  /** Uploads each file in turn; resolves to how many succeeded. */
  async function upload(target: UploadTarget, files: File[]): Promise<number> {
    setError(undefined);
    let done = 0;
    for (const file of files) {
      if (await uploadOne(target, file)) done += 1;
    }
    return done;
  }

  return { upload, uploading, error, setError };
}
