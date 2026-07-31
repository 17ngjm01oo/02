import { formatAxisTickValue, formatCompactDisplayValue, getDisplayScale } from "./displayFormat.js";
import { isCompactViewport } from "./responsive.js";

const chartInstances = new Map();
const chartRenderRequests = new Map();
const chartJsUrl = new URL("./vendor/chart.umd.min.js", import.meta.url).href;
const chartJsAttemptTimeouts = [5_000, 8_000];
let chartJsLoadPromise = null;

export function loadChartJs() {
  if (window.Chart) {
    return Promise.resolve(window.Chart);
  }

  if (!chartJsLoadPromise) {
    chartJsLoadPromise = loadChartJsWithRetry().catch((error) => {
      chartJsLoadPromise = null;
      throw error;
    });
  }

  return chartJsLoadPromise;
}

async function loadChartJsWithRetry() {
  let lastError;

  for (let attempt = 0; attempt < chartJsAttemptTimeouts.length; attempt += 1) {
    try {
      return await loadChartJsAttempt(attempt, chartJsAttemptTimeouts[attempt]);
    } catch (error) {
      lastError = error;
      if (attempt + 1 < chartJsAttemptTimeouts.length) {
        console.warn("[Chart] Chart.js load failed; retrying.", {
          attempt: attempt + 1,
          error,
        });
      }
    }
  }

  throw lastError ?? new Error("Failed to load Chart.js.");
}

function loadChartJsAttempt(attempt, timeoutMs) {
  return new Promise((resolve, reject) => {
    const existingScript = attempt === 0
      ? document.querySelector(`script[src="${chartJsUrl}"]`)
      : null;
    const script = existingScript || document.createElement("script");
    let settled = false;

    const finish = (callback) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutId);
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      callback();
    };
    const handleLoad = () => {
      if (window.Chart) {
        finish(() => resolve(window.Chart));
        return;
      }
      if (script.dataset.chartJsLoader === "true") {
        script.remove();
      }
      finish(() => reject(new Error("Chart.js loaded without exposing the Chart constructor.")));
    };
    const handleError = () => {
      if (script.dataset.chartJsLoader === "true") {
        script.remove();
      }
      finish(() => reject(new Error("Failed to load Chart.js.")));
    };
    const timeoutId = window.setTimeout(() => {
      if (script.dataset.chartJsLoader === "true") {
        script.remove();
      }
      finish(() => reject(new Error(`Chart.js load timed out after ${timeoutMs} ms.`)));
    }, timeoutMs);

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (existingScript) {
      if (window.Chart) {
        finish(() => resolve(window.Chart));
      }
      return;
    }

    const requestUrl = new URL(chartJsUrl);
    if (attempt > 0) {
      requestUrl.searchParams.set("_retry", String(Date.now()));
    }
    script.src = requestUrl.href;
    script.async = true;
    script.dataset.chartJsLoader = "true";
    document.head.append(script);
  });
}

export function renderLineChart(canvas, { points, config, comparison = null }) {
  if (!canvas) {
    throw new Error("Chart canvas element was not found.");
  }

  if (!window.Chart) {
    throw new Error("Chart.js was not loaded.");
  }

  if (chartInstances.has(canvas.id)) {
    chartInstances.get(canvas.id).destroy();
  }

  const allPoints = comparison?.points?.length ? [...points, ...comparison.points] : points;
  const labels = buildChartLabels(config);
  const displayScale = getDisplayScale(allPoints, config);
  const compactViewport = isCompactViewport();
  const chartColors = getChartColors();
  const datasets = [
    buildDataset({
      label: config.countryName,
      points,
      labels,
      displayScale,
      baseColor: chartColors.actual,
      isCompactViewport: compactViewport,
    }),
  ];

  if (comparison?.points?.length) {
    datasets.push(
      buildDataset({
        label: comparison.countryName,
        points: comparison.points,
        labels,
        displayScale,
        baseColor: chartColors.comparison,
        isCompactViewport: compactViewport,
      }),
    );
  }

  const chartInstance = new window.Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: true,
        mode: "nearest",
      },
      plugins: {
        legend: {
          display: Boolean(comparison?.points?.length),
          onClick() {},
          labels: {
            boxWidth: 14,
            boxHeight: 3,
            usePointStyle: false,
            ...(chartColors.isDark ? { color: chartColors.text } : {}),
          },
        },
        title: {
          display: false,
        },
        tooltip: {
          displayColors: false,
          ...(chartColors.isDark ? {
            backgroundColor: chartColors.tooltipSurface,
            titleColor: chartColors.text,
            bodyColor: chartColors.text,
            borderColor: chartColors.border,
            borderWidth: 1,
          } : {}),
          callbacks: {
            label(context) {
              const rawValue = context.dataset.rawValues?.[context.dataIndex];
              const formattedValue = Number.isFinite(rawValue)
                ? formatCompactDisplayValue(rawValue, displayScale)
                : formatAxisTickValue(context.parsed.y, displayScale);

              if (comparison?.points?.length) {
                return `${context.dataset.label}: ${formattedValue}`;
              }

              return formattedValue;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: false,
          },
          border: {
            ...(chartColors.isDark ? { color: chartColors.grid } : {}),
          },
          grid: {
            display: false,
          },
          ticks: {
            ...(chartColors.isDark ? { color: chartColors.muted } : {}),
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6,
          },
        },
        y: {
          title: {
            display: false,
          },
          border: {
            ...(chartColors.isDark ? { color: chartColors.grid } : {}),
          },
          grid: {
            ...(chartColors.isDark ? { color: chartColors.grid } : {}),
          },
          ticks: {
            ...(chartColors.isDark ? { color: chartColors.muted } : {}),
            callback(value) {
              return formatAxisTickValue(value, displayScale);
            },
            maxTicksLimit: 6,
          },
        },
      },
    },
  });

  chartInstances.set(canvas.id, chartInstance);
  chartRenderRequests.set(canvas.id, {
    canvas,
    options: { points, config, comparison },
  });

  return chartInstance;
}

