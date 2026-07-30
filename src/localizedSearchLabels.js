import {
  countryNameSearchLabels,
} from "./translationSearchLabels.js";

export function getCountryNameSearchLabels(countryOrCode, fallback = "") {
  const code = typeof countryOrCode === "string" ? countryOrCode : countryOrCode?.code;
  const name = typeof countryOrCode === "string" ? fallback : countryOrCode?.name;
  return uniqueLabels([
    name,
    fallback,
    ...(countryNameSearchLabels[code] ?? []),
  ]);
}

function uniqueLabels(labels) {
  return [...new Set(labels.map((label) => String(label ?? "").trim()).filter(Boolean))];
}
