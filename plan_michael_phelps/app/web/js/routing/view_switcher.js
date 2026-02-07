import { DEFAULT_ROUTE_ID, ROUTES } from "./routes.js";

function safeQueryAll(documentRef, selector) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }
  return Array.from(documentRef.querySelectorAll(selector));
}

function safeQuery(documentRef, selector) {
  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return null;
  }
  return documentRef.querySelector(selector);
}

function parseGroups(rawValue) {
  return String(rawValue || "")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function isVisibleForRoute(groups, routeId) {
  if (groups.length === 0) return true;
  return groups.includes("always") || groups.includes(routeId);
}

function applyNodeVisibility(documentRef, routeId) {
  const routeNodes = safeQueryAll(documentRef, "[data-route-group]");
  routeNodes.forEach((node) => {
    const groups = parseGroups(node.getAttribute("data-route-group"));
    const visible = isVisibleForRoute(groups, routeId);
    node.hidden = !visible;
    if (typeof node.setAttribute === "function") {
      node.setAttribute("aria-hidden", visible ? "false" : "true");
    }
  });
}

function applyActiveLinkState(documentRef, routeId) {
  const links = safeQueryAll(documentRef, "[data-route-link]");
  links.forEach((link) => {
    const linkRouteId = String(link.getAttribute("data-route-link") || "");
    const active = linkRouteId === routeId;

    if (link.classList && typeof link.classList.toggle === "function") {
      link.classList.toggle("is-active", active);
    }

    if (active) {
      link.setAttribute("aria-current", "page");
    } else if (typeof link.removeAttribute === "function") {
      link.removeAttribute("aria-current");
    }
  });
}

function focusRouteHeading(documentRef, routeId) {
  const target =
    safeQuery(documentRef, `[data-route-focus="${routeId}"]`) ||
    safeQuery(documentRef, '[data-route-focus="always"]');

  if (!target || typeof target.focus !== "function") {
    return;
  }

  if (!target.getAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
  }

  try {
    target.focus({ preventScroll: true });
  } catch {
    target.focus();
  }
}

export function applyRouteVisibility({ documentRef = document, routeId } = {}) {
  const safeRouteId = ROUTES[routeId] ? routeId : DEFAULT_ROUTE_ID;
  applyNodeVisibility(documentRef, safeRouteId);
  applyActiveLinkState(documentRef, safeRouteId);
  focusRouteHeading(documentRef, safeRouteId);
  return safeRouteId;
}
