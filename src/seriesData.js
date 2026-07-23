export function getSeriesValues(rawData, { indicatorCode, countryCode }) {
  return rawData?.economies?.[countryCode]?.series?.[indicatorCode]?.values ?? null;
}

export function getSeriesObservationStatus(rawData, { indicatorCode, countryCode }) {
  return rawData?.economies?.[countryCode]?.series?.[indicatorCode]?.observationStatus ?? null;
}

export function getObservationStatusForYear(observationStatus, year) {
  const numericYear = Number.parseInt(year, 10);
  if (!Number.isInteger(numericYear) || !observationStatus) {
    return "unknown";
  }

  if (isYearInRanges(numericYear, observationStatus.estimatedRanges)) {
    return "estimated";
  }
  if (isYearInRanges(numericYear, observationStatus.projectedRanges)) {
    return "projected";
  }
  if (isYearInRanges(numericYear, observationStatus.estimatedOrProjectedRanges)) {
    return "estimated_or_projected";
  }
  if (isYearInRanges(numericYear, observationStatus.unknownStatusRanges)) {
    return "unknown";
  }

  const actualThrough = Number.parseInt(observationStatus.actualThrough, 10);
  if (Number.isInteger(actualThrough) && numericYear <= actualThrough) {
    return "actual";
  }

  return "unknown";
}

const defaultObservationStatusHighlightStatuses = ["estimated", "projected", "estimated_or_projected"];

export function getObservationStatusHighlightStatuses(config = {}) {
  return Array.isArray(config?.observationStatusHighlightStatuses)
    ? config.observationStatusHighlightStatuses
    : defaultObservationStatusHighlightStatuses;
}

export function isHighlightedObservationStatus(status, config = {}) {
  return getObservationStatusHighlightStatuses(config).includes(status);
}

export function isEstimatedObservationStatus(status) {
  return status === "estimated" || status === "projected" || status === "estimated_or_projected";
}

export function getIndicatorSeriesMap(rawData, indicatorCode) {
  if (!rawData?.economies || typeof rawData.economies !== "object") {
    return null;
  }

  return Object.fromEntries(
    Object.entries(rawData.economies)
      .map(([countryCode, economy]) => {
        const values = economy?.series?.[indicatorCode]?.values;
        return values && typeof values === "object" ? [countryCode, values] : null;
      })
      .filter(Boolean),
  );
}

export function hasSeriesDataInRange(rawData, { indicatorCode, countryCode, startYear, endYear }) {
  const values = getSeriesValues(rawData, { indicatorCode, countryCode });

  if (!values || typeof values !== "object") {
    return false;
  }

  return Object.entries(values).some(([yearKey, value]) => {
    const year = Number.parseInt(yearKey, 10);
    return (
      Number.isInteger(year) &&
      year >= startYear &&
      year <= endYear &&
      Number.isFinite(normalizeSeriesValue(value))
    );
  });
}

export function normalizeSeriesValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = Number.parseFloat(value.replaceAll(",", ""));
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

function isYearInRanges(year, ranges) {
  if (!Array.isArray(ranges)) {
    return false;
  }

  return ranges.some((range) => {
    if (!Array.isArray(range) || range.length !== 2) {
      return false;
    }
    const start = Number.parseInt(range[0], 10);
    const end = Number.parseInt(range[1], 10);
    return Number.isInteger(start) && Number.isInteger(end) && start <= year && year <= end;
  });
}
