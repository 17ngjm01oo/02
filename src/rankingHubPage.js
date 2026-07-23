import { initializeIndicatorInfoTooltips } from "./indicatorInfoUi.js";
import { initializeHubCategoryFilter } from "./hubCategoryFilter.js";

initializeIndicatorInfoTooltips();

initializeHubCategoryFilter({
  buttonSelector: "[data-rankings-hub-category]",
  groupSelector: "[data-rankings-hub-group]",
  buttonCategoryKey: "rankingsHubCategory",
  groupCategoryKey: "rankingsHubGroup",
});
