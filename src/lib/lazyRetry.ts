/**
 * Utility to handle dynamic import failures in production.
 * This usually happens when a new version is deployed and the user's browser
 * is still trying to load a hashed JS chunk from the old version.
 */
export function lazyRetry<T extends { default: any }>(componentImport: () => Promise<T>): Promise<T> {
  return componentImport().catch((error) => {
    // Check if the error is a "Failed to fetch" error (Chrome/Firefox/Safari vary slightly)
    const errorMessage = error?.message || '';
    const isChunkLoadError = 
      error?.name === 'ChunkLoadError' || 
      /failed to fetch/i.test(errorMessage) ||
      /dynamically imported module/i.test(errorMessage);

    if (isChunkLoadError) {
      // Extract the failed chunk URL or hash to key the reload once per unique asset
      const chunkUrl = errorMessage.split(': ').pop() || 'unknown-chunk';
      const storageKey = `chunk-reload-${chunkUrl}`;
      const hasReloaded = window.sessionStorage.getItem(storageKey);
      
      if (!hasReloaded) {
        console.warn("[lazyRetry] Chunk load failure detected. Reloading page to fetch latest build asset map...", chunkUrl);
        window.sessionStorage.setItem(storageKey, 'true');
        window.location.reload();
      }
    }

    throw error;
  });
}
