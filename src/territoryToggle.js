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
  const action = isEnabled
    ? translate("ui.hideTerritories", "Hide")
    : translate("ui.showTerritories", "Show");
  button.setAttribute("aria-label", translate("ui.toggleTerritoriesAria", "{action} territories in {context}", {
    action,
    context: ariaContext,
  }));
  button.textContent = translate("ui.territories", "Territories");
}
