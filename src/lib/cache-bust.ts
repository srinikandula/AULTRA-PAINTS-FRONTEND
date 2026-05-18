// Append a cache-busting query param to a remote URL.
//
// The backend writes uploaded images to S3 at a key derived from the
// document's ID (e.g. `${productOfferId}.png`). The S3 URL therefore stays
// the same after an image update, and browsers happily serve the previously
// cached bytes. Appending `?v=...` with a value that changes on each update
// (we use the document's `updatedAt`) forces a fresh fetch.
//
// Data URIs (`data:image/...;base64,...`) and locally-staged previews are
// returned unchanged.

export function cacheBust(url: string | undefined | null, version?: string | number): string | null {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  if (version === undefined || version === null || version === '') return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(String(version))}`;
}
