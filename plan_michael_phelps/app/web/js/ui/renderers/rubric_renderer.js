import { RUBRIC_FIELDS, summarizeRubric } from "../../domain/rubric.js";
import { clearNode } from "../../core/dom.js";

export function renderRubric(dom, scores, rubricTargets, onScoreChange) {
  const doc = dom.rubricGrid.ownerDocument || document;
  clearNode(dom.rubricGrid);

  RUBRIC_FIELDS.forEach((field) => {
    const current = Number(scores[field.id] || 0);
    const target = Number(rubricTargets?.[field.id]?.target || 2);

    const row = doc.createElement("div");
    row.className = "rubric-row";

    const label = doc.createElement("label");
    label.textContent = `${field.label} (target >= ${target})`;

    const select = doc.createElement("select");
    for (let value = 0; value <= 3; value += 1) {
      const option = doc.createElement("option");
      option.value = String(value);
      option.textContent = String(value);
      if (value === current) option.selected = true;
      select.appendChild(option);
    }

    select.addEventListener("change", () => {
      onScoreChange(field.id, Number(select.value));
    });

    const descriptor = doc.createElement("small");
    descriptor.className = "hint";
    descriptor.textContent = rubricTargets?.[field.id]?.descriptor || "";

    row.appendChild(label);
    row.appendChild(select);
    row.appendChild(descriptor);
    dom.rubricGrid.appendChild(row);
  });

  const summary = summarizeRubric(scores, rubricTargets);
  dom.scoreSummary.textContent = `Promedio: ${summary.average} | targets cumplidos: ${summary.metTargets}/${summary.totalTargets}`;
}
