/**
 * Client-side image preparation for profile pictures.
 *
 * Pictures are stored inline on the user record, so they are cropped to a
 * square and re-encoded in the browser before upload. A 4 MB phone photo
 * becomes roughly 20 KB, which keeps the record small and the action payload
 * well inside its limit.
 */

export const AVATAR_SIZE = 256;
export const AVATAR_INPUT_MAX_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };

    image.src = url;
  });
}

/**
 * Centre-crops `file` to a square and returns a JPEG data URL.
 *
 * JPEG has no alpha channel, so the canvas is filled white first - otherwise a
 * transparent PNG would come out with a black background.
 */
export async function toAvatarDataUrl(file: File): Promise<string> {
  const image = await loadImage(file);

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not process that image.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);

  const side = Math.min(image.width, image.height);
  const sourceX = (image.width - side) / 2;
  const sourceY = (image.height - side) / 2;

  context.drawImage(image, sourceX, sourceY, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  return canvas.toDataURL("image/jpeg", 0.85);
}
