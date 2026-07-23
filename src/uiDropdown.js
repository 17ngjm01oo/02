export function createUiDropdown({
  controlClassName = "",
  toggleClassName = "",
  menuClassName = "",
  optionClassName = "",
  optionDatasetName = "",
  toggleText,
  toggleAriaLabel,
  menuAriaLabel,
  options,
  initialValue,
  onChange,
  outsideClickIgnoreSelector = "",
}) {
  const control = document.createElement("details");
  control.className = `ui-dropdown${controlClassName ? ` ${controlClassName}` : ""}`;

  const toggle = document.createElement("summary");
  toggle.className = `ui-dropdown-toggle${toggleClassName ? ` ${toggleClassName}` : ""}`;
  toggle.textContent = toggleText(initialValue);
  toggle.setAttribute("aria-label", toggleAriaLabel);

  const menu = document.createElement("div");
  menu.className = `ui-dropdown-menu${menuClassName ? ` ${menuClassName}` : ""}`;
  menu.setAttribute("role", "group");
  menu.setAttribute("aria-label", menuAriaLabel);

  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = `ui-dropdown-option${optionClassName ? ` ${optionClassName}` : ""}`;
    button.type = "button";
    if (optionDatasetName) {
      button.dataset[optionDatasetName] = option.value;
    }
    button.setAttribute("aria-pressed", String(option.value === initialValue));
    button.textContent = option.label;

    menu.append(button);
  });

  control.append(toggle, menu);
  initializeUiDropdown(control, {
    optionDatasetName,
    toggleText,
    onChange,
    outsideClickIgnoreSelector,
  });

  return control;
}

export function hydrateUiDropdown(control, {
  optionDatasetName = "",
  toggleText,
  onChange,
  options,
  outsideClickIgnoreSelector = "",
}) {
  const selector = optionDatasetName ? `[data-${datasetNameToAttribute(optionDatasetName)}]` : ".ui-dropdown-option";
  const optionButtons = [...control.querySelectorAll(selector)];
  const values = optionButtons.map((button) => button.dataset[optionDatasetName] ?? "");

  if (!control.matches("details.ui-dropdown") || !control.querySelector("summary") || values.length !== options.length || values.some((value, index) => value !== String(options[index].value))) {
    return null;
  }

  initializeUiDropdown(control, {
    optionDatasetName,
    toggleText,
    onChange,
    outsideClickIgnoreSelector,
  });

  return control;
}

function initializeUiDropdown(control, {
  optionDatasetName,
  toggleText,
  onChange,
  outsideClickIgnoreSelector,
}) {
  const toggle = control.querySelector("summary");
  const menu = control.querySelector(".ui-dropdown-menu");
  if (!toggle || !menu) {
    return;
  }

  const selector = optionDatasetName ? `[data-${datasetNameToAttribute(optionDatasetName)}]` : ".ui-dropdown-option";
  menu.querySelectorAll(selector).forEach((button) => {
    button.addEventListener("click", () => {
      menu.querySelectorAll(selector).forEach((optionButton) => {
        optionButton.setAttribute("aria-pressed", String(optionButton === button));
      });
      const value = optionDatasetName ? button.dataset[optionDatasetName] : button.value;
      toggle.textContent = toggleText(value);
      control.open = false;
      onChange?.(value);
    });
  });

  document.addEventListener("click", (event) => {
    const ignoredTarget = outsideClickIgnoreSelector && event.target.closest(outsideClickIgnoreSelector);
    if (!control.contains(event.target) && !ignoredTarget) {
      control.open = false;
    }
  });

  control.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      control.open = false;
      toggle.focus();
    }
  });

}

function datasetNameToAttribute(name) {
  return name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}
