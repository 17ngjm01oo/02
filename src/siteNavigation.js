import { rankingCategories } from "./rankingCategories.js";
import { renderRankingLinks } from "./rankingLinks.js";

export function renderTopNavigationLinks({
  rootHref = "./",
  currentRankingDirectory = "",
  currentScopeSlug = "world",
  currentPageKind = "",
  highlightCurrent = true,
  preserveExistingRankingLinks = false,
  useDisplayUnitLabels = false,
} = {}) {
  rankingCategories.forEach(({ navSelector, rankings }) => {
    const nav = document.querySelector(navSelector);
    if (preserveExistingRankingLinks && nav?.hasChildNodes()) {
      return;
    }

    renderRankingLinks(nav, rankings, {
      rootHref,
      currentRankingDirectory,
      currentScopeSlug,
      currentPageKind,
      highlightCurrent,
      useDisplayUnitLabels,
    });
  });
}
