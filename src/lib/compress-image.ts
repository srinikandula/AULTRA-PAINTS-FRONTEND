// Client-side image compression: downscale + JPEG-encode so the resulting
// base64 data URI fits comfortably under the backend's bodyParser.json() limit
// (default 100KB). Returns a JPEG data URI on success.
//
// Why: the backend accepts images as base64 inside a JSON body. Real photos
// straight off a phone come in at 3-5 MB which trips Express's 413 long
// before the controller sees them. Downscaling to a max edge of 1024px at
// quality 0.85 keeps catalog/offer/banner images sharp on a card grid while
// dropping payload to ~50-150 KB.

export type CompressOptions = {
  /** Max width/height of the longer edge in pixels. Defaults to 1024. */
  maxEdge?: number;
  /** JPEG quality 0-1. Defaults to 0.85. */
  quality?: number;
  /** Target MIME type. Defaults to image/jpeg. */
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
};

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<string> {
  const { maxEdge = 1024, quality = 0.85, mimeType = 'image/jpeg' } = options;

  // Read the file as a data URI first so we can load it into an Image element.
  const sourceUri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Unexpected FileReader result type'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Image decode failed'));
    el.src = sourceUri;
  });

  const naturalLongest = Math.max(img.naturalWidth, img.naturalHeight);
  // Don't upscale — skip the canvas pass if the image is already small enough.
  if (naturalLongest <= maxEdge) {
    // Still re-encode as JPEG if the source is much larger than the limit;
    // PNG screenshots are routinely 5-10x bigger than equivalent JPEG.
    // If the input is already a tiny JPEG, just return it as-is.
    if (file.type === mimeType && file.size <= 80 * 1024) {
      return sourceUri;
    }
  }

  const scale = naturalLongest > maxEdge ? maxEdge / naturalLongest : 1;
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL(mimeType, quality);
}
