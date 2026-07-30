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
  hideSelectedOption = false,
  outsideClickIgnoreSelector = "",
}) {
  const control = document.createElement("details");
  control.className = `ui-dropdown${controlClassName ? ` ${controlClassName}` : ""}`;

  const toggle = document.createElement("summary");
  toggle.className = `ui-dropdown-toggle${toggleClassName ? ` ${toggleClassName}` : ""}`;
  toggle.textContent = toggleText(initialValue);
  if (toggleAriaLabel) {
    toggle.setAttribute("aria-label", toggleAriaLabel);
  }

  const menu = document.createElement("div");
  menu.className = `ui-dropdown-menu${menuClassName ? ` ${menuClassName}` : ""}`;
  if (menuAriaLabel) {
    menu.setAttribute("role", "group");
    menu.setAttribute("aria-label", menuAriaLabel);
  }

  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = `ui-dropdown-option${optionClassName ? ` ${optionClassName}` : ""}`;
    button.type = "button";
    if (optionDatasetName) {
      button.dataset[optionDatasetName] = option.value;
    }
    button.textContent = option.label;

    menu.append(button);
  });

  control.append(toggle, menu);
  initializeUiDropdown(control, {
    optionDatasetName,
    toggleText,
    initialValue,
    onChange,
    hideSelectedOption,
    outsideClickIgnoreSelector,
  });

  return control;
}

export function hydrateUiDropdown(control, {
  optionDatasetName = "",
  toggleText,
  onChange,
  options,
  initialValue,
  hideSelectedOption = false,
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
    initialValue,
    onChange,
    hideSelectedOption,
    outsideClickIgnoreSelector,
  });

  return control;
}

function initializeUiDropdown(control, {
  optionDatasetName,
  toggleText,
  initialValue,
  onChange,
  hideSelectedOption,
  outsideClickIgnoreSelector,
}) {
  const toggle = control.querySelector("summary");
  const menu = control.querySelector(".ui-dropdown-menu");
  if (!toggle || !menu) {
    return;
  }

  const selector = optionDatasetName ? `[data-${datasetNameToAttribute(optionDatasetName)}]` : ".ui-dropdown-option";
  const optionButtons = [...menu.querySelectorAll(selector)];
  updateOptions(initialValue);

  optionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const value = optionDatasetName ? button.dataset[optionDatasetName] : button.value;
      toggle.textContent = toggleText(value);
      control.open = false;
      toggle.focus();
      updateOptions(value);
      onChange?.(value);
    });
  });

  function updateOptions(selectedValue) {
    optionButtons.forEach((optionButton) => {
      const optionValue = optionDatasetName ? optionButton.dataset[optionDatasetName] : optionButton.value;
      if (hideSelectedOption) {
        optionButton.hidden = optionValue === String(selectedValue);
        optionButton.removeAttribute("aria-pressed");
      } else {
        optionButton.hidden = false;
        optionButton.setAttribute("aria-pressed", String(optionValue === String(selectedValue)));
      }
    });
  }

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
