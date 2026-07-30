import { isTerritory } from "./countryTypes.js";
import { translate } from "./localization.js";

const entityCountTranslationKeys = {
  country: {
    singular: "ui.countryCountSingular",
    plural: "ui.countryCountPlural",
  },
  territory: {
    singular: "ui.territoryCountSingular",
    plural: "ui.territoryCountPlural",
  },
};

export function renderEntityCountSummary(element, items = []) {
  if (!element) {
    return;
  }

  const { totalCount, countryCount, territoryCount } = getEntityCounts(items);
  element.textContent = translate("ui.entityCountSummary", "Showing: {total} ({countries}, {territories})", {
    total: totalCount,
    countries: formatEntityCount(countryCount, "country"),
    territories: formatEntityCount(territoryCount, "territory"),
  });
}

function getEntityCounts(items) {
  const totalCount = items.length;
  const territoryCount = items.filter(isTerritory).length;
  const countryCount = totalCount - territoryCount;

  return { totalCount, countryCount, territoryCount };
}

function formatEntityCount(count, type) {
  const keys = entityCountTranslationKeys[type];
  const key = count === 1 ? keys.singular : keys.plural;
  const fallbackLabel = type === "country"
    ? count === 1 ? "country" : "countries"
    : count === 1 ? "territory" : "territories";
  return translate(key, "{count} {label}", { count, label: fallbackLabel });
}
