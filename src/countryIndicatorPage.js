import { seriesConfigs } from "./config.js";
import { scrollToCountryIndicatorHash } from "./countryIndicatorAnchors.js";
import { countries } from "./countries.js";
import {
  filterCountries,
  formatCountryMetaText,
  initializeCountrySelector,
  initializeSearchResultKeyboard,
} from "./countrySelector.js";
import { getCurrencyCode } from "./currencyCodes.js";
import { createFlagImage } from "./flags.js";
import { getIndicatorDisplayText, renderIndicatorLabel } from "./indicatorLabels.js";
import { initializeIndicatorInfoTooltips } from "./indicatorInfoUi.js";
import { buildStaticDataRequestUrls, fetchStaticData } from "./staticData.js";
import { hasSeriesDataInRange } from "./seriesData.js";
import { transformSeriesData } from "./transform.js";
import { clearLineChart, loadChartJs, renderLineChart } from "./chart.js";
import { formatCompactDisplayValue, getDisplayScale } from "./displayFormat.js";
import { comparisonTableTwoColumnQuery } from "./responsive.js";
import {
  getLocalizedRootHref,
  getPageLocale,
  translate,
  translateCountryName,
  translateExactText,
} from "./localization.js";

const rootHref = document.body.dataset.rootHref ?? "../../../";
const localizedRootHref = getLocalizedRootHref(rootHref);

const pageKind = document.body.dataset.pageKind ?? "";
const pageSeriesIds = (document.body.dataset.countryPageSeriesIds ?? "")
  .split(",")
  .filter(Boolean);
const pageLogPrefix = `${pageKind || "Country indicator"} page`;
const seriesConfigById = new Map(seriesConfigs.map((config) => [config.id, config]));
const pageSeriesConfigs = pageSeriesIds
  .map((seriesId) => seriesConfigById.get(seriesId))
  .filter(Boolean);
const countryCode = document.body.dataset.countryCode;
const selectedCountry = countries.find((country) => country.code === countryCode);
const seriesRuntimeState = new Map();

initializePage().catch((error) => {
  console.error(`[${pageLogPrefix}] Failed to initialize page.`, error);
  showPageError();
});

async function initializePage() {
  if (!selectedCountry) {
    throw new Error(`Country code was not found: ${countryCode}`);
  }
  if (!pageKind || pageSeriesConfigs.length !== pageSeriesIds.length || pageSeriesConfigs.length === 0) {
    throw new Error(`Invalid country indicator page definition: ${pageKind}`);
  }

  initializeCountrySelector({
    selectedCountry,
    placeholderKey: "ui.searchAnotherCountryPlaceholder",
    placeholder: "Search another country or territory",
    onSelect(country) {
      navigateToCountry(country);
    },
  });

  const countrySeriesConfigs = pageSeriesConfigs.map((seriesConfig) =>
    buildCountrySeriesConfig(seriesConfig, selectedCountry),
  );
  const visibleSeriesConfigs = countrySeriesConfigs.filter(shouldShowSeriesConfig);

  updateSeriesVisibility(countrySeriesConfigs);
  updateSeriesHeadings(visibleSeriesConfigs);
  initializeIndicatorInfoTooltips();
  initializeCompareSearches(visibleSeriesConfigs);
  initializeComparisonTableLayoutListener();

  await Promise.all(visibleSeriesConfigs.map((seriesConfig) => loadAndRenderSeries(seriesConfig)));
  scrollToCountryIndicatorHash();
}

function navigateToCountry(country) {
  window.location.href = `${localizedRootHref}countries/${country.slug}/${pageKind}/`;
}

function buildCountrySeriesConfig(seriesConfig, country) {
  const currencyCode = seriesConfig.usesCountryCurrency
    ? getCurrencyCode(country.code)
    : seriesConfig.currencyCode;

  return {
    ...seriesConfig,
    staticDataPath: getCountryPageStaticDataPath(seriesConfig),
    countryCode: country.code,
    countryName: translateCountryName(country),
    chartTitle: getSeriesChartTitle(seriesConfig, currencyCode),
    chartTitleCurrencyCode: currencyCode,
  };
}

