const CACHE_NAME = "andoro-invoice-route-desk-v79";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./assets/vendor/pdfjs/pdf.min.js",
  "./assets/vendor/pdfjs/pdf.worker.min.js",
  "./assets/vendor/tesseract/tesseract.min.js",
  "./assets/vendor/tesseract/worker.min.js",
  "./assets/vendor/tesseract/lang/eng.traineddata.gz",
  "./assets/vendor/tesseract/core/tesseract-core.wasm.js",
  "./assets/vendor/tesseract/core/tesseract-core.wasm",
  "./assets/vendor/tesseract/core/tesseract-core-simd.wasm.js",
  "./assets/vendor/tesseract/core/tesseract-core-simd.wasm",
  "./assets/vendor/tesseract/core/tesseract-core-lstm.wasm.js",
  "./assets/vendor/tesseract/core/tesseract-core-lstm.wasm",
  "./assets/vendor/tesseract/core/tesseract-core-simd-lstm.wasm.js",
  "./assets/vendor/tesseract/core/tesseract-core-simd-lstm.wasm",
  "./manifest.webmanifest",
  "./assets/andoro-logo.jpg",
  "./assets/andoro-pizza-logo.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isPage = request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  const isAppFile = /\.(?:html|css|js|webmanifest)$/i.test(url.pathname);

  if (isPage || isAppFile) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    }))
  );
});
