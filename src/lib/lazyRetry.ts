/**
 * Utility to handle dynamic import failures in production.
 * This usually happens when a new version is deployed and the user's browser
 * is still trying to load a hashed JS chunk from the old version.
 */
export function lazyRetry<T extends { default: any }>(componentImport: () => Promise<T>): Promise<T> {
  return componentImport().catch((error) => {
    // Check if the error is a "Failed to fetch" error (Chrome/Firefox/Safari vary slightly)
    const isChunkLoadError = 
      error.name === 'ChunkLoadError' || 
      /failed to fetch/i.test(error.message) ||
      /dynamically imported module/i.test(error.message);

    if (isChunkLoadError) {
      // If we haven't reloaded yet for this specific session, try once
      const hasReloaded = window.sessionStorage.getItem('chunk-reload-occurred');
      
      if (!hasReloaded) {
        window.sessionStorage.setItem('chunk-reload-occurred', 'true');
        window.location.reload();
      }
    }

    throw error;
  });
}
