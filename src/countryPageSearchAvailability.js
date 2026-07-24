const searchAvailabilityCache = new Map();

export async function getCountriesWithCountryPageData({ rootHref, pageKind, countryPool }) {
  const countryCodes = await getCountryCodesWithPageData(rootHref, pageKind);
  return countryPool.filter((country) => countryCodes.has(country.code));
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
  let request = searchAvailabilityCache.get(url);

  if (!request) {
    request = fetch(url, { headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Country page search availability request failed: ${response.status}`);
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
