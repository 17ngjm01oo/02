import { renderTopNavigationLinks } from "./siteNavigation.js";
import { initializeIndicatorInfoTooltips } from "./indicatorInfoUi.js";

const rootHref = document.body.dataset.rootHref ?? "../../";

renderTopNavigationLinks({
  rootHref,
  currentRankingDirectory: document.body.dataset.rankingDirectory ?? "",
  currentScopeSlug: document.body.dataset.rankingScopeSlug ?? "world",
});
initializeIndicatorInfoTooltips();
