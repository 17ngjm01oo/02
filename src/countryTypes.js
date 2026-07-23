export const countryTypes = {
  country: "Country",
  territory: "Territory",
};

const territoryCodes = new Set([
  "ASM",
  "AIA",
  "ABW",
  "BMU",
  "VGB",
  "CYM",
  "CUW",
  "FLK",
  "FRO",
  "GUF",
  "PYF",
  "GIB",
  "GRL",
  "GLP",
  "GUM",
  "HKG",
  "IMN",
  "MAC",
  "MTQ",
  "MYT",
  "MSR",
  "NCL",
  "MNP",
  "PCN",
  "PRI",
  "REU",
  "SHN",
  "MAF",
  "SPM",
  "SXM",
  "TKL",
  "TCA",
  "VIR",
  "WLF",
]);

export function getCountryType(countryOrCode) {
  const countryCode = typeof countryOrCode === "string" ? countryOrCode : countryOrCode?.code;
  return territoryCodes.has(countryCode) ? countryTypes.territory : countryTypes.country;
}

export function isTerritory(countryOrCode) {
  return getCountryType(countryOrCode) === countryTypes.territory;
}

export function markTerritoryElement(element, countryOrCode) {
  element.classList.toggle("is-territory", isTerritory(countryOrCode));
}
