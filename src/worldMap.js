import { geoEqualEarth, geoPath } from "https://cdn.jsdelivr.net/npm/d3-geo@3/+esm";
import { feature } from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";
import { createFlagImage } from "./flags.js";
import { translate, translateCountryName } from "./localization.js";
import { hoverPreferredQuery } from "./responsive.js";

const MAP_WIDTH = 960;
const MAP_HEIGHT = 420;
const MAP_PADDING = -18;
const MAP_DATA_PATH = "data/geo/countries-50m.json";
const COUNTRY_IDENTIFIERS_PATH = "data/country-identifiers.json";
const INACTIVE_COUNTRY_COLOR = "var(--world-map-inactive-country)";
const hoverTooltipMedia = window.matchMedia(hoverPreferredQuery);
const REGION_COLORS = {
  Asia: "#D3B25A",
  Europe: "#857CB8",
  Africa: "#D09A72",
  "North America": "#5A91C9",
  "South America": "#6E9F74",
  Oceania: "#D6908B",
};
const MAP_FOCUS_BOUNDS = {
  Asia: [40, -8, 155, 58],
  ASEAN: [88, -10, 144, 28],
  Europe: [-25, 34, 60, 72],
  EU: [-20, 35, 38, 66],
  NATO: [-94, 19, 45, 65],
  Africa: [-17, -34, 53, 35],
  "North America": [-172, 7, -52, 72],
  "South America": [-79, -53, -37, 9],
  Oceania: [112, -45, 180, -2],
};
const COUNTRY_FOCUS_BOUNDS = {
  USA: [-164, 19, -60, 71],
  FRA: [-6, 41, 10, 52],
  ESP: [-10, 35, 5, 44],
  PRT: [-10, 36, -6, 43],
  NLD: [3.6, 50.8, 7, 53.4],
  CYP: [32.3, 34.45, 34.6, 35.65],
  JPN: [127, 29.5, 145, 45],
  RUS: [20, 37, 120, 75],
  ZAF: [18, -34.5, 32, -22.5],
  AUS: [113, -44, 154, -10],
  FJI: [175, -22, 180, -12],
  KIR: [170, 0, 177, 5],
  TUV: [176, -11, 180, -5],
  GUF: [-55, 2, -51, 6],
  GLP: [-62.2, 15.6, -60.8, 16.9],
  MTQ: [-61.5, 14.2, -60.5, 15.1],
  MAF: [-63.22, 17.95, -62.9, 18.2],
  VIR: [-65.2, 17.5, -64.4, 18.45],
  MYT: [44.7, -13.25, 45.65, -12.45],
  REU: [54.7, -21.5, 56, -20.4],
  GIB: [-5.4, 36.02, -5.3, 36.16],
  PCN: [-130.5, -25.45, -129.7, -24.75],
  NZL: [165, -48, 180, -33],
};

export async function renderWorldMap({
  containerSelector = "#worldMap",
  countryList = [],
  rootHref = "../",
  linkRootHref = rootHref,
  dataUrl = `${rootHref}${MAP_DATA_PATH}`,
  identifiersUrl = `${rootHref}${COUNTRY_IDENTIFIERS_PATH}`,
  focusCountryCode = "",
  defaultZoom = 1,
} = {}) {
  const container = document.querySelector(containerSelector);

  if (!container) {
    return;
  }

  try {
    const [topology, countryIdentifiers] = await Promise.all([
      fetchJson(dataUrl, "Map data"),
      fetchJson(identifiersUrl, "Country identifiers"),
    ]);
    const mapCountries = feature(topology, topology.objects.countries);
    const countryLookup = buildCountryLookup(countryList, linkRootHref, countryIdentifiers);
    const svg = createSvg();
    const tooltip = createMapTooltip();

    container.replaceChildren(svg, tooltip);
    renderMapPaths({ svg, tooltip, container, mapCountries, countryLookup, focusCountryCode, defaultZoom });

    return {
      setScope({ focusId = "", highlightedCountryCodes = null } = {}) {
        hideMapTooltip(tooltip);
        renderMapPaths({
          svg,
          tooltip,
          container,
          mapCountries,
          countryLookup,
          focusId,
          defaultZoom,
          highlightedCountryCodes,
        });
      },
      focusRegion(regionId) {
        hideMapTooltip(tooltip);
        renderMapPaths({ svg, tooltip, container, mapCountries, countryLookup, focusId: regionId, defaultZoom });
      },
      focusCountry(countryCode) {
        hideMapTooltip(tooltip);
        renderMapPaths({ svg, tooltip, container, mapCountries, countryLookup, focusCountryCode: countryCode });
      },
    };
  } catch (error) {
    console.error("[World map] Failed to render map.", error);
    container.replaceChildren(createMapError());
  }
}

