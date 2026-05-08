// =========================================================
// BASİT RATE LIMITER
// Aynı IP'den dakikada N istekten fazlası 429 yer.
// In-memory — Vercel'de cold start'ta sıfırlanır, demo için yeter.
// =========================================================

const buckets = new Map();
const WINDOW_MS = 60 * 1000;        // 1 dakika
const MAX_REQUESTS_PER_WINDOW = 12; // dakikada 12 istek (yarışma için yeter)

export function checkRateLimit(ip) {
  const now = Date.now();
  const bucket = buckets.get(ip) || { count: 0, windowStart: now };

  // Pencere bittiyse sıfırla
  if (now - bucket.windowStart > WINDOW_MS) {
    bucket.count = 0;
    bucket.windowStart = now;
  }

  bucket.count++;
  buckets.set(ip, bucket);

  return {
    allowed: bucket.count <= MAX_REQUESTS_PER_WINDOW,
    remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - bucket.count),
    resetIn: Math.ceil((WINDOW_MS - (now - bucket.windowStart)) / 1000),
  };
}

// Bellek sızıntısı önleme — eski IP'leri arada temizle
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of buckets.entries()) {
    if (now - bucket.windowStart > WINDOW_MS * 2) buckets.delete(ip);
  }
}, WINDOW_MS).unref?.();
