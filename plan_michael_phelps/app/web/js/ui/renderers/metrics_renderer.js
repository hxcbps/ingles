import { METRIC_NOTE_FIELDS, METRIC_NUMERIC_FIELDS } from "../../domain/metrics.js";
import { clearNode } from "../../core/dom.js";

function targetForNumericField(metricTargets, fieldId) {
  const map = {
    error_density_per_100w: metricTargets?.error_density_max,
    repair_success_pct: metricTargets?.repair_success_min,
    turn_length_seconds: metricTargets?.turn_length_min_seconds,
    gist_pct: metricTargets?.gist_min,
    detail_pct: metricTargets?.detail_min,
    lexical_reuse_count: metricTargets?.lexical_reuse_min,
    pronunciation_score: metricTargets?.pronunciation_score_min
  };
  return map[fieldId];
}

export function renderMetrics(
  dom,
  metricsNumeric,
  metricsNotes,
  metricTargets,
  onNumericMetricChange,
  onNoteMetricChange
) {
  const doc = dom.metricsGrid.ownerDocument || document;
  clearNode(dom.metricsGrid);
  clearNode(dom.metricsNotesGrid);

  METRIC_NUMERIC_FIELDS.forEach((field) => {
    const row = doc.createElement("div");
    row.className = "metric-row";

    const label = doc.createElement("label");
    label.textContent = field.label;

    const input = doc.createElement("input");
    input.type = "number";
    input.step = "0.1";
    input.value = Number(metricsNumeric?.[field.id] || 0);
    const targetValue = targetForNumericField(metricTargets, field.id);
    input.placeholder = targetValue === undefined ? "" : String(targetValue);
    input.addEventListener("input", () => {
      onNumericMetricChange(field.id, Number(input.value));
    });

    const target = doc.createElement("small");
    target.className = "hint";
    target.textContent = `Target: ${targetValue ?? "n/a"}`;

    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(target);
    dom.metricsGrid.appendChild(row);
  });

  METRIC_NOTE_FIELDS.forEach((field) => {
    const row = doc.createElement("div");
    row.className = "metric-row";

    const label = doc.createElement("label");
    label.textContent = field.label;

    const input = doc.createElement("input");
    input.type = "text";
    input.value = metricsNotes?.[field.id] || "";
    input.placeholder = "Short note";
    input.addEventListener("input", () => {
      onNoteMetricChange(field.id, input.value);
    });

    row.appendChild(label);
    row.appendChild(input);
    dom.metricsNotesGrid.appendChild(row);
  });
}
