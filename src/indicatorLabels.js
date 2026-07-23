import { createIndicatorInfoButton } from "./indicatorInfoUi.js";
import { translateExactText, translateIndicatorLabel } from "./localization.js";

export function getIndicatorDisplayParts(seriesConfig, { label, currencyCode } = {}) {
  const displayLabel = translateIndicatorLabel(label ?? seriesConfig.titleTemplate ?? "");
  const unit = formatConfiguredDisplayUnit(seriesConfig.displayUnit, currencyCode);

  return {
    label: displayLabel,
    unit,
  };
}

export function getIndicatorDisplayText(seriesConfig, options = {}) {
  const { label, unit } = getIndicatorDisplayParts(seriesConfig, options);
  return unit ? `${label} ${unit}` : label;
}

export function renderIndicatorLabel(target, seriesConfig, options = {}) {
  const { label, unit, tooltipPlacement } = {
    ...getIndicatorDisplayParts(seriesConfig, options),
    tooltipPlacement: options.tooltipPlacement ?? "country-indicator",
  };
  target.textContent = "";

  const wrapper = document.createElement("span");
  wrapper.className = "indicator-label-cell";

  const labelElement = document.createElement("span");
  labelElement.className = "indicator-label-text";
  labelElement.textContent = label;
  wrapper.append(labelElement, document.createTextNode(" "));

  const metaElement = document.createElement("span");
  metaElement.className = "indicator-label-meta";

  if (unit) {
    const unitElement = document.createElement("span");
    unitElement.className = "indicator-display-unit";
    unitElement.textContent = `(${unit})`;
    metaElement.append(unitElement);
  }

  metaElement.append(createIndicatorInfoButton({
    seriesId: seriesConfig.id,
    label,
    tooltipPlacement,
  }));
  wrapper.append(metaElement);
  target.append(wrapper);
}

function formatConfiguredDisplayUnit(unit, currencyCode) {
  if (!unit) {
    return "";
  }

  if (unit === "Local currency" && currencyCode) {
    return `${translateExactText(unit)} - ${currencyCode}`;
  }

  return translateExactText(unit);
}
