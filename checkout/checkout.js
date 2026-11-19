(() => {
  const query = new URLSearchParams(window.location.search);
  const kitForm = document.getElementById("kit-form");
  if (kitForm) {
    const availability = document.getElementById("checkout-availability");
    const fieldset = document.getElementById("test-purchase");
    const radios = [...kitForm.elements.sku];
    const requested = query.get("kit");
    const preferred = radios.find(radio => radio.value === requested);
    if (preferred) preferred.checked = true;

    async function checkAvailability() {
      try {
        const response = await fetch("/api/checkout", { cache: "no-store" });
        if (!response.ok) throw new Error("Unavailable");
        const result = await response.json();
        const available = result.available === true && Array.isArray(result.kits) ? result.kits : [];
        const usable = radios.filter(radio => available.includes(radio.value));
        if (!usable.length) throw new Error("No available kits");

        for (const radio of radios) {
          radio.disabled = !available.includes(radio.value);
          if (radio.disabled) radio.checked = false;
        }
        if (!preferred && !usable.some(radio => radio.checked)) usable[0].checked = true;
        fieldset.disabled = false;
        availability.textContent = preferred?.disabled
          ? "This kit is unavailable in the test checkout. Choose an available kit to continue."
          : usable.length === radios.length ? "Test checkout is available." : "Some kits are unavailable in the test checkout.";
      } catch {
        availability.textContent = "Test checkout is unavailable. You can still download the free payroll sample below.";
      }
    }
    checkAvailability();
    return;
  }

  const downloadForm = document.getElementById("download-form");
  if (!downloadForm) return;
  const supplied = query.has("session_id");
  const reference = supplied ? query.get("session_id") : window.history.state?.fieldworkTestSession;
  const valid = typeof reference === "string" && /^cs_test_[a-zA-Z0-9]{1,200}$/.test(reference);
  if (supplied) {
    const state = valid ? { fieldworkTestSession: reference } : null;
    window.history.replaceState(state, "", window.location.pathname);
  }
  if (!valid) return;

  downloadForm.elements.session_id.value = reference;
  document.getElementById("session-status").textContent =
    "When you download, we’ll verify your test payment and send the sample ZIP for the kit you selected.";
  downloadForm.hidden = false;
})();