function getCountryPageStaticDataPath(seriesConfig) {
  if (!seriesConfig.staticDataPath) {
    throw new Error(`staticDataPath is required for ${seriesConfig.id}.`);
  }

  return `${rootHref}${seriesConfig.staticDataPath.replace(/^\.\//, "")}`;
}

function getSeriesChartTitle(seriesConfig, currencyCode) {
  return getIndicatorDisplayText(seriesConfig, { currencyCode });
}

function updateSeriesHeadings(countrySeriesConfigs) {
  countrySeriesConfigs.forEach((seriesConfig) => {
    const titleElement = document.querySelector(`#${seriesConfig.id}-title`);
    const canvas = document.querySelector(`#${seriesConfig.canvasId}`);

    if (titleElement) {
      renderIndicatorLabel(titleElement, seriesConfig, {
        currencyCode: seriesConfig.chartTitleCurrencyCode,
        tooltipPlacement: "country-indicator",
      });
    }

    if (canvas) {
      canvas.setAttribute("aria-label", `${seriesConfig.countryName} ${translate("ui.lineChart", "{label} line chart", {
        label: seriesConfig.chartTitle,
      })}`);
    }
  });
}

function updateSeriesVisibility(countrySeriesConfigs) {
  countrySeriesConfigs.forEach((seriesConfig) => {
    const titleElement = document.querySelector(`#${seriesConfig.id}-title`);
    const indicatorBlock = titleElement?.closest(".indicator-block");

    if (indicatorBlock) {
      indicatorBlock.hidden = !shouldShowSeriesConfig(seriesConfig);
    }
  });
}

function shouldShowSeriesConfig(seriesConfig) {
  return !(isNominalLocalCurrencySeries(seriesConfig) && seriesConfig.currencyCode === "USD");
}

function isNominalLocalCurrencySeries(seriesConfig) {
  return seriesConfig.id === "gdpNational" || seriesConfig.id === "gdpNationalPerCapita";
}

function initializeCompareSearches(countrySeriesConfigs) {
  countrySeriesConfigs
    .filter((seriesConfig) => getCompareElements(seriesConfig.id).input)
    .forEach((seriesConfig) => {
      seriesRuntimeState.set(seriesConfig.id, {
        baseConfig: pageSeriesConfigs.find((pageSeriesConfig) => pageSeriesConfig.id === seriesConfig.id),
        mainConfig: seriesConfig,
        seriesData: null,
        mainPoints: [],
        comparisonCountry: null,
        comparisonRequestId: 0,
        comparisonMatches: [],
        comparisonPoints: [],
        comparisonSearchKeyboard: null,
        hasMainData: false,
      });

      const { input, results } = getCompareElements(seriesConfig.id);
      const state = seriesRuntimeState.get(seriesConfig.id);

      if (!input || !results || !state) {
        return;
      }

      state.comparisonSearchKeyboard = initializeSearchResultKeyboard({
        input,
        resultsElement: results,
        getItemCount() {
          return state.comparisonMatches.length;
        },
        getItemAtIndex(index) {
          return state.comparisonMatches[index];
        },
        onHighlightChange(highlightedIndex) {
          syncHighlightedCompareCountry(seriesConfig.id, highlightedIndex);
        },
        onSelect(country) {
          selectComparisonCountry(seriesConfig.id, country);
        },
        onEscape() {
          hideCompareResults(seriesConfig.id);
        },
      });

      input.addEventListener("input", () => {
        renderCompareResults(seriesConfig.id, input.value);
      });

      input.addEventListener("focus", () => {
        if (input.value.trim()) {
          renderCompareResults(seriesConfig.id, input.value);
        }
      });

      updateCompareAvailability(seriesConfig.id);
    });
}

