export function getRankingControls() {
  const rankingCardHeader = document.querySelector(".ranking-card-header");

  if (!rankingCardHeader) {
    return null;
  }

  let controls = rankingCardHeader.querySelector(".ranking-controls");

  if (!controls) {
    controls = document.createElement("div");
    controls.className = "ranking-controls";
    rankingCardHeader.append(controls);
  }

  return controls;
}
