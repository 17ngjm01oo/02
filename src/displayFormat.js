import { getPageLocale, localeConfigs } from "./localization.js";

const basicMagnitudeModes = {
  gdpMagnitude: "billions",
  usdMillionsMagnitude: "millions",
  usdMagnitude: "units",
  internationalDollarMagnitude: "billions",
  nationalCurrencyMagnitude: "billions",
};

export function getDisplayScale(points, config) {
  const basicMagnitudeInput = basicMagnitudeModes[config.valueScaleMode];

  if (basicMagnitudeInput) {
    return getMagnitudeDisplayScale(points, getMagnitudeInput(basicMagnitudeInput));
  }

  if (config.valueScaleMode === "currencyUnitsMagnitude") {
    return getMagnitudeDisplayScale(points, getMagnitudeInput("units"), {
      maximumFractionDigits: config.maximumFractionDigits ?? 0,
      tooltipUnit: config.tooltipUnit ?? "",
    });
  }

  if (config.valueScaleMode === "populationMagnitude") {
    return getMagnitudeDisplayScale(points, getMagnitudeInput("people"), {
      valueScale: 1000000,
      maximumFractionDigits: 0,
    });
  }

  if (config.valueScaleMode === "populationUnitsMagnitude") {
    return getMagnitudeDisplayScale(points, getMagnitudeInput("units"), {
      maximumFractionDigits: config.fallbackMaximumFractionDigits ?? 0,
      smallValueMaximumFractionDigits: config.fallbackSmallValueMaximumFractionDigits,
      smallValueThreshold: config.fallbackSmallValueThreshold,
      integerValueThreshold: config.fallbackIntegerValueThreshold,
      suffix: config.suffix,
      suffixSpacing: config.suffixSpacing,
    });
  }

  if (config.valueScaleMode === "areaMagnitude") {
    return getMagnitudeDisplayScale(points, getMagnitudeInput("units"), {
      maximumFractionDigits: config.fallbackMaximumFractionDigits ?? 0,
      smallValueMaximumFractionDigits: config.fallbackSmallValueMaximumFractionDigits ?? 2,
      smallValueThreshold: config.fallbackSmallValueThreshold ?? 10,
    });
  }

  return {
    valueScale: config.valueScale ?? 1,
    tooltipPrefix: config.tooltipPrefix ?? "",
    tooltipUnit: config.tooltipUnit ?? "",
    tickPrefix: config.tickPrefix ?? "",
    suffix: config.suffix ?? "",
    suffixSpacing: config.suffixSpacing ?? " ",
    compactUnit: config.compactUnit ?? "",
    locale: getNumberFormatLocale(),
    maximumFractionDigits: config.maximumFractionDigits ?? 1,
  };
}

export function getSingleValueDisplayScale(value, config) {
  return getDisplayScale([{ value }], config);
}