function initializeComparisonTableLayoutListener() {
  const mediaQuery = window.matchMedia?.(comparisonTableTwoColumnQuery);
  if (!mediaQuery) {
    return;
  }

  const rerenderComparisonTables = () => {
    seriesRuntimeState.forEach((state) => {
      if (!state.mainConfig || !state.comparisonCountry || !state.mainPoints.length || !state.comparisonPoints.length) {
        return;
      }

      renderDataTable(state.mainPoints, state.mainConfig, {
        comparisonPoints: state.comparisonPoints,
        comparisonCountry: state.comparisonCountry,
      });
    });
  };

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", rerenderComparisonTables);
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(rerenderComparisonTables);
  }
}

async function loadAndRenderSeries(seriesConfig) {
  const chartCard = document.querySelector(`#${seriesConfig.chartCardId}`);
  const overlayElement = document.querySelector(`#${seriesConfig.overlayId}`);
  const canvas = document.querySelector(`#${seriesConfig.canvasId}`);

  try {
    showChartOverlay({
      chartCard,
      overlayElement,
      message: translate("ui.loading", "Loading..."),
      state: "loading",
    });
    clearDataTable(seriesConfig);

    const requestUrls = buildStaticDataRequestUrls(seriesConfig);
    console.info(`[${pageLogPrefix}] ${seriesConfig.indicatorCode} static data file:`, requestUrls.appUrl);

    const { data, url } = await fetchStaticData(seriesConfig);
    updateSeriesSourceOverrideNotes(data, seriesConfig);
    const points = transformSeriesData(data, seriesConfig);
    const state = seriesRuntimeState.get(seriesConfig.id);

    if (points.length === 0) {
      clearLineChart(canvas);
      renderNoDataTable(seriesConfig);
      if (state) {
        state.seriesData = null;
        state.mainPoints = [];
        state.hasMainData = false;
        updateCompareAvailability(seriesConfig.id);
      }
      showChartOverlay({
        chartCard,
        overlayElement,
        message: translate("ui.noData", "No data"),
        state: "no-data",
      });
      console.info(`[${pageLogPrefix}] No ${seriesConfig.indicatorCode} data points were found.`, {
        url,
        countryCode: seriesConfig.countryCode,
      });
      return;
    }

    await renderSeriesChart(canvas, {
      points,
      config: seriesConfig,
    });
    if (state) {
      state.seriesData = data;
      state.mainPoints = points;
      state.hasMainData = true;
      updateCompareAvailability(seriesConfig.id);
    }
    renderDataTable(points, seriesConfig);
    hideChartOverlay(chartCard, overlayElement);
  } catch (error) {
    clearLineChart(canvas);
    renderNoDataTable(seriesConfig);
    const state = seriesRuntimeState.get(seriesConfig.id);
    if (state) {
      state.seriesData = null;
      state.mainPoints = [];
      state.hasMainData = false;
      updateCompareAvailability(seriesConfig.id);
    }
    showChartOverlay({
      chartCard,
      overlayElement,
      message: translate("ui.failedToLoadData", "Failed to load data."),
      state: "error",
    });
    console.error(`[${pageLogPrefix}] Failed to load series.`, {
      seriesConfig,
      error,
    });
  }
}

function renderCompareResults(seriesId, query) {
  const state = seriesRuntimeState.get(seriesId);
  const { input, results } = getCompareElements(seriesId);

  if (!state || !results || !state.hasMainData || input?.disabled) {
    hideCompareResults(seriesId);
    return;
  }

  const normalizedQuery = query.trim();
  results.innerHTML = "";

  if (!normalizedQuery) {
    hideCompareResults(seriesId);
    return;
  }

  placeCompareResultsElement(seriesId, "search");

  const matchingCountries = filterCountries(normalizedQuery).filter((country) => {
    return country.code !== selectedCountry.code && canCompareCountry(state, country);
  });

  results.hidden = false;
  input?.setAttribute("aria-expanded", "true");
  state.comparisonMatches = matchingCountries;
  state.comparisonSearchKeyboard?.handleResultsRendered({ sync: false });

  if (matchingCountries.length === 0) {
    const emptyElement = document.createElement("div");
    emptyElement.className = "country-result-empty";
    emptyElement.textContent = translate("ui.noMatches", "No matches found.");
    results.append(emptyElement);
    state.comparisonSearchKeyboard?.handleResultsRendered();
    return;
  }

  const highlightedIndex = state.comparisonSearchKeyboard?.getHighlightedIndex() ?? -1;

  matchingCountries.forEach((country, index) => {
    const resultButton = document.createElement("button");
    resultButton.className = "country-result";
    resultButton.type = "button";
    resultButton.setAttribute("role", "option");
    resultButton.id = `${seriesId}-compare-result-${country.code}`;
    resultButton.dataset.countryCode = country.code;
    resultButton.setAttribute("aria-selected", String(index === highlightedIndex));
    resultButton.addEventListener("click", () => {
      selectComparisonCountry(seriesId, country);
    });

    const nameElement = document.createElement("span");
    nameElement.className = "country-result-name";
    nameElement.textContent = translateCountryName(country);

    const metaElement = document.createElement("span");
    metaElement.className = "country-result-meta";
    metaElement.textContent = formatCountryMetaText(country);

    resultButton.append(nameElement, metaElement);
    results.append(resultButton);
  });

  syncHighlightedCompareCountry(seriesId, highlightedIndex);
}

