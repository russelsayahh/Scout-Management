"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, Trash2, UserRound, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteAttachmentAction } from "@/lib/attachments/actions";

export interface DocumentCardRow {
  id: string;
  title: string;
  fileName: string;
  /** "PDF" or "Word". */
  kind: string;
  size: string;
  troopName: string;
  uploadedByName: string;
  uploadedOn: string;
}

/**
 * A standalone document on the Camps or Activities page, sized to sit in the
 * same grid as the camp and activity cards.
 */
export function DocumentCard({ row, canManage }: { row: DocumentCardRow; canManage: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const href = `/attachments/${row.id}`;

  function remove() {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteAttachmentAction(row.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={href}
            target="_blank"
            rel="noopener"
            className="text-[15px] font-semibold tracking-tight text-ink hover:text-brand-text hover:underline"
          >
            {row.title}
          </a>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge tone="info">Document</Badge>
            <span className="text-[11.5px] text-ink-muted">
              {row.kind} · {row.size}
            </span>
          </div>
        </div>

        {canManage && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setError(undefined);
              setConfirming(true);
            }}
            aria-label={`Remove ${row.title}`}
            title={`Remove ${row.title}`}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        )}
      </div>

      <dl className="mt-3.5 space-y-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <Users className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
          <dt className="sr-only">Troop</dt>
          <dd className="min-w-0 truncate text-[12.5px] text-ink-secondary">{row.troopName}</dd>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <UserRound className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
          <dt className="sr-only">Added by</dt>
          <dd className="min-w-0 truncate text-[12.5px] text-ink-secondary">
            {row.uploadedByName}, {row.uploadedOn}
          </dd>
        </div>
      </dl>

      <div className="mt-auto border-t border-line pt-3.5">
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className={buttonStyles({ variant: "secondary", size: "sm", className: "w-full" })}
          title={row.fileName}
        >
          <Download className="size-3.5" aria-hidden />
          {row.kind === "PDF" ? "Open PDF" : "Download"}
        </a>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => !pending && setConfirming(false)}
        onConfirm={remove}
        title="Remove this document?"
        description={`${row.title} will be deleted for everyone.`}
        confirmLabel="Remove"
        tone="danger"
        pending={pending}
        error={error}
      />
    </Card>
  );
}
