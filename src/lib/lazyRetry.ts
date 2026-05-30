/**
 * Handle dynamic import failures in production (stale hashed chunks after deploy).
 * When a missing chunk 404s, Vercel SPA fallback can return index.html → MIME type error.
 */
function isChunkLoadFailure(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const name = error instanceof Error ? error.name : "";

  return (
    name === "ChunkLoadError" ||
    /failed to fetch dynamically imported module/i.test(message) ||
    /failed to fetch/i.test(message) ||
    /loading chunk/i.test(message) ||
    /importing a module script failed/i.test(message) ||
    /mime type/i.test(message) ||
    /text\/html/i.test(message) ||
    /expected a javascript-or-wasm module script/i.test(message)
  );
}

function reloadOncePerChunk(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const chunkKey = message.slice(0, 200) || "unknown-chunk";
  const storageKey = `chunk-reload-${chunkKey}`;
  if (window.sessionStorage.getItem(storageKey)) return;

  console.warn("[lazyRetry] Stale or missing build chunk — reloading for fresh asset map…", chunkKey);
  window.sessionStorage.setItem(storageKey, "true");
  window.location.reload();
}

export function lazyRetry<T extends { default: unknown }>(
  componentImport: () => Promise<T>,
): Promise<T> {
  return componentImport().catch((error: unknown) => {
    if (isChunkLoadFailure(error)) {
      reloadOncePerChunk(error);
    }
    throw error;
  });
}

/** Global handler for script tag / dynamic import MIME failures (see index.html). */
export function handleGlobalChunkFailure(reason: unknown): void {
  if (isChunkLoadFailure(reason)) {
    reloadOncePerChunk(reason);
  }
}