function canCompareCountry(state, country) {
  if (!state?.seriesData || !state.baseConfig) {
    return false;
  }

  return hasSeriesDataInRange(state.seriesData, buildCountrySeriesConfig(state.baseConfig, country));
}

function syncHighlightedCompareCountry(seriesId, highlightedIndex = -1) {
  const state = seriesRuntimeState.get(seriesId);
  const { input, results } = getCompareElements(seriesId);

  if (!state || !results) {
    return;
  }

  const resultButtons = Array.from(results.querySelectorAll(".country-result"));

  resultButtons.forEach((button, index) => {
    const isHighlighted = index === highlightedIndex;
    button.classList.toggle("is-highlighted", isHighlighted);
    button.setAttribute("aria-selected", String(isHighlighted));

    if (isHighlighted) {
      button.scrollIntoView({ block: "nearest" });
    }
  });

  const highlightedButton = resultButtons[highlightedIndex];

  if (input && highlightedButton) {
    input.setAttribute("aria-activedescendant", highlightedButton.id);
  } else if (input) {
    input.removeAttribute("aria-activedescendant");
  }
}

function selectComparisonCountry(seriesId, country) {
  const state = seriesRuntimeState.get(seriesId);
  const { input } = getCompareElements(seriesId);

  if (!state) {
    return;
  }

  state.comparisonCountry = country;
  state.comparisonRequestId += 1;

  if (input) {
    input.value = "";
  }

  hideCompareResults(seriesId);
  updateCompareSelectionUi(seriesId);
  loadComparisonSeries(seriesId, state.comparisonRequestId).catch((error) => {
    updateCompareSelectionUi(seriesId, translate("ui.failedToLoadData", "Failed to load data."));
    renderMainSeriesOnly(seriesId);
    console.error(`[${pageLogPrefix}] Failed to load comparison series.`, {
      seriesId,
      country,
      error,
    });
  });
}

async function loadComparisonSeries(seriesId, requestId) {
  const state = seriesRuntimeState.get(seriesId);

  if (!state?.comparisonCountry || !state.baseConfig || !state.mainConfig || !state.seriesData) {
    return;
  }

  const comparisonConfig = buildCountrySeriesConfig(state.baseConfig, state.comparisonCountry);
  const comparisonPoints = transformSeriesData(state.seriesData, comparisonConfig);

  if (requestId !== state.comparisonRequestId) {
    return;
  }

  state.comparisonPoints = comparisonPoints;
  const canvas = document.querySelector(`#${state.mainConfig.canvasId}`);
  await loadChartJs();

  if (requestId !== state.comparisonRequestId) {
    return;
  }

  renderLineChart(canvas, {
    points: state.mainPoints,
    config: state.mainConfig,
    comparison: {
      countryName: translateCountryName(state.comparisonCountry),
      points: comparisonPoints,
    },
  });
  renderDataTable(state.mainPoints, state.mainConfig, {
    comparisonPoints,
    comparisonCountry: state.comparisonCountry,
  });
  updateCompareSelectionUi(seriesId);
}

