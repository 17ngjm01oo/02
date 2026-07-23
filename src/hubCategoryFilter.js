export function initializeHubCategoryFilter({
  buttonSelector,
  groupSelector,
  buttonCategoryKey,
  groupCategoryKey,
}) {
  const buttons = Array.from(document.querySelectorAll(buttonSelector));
  const groups = Array.from(document.querySelectorAll(groupSelector));
  if (buttons.length === 0 || groups.length === 0) {
    return;
  }

  updateHubCategoryFilter(buttons, groups, "", buttonCategoryKey, groupCategoryKey);

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      updateHubCategoryFilter(
        buttons,
        groups,
        button.dataset[buttonCategoryKey] ?? "",
        buttonCategoryKey,
        groupCategoryKey,
      );
    });
  });
}

function updateHubCategoryFilter(buttons, groups, categoryId, buttonCategoryKey, groupCategoryKey) {
  buttons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String((button.dataset[buttonCategoryKey] ?? "") === categoryId),
    );
  });

  groups.forEach((group) => {
    group.hidden = Boolean(categoryId) && group.dataset[groupCategoryKey] !== categoryId;
  });
}
