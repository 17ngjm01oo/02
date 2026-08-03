import { countries } from "./countries.js";
import { initializeIndicatorInfoTooltips } from "./indicatorInfoUi.js";
import { getLocalizedRootHref } from "./localization.js";
import { renderWorldMap } from "./worldMap.js";

const countryCode = document.body.dataset.countryCode;
const selectedCountry = countries.find((country) => country.code === countryCode);
const rootHref = document.body.dataset.rootHref ?? "../../";
const localizedRootHref = getLocalizedRootHref(rootHref);
const activeCategory = document.body.dataset.countryOverviewCategory ?? "overview";
const countryPathSuffix = activeCategory === "overview" ? "" : `categories/${activeCategory}/`;

try {
  initializeCountryOverview();
} catch (error) {
  console.error("[Country overview] Failed to initialize page.", error);
}

function initializeCountryOverview() {
  if (!selectedCountry) {
    throw new Error(`Country ${countryCode} was not found.`);
  }

  scheduleCountryMapRender();
  initializeIndicatorInfoTooltips();
}

function renderCountryMap() {
  if (!document.querySelector("#countryOverviewMap")) {
    return;
  }

  renderWorldMap({
    containerSelector: "#countryOverviewMap",
    countryList: countries.filter((country) => country.slug),
    rootHref,
    linkRootHref: localizedRootHref,
    countryPathSuffix,
    focusCountryCode: selectedCountry.code,
  });
}

function scheduleCountryMapRender() {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(renderCountryMap, { timeout: 1200 });
    return;
  }

  window.setTimeout(renderCountryMap, 0);
}