function clearComparison(seriesId) {
  const state = seriesRuntimeState.get(seriesId);
  const { input } = getCompareElements(seriesId);

  if (!state) {
    return;
  }

  state.comparisonCountry = null;
  state.comparisonRequestId += 1;
  state.comparisonPoints = [];

  if (input) {
    input.value = "";
  }

  hideCompareResults(seriesId);
  updateCompareSelectionUi(seriesId);
  renderMainSeriesOnly(seriesId);
}

function renderMainSeriesOnly(seriesId) {
  const state = seriesRuntimeState.get(seriesId);

  if (!state?.mainConfig || !state.mainPoints.length) {
    return;
  }

  const canvas = document.querySelector(`#${state.mainConfig.canvasId}`);
  renderSeriesChart(canvas, {
    points: state.mainPoints,
    config: state.mainConfig,
  }).catch((error) => {
    console.error(`[${pageLogPrefix}] Failed to restore main chart.`, {
      seriesId,
      error,
    });
  });
  renderDataTable(state.mainPoints, state.mainConfig);
}

async function renderSeriesChart(canvas, chartOptions) {
  await loadChartJs();
  return renderLineChart(canvas, chartOptions);
}

function updateCompareAvailability(seriesId) {
  const state = seriesRuntimeState.get(seriesId);
  const { input } = getCompareElements(seriesId);

  if (!input || !state) {
    return;
  }

  input.disabled = !state.hasMainData;
  input.placeholder = state.hasMainData
    ? translate("ui.compareWith", "Compare with...")
    : "";
}

function updateCompareSelectionUi(seriesId, errorMessage = "") {
  const state = seriesRuntimeState.get(seriesId);
  const { selected } = getCompareElements(seriesId);

  if (!state || !selected) {
    return;
  }

  selected.classList.toggle("is-error", Boolean(errorMessage));
  selected.innerHTML = "";

  if (errorMessage) {
    selected.append(createCompareSelectionText(errorMessage));
  } else if (state.comparisonCountry) {
    selected.append(createCompareSelectionText(translate("ui.comparingWith", "Comparing with {country}", {
      country: translateCountryName(state.comparisonCountry),
    })));
  } else {
    return;
  }

  if (state.comparisonCountry) {
    selected.append(createCompareClearButton(seriesId, translateCountryName(state.comparisonCountry)));
  }
}

function createCompareSelectionText(text) {
  const textElement = document.createElement("span");
  textElement.className = "compare-selected-text";
  textElement.textContent = text;
  return textElement;
}

function createCompareClearButton(seriesId, countryName) {
  const button = document.createElement("button");
  button.className = "compare-clear-button";
  button.type = "button";
  button.textContent = "x";
  button.setAttribute("aria-label", translate("ui.removeComparison", "Remove {country} comparison", {
    country: countryName,
  }));
  button.addEventListener("click", () => {
    clearComparison(seriesId);
  });
  return button;
}

function hideCompareResults(seriesId) {
  const state = seriesRuntimeState.get(seriesId);
  const { input, results } = getCompareElements(seriesId);

  if (results) {
    results.hidden = true;
    results.innerHTML = "";
    placeCompareResultsElement(seriesId);
  }

  if (state) {
    state.comparisonMatches = [];
    state.comparisonSearchKeyboard?.reset();
  }

  if (input) {
    input.removeAttribute("aria-activedescendant");
    input.setAttribute("aria-expanded", "false");
  }
}

function getCompareElements(seriesId) {
  return {
    input: document.querySelector(`#${seriesId}CompareInput`),
    results: document.querySelector(`#${seriesId}CompareResults`),
    selected: document.querySelector(`#${seriesId}CompareSelected`),
  };
}

function placeCompareResultsElement(seriesId, mode) {
  const { input, results } = getCompareElements(seriesId);
  const inputWrap = input?.closest(".compare-input-wrap");
  const control = input?.closest(".compare-control");

  if (!results || !control) {
    return;
  }

  if (mode === "search" && inputWrap) {
    inputWrap.append(results);
    return;
  }

  const selected = control.querySelector(".compare-selected");
  if (selected) {
    selected.after(results);
    return;
  }

  control.append(results);
}

