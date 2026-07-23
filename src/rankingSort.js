import { getRankingControls } from "./rankingControls.js";
import { createUiDropdown, hydrateUiDropdown } from "./uiDropdown.js";
import { translate } from "./localization.js";

const sortOptions = [
  { value: "highest", label: translate("ui.highest", "Highest") },
  { value: "lowest", label: translate("ui.lowest", "Lowest") },
];

export function initializeRankingSort({ initialValue = "highest", onChange }) {
  const controls = getRankingControls();

  if (!controls) {
    return initialValue;
  }

  const dropdownConfig = {
    controlClassName: "ranking-filter",
    toggleClassName: "ranking-filter-toggle",
    optionClassName: "ranking-filter-option",
    optionDatasetName: "rankingOption",
    toggleText: () => translate("ui.sortBy", "Sort by"),
    toggleAriaLabel: "Choose ranking sort order",
    menuAriaLabel: "Ranking sort order",
    options: sortOptions,
    initialValue,
    onChange,
    outsideClickIgnoreSelector: '[data-ranking-control="territories"]',
  };
  const existingControl = controls.querySelector('[data-ranking-control="sort"]');
  const sortControl = existingControl ? hydrateUiDropdown(existingControl, dropdownConfig) : null;

  if (!sortControl) {
    existingControl?.remove();
    controls.append(createUiDropdown(dropdownConfig));
  }

  return initialValue;
}
