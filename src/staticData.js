const staticDataCache = new Map();

export function buildStaticDataRequestUrls({ staticDataPath, sourceUrl, indicatorCode }) {
  if (!staticDataPath) {
    throw new Error(`staticDataPath is required for ${indicatorCode}.`);
  }

  return {
    appUrl: new URL(staticDataPath, window.location.href).toString(),
    sourceUrl: sourceUrl ?? "",
  };
}

export async function fetchStaticData(options) {
  const { appUrl, sourceUrl } = buildStaticDataRequestUrls(options);
  let request;

  console.info("[Static Data] Data file URL:", appUrl);

  if (sourceUrl) {
    console.info("[Static Data] Source URL for updates:", sourceUrl);
  }

  try {
    request = staticDataCache.get(appUrl);
    if (!request) {
      request = requestStaticData(appUrl);
      staticDataCache.set(appUrl, request);
    }

    const data = await request;

    return {
      data,
      url: sourceUrl,
      requestUrl: appUrl,
    };
  } catch (error) {
    if (staticDataCache.get(appUrl) === request) {
      staticDataCache.delete(appUrl);
    }
    console.error("[Static Data] Failed to load static data file.", {
      requestUrl: appUrl,
      sourceUrl,
      indicatorCode: options.indicatorCode,
      error,
    });
    throw error;
  }
}

async function requestStaticData(appUrl) {
  const response = await fetch(appUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  console.info("[Static Data] Response status:", response.status, response.statusText);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Static Data] Error response body:", errorBody);
    throw new Error(`Static data file request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  console.groupCollapsed("[Static Data] Raw response");
  console.log(data);
  console.groupEnd();

  return data;
}
