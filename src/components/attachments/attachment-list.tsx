"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { FileText, Paperclip, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useDocumentUpload } from "@/components/attachments/use-document-upload";
import { deleteAttachmentAction } from "@/lib/attachments/actions";
import { DOCUMENT_ACCEPT, type AttachmentParentKind } from "@/lib/attachments/types";

export interface AttachmentRow {
  id: string;
  fileName: string;
  /** "PDF" or "Word". */
  kind: string;
  size: string;
  uploadedOn: string;
  uploadedByName: string;
}

export function AttachmentList({
  parentKind,
  parentId,
  rows,
  canManage,
}: {
  parentKind: AttachmentParentKind;
  parentId: string;
  /** Null when the documents could not be read, i.e. storage is not set up. */
  rows: AttachmentRow[] | null;
  canManage: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const { upload, uploading, error } = useDocumentUpload();
  const [removing, setRemoving] = useState<AttachmentRow | null>(null);
  const [removeError, setRemoveError] = useState<string | undefined>();
  const [removePending, startRemove] = useTransition();

  const noun = parentKind === "camp" ? "camp" : "activity";

  async function uploadAll(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (input.current) input.current.value = "";
    if (list.length === 0) return;
    const done = await upload({ parentKind, parentId }, list);
    if (done > 0) router.refresh();
  }

  function confirmRemove() {
    if (!removing) return;
    setRemoveError(undefined);
    startRemove(async () => {
      const result = await deleteAttachmentAction(removing.id);
      if (!result.ok) {
        setRemoveError(result.message);
        return;
      }
      setRemoving(null);
      router.refresh();
    });
  }

  const addButton = canManage && rows !== null && (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => input.current?.click()}
      disabled={uploading !== null}
    >
      {uploading ? <Spinner label="Uploading" /> : <Upload className="size-3.5" aria-hidden />}
      {uploading ? "Uploading..." : "Add document"}
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Paperclip className="size-4 text-brand-text" strokeWidth={1.9} aria-hidden />
          <div>
            <CardTitle>
              Documents
              {rows && rows.length > 0 && (
                <span className="ml-2 text-[13px] font-normal text-ink-muted tabular-nums">
                  {rows.length}
                </span>
              )}
            </CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">Word and PDF files</p>
          </div>
        </div>

        {addButton}
        <input
          ref={input}
          type="file"
          accept={DOCUMENT_ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => void uploadAll(event.target.files)}
        />
      </CardHeader>

      <CardContent className={rows && rows.length > 0 ? "p-0" : undefined}>
        {error && (
          <Callout tone="error" className="mb-3">
            {error}
          </Callout>
        )}

        {uploading && (
          <p className="mb-3 truncate text-[12.5px] text-ink-secondary">Uploading {uploading}...</p>
        )}

        {rows === null ? (
          <Callout tone="warning" title="Documents are not set up yet">
            An administrator needs to create the attachments table in Supabase (see
            supabase/schema.sql) before files can be added.
          </Callout>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description={
              canManage
                ? `Add kit lists, permission forms or anything else people need for this ${noun}.`
                : `Nothing has been attached to this ${noun} yet.`
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-[10px] font-semibold text-ink-secondary">
                  {row.kind === "PDF" ? "PDF" : "DOC"}
                </span>

                <div className="min-w-0 flex-1">
                  <a
                    href={`/attachments/${row.id}`}
                    target="_blank"
                    rel="noopener"
                    className="block truncate text-[13px] font-medium text-ink hover:text-brand-text hover:underline"
                  >
                    {row.fileName}
                  </a>
                  <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">
                    {row.kind} · {row.size} · {row.uploadedByName}, {row.uploadedOn}
                  </p>
                </div>

                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setRemoveError(undefined);
                      setRemoving(row);
                    }}
                    aria-label={`Remove ${row.fileName}`}
                    title={`Remove ${row.fileName}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <ConfirmDialog
        open={removing !== null}
        onClose={() => !removePending && setRemoving(null)}
        onConfirm={confirmRemove}
        title="Remove this document?"
        description={removing ? `${removing.fileName} will be deleted for everyone.` : undefined}
        confirmLabel="Remove"
        tone="danger"
        pending={removePending}
        error={removeError}
      />
    </Card>
  );
}
