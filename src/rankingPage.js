import { countries } from "./countries.js";
import { filterCountriesByScope } from "./countryFilters.js";
import { isTerritory, markTerritoryElement } from "./countryTypes.js";
import { formatCompactDisplayValue, getSingleValueDisplayScale } from "./displayFormat.js";
import { createFlagImage } from "./flags.js";
import { initializeRankingFilters } from "./rankingFilters.js";
import { showRankingCount, showRankingLoading, showRankingLoadError } from "./rankingStatus.js";
import { initializeRankingSort } from "./rankingSort.js";
import { initializeTerritoryToggle } from "./territoryToggle.js";
import { appendRankingValueCells } from "./rankingValueBar.js";
import { initializeRankingYear } from "./rankingYear.js";
import { initializeIndicatorInfoTooltips } from "./indicatorInfoUi.js";
import {
  getLocalizedRootHref,
  getPageLocale,
  localeConfigs,
  formatCountryDisplayName,
  translate,
  translateCountryName,
  translateIndicatorLabel,
  translateScopeLabel,
} from "./localization.js";
import "./rankingTopNav.js";

const rankingConfig = getRankingConfigFromPage();

if (rankingConfig) {
  initializeRankingPage(rankingConfig);
}

function getRankingConfigFromPage() {
  const { dataset } = document.body;
  if (!dataset.rankingIndicatorCode || !dataset.rankingStaticDataPath) {
    return null;
  }

  try {
    return {
      logName: dataset.rankingDirectory ?? "ranking",
      indicatorCode: dataset.rankingIndicatorCode,
      staticDataPath: dataset.rankingStaticDataPath,
      rankingIndicatorLabel: dataset.rankingIndicatorLabel ?? "",
      countryPageKind: dataset.rankingCountryPageKind ?? "",
      hasCountryIndicatorPage: dataset.rankingHasCountryIndicatorPage !== "false",
      showWorldShare: dataset.rankingShowWorldShare === "true",
      displayScaleConfig: JSON.parse(dataset.rankingDisplayScaleConfig ?? "{}"),
    };
  } catch (error) {
    console.error("[Ranking] Invalid static ranking configuration.", error);
    return null;
  }
}

export function initializeRankingPage(config) {
  initializeLazyRankingCountrySearch(config);
  initializeIndicatorInfoTooltips();
  const pageTitle = document.querySelector("#ranking-title");

  const state = {
    allRankingRows: [],
    activeScope: null,
    sortOrder: "highest",
    showTerritories: true,
    selectedYear: null,
    rankingManifestUrl: null,
    rankingManifest: null,
    rankingDataByYear: new Map(),
    documentTitleSuffix: getDocumentTitleSuffix(document.title, pageTitle?.textContent),
    elements: {
      count: document.querySelector("#rankingCount"),
      pageTitle,
      tableBody: document.querySelector("#rankingTableBody"),
      worldShareValue: null,
    },
  };
  state.rankingIndicatorLabel = getRankingIndicatorLabel(config);

  state.sortOrder = initializeRankingSort({
    initialValue: state.sortOrder,
    onChange(sortOrder) {
      state.sortOrder = sortOrder;
      renderScopedRanking(config, state);
    },
  });

  initializeRanking(config, state).catch((error) => {
    console.error(`[Ranking] Failed to initialize ${config.logName} ranking.`, error);
    showRankingError(state);
  });
}

function initializeLazyRankingCountrySearch(config) {
  const searchInput = document.querySelector("#rankingCountrySearchInput");
  if (!searchInput) {
    return;
  }

  let initializationPromise = null;

  searchInput.addEventListener("focus", () => {
    initializationPromise ??= initializeRankingCountrySearch(config);
  }, { once: true });

  searchInput.addEventListener("input", () => {
    initializationPromise ??= initializeRankingCountrySearch(config);
  }, { once: true });
}

async function initializeRankingCountrySearch(config) {
  const { initializeCountrySelector } = await import("./countrySelector.js");
  const rootHref = document.body.dataset.rootHref ?? "../../";
  const localizedRootHref = getLocalizedRootHref(rootHref);
  const pagePathSegment = getCountryPagePathSegment(config);
  const searchInput = document.querySelector("#rankingCountrySearchInput");

  initializeCountrySelector({
    countryPool: countries.filter((country) => country.slug),
    placeholderKey: "ui.countrySearchPlaceholder",
    placeholder: "Search countries or territories",
    getCountryHref(country) {
      const indicatorPath = pagePathSegment ? `${pagePathSegment}/` : "";
      return `${localizedRootHref}countries/${country.slug}/${indicatorPath}`;
    },
    searchInputSelector: "#rankingCountrySearchInput",
    resultsSelector: "#rankingCountrySearchResults",
  });

  if (searchInput?.value.trim()) {
    searchInput.dispatchEvent(new Event("input"));
  }
}

