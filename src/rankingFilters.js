import { countryCategories, countryRegions } from "./countries.js";
import { initializeFilterPanels } from "./filterPanels.js";
import { translate, translateCategoryLabel, translateRegionLabel } from "./localization.js";
import { getRankingScopeHref } from "./rankingPaths.js";

const worldScope = { type: "world", id: "WORLD", label: "World", slug: "world" };

export function initializeRankingFilters() {
  const regionList = document.querySelector("#rankingRegionList");
  const categoryList = document.querySelector("#rankingCategoryList");
  const regionPanel = document.querySelector("#ranking-region-heading")?.closest(".category-panel");
  const categoryPanel = document.querySelector("#ranking-category-heading")?.closest(".category-panel");

  if (!regionList || !categoryList) {
    return worldScope;
  }

  const activeScope = getScopeFromPage();
  const rankingBaseHref = document.body.dataset.rankingBaseHref ?? "./";

  const updateButtons = () => {
    document.querySelectorAll("[data-ranking-scope-type]").forEach((link) => {
      const isActive =
        link.dataset.rankingScopeType === activeScope.type &&
        link.dataset.rankingScopeId === activeScope.id;
      link.setAttribute("aria-pressed", String(isActive));
    });
  };

  initializeFilterPanels({ regionPanel, categoryPanel, regionList, categoryList });

  regionList.innerHTML = "";
  categoryList.innerHTML = "";

  regionList.append(createScopeLink({
    scope: worldScope,
    rankingBaseHref,
  }));

  countryRegions.forEach((region) => {
    regionList.append(createScopeLink({
      scope: { type: "region", id: region.id, label: region.label, slug: slugify(region.label) },
      rankingBaseHref,
    }));
  });

  countryCategories.forEach((category) => {
    categoryList.append(createScopeLink({
      scope: { type: "category", id: category.id, label: category.label, slug: slugify(category.label) },
      rankingBaseHref,
    }));
  });

  updateButtons();
  return activeScope;
}

function createScopeLink({ scope, rankingBaseHref }) {
  const link = document.createElement("a");
  link.className = "navigation-control";
  link.href = getRankingScopeHref(rankingBaseHref, scope);
  link.dataset.rankingScopeType = scope.type;
  link.dataset.rankingScopeId = scope.id;
  link.setAttribute("aria-pressed", "false");
  link.textContent = getScopeDisplayLabel(scope);

  return link;
}

function getScopeDisplayLabel(scope) {
  if (scope.id === "WORLD") {
    return translate("ui.world", scope.label);
  }

  if (scope.type === "region") {
    return translateRegionLabel(scope.label);
  }

  if (scope.type === "category") {
    return translateCategoryLabel(scope.label);
  }

  return scope.label;
}

function getScopeFromPage() {
  const type = document.body.dataset.rankingScopeType;
  const id = document.body.dataset.rankingScopeId;
  const label = document.body.dataset.rankingScopeLabel;
  const slug = document.body.dataset.rankingScopeSlug;

  if (!type || !id || !label || !slug) {
    return worldScope;
  }

  return { type, id, label, slug };
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
