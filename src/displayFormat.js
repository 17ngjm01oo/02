import { getPageLocale, localeConfigs } from "./localization.js";
import {
  compactMagnitudePrecision,
  magnitudeInputs,
  rawMagnitudeStepsByFormat,
} from "./valueFormats.js";

const basicMagnitudeModes = {
  billionsMagnitude: "billions",
  millionsMagnitude: "millions",
};

export function getDisplayScale(points, config) {
  const resolvedConfig = config;
  const magnitudeInputKey = basicMagnitudeModes[resolvedConfig.valueScaleMode];
  const compactPrecisionPolicy = getCompactPrecisionPolicy(resolvedConfig);

  if (magnitudeInputKey) {
    return getMagnitudeDisplayScale(points, getMagnitudeInput(magnitudeInputKey), { compactPrecisionPolicy });
  }

  if (resolvedConfig.valueScaleMode === "unitsMagnitude") {
    const fallbackMaximumFractionDigits = resolvedConfig.fallbackMaximumFractionDigits
      ?? (resolvedConfig.fallbackPrecisionMode === "compact"
        ? compactPrecisionPolicy.maximumFractionDigits
        : 0);
    return getMagnitudeDisplayScale(points, getMagnitudeInput("units"), {
      maximumFractionDigits: fallbackMaximumFractionDigits,
      smallValueMaximumFractionDigits: resolvedConfig.fallbackSmallValueMaximumFractionDigits,
      smallValueThreshold: resolvedConfig.fallbackSmallValueThreshold,
      integerValueThreshold: resolvedConfig.fallbackIntegerValueThreshold,
      lowerUnitThreshold: resolvedConfig.lowerUnitThreshold,
      lowerUnitValueScale: resolvedConfig.lowerUnitValueScale,
      lowerUnitSuffix: resolvedConfig.lowerUnitSuffix,
      suffix: resolvedConfig.suffix,
      suffixSpacing: resolvedConfig.suffixSpacing,
      compactPrecisionPolicy,
    });
  }

  return {
    valueScale: resolvedConfig.valueScale ?? 1,
    tooltipPrefix: resolvedConfig.tooltipPrefix ?? "",
    tooltipUnit: resolvedConfig.tooltipUnit ?? "",
    tickPrefix: resolvedConfig.tickPrefix ?? "",
    suffix: resolvedConfig.suffix ?? "",
    suffixSpacing: resolvedConfig.suffixSpacing ?? " ",
    compactUnit: resolvedConfig.compactUnit ?? "",
    locale: getNumberFormatLocale(),
    maximumFractionDigits: resolvedConfig.maximumFractionDigits ?? 1,
    integerValueThreshold: resolvedConfig.integerValueThreshold,
  };
}

function getCompactPrecisionPolicy(config) {
  return {
    maximumFractionDigits: config.compactMaximumFractionDigits ?? compactMagnitudePrecision.maximumFractionDigits,
    significantDigitBudget: config.compactSignificantDigitBudget ?? compactMagnitudePrecision.significantDigitBudget,
    integerValueThreshold: config.compactIntegerValueThreshold ?? compactMagnitudePrecision.integerValueThreshold,
  };
}

export function getSingleValueDisplayScale(value, config) {
  return getDisplayScale([{ value }], config);
}

function getMagnitudeInput(inputKey) {
  const locale = getNumberFormatLocale();
  const input = magnitudeInputs[inputKey];
  const magnitudeFormat = localeConfigs[getPageLocale()]?.magnitudeFormat;
  const baseSteps = rawMagnitudeStepsByFormat[magnitudeFormat];
  if (!baseSteps) {
    throw new Error(`Unsupported magnitude format for locale: ${getPageLocale()}`);
  }
  const steps = input.forceMinimumCompactUnit
    ? baseSteps.map((step, index) => (
      index === baseSteps.length - 1 ? { ...step, threshold: Number.NEGATIVE_INFINITY } : step
    ))
    : baseSteps;

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
  const compactPrecisionPolicy = fallback.compactPrecisionPolicy ?? compactMagnitudePrecision;

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
      adaptiveFallbackSignificantDigitBudget: compactPrecisionPolicy.significantDigitBudget,
      adaptiveLowerUnitThreshold: fallback.lowerUnitThreshold,
      adaptiveLowerUnitValueScale: fallback.lowerUnitValueScale,
      adaptiveLowerUnitSuffix: fallback.lowerUnitSuffix,
      smallValueMaximumFractionDigits: fallback.smallValueMaximumFractionDigits,
      smallValueThreshold: fallback.smallValueThreshold,
      integerValueThreshold: fallback.integerValueThreshold,
      significantDigitBudget: compactPrecisionPolicy.significantDigitBudget,
      compactPrecisionPolicy,
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
    adaptiveFallbackSignificantDigitBudget: compactPrecisionPolicy.significantDigitBudget,
    adaptiveLowerUnitThreshold: fallback.lowerUnitThreshold,
    adaptiveLowerUnitValueScale: fallback.lowerUnitValueScale,
    adaptiveLowerUnitSuffix: fallback.lowerUnitSuffix,
    smallValueMaximumFractionDigits: fallback.smallValueMaximumFractionDigits,
    smallValueThreshold: fallback.smallValueThreshold,
    integerValueThreshold: fallback.integerValueThreshold,
    significantDigitBudget: compactPrecisionPolicy.significantDigitBudget,
    compactPrecisionPolicy,
    maximumFractionDigits: resolveMaximumFractionDigits(
      displayValue,
      compactPrecisionPolicy,
    ),
  };
}