function clearDataTable(seriesConfig) {
  const tableWrap = document.querySelector(`#${seriesConfig.id}TableWrap`);
  const tableToggle = document.querySelector(`#${seriesConfig.id}TableToggle`);

  if (tableWrap && !hasStaticDataTable(tableWrap)) {
    tableWrap.innerHTML = "";
  }

  if (tableToggle) {
    tableToggle.open = false;
  }
}

function renderDataTable(points, seriesConfig, { comparisonPoints = [], comparisonCountry = null } = {}) {
  const tableWrap = document.querySelector(`#${seriesConfig.id}TableWrap`);

  if (!tableWrap) {
    return;
  }

  const hasComparison = comparisonPoints.length > 0;
  if (!hasComparison && hasStaticDataTable(tableWrap)) {
    return;
  }

  const displayScale = getDisplayScale(hasComparison ? [...points, ...comparisonPoints] : points, seriesConfig);
  const sortedPoints = [...points].sort((pointA, pointB) => pointA.year - pointB.year);
  tableWrap.innerHTML = "";

  if (!hasComparison) {
    tableWrap.append(renderStandardDataTable(sortedPoints, displayScale));
    return;
  }

  const comparisonPointByYear = new Map(comparisonPoints.map((point) => [point.year, point]));
  tableWrap.append(
    renderComparisonDataTable({
      points: sortedPoints,
      comparisonPointByYear,
      displayScale,
      seriesConfig,
      comparisonCountry,
    }),
  );
}

function renderStandardDataTable(points, displayScale) {
  const table = document.createElement("table");
  table.className = "data-table";
  const tbody = document.createElement("tbody");
  const columnCount = 3;
  const rowCount = Math.ceil(points.length / columnCount);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = document.createElement("tr");

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const point = points[rowIndex + columnIndex * rowCount];
      appendDataTablePointCells(row, point, displayScale);
    }

    tbody.append(row);
  }

  table.append(tbody);
  return table;
}

function hasStaticDataTable(tableWrap) {
  return Boolean(tableWrap?.querySelector("[data-static-data-table]"));
}

function renderComparisonDataTable({
  points,
  comparisonPointByYear,
  displayScale,
  seriesConfig,
  comparisonCountry,
}) {
  const isTwoColumnTable = isTwoColumnComparisonTable();
  const table = document.createElement("table");
  table.className = "data-table data-table-comparison";
  table.classList.toggle("data-table-comparison-two-column", isTwoColumnTable);
  table.append(renderComparisonColumnGroup(isTwoColumnTable ? 2 : 1));

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.className = "data-table-comparison-header";
  appendComparisonHeaderCells(headerRow, comparisonCountry);
  if (isTwoColumnTable) {
    appendComparisonHeaderCells(headerRow, comparisonCountry);
  }
  thead.append(headerRow);

  const tbody = document.createElement("tbody");
  const rowCount = isTwoColumnTable ? Math.ceil(points.length / 2) : points.length;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = document.createElement("tr");
    row.className = "data-table-comparison-row";
    appendComparisonPointCells({
      row,
      point: points[rowIndex],
      comparisonPointByYear,
      displayScale,
      seriesConfig,
    });

    if (isTwoColumnTable) {
      appendComparisonPointCells({
        row,
        point: points[rowIndex + rowCount],
        comparisonPointByYear,
        displayScale,
        seriesConfig,
      });
    }

    tbody.append(row);
  }

  table.append(thead, tbody);
  return table;
}

function isTwoColumnComparisonTable() {
  return window.matchMedia?.(comparisonTableTwoColumnQuery)?.matches ?? false;
}

function renderComparisonColumnGroup(groupCount) {
  const columnGroup = document.createElement("colgroup");

  const groupColumns = [
    "data-table-comparison-year-column",
    "data-table-comparison-value-column",
    "data-table-comparison-value-column",
    "data-table-comparison-percentage-column",
  ];

  for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
    groupColumns.forEach((className) => {
      const column = document.createElement("col");
      column.className = className;
      columnGroup.append(column);
    });
  }

  return columnGroup;
}

