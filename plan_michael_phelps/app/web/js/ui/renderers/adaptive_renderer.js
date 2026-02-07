import { clearNode } from "../../core/dom.js";

export function renderAdaptive(dom, adaptivePlan) {
  dom.adaptiveFocus.textContent = adaptivePlan?.focusLabel || "No adaptive focus for today.";
  if (adaptivePlan?.extensionWeeksAssigned > 0) {
    const trigger =
      Number.isInteger(Number(adaptivePlan?.extensionTriggerWeek)) && Number(adaptivePlan.extensionTriggerWeek) > 0
        ? ` desde W${String(adaptivePlan.extensionTriggerWeek).padStart(2, "0")}`
        : "";
    dom.extensionRisk.textContent = `Extension assigned: +${adaptivePlan.extensionWeeksAssigned} semanas${trigger}.`;
  } else {
    dom.extensionRisk.textContent = adaptivePlan?.extensionRisk
      ? "Extension risk detected: remediation active."
      : "Extension risk: low";
  }

  clearNode(dom.adaptiveRecommendations);
  const doc = dom.adaptiveRecommendations.ownerDocument || document;
  const recommendations = Array.isArray(adaptivePlan?.recommendations)
    ? adaptivePlan.recommendations
    : [];

  if (recommendations.length === 0) {
    const li = doc.createElement("li");
    li.textContent = "Maintain current routine and transfer corrected chunks.";
    dom.adaptiveRecommendations.appendChild(li);
    return;
  }

  recommendations.forEach((item) => {
    const li = doc.createElement("li");
    li.textContent = item;
    dom.adaptiveRecommendations.appendChild(li);
  });
}