const rawMagnitudeStepsByFormat = {
  western: {
    compactFromMillions: [
      { threshold: 1000000000000000, valueScale: 0.000000000000001, compactUnit: "Q", fixedFractionDigits: 2 },
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: "T", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: "B" },
      { threshold: Number.NEGATIVE_INFINITY, valueScale: 0.000001, compactUnit: "M" },
    ],
    compactFromUnits: [
      { threshold: 1000000000000000, valueScale: 0.000000000000001, compactUnit: "Q", fixedFractionDigits: 2 },
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: "T", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: "B" },
      { threshold: 1000000, valueScale: 0.000001, compactUnit: "M" },
    ],
  },
  japanese: {
    compactFromMillions: [
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: "兆", fixedFractionDigits: 2 },
      { threshold: 100000000, valueScale: 0.00000001, compactUnit: "億" },
      { threshold: Number.NEGATIVE_INFINITY, valueScale: 0.0001, compactUnit: "万" },
    ],
    compactFromUnits: [
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: "兆", fixedFractionDigits: 2 },
      { threshold: 100000000, valueScale: 0.00000001, compactUnit: "億" },
      { threshold: 10000, valueScale: 0.0001, compactUnit: "万" },
    ],
  },
  spanish: {
    compactFromMillions: [
      { threshold: 1000000000000000, valueScale: 0.000000000000001, compactUnit: " mil bill.", fixedFractionDigits: 2 },
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " bill.", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " mil M" },
      { threshold: Number.NEGATIVE_INFINITY, valueScale: 0.000001, compactUnit: " M" },
    ],
    compactFromUnits: [
      { threshold: 1000000000000000, valueScale: 0.000000000000001, compactUnit: " mil bill.", fixedFractionDigits: 2 },
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " bill.", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " mil M" },
      { threshold: 1000000, valueScale: 0.000001, compactUnit: " M" },
    ],
  },
  french: {
    compactFromMillions: [
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " Bn", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " Md" },
      { threshold: Number.NEGATIVE_INFINITY, valueScale: 0.000001, compactUnit: " M" },
    ],
    compactFromUnits: [
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " Bn", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " Md" },
      { threshold: 1000000, valueScale: 0.000001, compactUnit: " M" },
    ],
  },
  brazilian_portuguese: {
    compactFromMillions: [
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " tri", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " bi" },
      { threshold: Number.NEGATIVE_INFINITY, valueScale: 0.000001, compactUnit: " mi" },
    ],
    compactFromUnits: [
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " tri", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " bi" },
      { threshold: 1000000, valueScale: 0.000001, compactUnit: " mi" },
    ],
  },
  german: {
    compactFromMillions: [
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " Bio.", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " Mrd." },
      { threshold: Number.NEGATIVE_INFINITY, valueScale: 0.000001, compactUnit: " Mio." },
    ],
    compactFromUnits: [
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " Bio.", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " Mrd." },
      { threshold: 1000000, valueScale: 0.000001, compactUnit: " Mio." },
    ],
  },
  italian: {
    compactFromMillions: [
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " mila mld", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " mld" },
      { threshold: Number.NEGATIVE_INFINITY, valueScale: 0.000001, compactUnit: " mln" },
    ],
    compactFromUnits: [
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " mila mld", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " mld" },
      { threshold: 1000000, valueScale: 0.000001, compactUnit: " mln" },
    ],
  },
  korean: {
    compactFromMillions: [
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: "조", fixedFractionDigits: 2 },
      { threshold: 100000000, valueScale: 0.00000001, compactUnit: "억" },
      { threshold: Number.NEGATIVE_INFINITY, valueScale: 0.0001, compactUnit: "만" },
    ],
    compactFromUnits: [
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: "조", fixedFractionDigits: 2 },
      { threshold: 100000000, valueScale: 0.00000001, compactUnit: "억" },
      { threshold: 10000, valueScale: 0.0001, compactUnit: "만" },
    ],
  },
  turkish: {
    compactFromMillions: [
      { threshold: 1000000000000000, valueScale: 0.000000000000001, compactUnit: " katrilyon", fixedFractionDigits: 2 },
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " trilyon", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " milyar" },
      { threshold: Number.NEGATIVE_INFINITY, valueScale: 0.000001, compactUnit: " milyon" },
    ],
    compactFromUnits: [
      { threshold: 1000000000000000, valueScale: 0.000000000000001, compactUnit: " katrilyon", fixedFractionDigits: 2 },
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " trilyon", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " milyar" },
      { threshold: 1000000, valueScale: 0.000001, compactUnit: " milyon" },
    ],
  },
  indonesian: {
    compactFromMillions: [
      { threshold: 1000000000000000, valueScale: 0.000000000000001, compactUnit: " kuadriliun", fixedFractionDigits: 2 },
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " triliun", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " miliar" },
      { threshold: Number.NEGATIVE_INFINITY, valueScale: 0.000001, compactUnit: " juta" },
    ],
    compactFromUnits: [
      { threshold: 1000000000000000, valueScale: 0.000000000000001, compactUnit: " kuadriliun", fixedFractionDigits: 2 },
      { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: " triliun", fixedFractionDigits: 2 },
      { threshold: 1000000000, valueScale: 0.000000001, compactUnit: " miliar" },
      { threshold: 1000000, valueScale: 0.000001, compactUnit: " juta" },
    ],
  },
};

