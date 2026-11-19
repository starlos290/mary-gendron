const { createHash } = require('node:crypto');
const { put } = require('@vercel/blob');

const success = 'We’ll email you when the kits are available.';
const unavailable = 'We could not save your email. Please try again in a moment.';
const invalid = 'Enter a valid email address and try again.';

const kitsByRoute = new Map([
  ['/', 'all'],
  ['/hr-kits/payroll', 'payroll'],
  ['/hr-kits/handbook', 'handbook'],
  ['/hr-kits/california', 'california'],
  ['/hr-kits/bundle', 'bundle']
]);
const payrollSample = {
  href: '/hr-kits/assets/samples/hr-fieldwork-payroll-sample.zip',
  label: 'Download the Fresno report and worksheet (ZIP)'
};
const samplesByKit = {
  all: payrollSample,
  payroll: payrollSample,
  bundle: payrollSample,
  handbook: { href: '/hr-kits/handbook#handbook-sample', label: 'Read the sample time off review' },
  california: { href: '/hr-kits/california#california-sample', label: 'Read the sample supervisor training review' }
};
const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function cleanCampaign(tags) {
  const campaign = {};
  for (const key of campaignKeys) {
    if (typeof tags?.[key] !== 'string') continue;
    const value = tags[key].normalize('NFKC').trim();
    // Accept short campaign labels. Drop links, email addresses and encoded payloads.
    if (/^[\p{L}\p{N} _.,()+|\-]{1,80}$/u.test(value) && !/(?:[\w-]+\.)+[a-z]{2,}(?:\b|$)/iu.test(value)) {
      campaign[key] = value;
    }
  }
  return campaign;
}

function reply(res, wantsHtml, status, message, signupRoute = '/') {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const sample = status === 200 ? samplesByKit[kitsByRoute.get(signupRoute)] : null;
  if (!wantsHtml) {
    return res.status(status).json(sample ? { ok: true, sample } : { ok: false, error: message });
  }
  // Messages, links and labels come from the fixed values above.
  const heading = sample ? 'You’re on the launch list.' : 'Your email was not added.';
  const action = sample
    ? `<a class="button" href="${sample.href}">${sample.label}</a>`
    : `<a class="button" href="${signupRoute}#launch-list">Return to the launch list</a>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(status).send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${heading} | HR Fieldwork</title><link rel="stylesheet" href="/hr-kits/assets/site.css">
<style>main{max-width:42rem;margin:9vh auto;padding:0 1.5rem}h1{margin:2.5rem 0 1rem}p{margin-bottom:1.5rem}</style></head>
<body><main><a class="brand-home" href="/"><img src="/hr-kits/assets/brand/hr-fieldwork.svg" alt="HR Fieldwork home" width="208" height="33"></a>
<h1>${heading}</h1><p>${message}</p>${action}</main></body></html>`);
}

module.exports = async function launchList(req, res) {
  const mediaType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const htmlForm = mediaType === 'application/x-www-form-urlencoded';
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, false, 405, 'Use the launch list form to join.');
  }
  if (!htmlForm && mediaType !== 'application/json') {
    return reply(res, false, 415, 'Use the launch list form to join.');
  }
  if (Number(req.headers['content-length']) > 2048) {
    return reply(res, htmlForm, 413, invalid);
  }
  if (req.headers.origin) {
    try {
      if (new URL(req.headers.origin).host !== req.headers.host) {
        return reply(res, htmlForm, 403, 'Submit the form from the HR Fieldwork website.');
      }
    } catch {
      return reply(res, htmlForm, 403, 'Submit the form from the HR Fieldwork website.');
    }
  }

  let data = req.body;
  if (Buffer.isBuffer(data)) data = data.toString('utf8');
  if (typeof data === 'string') {
    try {
      data = htmlForm ? Object.fromEntries(new URLSearchParams(data)) : JSON.parse(data);
    } catch {
      return reply(res, htmlForm, 400, invalid);
    }
  }

  const signupRoute = kitsByRoute.has(data?.signupRoute) ? data.signupRoute : '/';
  const landingRoute = kitsByRoute.has(data?.landingRoute) ? data.landingRoute : signupRoute;
  const kitInterest = kitsByRoute.get(signupRoute);
  const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
  if (data?.website || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    return reply(res, htmlForm, 400, invalid, signupRoute);
  }
  const key = createHash('sha256').update(email).digest('hex');
  const group = process.env.VERCEL_ENV === 'production' ? 'subscribers' : 'preview';
  try {
    // Each address has one private record, including after concurrent retries.
    await put(`${group}/${key}.json`, JSON.stringify({
      email,
      lastRequestedAt: new Date().toISOString(),
      purpose: 'HR Fieldwork kit launch notification',
      signupRoute,
      kitInterest,
      landingRoute,
      campaign: cleanCampaign(data.campaign)
    }), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
  } catch {
    return reply(res, htmlForm, 503, unavailable, signupRoute);
  }
  return reply(res, htmlForm, 200, success, signupRoute);
};
