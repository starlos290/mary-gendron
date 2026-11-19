document.documentElement.classList.add("js");
const toggle = document.querySelector(".navtoggle");
const nav = document.getElementById("mainnav");
function setNav(open) {
  nav.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}
if (nav && toggle) {
  toggle.addEventListener("click", () => setNav(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", () => setNav(false));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setNav(false); toggle.focus();
    }
  });
}
const exampleTabs = document.querySelector(".exampletabs");
if (exampleTabs) {
  const tabs = [...exampleTabs.querySelectorAll("a")];
  const panels = tabs.map(tab => document.querySelector(tab.hash));
  const activate = index => {
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  };
  exampleTabs.setAttribute("role", "tablist");
  tabs.forEach((tab, i) => {
    tab.id = "tab-" + panels[i].id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[i].id);
    panels[i].setAttribute("role", "tabpanel");
    panels[i].setAttribute("aria-labelledby", tab.id);
    panels[i].tabIndex = 0;
    tab.addEventListener("click", event => { event.preventDefault(); activate(i); });
    tab.addEventListener("keydown", event => {
      const next = {ArrowRight:(i+1)%tabs.length,ArrowLeft:(i+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[event.key];
      if (next !== undefined) { event.preventDefault(); activate(next); tabs[next].focus(); }
    });
  });
  const indexForHash = () => panels.findIndex(panel => "#" + panel.id === window.location.hash);
  activate(Math.max(0, indexForHash()));
  window.addEventListener("hashchange", () => { const i = indexForHash(); if (i >= 0) activate(i); });
}
