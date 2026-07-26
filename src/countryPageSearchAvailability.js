const searchAvailabilityCache = new Map();

export async function getCountriesWithCountryPageData({ rootHref, pageKind, countryPool }) {
  const countryCodes = await getCountryCodesWithPageData(rootHref, pageKind);
  return countryPool.filter((country) => countryCodes.has(country.code));
}

export async function getCountryCodesBySeriesData({ rootHref, seriesIds }) {
  const availability = await loadIndicatorAvailability(rootHref);
  const countryCodesBySeries = new Map();

  seriesIds.forEach((seriesId) => {
    const countries = availability.series?.[seriesId]?.countries;
    if (!countries || typeof countries !== "object") {
      throw new Error(`Country indicator availability is missing series: ${seriesId}`);
    }

    countryCodesBySeries.set(seriesId, new Set(Object.keys(countries)));
  });

  return countryCodesBySeries;
}

async function getCountryCodesWithPageData(rootHref, pageKind) {
  const availability = await loadSearchAvailability(rootHref);
  const countryCodes = availability.countriesByPageKind?.[pageKind];

  if (!Array.isArray(countryCodes)) {
    throw new Error(`Country page search availability is missing page kind: ${pageKind}`);
  }

  return new Set(countryCodes);
}

function loadSearchAvailability(rootHref) {
  const url = new URL(`${rootHref}data/country-page-search-availability.json`, window.location.href).toString();
  return loadAvailability(url, "Country page search availability");
}

function loadIndicatorAvailability(rootHref) {
  const url = new URL(`${rootHref}data/country-indicator-availability.json`, window.location.href).toString();
  return loadAvailability(url, "Country indicator availability");
}

function loadAvailability(url, label) {
  let request = searchAvailabilityCache.get(url);

  if (!request) {
    request = fetch(url, { headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`${label} request failed: ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => {
        searchAvailabilityCache.delete(url);
        throw error;
      });
    searchAvailabilityCache.set(url, request);
  }

  return request;
}
