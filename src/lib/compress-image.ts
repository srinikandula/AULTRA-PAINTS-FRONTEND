// Client-side image compression: downscale + JPEG-encode if the source is
// larger than the backend's 5 MB upload ceiling, otherwise pass through
// untouched.
//
// Why an iterative pass: encoder output for a fixed (maxEdge, quality) pair
// can't be predicted from input size, so we shrink quality + max edge in
// steps until the resulting data URI length is under the target. Real
// phone photos usually pass through in step 1.

export type CompressOptions = {
  /**
   * Hard ceiling on the resulting data URI byte length. Defaults to 6 MB so
   * a typical photo fits comfortably under the backend's 8 MB body-parser
   * limit (after JSON envelope + other fields).
   */
  targetBytes?: number;
  /** Start max edge in pixels. Defaults to 2400 (preserves real photo detail). */
  startMaxEdge?: number;
  /** Start JPEG quality (0-1). Defaults to 0.9. */
  startQuality?: number;
  /** Target MIME type. Defaults to image/jpeg. */
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
};

type Step = { maxEdge: number; quality: number };

const DEFAULT_STEPS: Step[] = [
  { maxEdge: 2400, quality: 0.9 },
  { maxEdge: 2000, quality: 0.85 },
  { maxEdge: 1600, quality: 0.8 },
  { maxEdge: 1280, quality: 0.75 },
  { maxEdge: 1024, quality: 0.7 },
  { maxEdge: 800, quality: 0.65 },
  { maxEdge: 640, quality: 0.6 },
];

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const sourceUri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Unexpected FileReader result type'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Image decode failed'));
    el.src = sourceUri;
  });
}

function encode(
  img: HTMLImageElement,
  maxEdge: number,
  quality: number,
  mimeType: string,
): string {
  const naturalLongest = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = naturalLongest > maxEdge ? maxEdge / naturalLongest : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL(mimeType, quality);
}

async function readAsDataUri(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Unexpected FileReader result type'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<string> {
  const {
    targetBytes = 6 * 1024 * 1024,
    startMaxEdge,
    startQuality,
    mimeType = 'image/jpeg',
  } = options;

  // Fast path: image is already small enough — read straight to a data URI
  // and skip the canvas re-encode. Base64 inflates raw bytes by ~33%, so we
  // approximate the resulting data URI length conservatively.
  const projectedDataUriBytes = Math.ceil(file.size * 1.4);
  if (projectedDataUriBytes <= targetBytes) {
    return await readAsDataUri(file);
  }

  const img = await fileToImage(file);
  const steps: Step[] = startMaxEdge || startQuality
    ? [
        {
          maxEdge: startMaxEdge ?? DEFAULT_STEPS[0].maxEdge,
          quality: startQuality ?? DEFAULT_STEPS[0].quality,
        },
        ...DEFAULT_STEPS,
      ]
    : DEFAULT_STEPS;

  let last = '';
  for (const step of steps) {
    const encoded = encode(img, step.maxEdge, step.quality, mimeType);
    last = encoded;
    if (encoded.length <= targetBytes) return encoded;
  }
  // Couldn't get under the target — return the smallest attempt. The backend
  // limit + api wrapper's 413 fallback produce a clearer downstream error
  // than 'Failed to fetch'.
  return last;
}