function resolveMaximumFractionDigits(value, policy) {
  const absoluteValue = Math.abs(value);
  const integerValueThreshold = policy.integerValueThreshold ?? Number.POSITIVE_INFINITY;

  if (absoluteValue >= integerValueThreshold) {
    return 0;
  }

  if (
    policy.smallValueMaximumFractionDigits != null
    && absoluteValue !== 0
    && absoluteValue < (policy.smallValueThreshold ?? 10)
  ) {
    return policy.smallValueMaximumFractionDigits;
  }

  const maximumFractionDigits = policy.maximumFractionDigits ?? 1;
  const significantDigitBudget = policy.significantDigitBudget;
  if (significantDigitBudget == null || absoluteValue < 1) {
    return maximumFractionDigits;
  }

  const integerDigits = Math.floor(Math.log10(absoluteValue)) + 1;
  return Math.min(maximumFractionDigits, Math.max(0, significantDigitBudget - integerDigits));
}

function getNumberFormatLocale() {
  return localeConfigs[getPageLocale()]?.numberLocale ?? "en-US";
}

const numberFormatterCache = new Map();

function getNumberFormatter(locale, maximumFractionDigits, useGrouping = true) {
  const cacheKey = `${locale}:${maximumFractionDigits}:${useGrouping}`;
  if (!numberFormatterCache.has(cacheKey)) {
    const options = { maximumFractionDigits };
    if (!useGrouping) {
      options.useGrouping = false;
    }
    numberFormatterCache.set(cacheKey, new Intl.NumberFormat(locale, options));
  }
  return numberFormatterCache.get(cacheKey);
}

function getRoundedDisplayValue(value, maximumFractionDigits) {
  return Number(getNumberFormatter("en-US", maximumFractionDigits, false).format(value));
}

function formatNumber(value, maximumFractionDigits = 1, locale = getNumberFormatLocale()) {
  const normalizedValue = getRoundedDisplayValue(value, maximumFractionDigits) === 0 ? 0 : value;
  return getNumberFormatter(locale, maximumFractionDigits).format(normalizedValue);
}

export function formatAxisTickValue(value, displayScale) {
  if (Number(value) === 0 && displayScale.suffix !== "%") {
    return formatNumber(0, 0, displayScale.locale);
  }

  if (displayScale.adaptiveCompactSteps) {
    return formatAdaptiveCompactValue(value / displayScale.valueScale, displayScale);
  }

  const maximumFractionDigits = resolveMaximumFractionDigits(value, displayScale);
  const formattedValue = formatNumber(value, maximumFractionDigits, displayScale.locale);
  const compactUnit = displayScale.compactUnit ?? "";
  const suffixSpacing = displayScale.suffixSpacing ?? (displayScale.suffix ? " " : "");
  const suffix = displayScale.suffix ? `${suffixSpacing}${displayScale.suffix}` : "";

  return `${displayScale.tickPrefix}${formattedValue}${compactUnit}${suffix}`;
}

export function formatDisplayValue(value, displayScale) {
  const displayValue = value * displayScale.valueScale;
  const maximumFractionDigits = resolveMaximumFractionDigits(displayValue, displayScale);
  const formattedValue = formatNumber(displayValue, maximumFractionDigits, displayScale.locale);
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
  const magnitudeStepIndex = displayScale.adaptiveCompactSteps.findIndex(
    (step) => Math.abs(rawValue) >= step.threshold,
  );

  if (magnitudeStepIndex < 0) {
    return formatAdaptiveFallbackValue(value, rawValue, displayScale);
  }

  return formatAdaptiveMagnitudeValue(rawValue, magnitudeStepIndex, displayScale);
}

