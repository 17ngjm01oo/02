export const societyProfileRankings = [
  {
    seriesId: "hdi",
    directory: "hdi",
    label: "HDI",
    countryPageKind: "hdi",
    section: "Living Standards",
  },
  {
    seriesId: "militarySpending",
    directory: "military-spending",
    label: "Military Spending",
    countryPageKind: "military-spending",
    countryPageLabel: "Military Spending",
    section: "Defense",
  },
  {
    seriesId: "militarySpendingPercentGdp",
    directory: "military-spending-percent-gdp",
    label: "Military Spending (% of GDP)",
    countryPageKind: "military-spending",
    countryPageLabel: "Military Spending",
    section: "Defense",
  },
];

export const societyRankings = societyProfileRankings.filter(({ directory }) => directory);
