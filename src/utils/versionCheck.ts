// Version & Cache-busting manager for CANCIONERO SALESIANO
// Ensures the browser always verifies and loads the latest updated version of the project.

declare const __APP_BUILD_TIME__: string | undefined;

export const RUNTIME_BUILD_TIME = typeof __APP_BUILD_TIME__ !== 'undefined' 
  ? __APP_BUILD_TIME__ 
  : 'dev-mode';

const LOCAL_STORAGE_VERSION_KEY = 'cancionero_client_build_time';
const RELOAD_GUARD_KEY = 'cancionero_last_version_reload';

export interface VersionInfo {
  version?: string;
  buildTime?: string;
  builtAt?: string;
  timestamp?: number;
}

/**
 * Hard-clears any cached assets, service workers and caches, then reloads the window
 */
export async function forceHardReload(): Promise<void> {
  try {
    // 1. Clear CacheStorage
    if ('caches' in window) {
      const cacheKeys = await window.caches.keys();
      await Promise.all(cacheKeys.map(key => window.caches.delete(key)));
    }

    // 2. Unregister any service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }

    // 3. Save guard timestamp to prevent reload loops
    sessionStorage.setItem(RELOAD_GUARD_KEY, Date.now().toString());
  } catch (err) {
    console.warn('[Cache] Could not clear all caches:', err);
  }

  // Force page reload from the network, bypassing cache
  window.location.reload();
}

/**
 * Fetches the latest build version from the server bypassing all browser cache
 */
export async function checkServerVersion(): Promise<{ hasUpdate: boolean; serverBuildTime?: string }> {
  try {
    const url = `/version.json?_t=${Date.now()}`;
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      return { hasUpdate: false };
    }

    const data: VersionInfo = await response.json();
    const serverBuildTime = data.buildTime || (data.timestamp ? String(data.timestamp) : undefined);

    if (!serverBuildTime) {
      return { hasUpdate: false };
    }

    // Compare with current runtime build time
    if (RUNTIME_BUILD_TIME !== 'dev-mode' && serverBuildTime !== RUNTIME_BUILD_TIME) {
      console.log(`[VersionCheck] New build detected: Server=${serverBuildTime}, Client=${RUNTIME_BUILD_TIME}`);
      return { hasUpdate: true, serverBuildTime };
    }

    // Also compare with stored build time in localStorage
    const storedBuildTime = localStorage.getItem(LOCAL_STORAGE_VERSION_KEY);
    if (storedBuildTime && storedBuildTime !== serverBuildTime && RUNTIME_BUILD_TIME === 'dev-mode') {
      return { hasUpdate: true, serverBuildTime };
    }

    // Save latest verified build time
    localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, serverBuildTime);
    return { hasUpdate: false, serverBuildTime };
  } catch {
    return { hasUpdate: false };
  }
}

/**
 * Global handlers for Vite preload error and dynamic chunk failure
 */
export function setupVersionGuards(onUpdateDetected?: () => void): () => void {
  // 1. Vite chunk loading failure handler (happens after new deploy)
  const handlePreloadError = () => {
    console.warn('[Version] Vite preload error: new version detected on server, reloading...');
    forceHardReload();
  };
  window.addEventListener('vite:preloadError', handlePreloadError);

  // 2. Initial check on page startup: if coming from a stale cache, reload immediately
  const checkInitial = async () => {
    const { hasUpdate } = await checkServerVersion();
    if (hasUpdate) {
      const lastReload = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || '0');
      // If we haven't reloaded in the last 15 seconds, reload cleanly now
      if (Date.now() - lastReload > 15000) {
        sessionStorage.setItem(RELOAD_GUARD_KEY, Date.now().toString());
        forceHardReload();
        return;
      }
      onUpdateDetected?.();
    }
  };
  checkInitial();

  // 3. Tab focus & visibility change: whenever user switches back to the tab, check if updated
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      const { hasUpdate } = await checkServerVersion();
      if (hasUpdate) {
        onUpdateDetected?.();
      }
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleVisibilityChange);

  // 4. Periodic check every 60 seconds in background
  const intervalId = setInterval(async () => {
    const { hasUpdate } = await checkServerVersion();
    if (hasUpdate) {
      onUpdateDetected?.();
    }
  }, 60000);

  return () => {
    window.removeEventListener('vite:preloadError', handlePreloadError);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleVisibilityChange);
    clearInterval(intervalId);
  };
}
