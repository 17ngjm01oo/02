import { initializeIndicatorInfoTooltips } from "./indicatorInfoUi.js";
import { initializeHubCategoryFilter } from "./hubCategoryFilter.js";

initializeIndicatorInfoTooltips();

initializeHubCategoryFilter({
  buttonSelector: "[data-data-hub-category]",
  groupSelector: "[data-data-hub-group]",
  buttonCategoryKey: "dataHubCategory",
  groupCategoryKey: "dataHubGroup",
});