function formatAdaptiveFallbackValue(value, rawValue, displayScale) {
  const fallbackValue = value * (displayScale.adaptiveFallbackValueScale ?? 1);
  const fallbackPrecisionPolicy = {
    maximumFractionDigits: displayScale.adaptiveFallbackMaximumFractionDigits,
    significantDigitBudget: displayScale.adaptiveFallbackSignificantDigitBudget,
    smallValueMaximumFractionDigits: displayScale.smallValueMaximumFractionDigits,
    smallValueThreshold: displayScale.smallValueThreshold,
    integerValueThreshold: displayScale.integerValueThreshold,
  };
  const lowerUnitThreshold = displayScale.adaptiveLowerUnitThreshold;
  if (lowerUnitThreshold != null && Math.abs(fallbackValue) > 0 && Math.abs(fallbackValue) < lowerUnitThreshold) {
    const lowerUnitValueScale = displayScale.adaptiveLowerUnitValueScale ?? 1;
    const lowerUnitDisplayValue = fallbackValue * lowerUnitValueScale;
    const lowerUnitMaximumFractionDigits = resolveMaximumFractionDigits(lowerUnitDisplayValue, fallbackPrecisionPolicy);
    const lowerUnitPromotionThreshold = lowerUnitThreshold * lowerUnitValueScale;
    if (!roundsToThreshold(lowerUnitDisplayValue, lowerUnitMaximumFractionDigits, lowerUnitPromotionThreshold)) {
      return formatAdaptiveValue(
        lowerUnitDisplayValue,
        lowerUnitMaximumFractionDigits,
        displayScale,
        { suffixValue: displayScale.adaptiveLowerUnitSuffix },
      );
    }
  }

  const maximumFractionDigits = resolveMaximumFractionDigits(fallbackValue, fallbackPrecisionPolicy);
  const smallestStepIndex = displayScale.adaptiveCompactSteps.length - 1;
  const smallestStep = displayScale.adaptiveCompactSteps[smallestStepIndex];
  const fallbackPromotionThreshold = (
    smallestStep.threshold
    / (displayScale.rawValueScale ?? 1)
    * (displayScale.adaptiveFallbackValueScale ?? 1)
  );
  if (
    Number.isFinite(fallbackPromotionThreshold)
    && roundsToThreshold(fallbackValue, maximumFractionDigits, fallbackPromotionThreshold)
  ) {
    return formatAdaptiveMagnitudeValue(rawValue, smallestStepIndex, displayScale);
  }

  return formatAdaptiveValue(fallbackValue, maximumFractionDigits, displayScale, {
    includeTooltipUnit: true,
    suffixValue: displayScale.suffix,
  });
}

function formatAdaptiveMagnitudeValue(rawValue, initialStepIndex, displayScale) {
  let stepIndex = initialStepIndex;
  let magnitudeStep = displayScale.adaptiveCompactSteps[stepIndex];
  let displayValue = rawValue * magnitudeStep.valueScale;
  let maximumFractionDigits = resolveMaximumFractionDigits(
    displayValue,
    displayScale.compactPrecisionPolicy ?? compactMagnitudePrecision,
  );

  while (stepIndex > 0) {
    const largerStep = displayScale.adaptiveCompactSteps[stepIndex - 1];
    const promotionThreshold = largerStep.threshold * magnitudeStep.valueScale;
    if (!roundsToThreshold(displayValue, maximumFractionDigits, promotionThreshold)) {
      break;
    }
    stepIndex -= 1;
    magnitudeStep = largerStep;
    displayValue = rawValue * magnitudeStep.valueScale;
    maximumFractionDigits = resolveMaximumFractionDigits(
      displayValue,
      displayScale.compactPrecisionPolicy ?? compactMagnitudePrecision,
    );
  }

  return formatAdaptiveValue(displayValue, maximumFractionDigits, displayScale, {
    compactUnit: magnitudeStep.compactUnit,
    suffixValue: displayScale.suffix,
  });
}

function roundsToThreshold(value, maximumFractionDigits, threshold) {
  const tolerance = Math.max(1, Math.abs(threshold)) * 1e-12;
  return Math.abs(getRoundedDisplayValue(value, maximumFractionDigits)) >= threshold - tolerance;
}

function formatAdaptiveValue(displayValue, maximumFractionDigits, displayScale, options = {}) {
  const { compactUnit = "", includeTooltipUnit = false, suffixValue = "" } = options;
  const formattedValue = formatNumber(displayValue, maximumFractionDigits, displayScale.locale);
  const unit = includeTooltipUnit && displayScale.tooltipUnit ? ` ${displayScale.tooltipUnit}` : "";
  const suffixSpacing = displayScale.suffixSpacing ?? (suffixValue ? " " : "");
  const suffix = suffixValue ? `${suffixSpacing}${suffixValue}` : "";
  return `${displayScale.tooltipPrefix}${formattedValue}${unit}${compactUnit}${suffix}`;
}
