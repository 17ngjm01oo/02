import { seriesConfigs } from "./config.js";
import { createIndicatorInfoButton } from "./indicatorInfoUi.js";
import { getLocalizedRootHref, translateExactText, translateIndicatorLabel } from "./localization.js";

const seriesConfigById = new Map(seriesConfigs.map((config) => [config.id, config]));
const countryRankingsBasePath = "rankings/countries";

export function renderRankingLinks(
  nav,
  rankings,
  {
    rootHref = "./",
    currentPageKind = "",
    currentRankingDirectory = "",
    currentScopeSlug = "world",
    highlightCurrent = true,
    replace = true,
    useDisplayUnitLabels = false,
  } = {},
) {
  if (!nav) {
    return;
  }

  if (replace) {
    nav.innerHTML = "";
  }

  const localizedRootHref = getLocalizedRootHref(rootHref);

  rankings.filter((ranking) => !ranking.hideFromRankingHub).forEach((ranking) => {
    if (useDisplayUnitLabels) {
      nav.append(createRankingHubLink(ranking, {
        rootHref: localizedRootHref,
        currentScopeSlug,
        currentPageKind,
        currentRankingDirectory,
        highlightCurrent,
      }));
      return;
    }

    const link = document.createElement("a");
    link.className = "navigation-control";
    link.dataset.uiTextAction = "";
    link.href = `${localizedRootHref}${countryRankingsBasePath}/${ranking.directory}/${currentScopeSlug}/`;
    link.textContent = translateIndicatorLabel(ranking.label);

    if (highlightCurrent && isCurrentRankingLink(ranking, { currentPageKind, currentRankingDirectory })) {
      link.classList.add("is-current");
      link.setAttribute("aria-current", "page");
    }

    nav.append(link);
  });
}

function createRankingHubLink(
  ranking,
  { rootHref, currentScopeSlug, currentPageKind, currentRankingDirectory, highlightCurrent },
) {
  const row = document.createElement("span");
  const link = document.createElement("a");
  link.className = "navigation-control";
  link.dataset.uiTextAction = "";
  const seriesConfig = seriesConfigById.get(ranking.seriesId);
  const displayUnit = seriesConfig?.displayUnit ?? "";

  row.className = "rankings-hub-link-row";
  link.href = `${rootHref}${countryRankingsBasePath}/${ranking.directory}/${currentScopeSlug}/`;
  link.textContent = translateIndicatorLabel(seriesConfig?.titleTemplate ?? ranking.label);

  if (highlightCurrent && isCurrentRankingLink(ranking, { currentPageKind, currentRankingDirectory })) {
    link.classList.add("is-current");
    link.setAttribute("aria-current", "page");
  }

  if (displayUnit) {
    link.append(document.createTextNode(" "));
    const unitElement = document.createElement("span");
    unitElement.className = "indicator-display-unit";
    unitElement.textContent = `(${translateExactText(displayUnit)})`;
    link.append(unitElement);
  }

  row.append(link, createIndicatorInfoButton({
    rankingDirectory: ranking.directory,
    label: translateIndicatorLabel(ranking.label),
    tooltipPlacement: "rankings-hub",
  }));
  return row;
}

function isCurrentRankingLink(ranking, { currentPageKind, currentRankingDirectory }) {
  if (ranking.directory === currentRankingDirectory) {
    return true;
  }

  if (!currentPageKind) {
    return false;
  }

  return ranking.countryPageKind === currentPageKind;
}

export function getCountryIndicatorLinks(rankings) {
  const linksByPageKind = new Map();

  rankings
    .filter((ranking) => ranking.countryPageKind)
    .forEach((ranking) => {
      if (linksByPageKind.has(ranking.countryPageKind)) {
        return;
      }

      linksByPageKind.set(ranking.countryPageKind, {
        pageKind: ranking.countryPageKind,
        href: `../${ranking.countryPageKind}/`,
        label: ranking.relatedIndicatorLabel ?? ranking.countryPageLabel ?? ranking.label,
      });
    });

  return Array.from(linksByPageKind.values());
}
