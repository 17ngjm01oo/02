export function initializeHomeDisclosures() {
  document.querySelectorAll("[data-home-disclosure-toggle]").forEach((button) => {
    const target = document.getElementById(button.dataset.homeDisclosureTarget);
    const items = target?.querySelectorAll(":scope > [data-home-disclosure-item]") ?? [];
    if (!items.length) {
      button.hidden = true;
      return;
    }

    const setExpanded = (expanded) => {
      items.forEach((item) => {
        item.hidden = !expanded;
      });
      button.setAttribute("aria-expanded", String(expanded));
      const label = expanded ? button.dataset.collapseLabel : button.dataset.expandLabel;
      if (label) {
        button.textContent = label;
      }
    };

    setExpanded(button.getAttribute("aria-expanded") === "true");
    button.addEventListener("click", () => {
      setExpanded(button.getAttribute("aria-expanded") !== "true");
    });
  });
}
