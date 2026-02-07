import { clearNode } from "../../core/dom.js";

function moduleLabel(moduleId, registry) {
  const list = Array.isArray(registry?.modules) ? registry.modules : [];
  const match = list.find((item) => item.id === moduleId);
  if (!match) return moduleId;
  return `${moduleId} - ${match.book} (${match.chapter_ref})`;
}

export function renderBookModules(dom, modules, progressSummary, registry) {
  clearNode(dom.bookModules);
  const doc = dom.bookModules.ownerDocument || document;
  const safeModules = Array.isArray(modules) ? modules : [];

  if (safeModules.length === 0) {
    const li = doc.createElement("li");
    li.textContent = "No book modules assigned.";
    dom.bookModules.appendChild(li);
  } else {
    safeModules.forEach((moduleId) => {
      const li = doc.createElement("li");
      li.textContent = moduleLabel(moduleId, registry);
      dom.bookModules.appendChild(li);
    });
  }

  if (!progressSummary) {
    dom.bookProgress.textContent = "Book progress unavailable.";
    return;
  }

  dom.bookProgress.textContent = `Book progress: ${progressSummary.done}/${progressSummary.total} (${progressSummary.percent}%)`;
}
