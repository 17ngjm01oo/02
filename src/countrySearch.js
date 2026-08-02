import { countries } from "./countries.js";
import { countrySearchAliases } from "./countrySearchAliases.js";
import { getCountryNameSearchLabels } from "./localizedSearchLabels.js";

const noMatchScore = Number.POSITIVE_INFINITY;

export function filterCountries(query) {
  return filterCountryList(countries, query);
}

export function filterCountryList(countryList, query) {
  const queryVariants = getSearchVariants(query);

  if (queryVariants.length === 0) {
    return [];
  }

  return countryList
    .map((country, index) => ({
      country,
      index,
      score: getCountrySearchScore(country, queryVariants),
    }))
    .filter(({ score }) => score !== noMatchScore)
    .sort((matchA, matchB) => matchA.score - matchB.score || matchA.index - matchB.index)
    .map(({ country }) => country);
}

function getCountrySearchScore(country, queryVariants) {
  return getCountrySearchTerms(country).reduce((bestScore, term) => {
    return Math.min(bestScore, ...queryVariants.map((query) => getSearchMatchScore(term, query)));
  }, noMatchScore);
}

function getCountrySearchTerms(country) {
  const terms = [
    ...getCountryNameSearchLabels(country),
    ...(countrySearchAliases[country.code] ?? []),
    country.slug,
    country.code,
  ];

  return [...new Set(terms.flatMap(getSearchVariants).filter(Boolean))];
}

function getSearchMatchScore(term, query) {
  const comparisons = [
    [term, query],
    [term, stripLeadingThe(query)],
    [stripLeadingThe(term), query],
    [stripLeadingThe(term), stripLeadingThe(query)],
  ];

  return comparisons.reduce((bestScore, [searchTerm, searchQuery]) => {
    if (!searchTerm || !searchQuery) {
      return bestScore;
    }

    const compactTerm = compactSearchText(searchTerm);
    const compactQuery = compactSearchText(searchQuery);

    if (compactTerm === compactQuery) {
      return 0;
    }

    // Very short aliases such as 独 and 仏 should not trigger broad substring matches.
    if ([...compactQuery].length === 1) {
      return bestScore;
    }

    if (searchTerm.startsWith(searchQuery) || compactTerm.startsWith(compactQuery)) {
      return Math.min(bestScore, 1);
    }

    if (searchTerm.includes(searchQuery) || compactTerm.includes(compactQuery)) {
      return Math.min(bestScore, 2);
    }

    return bestScore;
  }, noMatchScore);
}

export function normalizeSearchText(value) {
  return foldKatakanaToHiragana(String(value ?? "").normalize("NFKC").toLowerCase())
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}\p{Mark}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function foldKatakanaToHiragana(value) {
  return value
    .replace(/[\u30A1-\u30F6]/g, (character) => {
      return String.fromCodePoint(character.codePointAt(0) - 0x60);
    })
    .replace(/\u30FD/g, "\u309D")
    .replace(/\u30FE/g, "\u309E");
}

function stripLeadingThe(value) {
  return value.replace(/^the\s+/, "").trim();
}

function getSearchVariants(value) {
  const normalizedValue = normalizeSearchText(value);

  if (!normalizedValue) {
    return [];
  }

  const compactValue = compactSearchText(normalizedValue);
  return normalizedValue === compactValue ? [normalizedValue] : [normalizedValue, compactValue];
}

function compactSearchText(value) {
  return value.replace(/\s+/g, "");
}