export function clearLineChart(canvas) {
  if (!canvas) {
    return;
  }

  if (chartInstances.has(canvas.id)) {
    chartInstances.get(canvas.id).destroy();
    chartInstances.delete(canvas.id);
  }
  chartRenderRequests.delete(canvas.id);
}

function getChartColors() {
  const styles = getComputedStyle(document.documentElement);
  const color = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  return {
    isDark: document.documentElement.dataset.theme === "dark",
    actual: color("--chart-actual", "#176b87"),
    comparison: color("--chart-comparison", "#475569"),
    text: color("--text", "#17202a"),
    muted: color("--muted", "#617083"),
    border: color("--border", "#d9e0e7"),
    grid: color("--chart-grid", "#d9e0e7"),
    tooltipSurface: color("--chart-tooltip-surface", "#ffffff"),
  };
}

window.addEventListener("geostarna:themechange", () => {
  [...chartRenderRequests.entries()].forEach(([canvasId, request]) => {
    if (!request.canvas.isConnected) {
      chartInstances.get(canvasId)?.destroy();
      chartInstances.delete(canvasId);
      chartRenderRequests.delete(canvasId);
      return;
    }
    renderLineChart(request.canvas, request.options);
  });
});

function buildChartLabels(config) {
  const startYear = Number.isInteger(config.startYear) ? config.startYear : 1980;
  const endYear = Number.isInteger(config.endYear) ? config.endYear : startYear;

  return Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => String(startYear + index),
  );
}

function buildDataset({
  label,
  points,
  labels,
  displayScale,
  baseColor,
  isCompactViewport,
}) {
  const valueByYear = new Map(points.map((point) => [point.year, point.value]));
  const estimatedColor = lightenHexColor(baseColor, 0.6);
  const estimatedYears = new Set(
    points
      .filter((point) => point?.observationStatusHighlighted)
      .map((point) => Number(point.year)),
  );

  return {
    label,
    data: labels.map((labelYear) => {
      const value = valueByYear.get(Number(labelYear));
      return Number.isFinite(value) ? value * displayScale.valueScale : null;
    }),
    rawValues: labels.map((labelYear) => {
      const value = valueByYear.get(Number(labelYear));
      return Number.isFinite(value) ? value : null;
    }),
    borderColor: baseColor,
    backgroundColor: baseColor,
    borderWidth: isCompactViewport ? 2 : 3,
    borderCapStyle: "round",
    borderJoinStyle: "round",
    spanGaps: true,
    pointBackgroundColor: labels.map((labelYear) => {
      return estimatedYears.has(Number(labelYear)) ? estimatedColor : baseColor;
    }),
    pointBorderColor: labels.map((labelYear) => {
      return estimatedYears.has(Number(labelYear)) ? estimatedColor : baseColor;
    }),
    pointRadius: isCompactViewport ? 1 : 2,
    pointHoverRadius: 5,
    pointHitRadius: 20,
    segment: {
      borderColor(context) {
        const startYear = Number(labels[context.p0DataIndex]);
        const endYear = Number(labels[context.p1DataIndex]);
        return estimatedYears.has(startYear) || estimatedYears.has(endYear) ? estimatedColor : baseColor;
      },
    },
    tension: 0,
    fill: false,
  };
}

function lightenHexColor(hexColor, amount) {
  const normalized = hexColor.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return hexColor;
  }

  const channels = [0, 2, 4].map((start) => Number.parseInt(normalized.slice(start, start + 2), 16));
  const mixed = channels.map((channel) => {
    return Math.round(channel + (255 - channel) * amount);
  });

  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}
