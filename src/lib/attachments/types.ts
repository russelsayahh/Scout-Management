/**
 * A document attached to a camp or an activity: a kit list, a permission
 * form, a risk assessment.
 *
 * The file itself lives in Supabase Storage; this record is what the app
 * lists, and what decides who may download it - the storage bucket is
 * private, so every download goes through `/attachments/[id]`, which checks
 * the same permissions as the page the file is shown on.
 */

export type AttachmentParentKind = "camp" | "activity";

export interface Attachment {
  id: string;
  /** The section it belongs to: Camps or Activities. */
  parentKind: AttachmentParentKind;
  /**
   * The camp or activity it is attached to, or null for a standalone document
   * posted straight to the Camps or Activities page.
   */
  parentId: string | null;
  /** Standalone documents only: the heading shown on its card. */
  title?: string | null;
  /** Standalone documents only: the troop it is for, which decides who sees it. */
  troopId?: string | null;

  /** The name the file had on the uploader's computer, shown and used on download. */
  fileName: string;
  contentType: string;
  /** Bytes. */
  size: number;
  /** Key inside the storage bucket. */
  storagePath: string;

  /** User id of whoever uploaded it. */
  uploadedBy: string;
  uploadedAt: string;
}

/** Word and PDF only. Keyed by extension, because browsers often report no type for .doc. */
export const ACCEPTED_DOCUMENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** What the file picker offers. */
export const DOCUMENT_ACCEPT = ".pdf,.doc,.docx";

export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

/** The content type to store for `fileName`, or null when it is not Word or PDF. */
export function documentTypeFor(fileName: string): string | null {
  return ACCEPTED_DOCUMENT_TYPES[extensionOf(fileName)] ?? null;
}

/** "PDF", "Word". */
export function documentKindLabel(fileName: string): string {
  return extensionOf(fileName) === "pdf" ? "PDF" : "Word";
}

/** "840 KB", "2.4 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
