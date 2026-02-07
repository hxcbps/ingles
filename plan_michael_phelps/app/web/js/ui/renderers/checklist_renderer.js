import { clearNode } from "../../core/dom.js";
import { CHECK_ITEMS, getChecklistProgress, getNextAction } from "../../domain/checklist.js";
import { asString } from "../../utils/guards.js";

export function renderChecklist(dom, checklist, onToggle) {
  const doc = dom.checklist.ownerDocument || document;
  clearNode(dom.checklist);

  CHECK_ITEMS.forEach((item) => {
    const li = doc.createElement("li");
    li.className = "check-item";

    const input = doc.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(checklist[item.id]);
    input.addEventListener("change", () => {
      onToggle(item.id, input.checked);
    });

    const label = doc.createElement("label");
    label.textContent = item.label;

    li.appendChild(input);
    li.appendChild(label);
    dom.checklist.appendChild(li);
  });

  const progress = getChecklistProgress(checklist);
  dom.progressText.textContent = `${progress.percent}% completado (${progress.done}/${progress.total})`;
  dom.progressFill.style.width = `${progress.percent}%`;
  dom.nextAction.textContent = asString(getNextAction(checklist), "Ejecuta la siguiente accion");
}
