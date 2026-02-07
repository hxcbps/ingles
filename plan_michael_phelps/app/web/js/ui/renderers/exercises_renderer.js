import { clearNode } from "../../core/dom.js";

export function renderExercises(dom, exercises) {
  clearNode(dom.exercisesList);
  const doc = dom.exercisesList.ownerDocument || document;
  const safe = Array.isArray(exercises) ? exercises : [];

  if (safe.length === 0) {
    const li = doc.createElement("li");
    li.textContent = "No exercises available.";
    dom.exercisesList.appendChild(li);
    return;
  }

  safe.forEach((exercise) => {
    const li = doc.createElement("li");
    const type = String(exercise?.type || "exercise");
    const instructions = String(exercise?.instructions || "");
    li.textContent = `${type}: ${instructions}`;
    dom.exercisesList.appendChild(li);
  });
}
