const staticDataCache = new Map();
const staticDataAttemptTimeouts = [6_000, 10_000];

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
  let lastError;

  for (let attempt = 0; attempt < staticDataAttemptTimeouts.length; attempt += 1) {
    try {
      return await requestStaticDataAttempt(appUrl, {
        bypassCache: attempt > 0,
        timeoutMs: staticDataAttemptTimeouts[attempt],
      });
    } catch (error) {
      lastError = error;
      if (attempt + 1 < staticDataAttemptTimeouts.length) {
        console.warn("[Static Data] Request failed; retrying.", {
          requestUrl: appUrl,
          attempt: attempt + 1,
          error,
        });
      }
    }
  }

  throw lastError ?? new Error("Static data request failed.");
}

async function requestStaticDataAttempt(appUrl, { bypassCache, timeoutMs }) {
  const controller = new AbortController();
  const requestUrl = new URL(appUrl);
  if (bypassCache) {
    requestUrl.searchParams.set("_retry", String(Date.now()));
  }
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(requestUrl.href, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
      ...(bypassCache ? { cache: "reload" } : {}),
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
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Static data request timed out after ${timeoutMs} ms.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
