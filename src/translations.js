// Generated from src/translations.json by scripts/generate-translations-module.py.
const translationUrls = {
  "ja": new URL("./translations/ja.json", import.meta.url),
  "es": new URL("./translations/es.json", import.meta.url),
  "fr": new URL("./translations/fr.json", import.meta.url),
  "pt": new URL("./translations/pt.json", import.meta.url),
  "de": new URL("./translations/de.json", import.meta.url),
  "it": new URL("./translations/it.json", import.meta.url),
  "ko": new URL("./translations/ko.json", import.meta.url),
  "tr": new URL("./translations/tr.json", import.meta.url),
  "id": new URL("./translations/id.json", import.meta.url),
};

export async function loadTranslation(locale, { signal } = {}) {
  const url = translationUrls[locale];
  if (!url) {
    return {};
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Unable to load the ${locale} translation: ${response.status}`);
  }
  return response.json();
}
