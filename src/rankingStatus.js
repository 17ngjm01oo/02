import { renderEntityCountSummary } from "./entityCountSummary.js";
import { translate } from "./localization.js";

export function showRankingCount({
  countElement,
  rankingRows,
}) {
  if (countElement) {
    renderEntityCountSummary(countElement, rankingRows);
    countElement.classList.remove("is-error");
  }
}

export function showRankingLoading({ countElement }) {
  if (countElement) {
    countElement.textContent = translate("ui.loading", "Loading...");
    countElement.classList.remove("is-error");
  }
}

export function showRankingLoadError({ countElement }) {
  if (countElement) {
    countElement.textContent = translate("ui.failedToLoadData", "Failed to load data.");
    countElement.classList.add("is-error");
  }
}
