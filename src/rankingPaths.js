export function getRankingScopeHref(rankingBaseHref, scope) {
  return isWorldRankingScope(scope) ? rankingBaseHref : `${rankingBaseHref}${scope.slug}/`;
}

function isWorldRankingScope(scope) {
  return scope?.type === "world" || scope?.id === "WORLD" || scope?.slug === "world";
}