function shouldShowWorldShare(config, scope = null) {
  return config.showWorldShare === true && !isWorldScope(scope);
}

function getRankingScopeFromBody() {
  const type = document.body.dataset.rankingScopeType;
  const id = document.body.dataset.rankingScopeId;

  if (!type || !id) {
    return null;
  }

  return { type, id };
}

function isWorldScope(scope) {
  return scope?.type === "world" || scope?.id === "WORLD";
}

function getCountryPagePathSegment(config) {
  if (config.hasCountryIndicatorPage === false) {
    return "";
  }

  return config.countryPageKind || document.body.dataset.rankingDirectory || "";
}

async function initializeRanking(config, state) {
  state.activeScope = initializeRankingFilters();
  ensureRankingSummary(config, state);

  if (!config.staticDataPath) {
    throw new Error(`staticDataPath is required for ${config.logName} ranking.`);
  }

  const rootHref = document.body.dataset.rootHref ?? "../../";
  state.rankingManifestUrl = new URL(`${rootHref}${config.staticDataPath}`, window.location.href);
  state.rankingManifest = await fetchJson(state.rankingManifestUrl, config.logName);

  const availableYears = getAvailableYears(state.rankingManifest, config.indicatorCode);
  state.selectedYear = availableYears[0] ?? null;

  if (!state.selectedYear) {
    throw new Error(`Static ${config.logName} ranking manifest has no years for ${config.indicatorCode}.`);
  }

  updateRankingPageTitle(state, state.activeScope);

  initializeRankingYear({
    years: availableYears,
    initialValue: state.selectedYear,
    onChange(year) {
      state.selectedYear = year;
      updateRankingPageTitle(state, state.activeScope);
      showRankingLoading({
        countElement: state.elements.count,
      });
      showRankingSummaryLoading(state);
      loadRankingYear(config, state, year).catch((error) => {
        console.error(`[Ranking] Failed to load ${config.logName} ranking for ${year}.`, error);
        if (year === state.selectedYear) {
          showRankingError(state);
        }
      });
    },
  });

  state.showTerritories = initializeTerritoryToggle({
    initialValue: state.showTerritories,
    onChange(showTerritories) {
      state.showTerritories = showTerritories;
      renderScopedRanking(config, state);
    },
  });

  await loadRankingYear(config, state, state.selectedYear, {
    preservePrerenderedTable: canPreservePrerenderedInitialTable(config, state),
  });
}

async function loadRankingYear(config, state, year, { preservePrerenderedTable = false } = {}) {
  const data = await getRankingYearData(config, state, year);

  if (year !== state.selectedYear) {
    return;
  }

  state.allRankingRows = buildRankingRows(data, config, year);
  renderScopedRanking(config, state, { preservePrerenderedTable });
}

function canPreservePrerenderedInitialTable(config, state) {
  return Boolean(
    state.sortOrder === "highest"
    && state.showTerritories
    && state.elements.tableBody?.querySelector("tr:not(.ranking-empty)")
    && getManifestInitialYearData(config, state, state.selectedYear)
  );
}

async function getRankingYearData(config, state, year) {
  if (!state.rankingDataByYear.has(year)) {
    const initialYearData = getManifestInitialYearData(config, state, year);
    if (initialYearData) {
      state.rankingDataByYear.set(year, initialYearData);
      return initialYearData;
    }

    const yearPathTemplate = state.rankingManifest?.yearPathTemplate;

    if (
      !yearPathTemplate
      || !yearPathTemplate.includes("{indicator}")
      || !yearPathTemplate.includes("{year}")
    ) {
      throw new Error(`Static ${config.logName} ranking manifest has no year path template.`);
    }

    const yearPath = yearPathTemplate
      .replace("{indicator}", encodeURIComponent(config.indicatorCode))
      .replace("{year}", year);
    const yearUrl = new URL(yearPath, state.rankingManifestUrl);
    const request = fetchJson(yearUrl, `${config.logName} ${year}`).catch((error) => {
      state.rankingDataByYear.delete(year);
      throw error;
    });
    state.rankingDataByYear.set(year, request);
  }

  return state.rankingDataByYear.get(year);
}

function getManifestInitialYearData(config, state, year) {
  const initialYearData = state.rankingManifest?.initialYearDataByIndicator?.[config.indicatorCode];
  return initialYearData && String(initialYearData.year) === String(year)
    ? initialYearData
    : null;
}

async function fetchJson(url, label) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Static ${label} data file request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function getAvailableYears(manifest, indicatorCode) {
  const years = manifest?.yearsByIndicator?.[indicatorCode];

  if (!Array.isArray(years)) {
    return [];
  }

  return years.map(String).sort((yearA, yearB) => Number(yearB) - Number(yearA));
}

