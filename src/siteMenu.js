import {
  getLocaleDisplayName,
  getPageLocale,
  localeConfigs,
  supportedLocales,
  translate,
} from "./localization.js";
import {
  isReducedMotionPreferred,
  isTouchPreferred,
  touchOverlayScrollCloseThreshold,
} from "./responsive.js";
import { getThemePreference, setThemePreference } from "./theme.js";

const navigationConfigUrl = new URL("./siteNavigation.json", import.meta.url);
const menus = Array.from(document.querySelectorAll(".site-menu"));
const touchMenuScrollStartY = new WeakMap();
const menuCloseTimers = new WeakMap();
const menuCloseAnimationDuration = 160;

function loadNavigationConfig() {
  return fetch(navigationConfigUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load navigation configuration: ${response.status}`);
      }

      return response.json();
    })
    .then(validateNavigationConfig);
}

function validateNavigationConfig(config) {
  if (!config || !Array.isArray(config.items) || !Array.isArray(config.menuSections)) {
    throw new Error("Navigation configuration is incomplete.");
  }

  const itemsById = new Map();
  config.items.forEach((item) => {
    if (!item || typeof item.id !== "string" || !item.id
      || typeof item.labelKey !== "string" || typeof item.fallbackLabel !== "string"
      || typeof item.path !== "string" || itemsById.has(item.id)) {
      throw new Error("Navigation configuration contains an invalid item.");
    }
    itemsById.set(item.id, item);
  });

  config.menuSections.forEach((section) => {
    if (!section || typeof section.kind !== "string") {
      throw new Error("Navigation configuration contains an invalid menu section.");
    }
    if (section.kind === "links") {
      if (!Array.isArray(section.itemIds) || section.itemIds.some((itemId) => !itemsById.has(itemId))) {
        throw new Error("Navigation menu links reference an unknown item.");
      }
      return;
    }
    if (!["language", "theme"].includes(section.kind)
      || typeof section.labelKey !== "string" || typeof section.fallbackLabel !== "string") {
      throw new Error("Navigation configuration contains an unsupported menu section.");
    }
  });

  return { ...config, itemsById };
}

function closeMenu(menu) {
  if (!menu.open || menu.classList.contains("is-closing")) {
    return;
  }

  touchMenuScrollStartY.delete(menu);
  menu.querySelectorAll("details[open]").forEach((disclosure) => {
    disclosure.open = false;
  });

  if (isReducedMotionPreferred()) {
    finishClosingMenu(menu);
    return;
  }

  menu.classList.add("is-closing");
  menuCloseTimers.set(menu, window.setTimeout(() => {
    finishClosingMenu(menu);
  }, menuCloseAnimationDuration));
}

function finishClosingMenu(menu) {
  const timer = menuCloseTimers.get(menu);
  if (timer !== undefined) {
    window.clearTimeout(timer);
    menuCloseTimers.delete(menu);
  }

  menu.classList.remove("is-closing");
  menu.open = false;
}

function populateMenus(config) {
  menus.forEach((menu) => {
    const panel = menu.querySelector("[data-site-menu-panel]");
    if (!panel) {
      return;
    }

    const rootHref = document.body.dataset.rootHref ?? "./";
    const currentLocale = getPageLocale();
    const currentSection = panel.dataset.currentSection ?? "";
    const pagePath = panel.dataset.pagePath ?? "";
    const fragment = document.createDocumentFragment();

    config.menuSections.forEach((section) => {
      if (section.kind === "links") {
        section.itemIds.forEach((itemId) => {
          fragment.append(createMenuLink(config.itemsById.get(itemId), {
            rootHref,
            currentLocale,
            currentSection,
          }));
        });
        return;
      }

      fragment.append(section.kind === "language"
        ? createLanguageMenu(section, { rootHref, currentLocale, pagePath })
        : createThemeMenu(section));
    });

    panel.replaceChildren(fragment);
    panel.querySelectorAll("details").forEach((disclosure) => {
      disclosure.addEventListener("toggle", () => {
        if (!disclosure.open) {
          return;
        }
        panel.querySelectorAll("details[open]").forEach((otherDisclosure) => {
          if (otherDisclosure !== disclosure) {
            otherDisclosure.open = false;
          }
        });
      });
    });
    panel.removeAttribute("aria-busy");
  });
}

function createThemeMenu(section) {
  const details = document.createElement("details");
  details.className = "site-menu-disclosure site-menu-theme";
  const label = translate(`ui.${section.labelKey}`, section.fallbackLabel);
  const summary = document.createElement("summary");
  summary.className = "site-menu-disclosure-toggle";
  summary.dataset.uiTextAction = "";
  summary.textContent = label;

  const options = document.createElement("div");
  options.className = "site-menu-options";
  options.setAttribute("role", "group");
  options.setAttribute("aria-label", label);
  const preference = getThemePreference();

  [["light", "themeLight", "Light"], ["dark", "themeDark", "Dark"], ["system", "themeSystem", "System"]]
    .forEach(([value, labelKey, fallback]) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "site-menu-link site-menu-option";
      option.dataset.siteMenuThemeOption = "";
      option.dataset.uiTextAction = "";
      option.textContent = translate(`ui.${labelKey}`, fallback);
      option.setAttribute("aria-pressed", String(value === preference));
      option.addEventListener("click", () => {
        setThemePreference(value);
        options.querySelectorAll("[data-site-menu-theme-option]").forEach((candidate) => {
          candidate.setAttribute("aria-pressed", String(candidate === option));
        });
      });
      options.append(option);
    });
  details.append(summary, options);
  return details;
}

function createMenuLink(item, { rootHref, currentLocale, currentSection }) {
  const link = document.createElement("a");
  link.className = "site-menu-link";
  link.dataset.uiTextAction = "";
  link.href = getLocalizedHref(item.path, rootHref, currentLocale);
  link.textContent = translate(`ui.${item.labelKey}`, item.fallbackLabel);

  if (item.id === currentSection) {
    link.setAttribute("aria-current", "page");
  }

  return link;
}

function createLanguageMenu(section, { rootHref, currentLocale, pagePath }) {
  const details = document.createElement("details");
  details.className = "site-menu-disclosure";

  const label = translate(`ui.${section.labelKey}`, section.fallbackLabel);
  const summary = document.createElement("summary");
  summary.className = "site-menu-disclosure-toggle";
  summary.dataset.uiTextAction = "";
  summary.textContent = label;

  const options = document.createElement("div");
  options.className = "site-menu-options";
  options.setAttribute("role", "group");
  options.setAttribute("aria-label", label);

  supportedLocales.forEach((locale) => {
    const link = document.createElement("a");
    link.className = "site-menu-link site-menu-option";
    link.dataset.uiTextAction = "";
    link.href = getLocalizedHref(pagePath, rootHref, locale);
    link.textContent = getLocaleDisplayName(locale);
    if (locale === currentLocale) {
      link.setAttribute("aria-current", "page");
    }
    options.append(link);
  });

  details.append(summary, options);
  return details;
}

function getLocalizedHref(path, rootHref, locale) {
  const pathPrefix = localeConfigs[locale]?.pathPrefix ?? "";
  return `${rootHref}${pathPrefix}${path}`;
}

if (menus.length) {
  loadNavigationConfig()
    .then(populateMenus)
    .catch((error) => {
      console.error("[Site menu]", error);
      menus.forEach((menu) => {
        menu.querySelector("[data-site-menu-panel]")?.removeAttribute("aria-busy");
      });
    });

  menus.forEach((menu) => {
    menu.addEventListener("toggle", (event) => {
      if (event.target !== menu) {
        return;
      }

      if (menu.open && isTouchPreferred()) {
        touchMenuScrollStartY.set(menu, window.scrollY);
      } else {
        touchMenuScrollStartY.delete(menu);
      }
    });
  });

  document.addEventListener("click", (event) => {
    menus.forEach((menu) => {
      if (menu.open && !menu.contains(event.target)) {
        closeMenu(menu);
      }
    });
  });

  document.addEventListener("scroll", () => {
    if (!isTouchPreferred()) {
      return;
    }

    menus.forEach((menu) => {
      const scrollStartY = touchMenuScrollStartY.get(menu);
      if (!menu.open || scrollStartY === undefined) {
        return;
      }

      if (Math.abs(window.scrollY - scrollStartY) >= touchOverlayScrollCloseThreshold) {
        closeMenu(menu);
      }
    });
  }, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    menus.forEach((menu) => {
      if (!menu.open) {
        return;
      }
      closeMenu(menu);
      menu.querySelector("summary")?.focus();
    });
  });
}
