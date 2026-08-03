import { getRankingControls } from "./rankingControls.js";
import { translate } from "./localization.js";

export function initializeTerritoryToggle({
  initialValue = true,
  onChange,
  container = getRankingControls(),
  ariaContext = "ranking",
} = {}) {
  const controls = container;

  if (!controls) {
    return initialValue;
  }

  const button = controls.querySelector('[data-ranking-control="territories"]') ?? document.createElement("button");
  const isExistingButton = button.parentElement === controls;
  button.classList.add("territory-toggle");
  button.type = "button";

  button.addEventListener("click", () => {
    const nextValue = button.getAttribute("aria-pressed") !== "true";
    updateButton(button, nextValue, ariaContext);
    onChange?.(nextValue);
  });

  updateButton(button, initialValue, ariaContext);
  if (!isExistingButton) {
    controls.append(button);
  }
  return initialValue;
}

function updateButton(button, isEnabled, ariaContext) {
  button.setAttribute("aria-pressed", String(isEnabled));
  const resolvedAriaContext = button.dataset.territoryContext || ariaContext;
  const action = isEnabled
    ? translate("ui.hideTerritories", button.dataset.hideTerritoriesLabel || "Hide")
    : translate("ui.showTerritories", button.dataset.showTerritoriesLabel || "Show");
  button.setAttribute("aria-label", translate(
    "ui.toggleTerritoriesAria",
    button.dataset.toggleTerritoriesAria || "{action} territories in {context}",
    {
      action,
      context: resolvedAriaContext,
    },
  ));
  button.textContent = translate(
    "ui.territories",
    button.dataset.territoriesLabel || button.textContent.trim() || "Territories",
  );
}