function buildRankingRows(data, config, selectedYear) {
  const valuesByCountry = data?.indicatorId === config.indicatorCode ? data.valuesByCountry : null;

  if (!valuesByCountry || typeof valuesByCountry !== "object") {
    throw new Error(`Static ${config.logName} data file is missing ${config.indicatorCode} values.`);
  }

  return countries
    .map((country) => {
      const value = normalizeNumericValue(valuesByCountry[country.code]);

      if (!Number.isFinite(value)) {
        return null;
      }

      return {
        ...country,
        value,
        year: Number.parseInt(selectedYear, 10),
      };
    })
    .filter(Boolean)
    .sort((countryA, countryB) => countryB.value - countryA.value);
}

function renderScopedRanking(config, state, { preservePrerenderedTable = false } = {}) {
  const rankingRows = sortRankingRows(
    filterRankingRows(state.allRankingRows, state.activeScope, state.showTerritories),
    state.sortOrder,
  );
  updateRankingPageTitle(state, state.activeScope);
  if (!preservePrerenderedTable) {
    renderRankingTable(config, state, rankingRows);
  }
  renderRankingSummary(config, state, rankingRows);
  if (!preservePrerenderedTable) {
    updateRankingCount(state, rankingRows);
  }
}

function sortRankingRows(rankingRows, sortOrder) {
  const direction = sortOrder === "lowest" ? 1 : -1;
  return [...rankingRows].sort((countryA, countryB) => direction * (countryA.value - countryB.value));
}

function updateRankingPageTitle(state, scope) {
  if (!state.rankingIndicatorLabel) {
    return;
  }

  const title = getRankingPageTitle(state, scope);

  if (state.elements.pageTitle) {
    state.elements.pageTitle.textContent = title;
  }

  document.title = `${title}${state.documentTitleSuffix}`;
}

function getDocumentTitleSuffix(documentTitle, pageTitle) {
  const title = String(documentTitle ?? "");
  const pageTitleText = String(pageTitle ?? "");
  return title.startsWith(pageTitleText) ? title.slice(pageTitleText.length) : "";
}

function getRankingPageTitle(state, scope) {
  const localeConfig = localeConfigs[getPageLocale()] ?? {};
  const scopeLabel = scope?.type === "region"
    ? localeConfig.rankingTitleRegionForms?.[scope.label] ?? translateScopeLabel(scope)
    : translateScopeLabel(scope);
  const templateKey = ["world", "region", "category"].includes(scope?.type)
    ? scope.type
    : "category";
  const template = localeConfig.rankingTitleTemplates?.[templateKey]
    ?? (templateKey === "world"
      ? "{indicator} by Country ({year})"
      : "{indicator} by Country — {scope} ({year})");
  return formatRankingTitleTemplate(template, {
    indicator: state.rankingIndicatorLabel,
    scope: scopeLabel,
    year: state.selectedYear ?? "",
  });
}

