"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";

import { useDocumentUpload } from "@/components/attachments/use-document-upload";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { DOCUMENT_ACCEPT, type AttachmentParentKind } from "@/lib/attachments/types";

/** "report.final.pdf" -> "report.final" */
function withoutExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/**
 * The second way onto the Camps or Activities page, beside "New camp" /
 * "New activity": instead of filling in the form, post a Word or PDF file.
 * It shows as its own card next to the camps and activities.
 */
export function AddDocumentButton({
  parentKind,
  troops,
}: {
  parentKind: AttachmentParentKind;
  /** Troops the viewer may post to. */
  troops: { id: string; name: string }[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [troopId, setTroopId] = useState(troops.length === 1 ? troops[0].id : "");
  const [file, setFile] = useState<File | null>(null);
  const { upload, uploading, error, setError } = useDocumentUpload();

  const section = parentKind === "camp" ? "Camps" : "Activities";

  function reset() {
    setTitle("");
    setTroopId(troops.length === 1 ? troops[0].id : "");
    setFile(null);
    setError(undefined);
    if (input.current) input.current.value = "";
  }

  function close() {
    if (uploading) return;
    reset();
    setOpen(false);
  }

  async function submit() {
    if (!file) return setError("Choose a Word or PDF file to upload.");
    if (!title.trim()) return setError("Give the document a title.");
    if (!troopId) return setError("Choose which troop this document is for.");

    const done = await upload({ parentKind, troopId, title }, [file]);
    if (done === 1) {
      reset();
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Upload className="size-4" strokeWidth={2.2} aria-hidden />
        Add document
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title="Add a document"
        description={`Post a Word or PDF file to the ${section} page. It shows next to the ${section.toLowerCase()} for everyone in that troop.`}
        dismissible={!uploading}
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={uploading !== null}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} disabled={uploading !== null}>
              {uploading && <Spinner label="Uploading" />}
              {uploading ? "Uploading..." : "Add document"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <Callout tone="error">{error}</Callout>}

          <div>
            <p className="mb-1.5 text-[13px] font-medium text-ink">File</p>
            <input
              ref={input}
              type="file"
              accept={DOCUMENT_ACCEPT}
              className="hidden"
              onChange={(event) => {
                const chosen = event.target.files?.[0] ?? null;
                setError(undefined);
                setFile(chosen);
                if (chosen && !title.trim()) setTitle(withoutExtension(chosen.name));
              }}
            />
            <Button
              variant="secondary"
              onClick={() => input.current?.click()}
              disabled={uploading !== null}
              className="w-full justify-start"
            >
              <FileText className="size-4" aria-hidden />
              <span className="truncate">{file ? file.name : "Choose a Word or PDF file"}</span>
            </Button>
            <p className="mt-1.5 text-[11.5px] text-ink-muted">.doc, .docx or .pdf, up to 20 MB</p>
          </div>

          <TextField
            label="Title"
            value={title}
            maxLength={120}
            onChange={(event) => {
              setError(undefined);
              setTitle(event.target.value);
            }}
            disabled={uploading !== null}
            placeholder={parentKind === "camp" ? "e.g. Summer camp kit list" : "e.g. Hike permission form"}
          />

          <SelectField
            label="Troop"
            value={troopId}
            onChange={(event) => {
              setError(undefined);
              setTroopId(event.target.value);
            }}
            disabled={uploading !== null}
            hint="Only leaders in this troop will see it."
          >
            <option value="">Choose a troop...</option>
            {troops.map((troop) => (
              <option key={troop.id} value={troop.id}>
                {troop.name}
              </option>
            ))}
          </SelectField>
        </div>
      </Dialog>
    </>
  );
}