function getComparisonYearLabel() {
  return getPageLocale() === "ja" ? "年" : "Year";
}

function appendComparisonHeaderCells(row, comparisonCountry) {
  appendComparisonHeaderCell(row, getComparisonYearLabel(), "data-table-year-cell");
  appendComparisonFlagHeaderCell(row, selectedCountry);
  appendComparisonFlagHeaderCell(row, comparisonCountry);
  appendComparisonHeaderCell(row, "%", "data-table-comparison-percentage");
}

function appendComparisonHeaderCell(row, text, className) {
  const cell = document.createElement("th");
  cell.className = className;
  cell.scope = "col";
  cell.textContent = text;
  row.append(cell);
}

function appendComparisonFlagHeaderCell(row, country) {
  const cell = document.createElement("th");
  cell.className = "data-table-country-code-cell data-table-country-flag-cell";
  cell.scope = "col";

  const countryCode = country?.code ?? "";
  const countryName = country ? translateCountryName(country) : countryCode;
  if (countryName) {
    cell.title = countryName;
    cell.setAttribute("aria-label", countryName);
  }

  const flag = countryCode ? createFlagImage(countryCode, { className: "data-table-comparison-flag", rootHref }) : null;
  if (flag) {
    cell.append(flag);
  } else {
    cell.textContent = countryCode;
  }

  row.append(cell);
}

function appendComparisonPointCells({
  row,
  point,
  comparisonPointByYear,
  displayScale,
  seriesConfig,
}) {
  if (!point) {
    appendComparisonCell(row, "", "data-table-year-cell");
    appendComparisonCell(row, "", "data-table-value-cell");
    appendComparisonCell(row, "", "data-table-value-cell data-table-comparison-value");
    appendComparisonCell(row, "", "data-table-comparison-percentage");
    return;
  }

  const comparisonPoint = comparisonPointByYear.get(point.year);
  appendComparisonCell(row, String(point.year), "data-table-year-cell");
  appendComparisonCell(
    row,
    formatDataTableValue(point.value, displayScale),
    joinClassNames("data-table-value-cell", getObservationStatusCellClass(point)),
  );
  appendComparisonCell(
    row,
    comparisonPoint ? formatDataTableValue(comparisonPoint.value, displayScale) : "-",
    joinClassNames(
      "data-table-value-cell data-table-comparison-value",
      getObservationStatusCellClass(comparisonPoint),
    ),
  );
  appendComparisonPercentageCell(row, point, comparisonPoint, seriesConfig);
}

function appendComparisonCell(row, text, className) {
  const cell = document.createElement("td");
  cell.className = className;
  cell.textContent = text;
  row.append(cell);
}

function appendComparisonPercentageCell(row, mainPoint, comparisonPoint, seriesConfig) {
  const cell = document.createElement("td");
  cell.className = "data-table-comparison-percentage";

  if (mainPoint && comparisonPoint) {
    const comparisonPercentage = getComparisonPercentage(comparisonPoint.value, mainPoint.value);
    cell.textContent = formatComparisonPercentage(comparisonPercentage);
    if (Number.isFinite(comparisonPercentage)) {
      const comparisonClassName = getComparisonPercentageClass({
        comparisonPercentage,
        comparisonValue: comparisonPoint.value,
        mainValue: mainPoint.value,
        seriesConfig,
      });
      if (comparisonClassName) {
        cell.classList.add(comparisonClassName);
      }
    }
  } else {
    cell.textContent = "-";
  }

  row.append(cell);
}

function renderNoDataTable(seriesConfig) {
  const tableWrap = document.querySelector(`#${seriesConfig.id}TableWrap`);

  if (!tableWrap) {
    return;
  }

  if (hasStaticDataTable(tableWrap)) {
    return;
  }

  tableWrap.innerHTML = "";
}

