import { translations } from "./translations.js";

export const defaultLocale = "en";
export const localeConfigs = {
  en: {
    pathPrefix: "",
    switchLabel: "EN",
    displayName: "English",
  },
  ja: {
    pathPrefix: "ja/",
    switchLabel: "JA",
    displayName: "日本語",
  },
};
export const supportedLocales = Object.keys(localeConfigs);

export function getPageLocale() {
  return document.body.dataset.locale || defaultLocale;
}

export function getLocalizedRootHref(rootHref = document.body.dataset.rootHref ?? "./") {
  const locale = getPageLocale();
  const prefix = getLocalePathPrefix(locale);
  return `${rootHref}${prefix}`;
}

export function getAlternateLocales(locale = getPageLocale()) {
  return supportedLocales.filter((candidateLocale) => candidateLocale !== locale);
}

export function getLocaleSwitchLabel(locale) {
  return localeConfigs[locale]?.switchLabel ?? locale.toUpperCase();
}

export function getLocaleDisplayName(locale) {
  return localeConfigs[locale]?.displayName ?? getLocaleSwitchLabel(locale);
}

export function getAlternatePageHref(targetLocale, rootHref = document.body.dataset.rootHref ?? "./") {
  if (!localeConfigs[targetLocale] || targetLocale === getPageLocale()) {
    return "";
  }

  return `${rootHref}${localeConfigs[targetLocale].pathPrefix}${getCurrentPagePathWithoutLocale(rootHref)}`;
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

export function translateContentLabel(label) {
  const normalized = String(label ?? "").trim();
  return translateFromDictionaries(normalized, ["indicators", "exactText", "categories", "regions"]);
}

export function translateExactTextList(items) {
  return items.map((item) => translateExactText(item)).join(", ");
}

export function translateOfficialCountryName(country) {
  const officialName = country?.officialName ?? "";
  if (!officialName) {
    return "";
  }

  return translateExactText(officialName);
}

export function translateCategoryLabel(label) {
  return getLocaleDictionary().categories?.[label] ?? label;
}

export function translateRegionLabel(label) {
  return getLocaleDictionary().regions?.[label] ?? label;
}

export function translateIndicatorLabel(label) {
  return getLocaleDictionary().indicators?.[label] ?? label;
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
  const { article = "none", articleCase = "lower", fallback = "" } = options;
  const countryName = translateCountryName(countryOrCode, fallback);
  const usesDefiniteArticle = typeof countryOrCode === "object" && countryOrCode?.englishDefiniteArticle === true;
  if (getPageLocale() !== "en" || article !== "definite" || !usesDefiniteArticle) {
    return countryName;
  }

  const articleText = articleCase === "title" ? "The" : "the";
  return `${articleText} ${countryName}`;
}

export function getCountryNameSearchLabels(countryOrCode, fallback = "") {
  const code = typeof countryOrCode === "string" ? countryOrCode : countryOrCode?.code;
  const name = typeof countryOrCode === "string" ? fallback : countryOrCode?.name;
  return uniqueLabels([
    name,
    fallback,
    ...Object.values(translations).map((dictionary) => dictionary.countries?.[code]),
  ]);
}

export function getExactTextSearchLabels(text) {
  const normalized = String(text ?? "").trim();
  if (!normalized) {
    return [];
  }

  return uniqueLabels([
    normalized,
    ...Object.values(translations).map((dictionary) => dictionary.exactText?.[normalized]),
  ]);
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

function getCurrentPagePath(rootHref = document.body.dataset.rootHref ?? "./") {
  if (document.body.dataset.pageKind === "home") {
    return "";
  }

  const pagePath = window.location.pathname.replace(/^\/+/, "");
  const basePath = getBasePathFromRootHref(rootHref);
  return pagePath.startsWith(basePath) ? pagePath.slice(basePath.length) : pagePath;
}

function getCurrentPagePathWithoutLocale(rootHref = document.body.dataset.rootHref ?? "./") {
  const pagePath = getCurrentPagePath(rootHref);
  const localePrefix = localeConfigs[getPageLocale()]?.pathPrefix ?? "";
  return localePrefix && pagePath.startsWith(localePrefix) ? pagePath.slice(localePrefix.length) : pagePath;
}

function getLocaleDictionary() {
  return translations[getPageLocale()] ?? {};
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

function uniqueLabels(labels) {
  return [...new Set(labels.map((label) => String(label ?? "").trim()).filter(Boolean))];
}

function getBasePathFromRootHref(rootHref = document.body.dataset.rootHref ?? "./") {
  if (!rootHref.startsWith("../")) {
    return "";
  }

  const depth = rootHref.split("../").length - 1;
  const parts = window.location.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  return parts.slice(0, Math.max(0, parts.length - depth)).join("/") + "/";
}