function renderMapPaths({
  svg,
  tooltip,
  container,
  mapCountries,
  countryLookup,
  focusId = "",
  focusCountryCode = "",
  defaultZoom = 1,
  highlightedCountryCodes = null,
}) {
  const projection = geoEqualEarth().fitExtent(
    [
      [MAP_PADDING, MAP_PADDING],
      [MAP_WIDTH - MAP_PADDING, MAP_HEIGHT - MAP_PADDING],
    ],
    getCountryFocusGeometry(focusCountryCode, mapCountries, countryLookup) ?? getMapFocusGeometry(focusId) ?? mapCountries,
  );

  if (!focusCountryCode && !focusId && defaultZoom !== 1) {
    projection.scale(projection.scale() * defaultZoom);
  }

  const path = geoPath(projection);

  svg.replaceChildren();
  appendPath(svg, path({ type: "Sphere" }), "world-map-sphere");

  for (const country of mapCountries.features) {
    const mapName = country.properties?.name ?? "";
    const countryRecord = findCountryRecord(country, countryLookup);
    const countryPath = appendPath(svg, path(country), "world-map-country");

    if (countryPath) {
      colorCountryPath(countryPath, countryRecord?.country, highlightedCountryCodes);
    }

    if (countryPath && countryRecord) {
      makeCountryPathClickable(countryPath, countryRecord, container, tooltip);
    }
  }
}

function getCountryFocusGeometry(countryCode, mapCountries, countryLookup) {
  if (!countryCode) {
    return null;
  }

  const bounds = COUNTRY_FOCUS_BOUNDS[countryCode];

  if (bounds) {
    return createBoundsPoints(bounds);
  }

  return mapCountries.features.find((country) => {
    const countryRecord = findCountryRecord(country, countryLookup);
    return countryRecord?.country.code === countryCode;
  }) ?? null;
}

function getMapFocusGeometry(focusId) {
  const bounds = MAP_FOCUS_BOUNDS[focusId];

  if (!bounds) {
    return null;
  }

  return createBoundsPoints(bounds);
}

function createBoundsPoints([west, south, east, north]) {
  return {
    type: "MultiPoint",
    coordinates: [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
    ],
  };
}

