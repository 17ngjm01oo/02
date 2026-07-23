import { countrySearchAliases } from "./countrySearchAliases.js";
import { countries } from "./countries.js";
import {
  getCountryNameSearchLabels,
  getExactTextSearchLabels,
  translate,
  translateCountryName,
  translateRegionLabel,
} from "./localization.js";

export function initializeCountrySelector({
  selectedCountry = null,
  onSelect,
  countryPool = countries,
  getCountryHref = null,
  placeholderKey = "",
  placeholder = "",
  searchInputSelector = "#countrySearchInput",
  resultsSelector = "#countrySearchResults",
} = {}) {
  const searchInput = document.querySelector(searchInputSelector);
  const resultsElement = document.querySelector(resultsSelector);
  const state = {
    selectedCountry,
    currentMatches: [],
  };

  if (!searchInput || !resultsElement) {
    return {
      setSelectedCountry(country) {
        state.selectedCountry = country;
      },
      close() {},
    };
  }

  if (placeholderKey || placeholder) {
    searchInput.placeholder = translate(placeholderKey, placeholder);
  }

  const resultKeyboard = initializeSearchResultKeyboard({
    input: searchInput,
    resultsElement,
    getItemCount() {
      return state.currentMatches.length;
    },
    getItemAtIndex(index) {
      return state.currentMatches[index];
    },
    onHighlightChange(highlightedIndex) {
      syncHighlightedCountry(highlightedIndex);
    },
    onSelect(country) {
      selectCountry(country);
    },
    onEscape() {
      hideCountryResults();
    },
  });

  searchInput.addEventListener("input", () => {
    renderCountryResults(searchInput.value);
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim()) {
      renderCountryResults(searchInput.value);
    }
  });

  function renderCountryResults(query) {
    const normalizedQuery = query.trim();
    resultsElement.innerHTML = "";

    if (!normalizedQuery) {
      hideCountryResults();
      return;
    }

    resultsElement.dataset.mode = "search";
    renderCountryList(filterCountryList(countryPool, normalizedQuery), translate("ui.noMatches", "No matches found."));
  }

  function renderCountryList(matchingCountries, emptyMessage) {
    resultsElement.innerHTML = "";
    resultsElement.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
    state.currentMatches = matchingCountries;
    resultKeyboard.handleResultsRendered({ sync: false });

    if (matchingCountries.length === 0) {
      searchInput.removeAttribute("aria-activedescendant");
      const emptyElement = document.createElement("div");
      emptyElement.className = "country-result-empty";
      emptyElement.textContent = emptyMessage;
      resultsElement.append(emptyElement);
      return;
    }

    matchingCountries.forEach((country, index) => {
      const resultElement = getCountryHref ? document.createElement("a") : document.createElement("button");
      resultElement.className = "country-result";
      if (getCountryHref) {
        resultElement.href = getCountryHref(country);
      } else {
        resultElement.type = "button";
      }
      resultElement.dataset.countryCode = country.code;
      resultElement.setAttribute("role", "option");
      resultElement.id = `country-result-${country.code}`;
      resultElement.setAttribute("aria-selected", String(index === resultKeyboard.getHighlightedIndex()));
      resultElement.dataset.isActiveCountry = String(country.code === state.selectedCountry?.code);
      resultElement.addEventListener("click", (event) => {
        if (getCountryHref && !onSelect) {
          return;
        }

        event.preventDefault();
        selectCountry(country);
      });

      resultElement.append(...createDefaultCountryResultContent(country));
      resultsElement.append(resultElement);
    });

    syncHighlightedCountry(resultKeyboard.getHighlightedIndex());
  }

  function createDefaultCountryResultContent(country) {
    const nameElement = document.createElement("span");
    nameElement.className = "country-result-name";
    nameElement.textContent = translateCountryName(country);

    const metaElement = document.createElement("span");
    metaElement.className = "country-result-meta";
    metaElement.textContent = formatCountryMetaText(country);

    return [nameElement, metaElement];
  }

  function selectCountry(country) {
    state.selectedCountry = country;
    searchInput.value = "";
    hideCountryResults();

    if (onSelect) {
      onSelect(country);
    } else if (getCountryHref) {
      window.location.href = getCountryHref(country);
    }
  }

  function syncHighlightedCountry(highlightedIndex = resultKeyboard.getHighlightedIndex()) {
    const resultButtons = Array.from(resultsElement.querySelectorAll(".country-result"));

    resultButtons.forEach((button, index) => {
      const isHighlighted = index === highlightedIndex;
      button.classList.toggle("is-highlighted", isHighlighted);
      button.setAttribute("aria-selected", String(isHighlighted));

      if (isHighlighted) {
        button.scrollIntoView({ block: "nearest" });
      }
    });

    const highlightedButton = resultButtons[highlightedIndex];

    if (highlightedButton) {
      searchInput.setAttribute("aria-activedescendant", highlightedButton.id);
    } else {
      searchInput.removeAttribute("aria-activedescendant");
    }
  }

  function hideCountryResults() {
    resultsElement.hidden = true;
    resultsElement.innerHTML = "";
    resultsElement.removeAttribute("data-mode");
    state.currentMatches = [];
    resultKeyboard.reset();
    searchInput.removeAttribute("aria-activedescendant");
    searchInput.setAttribute("aria-expanded", "false");
  }

  return {
    setSelectedCountry(country) {
      state.selectedCountry = country;
    },
    close() {
      hideCountryResults();
    },
  };
}

