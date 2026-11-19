const { createHash } = require('node:crypto');
const { put } = require('@vercel/blob');

const success = 'You are on the launch list. We will email you when the kits are available.';
const unavailable = 'We could not save your email. Please try again in a moment.';
const invalid = 'Enter a valid email address and try again.';

const kitsByRoute = new Map([
  ['/', 'all'],
  ['/hr-kits/payroll', 'payroll'],
  ['/hr-kits/handbook', 'handbook'],
  ['/hr-kits/california', 'california'],
  ['/hr-kits/bundle', 'bundle']
]);
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
  if (!wantsHtml) {
    return res.status(status).json(status === 200 ? { ok: true } : { ok: false, error: message });
  }
  // Only fixed application messages are rendered here.
  const heading = status === 200 ? 'You are on the list.' : 'Your email was not added.';
  const link = status === 200 ? 'Return to HR Fieldwork' : 'Return to the launch list';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(status).send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${heading} | HR Fieldwork</title><link rel="stylesheet" href="/hr-kits/assets/site.css">
<style>main{max-width:40rem;margin:12vh auto;padding:0 1.5rem}p,a{font-size:1.125rem;line-height:1.6}a{text-decoration:underline}</style></head>
<body><main><h1>${heading}</h1><p>${message}</p><a href="${signupRoute}#launch-list">${link}</a></main></body></html>`);
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
