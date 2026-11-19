document.documentElement.classList.add("js");

const toggle = document.querySelector(".menutoggle");
const menu = document.getElementById("mastnav");
if (menu && toggle) {
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("open", open);
  }
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", () => setMenu(false));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.classList.contains("open")) {
      setMenu(false);
      toggle.focus();
    }
  });
}

// The animated underline follows the selected case. Without scripts, every file is readable.
const tablist = document.querySelector(".case-tabs");
if (tablist) {
  const tabs = [...tablist.querySelectorAll("a")];
  const cases = tabs.map(tab => document.querySelector(tab.hash));
  const activate = index => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      cases[i].hidden = !selected;
    });
    tablist.style.setProperty("--current", index);
  };
  const hashIndex = () => cases.findIndex(panel => "#" + panel.id === window.location.hash);
  tablist.setAttribute("role", "tablist");
  tabs.forEach((tab, i) => {
    tab.id = "tab-" + cases[i].id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", cases[i].id);
    cases[i].setAttribute("role", "tabpanel");
    cases[i].setAttribute("aria-labelledby", tab.id);
    cases[i].tabIndex = 0;
    tab.addEventListener("click", event => {
      event.preventDefault();
      activate(i);
    });
    tab.addEventListener("keydown", event => {
      const positions = {ArrowRight:(i+1)%tabs.length, ArrowLeft:(i+tabs.length-1)%tabs.length, Home:0, End:tabs.length-1};
      if (Object.hasOwn(positions, event.key)) {
        event.preventDefault();
        activate(positions[event.key]);
        tabs[positions[event.key]].focus();
      }
    });
  });
  activate(Math.max(0, hashIndex()));
  window.addEventListener("hashchange", () => {if (hashIndex() >= 0) activate(hashIndex());});
}

// A pointer controlled detail layer and a fixed lens for keyboard and touch.
const frame = document.getElementById("photo-frame");
if (frame) {
  const control = frame.querySelector(".magnifier");
  const label = control.querySelector("span:last-child");
  const fixedLens = () => control.getAttribute("aria-pressed") === "true";
  function setPosition(x, y) {
    frame.style.setProperty("--mx", x + "%");
    frame.style.setProperty("--my", y + "%");
  }
  const followPointer = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  frame.addEventListener("pointermove", event => {
    if (!followPointer.matches || fixedLens() || event.pointerType === "touch") return;
    if (control.contains(event.target)) {frame.classList.remove("is-zoomed"); return;}
    const bounds = frame.getBoundingClientRect();
    setPosition(100*(event.clientX-bounds.left)/bounds.width, 100*(event.clientY-bounds.top)/bounds.height);
    frame.classList.add("is-zoomed");
  });
  frame.addEventListener("pointerleave", () => {if(!fixedLens()) frame.classList.remove("is-zoomed");});
  control.addEventListener("click", () => {
    const enabled = !fixedLens();
    control.setAttribute("aria-pressed", String(enabled));
    control.setAttribute("aria-label", enabled ? "Close magnifier" : "Magnify payroll file");
    label.textContent = enabled ? "Close magnifier" : "Magnify file";
    setPosition(55,48);
    frame.classList.toggle("is-zoomed", enabled);
  });
}