export function initializeSearchResultKeyboard({
  input,
  resultsElement,
  getItemCount,
  getItemAtIndex,
  onHighlightChange,
  onSelect,
  onEscape,
}) {
  const state = {
    highlightedIndex: -1,
    isComposing: false,
    highlightFirstAfterComposition: false,
  };

  input.addEventListener("compositionstart", () => {
    state.isComposing = true;
    state.highlightFirstAfterComposition = false;
  });

  input.addEventListener("compositionend", () => {
    state.isComposing = false;
  });

  input.addEventListener("keydown", (event) => {
    handleKeydown(event);
  });

  function handleResultsRendered({ sync = true } = {}) {
    const itemCount = getItemCount();
    state.highlightedIndex = state.highlightFirstAfterComposition && itemCount > 0 ? 0 : -1;
    state.highlightFirstAfterComposition = false;

    if (sync) {
      syncHighlight();
    }
  }

  function handleKeydown(event) {
    const itemCount = getItemCount();
    const hasOpenResults = !resultsElement.hidden && itemCount > 0;

    if (event.key === "Escape") {
      onEscape();
      return;
    }

    if (event.key === "Enter") {
      if (state.isComposing || isComposingSearchText(event)) {
        state.highlightFirstAfterComposition = true;

        if (hasOpenResults && state.highlightedIndex === -1) {
          state.highlightedIndex = 0;
          syncHighlight();
        }

        return;
      }

      if (!hasOpenResults) {
        return;
      }

      event.preventDefault();

      if (state.highlightedIndex === -1) {
        state.highlightedIndex = 0;
        syncHighlight();
        return;
      }

      const item = getItemAtIndex(state.highlightedIndex);

      if (item) {
        onSelect(item);
      }

      return;
    }

    if (!hasOpenResults) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      state.highlightedIndex = Math.min(state.highlightedIndex + 1, itemCount - 1);
      syncHighlight();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      state.highlightedIndex = Math.max(state.highlightedIndex - 1, 0);
      syncHighlight();
    }
  }

  function syncHighlight() {
    onHighlightChange(state.highlightedIndex);
  }

  return {
    getHighlightedIndex() {
      return state.highlightedIndex;
    },
    handleResultsRendered,
    reset() {
      state.highlightedIndex = -1;
      state.highlightFirstAfterComposition = false;
      syncHighlight();
    },
  };
}

function isComposingSearchText(event) {
  return event.isComposing || event.keyCode === 229;
}

export function filterCountries(query) {
  return filterCountryList(countries, query);
}

export function filterCountryList(countryList, query) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  const queryVariants = getSearchVariants(normalizedQuery);

  return countryList.filter((country) => {
    return getCountrySearchTerms(country).some((term) => {
      return queryVariants.some((queryVariant) => matchesSearchTerm(term, queryVariant));
    });
  });
}

function getCountrySearchTerms(country) {
  const terms = [
    ...getCountryNameSearchLabels(country),
    ...getExactTextSearchLabels(country.officialName),
    ...getCountrySearchAliases(country.code),
    country.slug,
    country.code,
  ];

  return [...new Set(terms.flatMap(getSearchVariants).filter(Boolean))];
}

function getCountrySearchAliases(countryCode) {
  const aliases = countrySearchAliases[countryCode] ?? {};
  return Object.values(aliases).flatMap((values) => (Array.isArray(values) ? values : []));
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function stripLeadingThe(value) {
  return value.replace(/^the\s+/, "").trim();
}

function matchesSearchTerm(term, query) {
  const comparisons = [
    [term, query],
    [term, stripLeadingThe(query)],
    [stripLeadingThe(term), query],
    [stripLeadingThe(term), stripLeadingThe(query)],
  ];

  return comparisons.some(([searchTerm, searchQuery]) => {
    if (!searchTerm || !searchQuery) {
      return false;
    }

    const compactTerm = compactSearchText(searchTerm);
    const compactQuery = compactSearchText(searchQuery);
    return searchTerm.includes(searchQuery) || compactTerm.includes(compactQuery);
  });
}

function getSearchVariants(value) {
  const normalizedValue = normalizeSearchText(value);
  const compactValue = compactSearchText(normalizedValue);

  return normalizedValue === compactValue ? [normalizedValue] : [normalizedValue, compactValue];
}

function compactSearchText(value) {
  return value.replace(/\s+/g, "");
}

export function sortCountriesByName(countryList) {
  return [...countryList].sort((countryA, countryB) => {
    return translateCountryName(countryA).localeCompare(translateCountryName(countryB), undefined, { sensitivity: "base" });
  });
}

export function formatCountryMetaText(country) {
  return country.region ? translateRegionLabel(country.region) : "";
}
