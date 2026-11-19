const { randomUUID } = require('node:crypto');
const { head } = require('@vercel/blob');

const catalog = new Map([
  ['payroll', { sku: 'payroll', name: 'Payroll Review', cents: 19700, priceEnv: 'STRIPE_PRICE_PAYROLL' }],
  ['handbook', { sku: 'handbook', name: 'HR and Handbook Audit', cents: 24700, priceEnv: 'STRIPE_PRICE_HANDBOOK' }],
  ['california', { sku: 'california', name: 'California Compliance', cents: 29700, priceEnv: 'STRIPE_PRICE_CALIFORNIA' }],
  ['bundle', { sku: 'bundle', name: 'Complete Bundle', cents: 49700, priceEnv: 'STRIPE_PRICE_BUNDLE' }]
]);

const editionPattern = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const unavailable = 'The checkout preview is unavailable. Please return to the launch list.';

function failure(status, message) {
  return Object.assign(new Error(message), { status });
}

function getConfig() {
  const env = process.env;
  let origin;
  if (env.VERCEL_ENV === 'preview') {
    if (!/^[a-z0-9-]+\.vercel\.app$/.test(env.VERCEL_URL || '')) throw failure(503, unavailable);
    origin = 'https://' + env.VERCEL_URL;
  } else {
    const local = (!env.VERCEL_ENV || env.VERCEL_ENV === 'development') &&
      env.NODE_ENV !== 'production' && env.HR_FIELDWORK_LOCAL_CHECKOUT === 'true';
    const localOrigin = env.HR_FIELDWORK_LOCAL_ORIGIN || 'http://127.0.0.1:3000';
    if (!local || !/^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(localOrigin)) {
      throw failure(503, unavailable);
    }
    try {
      origin = new URL(localOrigin).origin;
    } catch {
      throw failure(503, unavailable);
    }
  }
  if (!/^sk_test_[a-zA-Z0-9]+$/.test(env.STRIPE_SECRET_KEY || '') ||
      !editionPattern.test(env.HR_FIELDWORK_EDITION || '')) {
    throw failure(503, unavailable);
  }
  return { origin, stripeKey: env.STRIPE_SECRET_KEY, edition: env.HR_FIELDWORK_EDITION };
}

function getKit(sku) {
  return catalog.get(sku) || null;
}

function configuredPriceId(kit) {
  const value = process.env[kit.priceEnv] || '';
  return /^price_[a-zA-Z0-9]+$/.test(value) ? value : null;
}

function getPriceId(kit) {
  const priceId = configuredPriceId(kit);
  if (!priceId) throw failure(503, unavailable);
  return priceId;
}

function getConfiguredKits() {
  const env = process.env;
  // A compatible test price and an accessible archive get checked on submission.
  if (!env.BLOB_READ_WRITE_TOKEN && !(env.BLOB_STORE_ID && env.VERCEL_OIDC_TOKEN)) return [];
  return [...catalog.values()].filter(configuredPriceId).map(kit => kit.sku);
}

function getArchivePath(kit, edition) {
  if (!kit || getKit(kit.sku) !== kit || typeof edition !== 'string' || !editionPattern.test(edition)) {
    throw failure(400, 'The selected kit edition is invalid.');
  }
  return 'commerce-preview/' + edition + '/' + kit.sku + '.zip';
}

async function getArchiveInfo(kit, edition) {
  const path = getArchivePath(kit, edition);
  const info = await head(path);
  const url = new URL(info.url);
  if (info.pathname !== path || !Number.isSafeInteger(info.size) || info.size < 22 ||
      info.contentType?.split(';')[0] !== 'application/zip' ||
      url.protocol !== 'https:' || !/^[a-z0-9-]+\.private\.blob\.vercel-storage\.com$/i.test(url.hostname) ||
      url.pathname !== '/' + path || url.username || url.password || url.port || url.search || url.hash) {
    throw failure(503, unavailable);
  }
  return info;
}

async function stripeRequest(config, path, params) {
  if (!path.startsWith('/v1/')) throw failure(503, unavailable);
  const isWrite = params !== undefined;
  const headers = { Authorization: 'Bearer ' + config.stripeKey };
  if (isWrite) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    // Both attempts must refer to the same Checkout Session creation.
    headers['Idempotency-Key'] = randomUUID();
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    let response;
    try {
      response = await fetch('https://api.stripe.com' + path, {
        method: isWrite ? 'POST' : 'GET', headers, body: params,
        redirect: 'error', signal: AbortSignal.timeout(7000)
      });
    } catch {
      if (attempt === 0) continue;
      throw failure(503, unavailable);
    }
    if (response.ok) return response.json();
    const retryHeader = response.headers.get('stripe-should-retry');
    const retryable = retryHeader === 'true' ||
      (retryHeader !== 'false' && [429, 502, 503, 504].includes(response.status));
    if (attempt === 0 && retryable) {
      const seconds = Number(response.headers.get('retry-after'));
      // Respect longer backoffs by letting a later customer request retry.
      if (!Number.isFinite(seconds) || seconds > 1) throw failure(response.status, unavailable);
      await new Promise(resolve => setTimeout(resolve, Math.max(200, seconds * 1000)));
      continue;
    }
    throw failure(response.status, unavailable);
  }
}

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function sendError(res, status, message) {
  noStore(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const escaped = message.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Checkout preview | HR Fieldwork</title><link rel="stylesheet" href="/hr-kits/assets/site.css"></head>
  <body><main class="wrap" style="padding-block:12vh"><h1>Checkout preview</h1><p>${escaped}</p>
  <p><a class="textlink" href="/checkout/preview">Return to the preview</a></p><p><a href="/#launch-list">Join the launch list</a></p></main></body></html>`);
}

module.exports = { getConfig, getKit, getPriceId, getConfiguredKits, getArchivePath, getArchiveInfo, stripeRequest, noStore, sendError };
