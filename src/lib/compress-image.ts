// Client-side image compression: downscale + JPEG-encode so the resulting
// base64 data URI fits comfortably under the backend's bodyParser.json()
// limit (default 100 KB). Returns a JPEG data URI on success.
//
// Why: the backend accepts images as base64 inside a JSON body. Real photos
// straight off a phone come in at 3-5 MB raw / 4-7 MB base64-encoded, which
// makes Express drop the connection before the controller sees the request
// — the browser surfaces that as a generic 'Failed to fetch'. Aggressive
// downscaling + JPEG re-encoding keeps the payload safely under the limit.
//
// Hitting a target size requires an iterative pass: a single fixed quality
// + max-edge can't guarantee the output stays under the threshold for
// every input. We loop, shrinking max-edge and quality until the encoded
// length fits or we exhaust the steps.

export type CompressOptions = {
  /**
   * Target maximum SERIALIZED size (in bytes) of the resulting data URI.
   * Defaults to 80 KB so the full JSON request body (image + other form
   * fields, base64 overhead, etc.) comfortably fits under the backend's
   * 100 KB bodyParser limit.
   */
  targetBytes?: number;
  /** Start max edge in pixels. Defaults to 1024. */
  startMaxEdge?: number;
  /** Start JPEG quality (0-1). Defaults to 0.82. */
  startQuality?: number;
  /** Target MIME type. Defaults to image/jpeg. */
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
};

type Step = { maxEdge: number; quality: number };

const DEFAULT_STEPS: Step[] = [
  { maxEdge: 1024, quality: 0.82 },
  { maxEdge: 1024, quality: 0.7 },
  { maxEdge: 800, quality: 0.7 },
  { maxEdge: 800, quality: 0.55 },
  { maxEdge: 640, quality: 0.6 },
  { maxEdge: 640, quality: 0.45 },
  { maxEdge: 480, quality: 0.5 },
  { maxEdge: 480, quality: 0.35 },
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

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<string> {
  const {
    targetBytes = 80 * 1024,
    startMaxEdge,
    startQuality,
    mimeType = 'image/jpeg',
  } = options;

  const img = await fileToImage(file);

  // Build the descent. If the caller passed custom starts, anchor the
  // first step to those values; otherwise use the curated defaults.
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
  // Couldn't get under the target — return the smallest attempt anyway;
  // the backend will reject if it's still too big, with a clearer error
  // than 'Failed to fetch' (the api wrapper maps 413 to a friendly
  // message). Most real-world photos will hit the target well before
  // the last step.
  return last;
}
