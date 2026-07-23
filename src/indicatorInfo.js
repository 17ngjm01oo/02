import { translateIndicatorInfo } from "./localization.js";

const indicatorInfoUrl = new URL("../data/indicator-info.json", import.meta.url);

let indicatorInfoDataPromise = null;

export function getIndicatorInfoData() {
  if (!indicatorInfoDataPromise) {
    indicatorInfoDataPromise = fetch(indicatorInfoUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load indicator info: ${response.status}`);
        }
        return response.json();
      })
      .catch(() => ({ rankings: {}, series: {} }));
  }

  return indicatorInfoDataPromise;
}

export function getIndicatorInfoBySeriesId(indicatorInfoData, seriesId) {
  const fallback = indicatorInfoData?.series?.[seriesId] ?? "";
  return translateIndicatorInfo("series", seriesId, fallback);
}

export function getIndicatorInfoByRankingDirectory(indicatorInfoData, directory) {
  const fallback = indicatorInfoData?.rankings?.[directory] ?? "";
  return translateIndicatorInfo("rankings", directory, fallback);
}
