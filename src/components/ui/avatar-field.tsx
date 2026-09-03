"use client";

import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ACCEPTED_IMAGE_TYPES,
  AVATAR_INPUT_MAX_BYTES,
  toAvatarDataUrl,
} from "@/lib/image";

export interface AvatarFieldProps {
  /** Name of the hidden input carrying the data URL. */
  name: string;
  /** Stored picture, or null. */
  initialSrc: string | null;
  /** Used for the initials fallback and the alt context. */
  displayName: string;
  label: string;
  description?: string;
  disabled?: boolean;
  /** Server-side error for this field. */
  error?: string;
}

/**
 * Picture picker shared by the account profile and the scout form.
 *
 * The chosen file is cropped and re-encoded in the browser (see `lib/image.ts`)
 * before it ever reaches the server. The hidden input is only rendered once the
 * picture actually changes, so submitting an untouched form leaves the stored
 * picture alone rather than round-tripping it.
 */
export function AvatarField({
  name,
  initialSrc,
  displayName,
  label,
  description,
  disabled = false,
  error,
}: AvatarFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialSrc);
  const [changed, setChanged] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>();

  async function handleFile(file: File | undefined) {
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setLocalError("Choose a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > AVATAR_INPUT_MAX_BYTES) {
      setLocalError("That image is too large. Choose one under 8 MB.");
      return;
    }

    try {
      setPreview(await toAvatarDataUrl(file));
      setChanged(true);
      setLocalError(undefined);
    } catch (cause) {
      setLocalError(
        cause instanceof Error ? cause.message : "That image could not be processed.",
      );
    }
  }

  function removePicture() {
    setPreview(null);
    setChanged(true);
    setLocalError(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const message = localError ?? error;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar name={displayName} src={preview} size="xl" />

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 text-[12px] text-ink-muted">{description}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Upload className="size-3.5" strokeWidth={2} aria-hidden />
            {preview ? "Change" : "Upload"}
          </Button>

          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removePicture}
              disabled={disabled}
            >
              <Trash2 className="size-3.5" strokeWidth={2} aria-hidden />
              Remove
            </Button>
          )}
        </div>

        {message && (
          <p className="mt-2 text-[12px] text-negative" role="alert">
            {message}
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
        aria-label={label}
        tabIndex={-1}
      />
      {changed && <input type="hidden" name={name} value={preview ?? ""} />}
    </div>
  );
}
