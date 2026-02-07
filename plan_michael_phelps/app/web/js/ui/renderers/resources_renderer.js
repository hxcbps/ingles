import { clearNode } from "../../core/dom.js";

function mapCatalog(catalog) {
  const items = Array.isArray(catalog?.items) ? catalog.items : [];
  return new Map(items.map((item) => [item.id, item]));
}

export function renderResources(dom, resourcePack, catalog) {
  clearNode(dom.resourcesList);
  const doc = dom.resourcesList.ownerDocument || document;
  const safe = Array.isArray(resourcePack) ? resourcePack : [];
  const catalogMap = mapCatalog(catalog);

  if (safe.length === 0) {
    const li = doc.createElement("li");
    li.textContent = "No resources assigned today.";
    dom.resourcesList.appendChild(li);
    return;
  }

  safe.forEach((entry) => {
    const li = doc.createElement("li");
    const match = catalogMap.get(entry.id);
    const source = match?.source || "Resource";
    const ref = match?.url_or_ref ? ` (${match.url_or_ref})` : "";
    li.textContent = `${entry.id} - ${source} - ${entry.minutes} min - ${entry.purpose}${ref}`;
    dom.resourcesList.appendChild(li);
  });
}
