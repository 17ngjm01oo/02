import { economyProfileRankings, economyRankings } from "./economyRankings.js";
import { environmentRankings } from "./environmentRankings.js";
import { financeProfileRankings, financeRankings } from "./financeRankings.js";
import { populationRankings } from "./populationRankings.js";
import { getCountryIndicatorLinks } from "./rankingLinks.js";
import { societyProfileRankings, societyRankings } from "./societyRankings.js";
import { tradeRankings } from "./tradeRankings.js";

function pickRankings(rankings, seriesIds) {
  const rankingBySeriesId = new Map(rankings.map((ranking) => [ranking.seriesId, ranking]));
  return seriesIds.map((seriesId) => rankingBySeriesId.get(seriesId)).filter(Boolean);
}

const categoryDefinitions = [
  {
    id: "economy",
    label: "Economy",
    navSelector: "#economyTopNav, #rankingTopNav",
    rankings: economyRankings,
    overviewRankings: pickRankings(economyRankings, ["gdp", "gdpPerCapita", "gdpGrowth", "unemploymentRate"]),
    profileRankings: economyProfileRankings,
  },
  {
    id: "population",
    label: "Population",
    navSelector: "#populationTopNav",
    rankings: populationRankings,
    overviewRankings: pickRankings(populationRankings, ["population", "populationGrowth", "fertilityRate"]),
  },
  {
    id: "trade",
    label: "Trade",
    navSelector: "#tradeTopNav",
    rankings: tradeRankings,
    overviewRankings: pickRankings(tradeRankings, [
      "tradeBalance",
      "exports",
      "imports",
    ]),
  },
  {
    id: "government-finance",
    label: "Government Finance",
    navSelector: "#governmentFinanceTopNav",
    rankings: financeRankings,
    overviewRankings: pickRankings(financeRankings, [
      "governmentGrossDebt",
      "fiscalBalance",
    ]),
    profileRankings: financeProfileRankings,
  },
  {
    id: "society",
    label: "Society",
    navSelector: "#societyTopNav",
    rankings: societyRankings,
    overviewRankings: pickRankings(societyRankings, ["hdi"]),
    profileRankings: societyProfileRankings,
  },
  {
    id: "environment",
    label: "Environment",
    navSelector: "#environmentTopNav",
    rankings: environmentRankings,
    overviewRankings: pickRankings(environmentRankings, ["co2EmissionsPerCapita", "area"]),
  },
];

export const rankingCategories = categoryDefinitions.map((category) => ({
  ...category,
  overviewRankings: category.overviewRankings ?? category.rankings,
  profileRankings: category.profileRankings ?? category.rankings,
  indicatorLinks: getCountryIndicatorLinks(category.rankings),
}));

export const rankingCategoryById = Object.fromEntries(
  rankingCategories.map((category) => [category.id, category]),
);

export const countryPageRankings = rankingCategories
  .flatMap((category) => category.rankings)
  .filter((ranking) => ranking.countryPageKind);

export const countryPageKindByRankingDirectory = Object.fromEntries(
  countryPageRankings.map((ranking) => [ranking.directory, ranking.countryPageKind]),
);
