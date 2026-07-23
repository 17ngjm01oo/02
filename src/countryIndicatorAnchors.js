export function getCountryIndicatorAnchorId(seriesId) {
  return `${seriesId}-title`;
}

export function getCountryIndicatorHash(seriesId) {
  return `#${getCountryIndicatorAnchorId(seriesId)}`;
}

export function scrollToCountryIndicatorHash({ behavior = "auto" } = {}) {
  const targetId = decodeURIComponent(window.location.hash.replace(/^#/, ""));

  if (!targetId) {
    return false;
  }

  const target = document.getElementById(targetId);
  const indicatorBlock = target?.closest(".indicator-block");
  const scrollTarget = indicatorBlock || target;

  if (!scrollTarget || scrollTarget.hidden) {
    return false;
  }

  scrollTarget.scrollIntoView({ block: "center", behavior });
  return true;
}
