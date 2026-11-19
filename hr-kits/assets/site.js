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

const launchForm = document.querySelector('.launch-form');
if (launchForm && window.fetch && window.FormData) {
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
        body: JSON.stringify({ email: fields.get('email'), website: fields.get('website') })
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
    } finally {
      submitButton.disabled = false;
    }
  });
}
