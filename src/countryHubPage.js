import { countries, countryCategories, countryRegions } from "./countries.js";
import { filterCountriesByScope } from "./countryFilters.js";
import { renderEntityCountSummary } from "./entityCountSummary.js";
import { isTerritory, markTerritoryElement } from "./countryTypes.js";
import { initializeFilterPanels } from "./filterPanels.js";
import { createFlagImage } from "./flags.js";
import { initializeTerritoryToggle } from "./territoryToggle.js";
import { renderWorldMap } from "./worldMap.js";
import {
  getLocalizedRootHref,
  getPageLocale,
  translate,
  translateCategoryLabel,
  translateCountryName,
  translateRegionLabel,
} from "./localization.js";
import "./rankingTopNav.js";

const rootHref = document.body.dataset.rootHref ?? "../";
const localizedRootHref = getLocalizedRootHref(rootHref);
const hubCountries = countries.filter((country) => country.slug);
const countElement = document.querySelector("#countryHubCount");
const tableBody = document.querySelector("#countryTableBody");
const regionList = document.querySelector("#regionList");
const categoryList = document.querySelector("#categoryList");
const regionPanel = document.querySelector("#region-heading")?.closest(".category-panel");
const categoryPanel = document.querySelector("#category-heading")?.closest(".category-panel");
const countryHubControls = document.querySelector("#countryHubControls");
const categoryMapFocusById = {
  ASEAN: "ASEAN",
  EU: "EU",
  Eurozone: "EU",
  NATO: "NATO",
};
const preferredCountryCodesByLocale = getPreferredCountryCodesByLocale();
let activeScope = null;
let showTerritories = true;
let worldMap = null;
let worldMapRequest = null;

initializeMapInstruction();
initializeWorldMap();

const countrySearch = initializeLazyCountrySearch();
const filterPanels = initializeFilterPanels({
  regionPanel,
  categoryPanel,
  regionList,
  categoryList,
  onOpen() {
    countrySearch.close();
  },
});

initializeHubFilters();
showTerritories = initializeTerritoryToggle({
  initialValue: showTerritories,
  container: countryHubControls,
  ariaContext: translate("ui.countries", "country list"),
  onChange(nextShowTerritories) {
    countrySearch.close();
    showTerritories = nextShowTerritories;
    renderCountryTable();
  },
});
hydratePrerenderedCountryTable();
updateFilterButtons();

function initializeLazyCountrySearch() {
  const searchInput = document.querySelector("#countrySearchInput");
  let countrySearch = null;
  let initializationPromise = null;

  async function initialize() {
    if (countrySearch) {
      return countrySearch;
    }

    const { initializeCountrySelector } = await import("./countrySelector.js");
    countrySearch = initializeCountrySelector({
      countryPool: hubCountries,
      placeholderKey: "ui.countrySearchPlaceholder",
      placeholder: "Search countries or territories",
      getCountryHref(country) {
        return `${localizedRootHref}countries/${country.slug}/`;
      },
    });

    if (searchInput?.value.trim()) {
      searchInput.dispatchEvent(new Event("input"));
    }

    return countrySearch;
  }

  function initializeOnce() {
    initializationPromise ??= initialize();
  }

  searchInput?.addEventListener("focus", initializeOnce, { once: true });
  searchInput?.addEventListener("input", initializeOnce, { once: true });

  return {
    close() {
      countrySearch?.close();
    },
  };
}

function initializeMapInstruction() {
  const instruction = document.querySelector(".world-map-instruction");
  if (!instruction) {
    return;
  }

  instruction.textContent = translate(
    "ui.mapInstruction",
    instruction.textContent.trim() || "Select a country or territory on the map.",
  );
}

function initializeWorldMap() {
  if (worldMap || worldMapRequest) {
    return;
  }

  worldMapRequest = renderWorldMap({
    countryList: hubCountries,
    rootHref,
    linkRootHref: localizedRootHref,
    defaultZoom: 1.11,
  }).then((map) => {
    worldMap = map;
    updateMapScope();
  }).catch((error) => {
    worldMapRequest = null;
    console.error("[Country hub] Failed to initialize map.", error);
  });
}

function initializeHubFilters() {
  renderRegionButtons();
  renderCategoryButtons();
}

function renderRegionButtons() {
  appendFilterButton(regionList, translate("ui.world", "World"), null, "WORLD");

  countryRegions.forEach((region) => {
    appendFilterButton(regionList, translateRegionLabel(region.label), { type: "region", id: region.id }, region.id);
  });
}

function renderCategoryButtons() {
  countryCategories.forEach((category) => {
    appendFilterButton(categoryList, translateCategoryLabel(category.label), { type: "category", id: category.id });
  });
}

