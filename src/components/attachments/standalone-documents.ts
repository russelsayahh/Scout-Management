import type { DocumentCardRow } from "@/components/attachments/document-card";
import { listStandalone } from "@/lib/attachments/service";
import {
  documentKindLabel,
  formatFileSize,
  type AttachmentParentKind,
} from "@/lib/attachments/types";
import * as userStore from "@/lib/auth/store";
import type { TroopScope } from "@/lib/auth/troop-scope";
import { formatShortDate } from "@/lib/format";
import { listTroops } from "@/lib/troops/service";

/**
 * Standalone documents for the Camps or Activities page, ready for
 * `DocumentCard`. An empty list when the attachments table is not set up, so
 * the page itself still renders.
 */
export async function standaloneDocumentRows(
  parentKind: AttachmentParentKind,
  scope: TroopScope,
): Promise<DocumentCardRow[]> {
  const [documents, users, troops] = await Promise.all([
    listStandalone(parentKind, scope),
    userStore.listUsers(),
    listTroops(),
  ]);
  const people = new Map(users.map((user) => [user.id, user.name]));
  const troopNames = new Map(troops.map((troop) => [troop.id, troop.name]));

  return (documents ?? []).map((document) => ({
    id: document.id,
    title: document.title || document.fileName,
    fileName: document.fileName,
    kind: documentKindLabel(document.fileName),
    size: formatFileSize(document.size),
    troopName: (document.troopId && troopNames.get(document.troopId)) || "Unknown troop",
    uploadedByName: people.get(document.uploadedBy) ?? "A former leader",
    uploadedOn: formatShortDate(document.uploadedAt),
  }));
}
