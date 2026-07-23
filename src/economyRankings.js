export const economyProfileRankings = [
  {
    seriesId: "gdp",
    directory: "gdp",
    label: "GDP",
    section: "GDP",
    countryPageKind: "gdp",
  },
  {
    seriesId: "gdpNational",
    section: "GDP",
    countryPageKind: "gdp",
  },
  {
    seriesId: "realGdp",
    section: "GDP",
    countryPageKind: "gdp",
  },
  {
    seriesId: "gdpPerCapita",
    directory: "gdp-per-capita",
    label: "GDP per Capita",
    section: "GDP per Capita",
    countryPageKind: "gdp-per-capita",
  },
  {
    seriesId: "gdpNationalPerCapita",
    section: "GDP per Capita",
    countryPageKind: "gdp-per-capita",
  },
  {
    seriesId: "realGdpPerCapita",
    section: "GDP per Capita",
    countryPageKind: "gdp-per-capita",
  },
  {
    seriesId: "ppp",
    directory: "ppp-gdp",
    label: "PPP GDP",
    section: "GDP",
    countryPageKind: "ppp-gdp",
  },
  {
    seriesId: "pppPerCapita",
    directory: "ppp-gdp-per-capita",
    label: "PPP GDP per Capita",
    section: "GDP per Capita",
    countryPageKind: "ppp-gdp-per-capita",
  },
  {
    seriesId: "gni",
    directory: "gni",
    label: "GNI",
    section: "GDP",
    countryPageKind: "gni",
  },
  {
    seriesId: "gniPerCapita",
    directory: "gni-per-capita",
    label: "GNI per Capita",
    section: "GDP per Capita",
    countryPageKind: "gni-per-capita",
  },
  {
    seriesId: "gdpGrowth",
    directory: "gdp-growth",
    label: "GDP Growth",
    section: "Economic Growth",
    countryPageKind: "gdp-growth",
  },
  {
    seriesId: "inflationRate",
    directory: "inflation-rate",
    label: "Inflation Rate",
    section: "Prices and Inflation",
    countryPageKind: "inflation-rate",
  },
  {
    seriesId: "unemploymentRate",
    directory: "unemployment-rate",
    label: "Unemployment Rate",
    section: "Labor Market",
    countryPageKind: "unemployment-rate",
  },
];

export const economyRankings = economyProfileRankings.filter(({ directory }) => directory);