const magnitudeInputs = {
  billions: {
    rawValueScale: 1000000000,
    stepsKey: "compactFromMillions",
  },
  millions: {
    rawValueScale: 1000000,
    stepsKey: "compactFromMillions",
  },
  units: {
    rawValueScale: 1,
    stepsKey: "compactFromUnits",
  },
  people: {
    rawValueScale: 1000000,
    stepsKey: "compactFromUnits",
  },
};

function getMagnitudeInput(inputKey) {
  const locale = getNumberFormatLocale();
  const input = magnitudeInputs[inputKey];
  const magnitudeFormat = localeConfigs[getPageLocale()]?.magnitudeFormat;
  const steps = rawMagnitudeStepsByFormat[magnitudeFormat]?.[input.stepsKey];
  if (!steps) {
    throw new Error(`Unsupported magnitude format for locale: ${getPageLocale()}`);
  }

  return {
    ...input,
    locale,
    steps,
  };
}

function getMagnitudeDisplayScale(points, magnitudeInput, fallback = {}) {
  const maxRawValue = Math.max(...points.map((point) => Math.abs(point.value * magnitudeInput.rawValueScale)));
  const magnitudeSteps = magnitudeInput.steps;
  const magnitudeStep = magnitudeSteps.find((step) => maxRawValue >= step.threshold);

  if (!magnitudeStep) {
    return {
      valueScale: fallback.valueScale ?? 1,
      tooltipPrefix: "",
      tooltipUnit: fallback.tooltipUnit ?? "",
      tickPrefix: "",
      suffix: fallback.suffix ?? "",
      suffixSpacing: fallback.suffixSpacing ?? " ",
      compactUnit: "",
      locale: magnitudeInput.locale,
      rawValueScale: magnitudeInput.rawValueScale,
      adaptiveCompactSteps: magnitudeSteps,
      adaptiveFallbackValueScale: fallback.valueScale ?? 1,
      adaptiveFallbackMaximumFractionDigits: fallback.maximumFractionDigits ?? 0,
      smallValueMaximumFractionDigits: fallback.smallValueMaximumFractionDigits,
      smallValueThreshold: fallback.smallValueThreshold,
      integerValueThreshold: fallback.integerValueThreshold,
      maximumFractionDigits: fallback.maximumFractionDigits ?? 0,
    };
  }

  const displayValue = maxRawValue * magnitudeStep.valueScale;

  return {
    valueScale: magnitudeInput.rawValueScale * magnitudeStep.valueScale,
    tooltipPrefix: "",
    tickPrefix: "",
    suffix: fallback.suffix ?? "",
    suffixSpacing: fallback.suffixSpacing ?? " ",
    compactUnit: magnitudeStep.compactUnit,
    locale: magnitudeInput.locale,
    rawValueScale: magnitudeInput.rawValueScale,
    adaptiveCompactSteps: magnitudeSteps,
    adaptiveFallbackValueScale: fallback.valueScale ?? 1,
    adaptiveFallbackMaximumFractionDigits: fallback.maximumFractionDigits ?? 0,
    smallValueMaximumFractionDigits: fallback.smallValueMaximumFractionDigits,
    smallValueThreshold: fallback.smallValueThreshold,
    integerValueThreshold: fallback.integerValueThreshold,
    maximumFractionDigits: magnitudeStep.fixedFractionDigits ?? getMagnitudeFractionDigits(displayValue),
  };
}

function getMagnitudeFractionDigits(maxDisplayValue) {
  if (maxDisplayValue >= 100) {
    return 0;
  }

  if (maxDisplayValue >= 10) {
    return 1;
  }

  return 2;
}

function getNumberFormatLocale() {
  return localeConfigs[getPageLocale()]?.numberLocale ?? "en-US";
}

function formatNumber(value, maximumFractionDigits = 1, locale = getNumberFormatLocale()) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
  }).format(value);
}

