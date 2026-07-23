export function countryBelongsToRegion(country, regionId) {
  return country.region?.trim() === regionId;
}

export function filterCountriesByScope(countryList, scope) {
  if (!scope || scope.type === "world") {
    return countryList;
  }

  if (scope.type === "region") {
    return countryList.filter((country) => countryBelongsToRegion(country, scope.id));
  }

  if (scope.type === "category") {
    return countryList.filter((country) => country.categories?.includes(scope.id));
  }

  return countryList;
}
