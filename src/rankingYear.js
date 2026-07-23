import { getRankingControls } from "./rankingControls.js";
import { createUiDropdown, hydrateUiDropdown } from "./uiDropdown.js";

export function initializeRankingYear({ years, initialValue, onChange }) {
  const controls = getRankingControls();

  if (!controls || years.length === 0) {
    return initialValue;
  }

  const dropdownConfig = {
    controlClassName: "ranking-filter",
    toggleClassName: "ranking-filter-toggle",
    menuClassName: "ranking-year-menu",
    optionClassName: "ranking-filter-option",
    optionDatasetName: "rankingOption",
    toggleText: (year) => String(year),
    toggleAriaLabel: "Choose ranking year",
    menuAriaLabel: "Ranking year",
    options: years.map((year) => ({ value: String(year), label: String(year) })),
    initialValue: String(initialValue),
    onChange,
    outsideClickIgnoreSelector: '[data-ranking-control="territories"]',
  };
  const existingControl = controls.querySelector('[data-ranking-control="year"]');
  const yearControl = existingControl ? hydrateUiDropdown(existingControl, dropdownConfig) : null;

  if (!yearControl) {
    existingControl?.remove();
    controls.append(createUiDropdown(dropdownConfig));
  }
  return String(initialValue);
}
