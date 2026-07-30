// Generated from src/translations.json by scripts/generate-translations-module.py.
const translationLoaders = {
  "ja": () => import("./translations/ja.js"),
  "es": () => import("./translations/es.js"),
  "fr": () => import("./translations/fr.js"),
  "pt": () => import("./translations/pt.js"),
  "de": () => import("./translations/de.js"),
  "it": () => import("./translations/it.js"),
  "ko": () => import("./translations/ko.js"),
  "tr": () => import("./translations/tr.js"),
  "id": () => import("./translations/id.js"),
};

export async function loadTranslation(locale) {
  const loader = translationLoaders[locale];
  return loader ? (await loader()).translation : {};
}
