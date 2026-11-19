'use strict';

const mobileMenu = document.querySelector('.mobile-nav');
if (mobileMenu) {
  document.addEventListener('click', (event) => {
    if (mobileMenu.open && (!mobileMenu.contains(event.target) || event.target.closest('a'))) {
      mobileMenu.open = false;
    }
  });
  mobileMenu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileMenu.open) {
      mobileMenu.open = false;
      mobileMenu.querySelector('summary').focus();
    }
  });
}

const printSample = document.querySelector('.print-trigger');
if (printSample && typeof window.print === 'function') {
  printSample.hidden = false;
  printSample.addEventListener('click', () => window.print());
}

const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const kitRoutes = new Set(['/', '/hr-kits/payroll', '/hr-kits/handbook', '/hr-kits/california', '/hr-kits/bundle']);
const captureKey = 'hr-fieldwork:launch-source';

function readCampaign(tags) {
  const campaign = {};
  for (const key of campaignKeys) {
    if (typeof tags[key] !== 'string') continue;
    const value = tags[key].normalize('NFKC').trim();
    if (/^[\p{L}\p{N} _.,()+|\-]{1,80}$/u.test(value) && !/(?:[\w-]+\.)+[a-z]{2,}(?:\b|$)/iu.test(value)) {
      campaign[key] = value;
    }
  }
  return campaign;
}

function getLaunchSource(route) {
  const params = new URLSearchParams(window.location.search);
  const campaign = readCampaign(Object.fromEntries(campaignKeys.map(key => [key, params.get(key)])));
  const current = { landingRoute: route, campaign };
  try {
    // A new tagged arrival starts a fresh campaign. Untagged internal links keep the source.
    if (!Object.keys(campaign).length) {
      const saved = JSON.parse(window.sessionStorage.getItem(captureKey) || 'null');
      if (saved && kitRoutes.has(saved.landingRoute)) {
        return { landingRoute: saved.landingRoute, campaign: readCampaign(saved.campaign || {}) };
      }
    }
    window.sessionStorage.setItem(captureKey, JSON.stringify(current));
  } catch {
    // If the browser blocks storage, current-page attribution still works.
  }
  return current;
}

const currentPath = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
const currentRoute = kitRoutes.has(currentPath) ? currentPath : '/';
const launchSource = getLaunchSource(currentRoute);

for (const launchForm of document.querySelectorAll('.launch-form')) {
  if (!window.fetch || !window.FormData) continue;
  const submitButton = launchForm.querySelector('button[type="submit"]');
  const status = launchForm.querySelector('.signup-status');
  launchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;
    submitButton.disabled = true;
    status.textContent = 'Saving your email…';
    const fields = new FormData(launchForm);
    try {
      const response = await fetch(launchForm.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: fields.get('email'),
          website: fields.get('website'),
          signupRoute: currentRoute,
          ...launchSource
        })
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        status.textContent = result.error || 'We could not save your email. Please try again.';
        return;
      }
      launchForm.reset();
      status.textContent = 'You’re on the launch list. We’ll email you when the kits are available.';
    } catch {
      status.textContent = 'We could not confirm your signup. Please try again.';
      return;
    } finally {
      submitButton.disabled = false;
    }

    if (!window.dataLayer) window.dataLayer = [];
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: 'hr_fieldwork_launch_signup', signup_route: currentRoute });
    }
  });
}
