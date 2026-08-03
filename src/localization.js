import { loadTranslation } from "./translations.js";
export { defaultLocale, localeConfigs, supportedLocales } from "./locales.js";
import { defaultLocale, localeConfigs } from "./locales.js";

const translationLoadAttemptTimeouts = [4_000, 8_000];
const pageLocale = getPageLocale();
const isCountryIndicatorPage = Boolean(document.body.dataset.countryPageSeriesIds);
let localeDictionary = {};
let fullTranslationLoaded = pageLocale === defaultLocale;
const fullTranslationPromise = initializeLocaleDictionary(pageLocale);

if (!isCountryIndicatorPage) {
  await fullTranslationPromise;
}

async function initializeLocaleDictionary(locale) {
  if (locale === defaultLocale) {
    return true;
  }

  for (let attempt = 0; attempt < translationLoadAttemptTimeouts.length; attempt += 1) {
    const timeoutMs = translationLoadAttemptTimeouts[attempt];
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      localeDictionary = await loadTranslation(locale, { signal: controller.signal });
      fullTranslationLoaded = true;
      return true;
    } catch (error) {
      const hasNextAttempt = attempt + 1 < translationLoadAttemptTimeouts.length;
      if (hasNextAttempt) {
        console.warn(
          `[Localization] Failed to load the ${locale} translation on attempt ${attempt + 1}; retrying.`,
          error,
        );
      } else {
        console.error(
          `[Localization] Failed to load the ${locale} translation after ${attempt + 1} attempts.`,
          error,
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  return false;
}

export function getPageLocale() {
  return document.body.dataset.locale || defaultLocale;
}

export function hasFullTranslation() {
  return fullTranslationLoaded;
}

export function waitForFullTranslation() {
  return fullTranslationPromise;
}

export function getLocalizedRootHref(rootHref = document.body.dataset.rootHref ?? "./") {
  const locale = getPageLocale();
  const prefix = getLocalePathPrefix(locale);
  return `${rootHref}${prefix}`;
}

export function getLocaleSwitchLabel(locale) {
  return localeConfigs[locale]?.switchLabel ?? locale.toUpperCase();
}

export function getLocaleDisplayName(locale) {
  return localeConfigs[locale]?.displayName ?? getLocaleSwitchLabel(locale);
}

function getLocalePathPrefix(locale) {
  return localeConfigs[locale]?.pathPrefix ?? "";
}

export function translate(key, fallback = "", params = {}) {
  const value = getDictionaryValue(key);
  const text = value ?? fallback ?? "";
  return interpolate(text, params);
}

export function translateExactText(text) {
  const normalized = String(text ?? "").trim();
  return translateFromDictionaries(normalized, ["exactText", "categories", "regions", "indicators"]);
}

export function translateCategoryLabel(label) {
  const dictionary = getLocaleDictionary();
  return dictionary.categories?.[label]
    ?? dictionary.indicators?.[label]
    ?? dictionary.exactText?.[label]
    ?? label;
}

export function translateRegionLabel(label) {
  return getLocaleDictionary().regions?.[label] ?? label;
}

export function translateIndicatorLabel(label) {
  return getLocaleDictionary().indicators?.[label] ?? label;
}

export function hasIndicatorTranslation(label) {
  if (!label) {
    return false;
  }

  if (getPageLocale() === defaultLocale) {
    return true;
  }

  return Object.prototype.hasOwnProperty.call(getLocaleDictionary().indicators ?? {}, label);
}

export function translateIndicatorInfo(kind, key, fallback = "") {
  return getLocaleDictionary().indicatorInfo?.[kind]?.[key] ?? fallback;
}

export function translateCountryName(countryOrCode, fallback = "") {
  const code = typeof countryOrCode === "string" ? countryOrCode : countryOrCode?.code;
  const name = typeof countryOrCode === "string" ? fallback : countryOrCode?.name;
  return getLocaleDictionary().countries?.[code] ?? name ?? fallback;
}

export function formatCountryDisplayName(countryOrCode, options = {}) {
  const { form = "default", fallback = "" } = options;
  const countryName = translateCountryName(countryOrCode, fallback);
  const code = typeof countryOrCode === "string" ? countryOrCode : countryOrCode?.code;
  const config = localeConfigs[getPageLocale()];
  const namedForm = config?.countryNameForms?.[code]?.[form];
  if (namedForm) {
    return namedForm;
  }
  return `${config?.countryNameFormPrefixes?.[form] ?? ""}${countryName}`;
}

export function translateScopeLabel(scope) {
  if (!scope) {
    return translate("ui.world", "World");
  }

  if (scope.type === "region" || scope.id === "WORLD") {
    return translateRegionLabel(scope.label);
  }

  if (scope.type === "category") {
    return translateCategoryLabel(scope.label);
  }

  return translateExactText(scope.label);
}

function getLocaleDictionary() {
  return localeDictionary;
}

function getDictionaryValue(key) {
  return key.split(".").reduce((value, part) => value?.[part], getLocaleDictionary());
}

function translateFromDictionaries(text, dictionaryKeys) {
  if (!text) {
    return text;
  }

  const dictionary = getLocaleDictionary();
  for (const key of dictionaryKeys) {
    const translated = dictionary[key]?.[text];
    if (translated) {
      return translated;
    }
  }
  return text;
}

function interpolate(text, params) {
  return String(text).replaceAll(/\{(\w+)\}/g, (_, key) => params[key] ?? "");
}
