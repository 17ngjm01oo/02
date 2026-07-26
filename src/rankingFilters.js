import { initializeFilterPanels } from "./filterPanels.js";

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
  document.querySelectorAll("[data-ranking-scope-type]").forEach((link) => {
    const isActive =
      link.dataset.rankingScopeType === activeScope.type &&
      link.dataset.rankingScopeId === activeScope.id;
    link.setAttribute("aria-pressed", String(isActive));
  });

  initializeFilterPanels({ regionPanel, categoryPanel, regionList, categoryList });
  return activeScope;
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
