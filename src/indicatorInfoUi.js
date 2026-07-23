import {
  getIndicatorInfoByRankingDirectory,
  getIndicatorInfoBySeriesId,
  getIndicatorInfoData,
} from "./indicatorInfo.js";
import { isTouchPreferred, touchOverlayScrollCloseThreshold } from "./responsive.js";
let touchTooltipScrollStartY = null;

export function createIndicatorInfoButton({
  seriesId = "",
  rankingDirectory = "",
  label = "indicator",
  tooltipPlacement = "country-indicator",
} = {}) {
  const button = document.createElement("button");
  button.className = "indicator-info-button";
  button.type = "button";
  button.textContent = "i";
  button.setAttribute("aria-label", `${label} information`);
  button.dataset.indicatorInfoTooltipPlacement = tooltipPlacement;

  if (seriesId) {
    button.dataset.indicatorInfoSeriesId = seriesId;
  }

  if (rankingDirectory) {
    button.dataset.indicatorInfoRankingDirectory = rankingDirectory;
  }

  return button;
}

export function initializeIndicatorInfoTooltips(root = document) {
  const buttons = [...root.querySelectorAll(".indicator-info-button")].filter((button) => {
    if (button.dataset.indicatorInfoReady === "true") {
      return false;
    }

    button.dataset.indicatorInfoReady = "true";
    return true;
  });

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      if (!isTouchTooltipPreferred()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      closeOpenInfoButtons(button);
      button.classList.toggle("is-open");
      touchTooltipScrollStartY = button.classList.contains("is-open") ? window.scrollY : null;
    });
  });

  if (buttons.length > 0) {
    getIndicatorInfoData().then((indicatorInfoData) => {
      buttons.forEach((button) => {
        const infoText = getButtonInfoText(button, indicatorInfoData);

        if (!infoText || button.querySelector(".indicator-info-tooltip")) {
          return;
        }

        const tooltip = document.createElement("span");
        tooltip.className = "indicator-info-tooltip";
        tooltip.setAttribute("role", "tooltip");
        tooltip.textContent = infoText;
        button.append(tooltip);
      });
    });
  }

  if (document.documentElement.dataset.indicatorInfoDocumentReady === "true") {
    return;
  }

  document.documentElement.dataset.indicatorInfoDocumentReady = "true";
  document.addEventListener("click", () => {
    if (isTouchTooltipPreferred()) {
      closeOpenInfoButtons();
    }
  });
  document.addEventListener("scroll", () => {
    if (!isTouchTooltipPreferred() || touchTooltipScrollStartY === null) {
      return;
    }

    if (Math.abs(window.scrollY - touchTooltipScrollStartY) >= touchOverlayScrollCloseThreshold) {
      closeOpenInfoButtons();
    }
  }, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeOpenInfoButtons();
    }
  });
}

function getButtonInfoText(button, indicatorInfoData) {
  const seriesId = button.dataset.indicatorInfoSeriesId;
  const rankingDirectory = button.dataset.indicatorInfoRankingDirectory;

  if (seriesId) {
    return getIndicatorInfoBySeriesId(indicatorInfoData, seriesId);
  }

  if (rankingDirectory) {
    return getIndicatorInfoByRankingDirectory(indicatorInfoData, rankingDirectory);
  }

  return "";
}

function closeOpenInfoButtons(exceptButton = null) {
  document.querySelectorAll(".indicator-info-button.is-open").forEach((button) => {
    if (button !== exceptButton) {
      button.classList.remove("is-open");
    }
  });

  if (!exceptButton || !exceptButton.classList.contains("is-open")) {
    touchTooltipScrollStartY = null;
  }
}

function isTouchTooltipPreferred() {
  return isTouchPreferred();
}