function appendDataTablePointCells(row, point, displayScale) {
  const yearCell = document.createElement("td");
  const valueCell = document.createElement("td");

  if (point) {
    const statusClass = getObservationStatusCellClass(point);
    valueCell.className = statusClass;
    yearCell.textContent = String(point.year);
    valueCell.textContent = formatDataTableValue(point.value, displayScale);
  }

  row.append(yearCell, valueCell);
}

function getObservationStatusCellClass(point) {
  return point?.observationStatusHighlighted ? "data-table-observation-estimated" : "";
}

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

function formatDataTableValue(value, displayScale) {
  return formatCompactDisplayValue(value, displayScale);
}

function getComparisonPercentage(comparisonValue, mainValue) {
  if (!Number.isFinite(comparisonValue) || !Number.isFinite(mainValue) || mainValue === 0) {
    return null;
  }

  return (comparisonValue / mainValue) * 100;
}

function getComparisonPercentageClass({ comparisonPercentage, comparisonValue, mainValue, seriesConfig }) {
  if (isPercentSeriesConfig(seriesConfig)) {
    if (!Number.isFinite(comparisonValue) || !Number.isFinite(mainValue)) {
      return "";
    }

    return mainValue >= comparisonValue ? "is-at-or-above-main-value" : "is-below-main-value";
  }

  if (!Number.isFinite(comparisonPercentage)) {
    return "";
  }

  return comparisonPercentage <= 100 ? "is-at-or-above-main-value" : "is-below-main-value";
}

function isPercentSeriesConfig(seriesConfig) {
  return seriesConfig?.suffix === "%" || String(seriesConfig?.displayUnit ?? "").includes("%");
}

function formatComparisonPercentage(percentage) {
  if (!Number.isFinite(percentage)) {
    return "-";
  }

  const formatter = new Intl.NumberFormat(getPageLocale() === "ja" ? "ja-JP" : "en-US", {
    maximumFractionDigits: Math.abs(percentage) >= 10_000_000 ? 0 : 1,
  });

  return `${formatter.format(percentage)}%`;
}

function updateSeriesSourceOverrideNotes(data, seriesConfig) {
  const notesContainer = document.querySelector(".indicators-card > .shared-notes");
  if (!notesContainer) {
    return;
  }

  const overrideNotes =
    data?.economies?.[seriesConfig.countryCode]?.series?.[seriesConfig.indicatorCode]?.sourceOverride?.notes ?? [];
  const primarySourceNote = notesContainer.querySelector("[data-primary-source-note]");

  primarySourceNote?.toggleAttribute("hidden", overrideNotes.length > 0);
  notesContainer
    .querySelectorAll(`[data-source-override-series="${seriesConfig.id}"]`)
    .forEach((element) => element.remove());

  overrideNotes.forEach((noteText) => {
    const noteElement = document.createElement("p");
    noteElement.dataset.sourceOverrideSeries = seriesConfig.id;
    noteElement.textContent = translateExactText(noteText);
    notesContainer.append(noteElement);
  });
}

function showChartOverlay({ chartCard, overlayElement, message, state }) {
  if (chartCard) {
    chartCard.classList.toggle("is-loading", state === "loading");
    chartCard.classList.toggle("is-error", state === "error");
    chartCard.classList.toggle("is-no-data", state === "no-data");
  }

  if (!overlayElement) {
    return;
  }

  overlayElement.hidden = false;
  overlayElement.setAttribute("aria-hidden", "false");
  overlayElement.innerHTML = "";

  const messageElement = document.createElement("span");
  messageElement.className = "overlay-message";
  messageElement.textContent = message;
  overlayElement.append(messageElement);
}

function hideChartOverlay(chartCard, overlayElement) {
  if (chartCard) {
    chartCard.classList.remove("is-loading", "is-error", "is-no-data");
  }

  if (!overlayElement) {
    return;
  }

  overlayElement.hidden = true;
  overlayElement.setAttribute("aria-hidden", "true");
  overlayElement.innerHTML = "";
}

function showPageError() {
  document.querySelectorAll(".chart-card").forEach((chartCard) => {
    chartCard.classList.add("is-error");
  });
}
