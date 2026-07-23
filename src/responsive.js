export const compactViewportQuery = "(max-width: 640px)";
export const comparisonTableTwoColumnQuery = "(min-width: 900px)";
export const touchPreferredQuery = "(hover: none), (pointer: coarse)";
export const hoverPreferredQuery = "(hover: hover) and (pointer: fine)";
export const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
export const touchOverlayScrollCloseThreshold = 80;

export function isCompactViewport() {
  return window.matchMedia?.(compactViewportQuery)?.matches ?? false;
}

export function isTouchPreferred() {
  return window.matchMedia?.(touchPreferredQuery)?.matches ?? false;
}

export function isHoverPreferred() {
  return window.matchMedia?.(hoverPreferredQuery)?.matches ?? false;
}

export function isReducedMotionPreferred() {
  return window.matchMedia?.(reducedMotionQuery)?.matches ?? false;
}
