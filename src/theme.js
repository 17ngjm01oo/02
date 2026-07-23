const storageKey = "geostarna-theme-preference";
const preferences = new Set(["light", "dark", "system"]);
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
const themeColorByTheme = { light: "#f4f6f8", dark: "#000000" };

export function getThemePreference() {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return preferences.has(stored) ? stored : "light";
  } catch {
    return "light";
  }
}

export function getResolvedTheme(preference = getThemePreference()) {
  return preference === "system" && systemThemeQuery.matches ? "dark" : preference === "dark" ? "dark" : "light";
}

export function applyTheme(preference = getThemePreference(), { announce = false } = {}) {
  const resolvedTheme = getResolvedTheme(preference);
  const root = document.documentElement;
  const changed = root.dataset.theme !== resolvedTheme || root.dataset.themePreference !== preference;
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = preference;
  document.querySelector("meta[data-theme-color]")?.setAttribute(
    "content",
    themeColorByTheme[resolvedTheme],
  );
  if (changed && announce) {
    window.dispatchEvent(new CustomEvent("geostarna:themechange", {
      detail: { preference, resolvedTheme },
    }));
  }
  return { preference, resolvedTheme };
}

export function setThemePreference(preference) {
  if (!preferences.has(preference)) return applyTheme();
  try {
    window.localStorage.setItem(storageKey, preference);
  } catch {
    // The current page still reflects the user's choice when storage is unavailable.
  }
  return applyTheme(preference, { announce: true });
}

systemThemeQuery.addEventListener("change", () => {
  if (getThemePreference() === "system") applyTheme("system", { announce: true });
});

applyTheme();
