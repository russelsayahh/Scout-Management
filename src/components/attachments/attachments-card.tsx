import {
  AttachmentList,
  type AttachmentRow,
} from "@/components/attachments/attachment-list";
import { listAttachments } from "@/lib/attachments/service";
import {
  documentKindLabel,
  formatFileSize,
  type AttachmentParentKind,
} from "@/lib/attachments/types";
import * as userStore from "@/lib/auth/store";
import { formatShortDate } from "@/lib/format";

/**
 * Word and PDF documents attached to one camp or activity - kit lists,
 * permission forms, risk assessments - shown on that event's own page.
 *
 * The caller has already checked that the viewer may see the page; this card
 * only needs to know whether they may also add and remove documents.
 */
export async function AttachmentsCard({
  parentKind,
  parentId,
  canManage,
}: {
  parentKind: AttachmentParentKind;
  parentId: string;
  canManage: boolean;
}) {
  const [attachments, users] = await Promise.all([
    listAttachments(parentKind, parentId),
    userStore.listUsers(),
  ]);
  const names = new Map(users.map((user) => [user.id, user.name]));

  const rows: AttachmentRow[] | null =
    attachments?.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      kind: documentKindLabel(attachment.fileName),
      size: formatFileSize(attachment.size),
      uploadedOn: formatShortDate(attachment.uploadedAt),
      uploadedByName: names.get(attachment.uploadedBy) ?? "A former leader",
    })) ?? null;

  return (
    <AttachmentList
      parentKind={parentKind}
      parentId={parentId}
      rows={rows}
      canManage={canManage}
    />
  );
}