function appendFilterButton(list, label, scope, regionId = null) {
  const button = document.createElement("button");
  button.className = `navigation-control${regionId ? " region-button" : ""}`;
  button.type = "button";
  button.textContent = label;

  if (regionId) {
    button.dataset.regionId = regionId;
  } else {
    button.dataset.categoryId = scope.id;
  }

  button.addEventListener("click", () => {
    countrySearch.close();
    activeScope = isSameScope(activeScope, scope) ? null : scope;
    filterPanels.close();
    renderCountryTable();
  });
  list.append(button);
}

function renderCountryTable() {
  const matchingCountries = getMatchingCountries();
  const fragment = document.createDocumentFragment();

  matchingCountries.forEach((country) => {
    fragment.append(createCountryTableRow(country));
  });

  tableBody.replaceChildren(fragment);
  renderEntityCountSummary(countElement, matchingCountries);
  updateMapScope(matchingCountries);
  updateFilterButtons();
}

function getMatchingCountries() {
  const sortedCountries = sortCountriesByName(
    filterCountriesByScope(hubCountries, activeScope).filter((country) => showTerritories || !isTerritory(country)),
  );
  return prioritizePreferredCountryForLocale(sortedCountries);
}

function sortCountriesByName(countryList) {
  return [...countryList].sort((countryA, countryB) => {
    return translateCountryName(countryA).localeCompare(translateCountryName(countryB), undefined, { sensitivity: "base" });
  });
}

function prioritizePreferredCountryForLocale(countryList) {
  const preferredCountryCodes = preferredCountryCodesByLocale[getPageLocale()] ?? [];

  if (!preferredCountryCodes.length) {
    return countryList;
  }

  const preferredCountryCodesSet = new Set(preferredCountryCodes);
  const preferredCountriesByCode = new Map(countryList
    .filter((country) => preferredCountryCodesSet.has(country.code))
    .map((country) => [country.code, country]));
  const preferredCountries = preferredCountryCodes
    .map((countryCode) => preferredCountriesByCode.get(countryCode))
    .filter(Boolean);

  if (!preferredCountries.length) {
    return countryList;
  }

  return [
    ...preferredCountries,
    ...countryList.filter((country) => !preferredCountryCodesSet.has(country.code)),
  ];
}

function getPreferredCountryCodesByLocale() {
  try {
    const preferredCodes = JSON.parse(document.body.dataset.countryHubPreferredCodes ?? "{}");
    return preferredCodes && typeof preferredCodes === "object" ? preferredCodes : {};
  } catch (error) {
    console.error("[Country hub] Invalid preferred country configuration.", error);
    return {};
  }
}

function updateMapScope(matchingCountries = getMatchingCountries()) {
  if (!worldMap) {
    return;
  }

  if (activeScope?.type === "category") {
    worldMap.setScope({
      focusId: categoryMapFocusById[activeScope.id] ?? "",
      highlightedCountryCodes: new Set(matchingCountries.map((country) => country.code)),
    });
    return;
  }

  worldMap.setScope({
    focusId: activeScope?.type === "region" ? activeScope.id : "",
  });
}

function createCountryTableRow(country) {
  const row = document.createElement("tr");
  row.className = "country-table-row";
  row.dataset.countryCode = country.code;
  markTerritoryElement(row, country);

  const flag = document.createElement("span");
  flag.className = "ranking-flag country-hub-table-flag";
  const flagImage = createFlagImage(country.code, { rootHref });
  if (flagImage) {
    flag.append(flagImage);
  }

  const name = document.createElement("a");
  name.className = "country-hub-table-name";
  name.dataset.uiTextAction = "";
  name.href = `${localizedRootHref}countries/${country.slug}/`;
  name.textContent = translateCountryName(country);

  const region = document.createElement("span");
  region.className = "country-hub-table-region";
  region.textContent = country.region ? translateRegionLabel(country.region) : "-";

  [flag, name, region].forEach((content) => {
    const cell = document.createElement("td");
    cell.append(content);
    row.append(cell);
  });

  return row;
}

function hydratePrerenderedCountryTable() {
  if (!tableBody?.querySelector("tr")) {
    renderCountryTable();
  }
}

function updateFilterButtons() {
  document.querySelectorAll(".region-button").forEach((button) => {
    const isWorld = button.dataset.regionId === "WORLD";
    const isActive = isWorld ? !activeScope : activeScope?.type === "region" && activeScope.id === button.dataset.regionId;
    button.setAttribute("aria-pressed", String(isActive));
  });

  document.querySelectorAll(".navigation-control[data-category-id]").forEach((button) => {
    const isActive = activeScope?.type === "category" && activeScope.id === button.dataset.categoryId;
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function isSameScope(scopeA, scopeB) {
  return scopeA?.type === scopeB?.type && scopeA?.id === scopeB?.id;
}
