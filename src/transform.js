import {
  getObservationStatusForYear,
  getSeriesObservationStatus,
  getSeriesValues,
  isHighlightedObservationStatus,
  normalizeSeriesValue,
} from "./seriesData.js";

export function transformSeriesData(rawResponse, seriesConfig) {
  const { indicatorCode, countryCode, startYear, endYear } = seriesConfig;
  console.groupCollapsed("[Static Data] Inspecting series data");
  console.log({
    indicatorCode,
    countryCode,
    startYear,
    endYear,
    availableIndicators: getAvailableIndicators(rawResponse),
  });
  console.groupEnd();

  const preferredSeries = getSeriesValues(rawResponse, { indicatorCode, countryCode });
  const observationStatus = getSeriesObservationStatus(rawResponse, { indicatorCode, countryCode });

  if (!preferredSeries) {
    console.info("[Static Data] No series data found for the requested country and indicator.", {
      indicatorCode,
      countryCode,
    });
    return [];
  }

  const points = Object.entries(preferredSeries)
    .map(([yearKey, value]) => {
      const pointObservationStatus = getObservationStatusForYear(observationStatus, yearKey);
      return {
        year: Number.parseInt(yearKey, 10),
        value: normalizeSeriesValue(value),
        observationStatus: pointObservationStatus,
        observationStatusHighlighted: isHighlightedObservationStatus(pointObservationStatus, seriesConfig),
      };
    })
    .filter(({ year, value }) => {
      return (
        Number.isInteger(year) &&
        year >= startYear &&
        year <= endYear &&
        Number.isFinite(value)
      );
    })
    .sort((a, b) => a.year - b.year);

  console.table(points);

  if (points.length === 0) {
    console.info("[Static Data] Series exists, but no numeric points matched the requested period.", {
      indicatorCode,
      countryCode,
      startYear,
      endYear,
    });
  }

  return points;
}

function getAvailableIndicators(rawResponse) {
  if (rawResponse?.indicators && typeof rawResponse.indicators === "object") {
    return Object.keys(rawResponse.indicators);
  }

  if (rawResponse?.values && typeof rawResponse.values === "object") {
    return Object.keys(rawResponse.values);
  }

  return [];
}
