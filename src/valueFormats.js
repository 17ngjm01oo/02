// Spread a shared preset into a series config, then override only true exceptions.
export const valueFormats = {
  gdpMagnitude: {
    valueScaleMode: "gdpMagnitude",
  },
  currencyUnitsWhole: {
    valueScaleMode: "currencyUnitsMagnitude",
    maximumFractionDigits: 0,
  },
  nationalCurrencyMagnitude: {
    valueScaleMode: "nationalCurrencyMagnitude",
  },
  percentOneDecimal: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
  decimalOne: {
    maximumFractionDigits: 1,
  },
  decimalTwo: {
    maximumFractionDigits: 2,
  },
  decimalThree: {
    maximumFractionDigits: 3,
  },
  populationUnitsMagnitude: {
    valueScaleMode: "populationUnitsMagnitude",
  },
  populationMagnitude: {
    valueScaleMode: "populationMagnitude",
  },
  internationalDollarMagnitude: {
    valueScaleMode: "internationalDollarMagnitude",
  },
  usdMillionsMagnitude: {
    valueScaleMode: "usdMillionsMagnitude",
  },
  usdMagnitude: {
    valueScaleMode: "usdMagnitude",
  },
  areaMagnitude: {
    valueScaleMode: "areaMagnitude",
    fallbackMaximumFractionDigits: 0,
    fallbackSmallValueMaximumFractionDigits: 2,
    fallbackSmallValueThreshold: 10,
  },
  co2Emissions: {
    valueScaleMode: "populationUnitsMagnitude",
    fallbackMaximumFractionDigits: 2,
    fallbackSmallValueMaximumFractionDigits: 4,
    fallbackSmallValueThreshold: 10,
    fallbackIntegerValueThreshold: 1000,
    suffix: "Mt",
  },
  co2EmissionsPerCapita: {
    suffix: "t",
    maximumFractionDigits: 2,
  },
};
