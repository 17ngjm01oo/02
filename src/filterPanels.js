export function initializeFilterPanels({
  regionPanel,
  categoryPanel,
  regionList,
  categoryList,
  onOpen = null,
}) {
  const close = (exceptPanel = null) => {
    [regionPanel, categoryPanel].forEach((panel) => {
      if (panel && panel !== exceptPanel) {
        panel.open = false;
      }
    });

    if (!exceptPanel) {
      regionList.hidden = true;
      categoryList.hidden = true;
    }
  };

  const show = (type) => {
    regionList.hidden = type !== "region";
    categoryList.hidden = type !== "category";
  };

  const attachToggleHandler = (panel, list, type) => {
    panel?.addEventListener("toggle", () => {
      if (panel.open) {
        onOpen?.();
        close(panel);
        show(type);
      } else {
        list.hidden = true;
      }
    });
  };

  attachToggleHandler(regionPanel, regionList, "region");
  attachToggleHandler(categoryPanel, categoryList, "category");

  return { close };
}
