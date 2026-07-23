export function appendRankingValueCells(valueCell, barCell, { href, text, ariaLabel, value, valueBarScale }) {
  const valueElement = href ? document.createElement("a") : document.createElement("span");

  if (href) {
    valueElement.dataset.uiTextAction = "";
    valueElement.href = href;
    valueElement.setAttribute("aria-label", ariaLabel);
  }

  const valueText = document.createElement("span");
  valueText.textContent = text;

  valueElement.append(valueText);

  valueElement.className = href ? "ranking-value" : "ranking-value ranking-value-static";
  valueCell.append(valueElement);

  const track = document.createElement("div");
  track.className = "ranking-value-bar";
  track.dataset.valueSign = value < 0 ? "negative" : "positive";
  track.setAttribute("aria-hidden", "true");

  const fill = document.createElement("span");
  fill.style.width = `${getValuePercentage(value, valueBarScale)}%`;

  track.append(fill);
  barCell.append(track);
}

function getValuePercentage(value, valueBarScale) {
  const topMagnitude = getTopMagnitudeForSign(value, valueBarScale);

  if (!Number.isFinite(value) || topMagnitude <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (Math.abs(value) / topMagnitude) * 100));
}

function getTopMagnitudeForSign(value, valueBarScale) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return valueBarScale?.negativeMagnitude ?? 0;
  }

  return valueBarScale?.positiveMagnitude ?? 0;
}
