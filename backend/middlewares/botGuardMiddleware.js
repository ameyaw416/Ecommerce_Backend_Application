// backend/middlewares/botGuardMiddleware.js
// Heuristic bot detection + micro-velocity checks per IP.
// No external deps. ES modules. Default export (matches your style).

const SUSPICIOUS_UA_PATTERNS = [
  'headless', 'phantom', 'puppeteer', 'playwright',
  'selenium', 'crawler', 'spider', 'scrapy',
  'curl', 'wget', 'python-requests', 'httpclient',
  'java/', 'libwww', 'okhttp', 'postmanruntime',
  'axios', 'go-http-client', 'insomnia'
];

function scoreRequest(req) {
  let score = 0;

  const ua = String(req.headers['user-agent'] || '').toLowerCase();
  const accept = String(req.headers['accept'] || '');
  const acceptLang = String(req.headers['accept-language'] || '');
  const secFetchSite = String(req.headers['sec-fetch-site'] || '');
  const secChUa = String(req.headers['sec-ch-ua'] || '');

  // 1) Missing or weird headers
  if (!ua) score += 2;                // no UA is very suspicious
  if (!acceptLang) score += 1;        // most browsers send this
  if (!accept) score += 1;

  // 2) Known automation/tool UAs
  for (const pat of SUSPICIOUS_UA_PATTERNS) {
    if (ua.includes(pat)) { score += 3; break; }
  }

  // 3) Headless-ish hints
  if (ua.includes('headlesschrome')) score += 3;
  if (secChUa && /"Not.A/ig.test(secChUa)) score += 1; // some headless contexts

  // 4) Cross-site scraping hints (no referrer + cross-site fetch)
  const referer = String(req.headers['referer'] || '');
  if (!referer && secFetchSite && secFetchSite !== 'same-origin') score += 1;

  // 5) JSON-only strange clients hammering endpoints
  if (accept.trim() === 'application/json') score += 1;

  return score;
}

// in-memory tiny store: IP -> recent timestamps (ms)
const buckets = new Map();

function pruneStaleBuckets(now, staleMs, maxBuckets) {
  if (buckets.size <= maxBuckets) return;

  for (const [ip, record] of buckets) {
    const lastSeen = record.lastSeen || record.blockUntil || 0;
    if (now - lastSeen > staleMs) {
      buckets.delete(ip);
    }
    if (buckets.size <= maxBuckets) break;
  }
}

export default function botGuard(options = {}) {
  const {
    windowMs = 10_000,           // lookback window (10s)
    maxHits = 30,                // soft velocity cap in window
    scoreThreshold = 4,          // header heuristic threshold
    blockForMs = 30_000,         // temporary block duration
    watchPaths = [               // most targeted endpoints
      '/api/auth/login',
      '/api/auth/register',
      '/api/products',
      '/api/orders'
    ],
    maxBuckets = 10_000,         // prevent unbounded memory usage
    staleBucketMs = windowMs * 6, // drop buckets idle for 6 windows
    log = true
  } = options;

  return function (req, res, next) {
    try {
      // only guard selected paths (exact or prefix)
      const path = req.path || req.originalUrl || '';
      const watch = watchPaths.some(p => path === p || path.startsWith(p));
      if (!watch) return next();

      // compute header score
      const headerScore = scoreRequest(req);

      // velocity bucket per IP
      const ip = (req.ip || req.connection?.remoteAddress || 'unknown').toString();
      const now = Date.now();
      const until = now - windowMs;

      // active bucket
      const rec = buckets.get(ip) || { hits: [], blockUntil: 0, lastSeen: 0 };
      // if blocked, short-circuit
      if (rec.blockUntil && rec.blockUntil > now) {
        res.set('Retry-After', Math.ceil((rec.blockUntil - now) / 1000));
        return res.status(429).json({ message: 'Too many requests. Please try again later.' });
      }

      // push hit and prune old
      rec.hits.push(now);
      while (rec.hits.length && rec.hits[0] < until) rec.hits.shift();

      // combine score + velocity
      const velocity = rec.hits.length;
      const isVelocityBad = velocity > maxHits;
      const headerSuspicious = headerScore >= scoreThreshold;
      const combinedSuspicion = headerSuspicious && velocity > Math.max(Math.floor(maxHits * 0.4), 5);

      if (isVelocityBad || combinedSuspicion) {
        // soft block for a short time
        rec.blockUntil = now + blockForMs;
        rec.lastSeen = now;
        buckets.set(ip, rec);

        if (log) {
          console.warn('[botGuard] blocked', {
            ip,
            path,
            headerScore,
            velocity,
            ua: req.headers['user-agent'] || '(none)'
          });
        }

        res.set('Retry-After', Math.ceil(blockForMs / 1000));
        return res.status(429).json({ message: 'Rate limit / bot protection triggered' });
      }

      // store back and continue
      rec.lastSeen = now;
      buckets.set(ip, rec);
      pruneStaleBuckets(now, staleBucketMs, maxBuckets);
      return next();
    } catch (err) {
      if (log) console.error('[botGuard] error ->', err?.stack || err);
      // fail open (don’t break app on detection error)
      return next();
    }
  };
}