function formatRankingTitleTemplate(template, values) {
  return String(template).replaceAll(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function filterRankingRows(rankingRows, scope, showTerritories) {
  return filterCountriesByScope(rankingRows, scope).filter((country) => showTerritories || !isTerritory(country));
}

function renderRankingTable(config, state, rankingRows) {
  const rankingTableBody = state.elements.tableBody;
  const rootHref = document.body.dataset.rootHref ?? "../../";
  const localizedRootHref = getLocalizedRootHref(rootHref);
  const valueBarScale = getValueBarScale(rankingRows);
  const pagePathSegment = getCountryPagePathSegment(config);

  if (!rankingTableBody) {
    return;
  }

  rankingTableBody.innerHTML = "";

  if (rankingRows.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "ranking-empty";
    cell.textContent = translate("ui.noData", "No data");
    row.append(cell);
    rankingTableBody.append(row);
    return;
  }

  const fragment = document.createDocumentFragment();

  rankingRows.forEach((country, index) => {
    const row = document.createElement("tr");
    markTerritoryElement(row, country);
    const rankCell = document.createElement("td");
    const flagCell = document.createElement("td");
    const countryCell = document.createElement("td");
    const valueCell = document.createElement("td");
    const barCell = document.createElement("td");
    const displayScale = getSingleValueDisplayScale(country.value, config.displayScaleConfig);

    rankCell.textContent = String(index + 1);
    flagCell.className = "ranking-flag";
    const flagImage = createFlagImage(country.code, { rootHref });
    if (flagImage) {
      flagCell.append(flagImage);
    }
    countryCell.className = "ranking-country";

    const countryLink = document.createElement("a");
    countryLink.dataset.uiTextAction = "";
    countryLink.href = `${localizedRootHref}countries/${country.slug}/`;
    const accessibleCountryName = formatCountryDisplayName(country, { form: "definite" });
    const countryAriaLabel = translate("ui.openCountryPageAria", "Open {country} country page", {
      country: accessibleCountryName,
    });
    countryLink.setAttribute("aria-label", countryAriaLabel);

    const countryLinkText = document.createElement("span");
    countryLinkText.textContent = translateCountryName(country);

    countryLink.append(countryLinkText);
    countryCell.append(countryLink);

    appendRankingValueCells(valueCell, barCell, {
      href: pagePathSegment ? `${localizedRootHref}countries/${country.slug}/${pagePathSegment}/` : "",
      text: formatCompactDisplayValue(country.value, displayScale),
      ariaLabel: translate("ui.openCountryIndicatorPageAria", "Open {country} {indicator} page", {
        country: accessibleCountryName,
        indicator: translateIndicatorLabel(config.rankingIndicatorLabel),
      }),
      value: country.value,
      valueBarScale,
    });

    row.append(rankCell, flagCell, countryCell, valueCell, barCell);
    fragment.append(row);
  });

  rankingTableBody.append(fragment);
}

function ensureRankingSummary(config, state) {
  const rankingCard = document.querySelector(".ranking-card");
  const rankingCardHeader = rankingCard?.querySelector(".ranking-card-header");
  const showWorldShare = shouldShowWorldShare(config, state.activeScope);

  if (!rankingCardHeader || !showWorldShare || state.elements.worldShareValue) {
    return;
  }

  const prerenderedWorldShare = rankingCardHeader.querySelector('[data-summary-key="world-share"]');
  if (prerenderedWorldShare) {
    state.elements.worldShareValue = prerenderedWorldShare;
    return;
  }

  const summary = document.createElement("p");
  summary.className = "ranking-summary ranking-count";
  summary.innerHTML = `
    <span data-summary-key="world-share-item">${translate("ui.worldShare", "World Share")}: <span data-summary-key="world-share">-</span></span>
  `;

  if (state.elements.count) {
    state.elements.count.after(summary);
  } else {
    rankingCardHeader.prepend(summary);
  }

  state.elements.worldShareValue = summary.querySelector('[data-summary-key="world-share"]');
}

function renderRankingSummary(config, state, rankingRows) {
  const worldShareElement = state.elements.worldShareValue;

  if (!worldShareElement || !shouldShowWorldShare(config, state.activeScope)) {
    return;
  }

  const visibleRows = rankingRows.filter((row) => !isTerritory(row));
  const worldRows = state.allRankingRows.filter((row) => !isTerritory(row));
  const visibleTotal = sumRankingValues(visibleRows, true);
  const worldTotal = sumRankingValues(worldRows, true);
  const worldShare = worldTotal > 0 ? (visibleTotal / worldTotal) * 100 : null;
  worldShareElement.textContent = formatRankingPercent(worldShare);
}

function showRankingSummaryLoading(state) {
  if (state.elements.worldShareValue) {
    state.elements.worldShareValue.textContent = translate("ui.loading", "Loading...");
  }
}

function getRankingIndicatorLabel(config) {
  return translateIndicatorLabel(config.rankingIndicatorLabel ?? "");
}

function getValueBarScale(rankingRows) {
  return rankingRows.reduce(
    (scale, row) => {
      if (!Number.isFinite(row.value)) {
        return scale;
      }

      if (row.value < 0) {
        scale.negativeMagnitude = Math.max(scale.negativeMagnitude, Math.abs(row.value));
      } else {
        scale.positiveMagnitude = Math.max(scale.positiveMagnitude, row.value);
      }

      return scale;
    },
    { negativeMagnitude: 0, positiveMagnitude: 0 },
  );
}

function updateRankingCount(state, rankingRows) {
  showRankingCount({
    countElement: state.elements.count,
    rankingRows,
  });
}

function showRankingError(state) {
  showRankingLoadError({
    countElement: state?.elements?.count ?? document.querySelector("#rankingCount"),
  });
  clearRankingSummary(state);

  const rankingTableBody = state?.elements?.tableBody ?? document.querySelector("#rankingTableBody");

  if (rankingTableBody) {
    rankingTableBody.innerHTML = "";
  }
}

function clearRankingSummary(state) {
  if (state?.elements?.worldShareValue) {
    state.elements.worldShareValue.textContent = "—";
  }
}

function normalizeNumericValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = Number.parseFloat(value.replaceAll(",", ""));
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

function sumRankingValues(rankingRows, useAbsoluteValues = false) {
  return rankingRows.reduce((total, row) => {
    if (!Number.isFinite(row.value)) {
      return total;
    }

    return total + (useAbsoluteValues ? Math.abs(row.value) : row.value);
  }, 0);
}

function formatRankingPercent(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `${new Intl.NumberFormat(localeConfigs[getPageLocale()]?.numberLocale ?? "en-US", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}
