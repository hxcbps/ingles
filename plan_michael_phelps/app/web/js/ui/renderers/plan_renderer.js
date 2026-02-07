import { setList } from "../../core/dom.js";

export function renderPlan(dom, dayView) {
  setList(dom.sessionPlan, dayView.sessionPlan);
  setList(dom.deliverables, dayView.deliverables);
  dom.promptText.textContent = dayView.prompt;
  dom.evidencePath.textContent = dayView.evidencePath;
  dom.dailyGate.textContent = dayView.dailyGate;
}