async function fetchJson(dataUrl, label = "JSON") {
  const response = await fetch(dataUrl, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`${label} request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function createSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "world-map-svg");
  svg.setAttribute("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", translate("ui.worldMap", "World map"));
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return svg;
}

function appendPath(svg, pathData, className) {
  if (!pathData) {
    return null;
  }

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", className);
  path.setAttribute("d", pathData);
  svg.append(path);
  return path;
}

function buildCountryLookup(countryList, rootHref, countryIdentifiers) {
  const identifiersByCountry = countryIdentifiers?.countries ?? {};

  return countryList.reduce((lookup, country) => {
    const mapId = normalizeMapId(identifiersByCountry[country.code]?.sourceIds?.worldMapTopojson);

    if (!country.slug) {
      return lookup;
    }

    const href = `${rootHref}countries/${country.slug}/`;
    const record = { country, href };

    if (mapId) {
      lookup.byId.set(mapId, record);
    }

    [country.name].forEach((name) => {
      const normalizedName = normalizeName(name);

      if (normalizedName) {
        lookup.byName.set(normalizedName, record);
      }
    });

    return lookup;
  }, { byId: new Map(), byName: new Map() });
}

function findCountryRecord(mapCountry, countryLookup) {
  return countryLookup.byId.get(normalizeMapId(mapCountry.id))
    ?? countryLookup.byName.get(normalizeName(mapCountry.properties?.name));
}

function colorCountryPath(path, country, highlightedCountryCodes = null) {
  if (highlightedCountryCodes && !highlightedCountryCodes.has(country?.code)) {
    path.style.setProperty("--world-map-country-fill", INACTIVE_COUNTRY_COLOR);
    return;
  }

  const color = REGION_COLORS[country?.region?.trim()];

  if (color) {
    path.style.setProperty("--world-map-country-fill", color);
  }
}

function normalizeMapId(mapId) {
  return mapId === undefined || mapId === null
    ? ""
    : String(mapId).padStart(3, "0");
}

function normalizeName(name) {
  return typeof name === "string"
    ? name.trim().toLowerCase()
    : "";
}

function makeCountryPathClickable(path, countryRecord, container, tooltip) {
  const { country, href } = countryRecord;

  path.classList.add("is-clickable");
  path.addEventListener("mouseenter", (event) => {
    if (!canShowMapTooltip()) {
      return;
    }

    showMapTooltip(tooltip, container, country, event);
  });
  path.addEventListener("mousemove", (event) => {
    if (!canShowMapTooltip() || tooltip.hidden) {
      return;
    }

    positionMapTooltip(tooltip, container, event);
  });
  path.addEventListener("mouseleave", () => {
    hideMapTooltip(tooltip);
  });
  path.addEventListener("click", () => {
    window.location.href = href;
  });
}

function canShowMapTooltip() {
  return hoverTooltipMedia.matches;
}

function createMapTooltip() {
  const tooltip = document.createElement("div");
  tooltip.className = "world-map-tooltip";
  tooltip.hidden = true;

  const flag = document.createElement("span");
  flag.className = "world-map-tooltip-flag";

  const name = document.createElement("span");
  name.className = "world-map-tooltip-name";

  tooltip.append(flag, name);
  return tooltip;
}

function showMapTooltip(tooltip, container, country, event) {
  const flag = tooltip.querySelector(".world-map-tooltip-flag");
  const flagImage = createFlagImage(country.code);
  flag.replaceChildren();
  if (flagImage) {
    flag.append(flagImage);
  }
  tooltip.querySelector(".world-map-tooltip-name").textContent = translateCountryName(country);
  tooltip.hidden = false;

  if (event) {
    positionMapTooltip(tooltip, container, event);
  }
}

function hideMapTooltip(tooltip) {
  tooltip.hidden = true;
}

function positionMapTooltip(tooltip, container, event) {
  const containerRect = container.getBoundingClientRect();
  setMapTooltipPosition(
    tooltip,
    container,
    event.clientX - containerRect.left,
    event.clientY - containerRect.top,
  );
}

function setMapTooltipPosition(tooltip, container, x, y) {
  const offset = 14;
  const maxLeft = container.clientWidth - tooltip.offsetWidth - offset;
  const maxTop = container.clientHeight - tooltip.offsetHeight - offset;
  const left = Math.min(Math.max(x + offset, offset), Math.max(maxLeft, offset));
  const top = Math.min(Math.max(y + offset, offset), Math.max(maxTop, offset));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function createMapError() {
  const message = document.createElement("p");
  message.className = "world-map-error";
  message.textContent = translate("ui.failedToLoadData", "Failed to load data.");
  return message;
}
