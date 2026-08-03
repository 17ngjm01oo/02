import {
  getIndicatorInfoByRankingDirectory,
  getIndicatorInfoBySeriesId,
  getIndicatorInfoData,
} from "./indicatorInfo.js";
import { isTouchPreferred, touchOverlayScrollCloseThreshold } from "./responsive.js";
const countryIndicatorTooltipViewportPadding = 8;
let touchTooltipScrollStartY = null;
let tooltipResizeFrame = null;

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
    if (isCountryIndicatorInfoButton(button)) {
      button.addEventListener("pointerenter", () => updateCountryIndicatorTooltipPlacement(button));
      button.addEventListener("focus", () => updateCountryIndicatorTooltipPlacement(button));
    }

    button.addEventListener("click", (event) => {
      if (!isTouchTooltipPreferred()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      updateCountryIndicatorTooltipPlacement(button);
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
        updateCountryIndicatorTooltipPlacement(button);
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
  window.addEventListener("resize", scheduleCountryIndicatorTooltipPlacementUpdate, { passive: true });
  window.visualViewport?.addEventListener("resize", scheduleCountryIndicatorTooltipPlacementUpdate, { passive: true });
}

function isCountryIndicatorInfoButton(button) {
  return button.dataset.indicatorInfoTooltipPlacement === "country-indicator";
}

function updateCountryIndicatorTooltipPlacement(button) {
  if (!isCountryIndicatorInfoButton(button)) {
    return;
  }

  const buttonRect = button.getBoundingClientRect();
  const visualViewport = window.visualViewport;
  const viewportLeft = visualViewport?.offsetLeft ?? 0;
  const viewportWidth = visualViewport?.width ?? document.documentElement.clientWidth;
  const viewportRight = viewportLeft + viewportWidth;
  const buttonCenter = buttonRect.left + buttonRect.width / 2;
  const side = buttonCenter > viewportLeft + viewportWidth / 2 ? "left" : "right";
  const availableWidth = side === "left"
    ? buttonRect.right - viewportLeft - countryIndicatorTooltipViewportPadding
    : viewportRight - buttonRect.left - countryIndicatorTooltipViewportPadding;

  button.dataset.indicatorInfoTooltipSide = side;
  button.style.setProperty(
    "--indicator-info-tooltip-available-width",
    `${Math.max(0, Math.floor(availableWidth))}px`,
  );
}

function scheduleCountryIndicatorTooltipPlacementUpdate() {
  if (tooltipResizeFrame !== null) {
    return;
  }

  tooltipResizeFrame = window.requestAnimationFrame(() => {
    tooltipResizeFrame = null;
    document
      .querySelectorAll('.indicator-info-button[data-indicator-info-tooltip-placement="country-indicator"]')
      .forEach(updateCountryIndicatorTooltipPlacement);
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
