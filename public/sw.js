const CACHE_NAME = "tacavision-shell-v1";
const CORE_ASSETS = [
  "/",
  "/board",
  "/manifest.webmanifest",
  "/icon-tv-3.svg",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {
        // Ignore warm-cache failures; runtime network is still primary.
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          const normalized = key.toLowerCase();
          const isLegacyPitchFlowCache = normalized.includes("pitchflow");
          const isOldTacavisionCache = normalized.startsWith("tacavision-") && key !== CACHE_NAME;
          if (!isLegacyPitchFlowCache && !isOldTacavisionCache) return Promise.resolve(false);
          return caches.delete(key);
        }),
      ),
    ),
  );
  self.clients.claim();
});
