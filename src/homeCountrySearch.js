function initializeHomeCountrySearch() {
  const searchInput = document.querySelector("#homeCountrySearchInput");
  if (!searchInput) {
    return;
  }

  let initializationPromise = null;

  const initializeCountrySearch = () => {
    initializationPromise ??= Promise.all([
      import("./countries.js"),
      import("./countrySelector.js"),
    ]).then(([{ countries }, { initializeCountrySelector }]) => {
      const countryPool = countries.filter((country) => country.slug);
      const selector = initializeCountrySelector({
        countryPool,
        placeholderKey: "ui.countrySearchPlaceholder",
        placeholder: "Search countries or territories",
        searchInputSelector: "#homeCountrySearchInput",
        resultsSelector: "#homeCountrySearchResults",
        getCountryHref(country) {
          return `./countries/${country.slug}/`;
        },
      });

      if (searchInput.value.trim()) {
        searchInput.dispatchEvent(new Event("input"));
      }

      return selector;
    });
  };

  searchInput.addEventListener("focus", initializeCountrySearch, { once: true });
  searchInput.addEventListener("input", initializeCountrySearch, { once: true });
}

initializeHomeCountrySearch();
