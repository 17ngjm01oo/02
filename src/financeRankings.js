export const financeProfileRankings = [
  {
    seriesId: "governmentGrossDebt",
    directory: "government-gross-debt",
    label: "Government Gross Debt (% of GDP)",
    countryPageKind: "government-debt",
    countryPageLabel: "Government Debt",
    section: "Government Debt",
  },
  {
    seriesId: "governmentGrossDebtNational",
    countryPageKind: "government-debt",
    section: "Government Debt",
  },
  {
    seriesId: "governmentNetDebt",
    directory: "government-net-debt",
    label: "Government Net Debt (% of GDP)",
    countryPageKind: "government-debt",
    countryPageLabel: "Government Debt",
    section: "Government Debt",
  },
  {
    seriesId: "governmentNetDebtNational",
    countryPageKind: "government-debt",
    section: "Government Debt",
  },
  {
    seriesId: "fiscalBalance",
    directory: "fiscal-balance",
    label: "Fiscal Balance (% of GDP)",
    countryPageKind: "fiscal-balance",
    countryPageLabel: "Fiscal Balance",
    section: "Fiscal Balance",
  },
  {
    seriesId: "fiscalBalanceNational",
    countryPageKind: "fiscal-balance",
    section: "Fiscal Balance",
  },
  {
    seriesId: "primaryFiscalBalance",
    directory: "primary-fiscal-balance",
    label: "Primary Fiscal Balance (% of GDP)",
    countryPageKind: "fiscal-balance",
    countryPageLabel: "Fiscal Balance",
    section: "Fiscal Balance",
  },
  {
    seriesId: "primaryFiscalBalanceNational",
    countryPageKind: "fiscal-balance",
    section: "Fiscal Balance",
  },
  {
    seriesId: "governmentRevenue",
    directory: "government-revenue",
    label: "Government Revenue (% of GDP)",
    countryPageKind: "government-revenue-spending",
    countryPageLabel: "Government Revenue and Spending",
    section: "Revenue and Spending",
  },
  {
    seriesId: "governmentRevenueNational",
    countryPageKind: "government-revenue-spending",
    section: "Revenue and Spending",
  },
  {
    seriesId: "governmentSpending",
    directory: "government-spending",
    label: "Government Spending (% of GDP)",
    countryPageKind: "government-revenue-spending",
    countryPageLabel: "Government Revenue and Spending",
    section: "Revenue and Spending",
  },
  {
    seriesId: "governmentSpendingNational",
    countryPageKind: "government-revenue-spending",
    section: "Revenue and Spending",
  },
  {
    seriesId: "totalReservesIncludingGold",
    directory: "total-reserves",
    label: "Total Reserves",
    countryPageKind: "total-reserves",
    section: "International Reserves",
  },
];

export const financeRankings = financeProfileRankings.filter(({ directory }) => directory);