export function formatAxisTickValue(value, displayScale) {
  if (Number(value) === 0 && displayScale.suffix !== "%") {
    return formatNumber(0, 0, displayScale.locale);
  }

  if (displayScale.adaptiveCompactSteps) {
    return formatAdaptiveCompactValue(value / displayScale.valueScale, displayScale);
  }

  const formattedValue = formatNumber(value, displayScale.maximumFractionDigits, displayScale.locale);
  const compactUnit = displayScale.compactUnit ?? "";
  const suffixSpacing = displayScale.suffixSpacing ?? (displayScale.suffix ? " " : "");
  const suffix = displayScale.suffix ? `${suffixSpacing}${displayScale.suffix}` : "";

  return `${displayScale.tickPrefix}${formattedValue}${compactUnit}${suffix}`;
}

export function formatDisplayValue(value, displayScale) {
  const formattedValue = formatNumber(value * displayScale.valueScale, displayScale.maximumFractionDigits, displayScale.locale);
  const unit = displayScale.tooltipUnit ? ` ${displayScale.tooltipUnit}` : "";
  const suffixSpacing = displayScale.suffixSpacing ?? (displayScale.suffix ? " " : "");
  const suffix = displayScale.suffix ? `${suffixSpacing}${displayScale.suffix}` : "";

  return `${displayScale.tooltipPrefix}${formattedValue}${unit}${suffix}`;
}

export function formatCompactDisplayValue(value, displayScale) {
  if (displayScale.adaptiveCompactSteps) {
    return formatAdaptiveCompactValue(value, displayScale);
  }

  if (!displayScale.compactUnit) {
    return formatDisplayValue(value, displayScale);
  }

  const formattedValue = formatNumber(value * displayScale.valueScale, displayScale.maximumFractionDigits, displayScale.locale);

  return `${displayScale.tooltipPrefix}${formattedValue}${displayScale.compactUnit}`;
}

function formatAdaptiveCompactValue(value, displayScale) {
  const rawValue = value * (displayScale.rawValueScale ?? 1);
  const magnitudeStep = displayScale.adaptiveCompactSteps.find((step) => Math.abs(rawValue) >= step.threshold);

  if (!magnitudeStep) {
    const fallbackValue = value * (displayScale.adaptiveFallbackValueScale ?? 1);
    const formattedValue = formatNumber(
      fallbackValue,
      getAdaptiveFallbackFractionDigits(fallbackValue, displayScale),
      displayScale.locale,
    );
    const unit = displayScale.tooltipUnit ? ` ${displayScale.tooltipUnit}` : "";
    const suffixValue = displayScale.suffix;
    const suffixSpacing = displayScale.suffixSpacing ?? (suffixValue ? " " : "");
    const suffix = suffixValue ? `${suffixSpacing}${suffixValue}` : "";

    return `${displayScale.tooltipPrefix}${formattedValue}${unit}${suffix}`;
  }

  const displayValue = rawValue * magnitudeStep.valueScale;
  const maximumFractionDigits = magnitudeStep.fixedFractionDigits ?? getMagnitudeFractionDigits(Math.abs(displayValue));
  const formattedValue = formatNumber(displayValue, maximumFractionDigits, displayScale.locale);
  const suffixValue = displayScale.suffix;
  const suffixSpacing = displayScale.suffixSpacing ?? (suffixValue ? " " : "");
  const suffix = suffixValue ? `${suffixSpacing}${suffixValue}` : "";
  return `${displayScale.tooltipPrefix}${formattedValue}${magnitudeStep.compactUnit}${suffix}`;
}

function getAdaptiveFallbackFractionDigits(value, displayScale) {
  const defaultFractionDigits = displayScale.adaptiveFallbackMaximumFractionDigits;
  const smallValueMaximumFractionDigits = displayScale.smallValueMaximumFractionDigits;

  if (Math.abs(value) >= (displayScale.integerValueThreshold ?? Number.POSITIVE_INFINITY)) {
    return 0;
  }

  if (
    smallValueMaximumFractionDigits != null
    && value !== 0
    && Math.abs(value) < (displayScale.smallValueThreshold ?? 10)
  ) {
    return smallValueMaximumFractionDigits;
  }

  return defaultFractionDigits;
}
