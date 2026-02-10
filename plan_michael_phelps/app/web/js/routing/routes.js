import { CANONICAL_ROUTE_ORDER, CANONICAL_ROUTES, LEGACY_TO_CANONICAL_HASH } from "./canonical_routes_s0.js";

const ROUTE_ORDER = [...CANONICAL_ROUTE_ORDER];

export const DEFAULT_ROUTE_ID = "hoy";

export const ROUTES = Object.freeze(
  Object.fromEntries(
    ROUTE_ORDER.map((routeId) => {
      const route = CANONICAL_ROUTES[routeId];
      return [routeId, Object.freeze({ ...route, path: route.hash.slice(1) })];
    })
  )
);

const CANONICAL_HASH_TO_ROUTE_ID = Object.freeze(
  Object.fromEntries(ROUTE_ORDER.map((routeId) => [ROUTES[routeId].hash, routeId]))
);

const ALIAS_HASH_TO_ROUTE_ID = Object.freeze({
  "#/today": "hoy"
});

const LEGACY_HASH_TO_ROUTE_ID = Object.freeze(
  Object.fromEntries(
    Object.entries(LEGACY_TO_CANONICAL_HASH).flatMap(([legacyHash, canonicalHash]) => {
      const routeId = CANONICAL_HASH_TO_ROUTE_ID[canonicalHash];
      return routeId ? [[legacyHash, routeId]] : [];
    })
  )
);

function normalizeHash(hash) {
  if (typeof hash !== "string") return "";

  let value = hash.trim();
  if (!value) return "";

  const hashIndex = value.indexOf("#");
  if (hashIndex >= 0) {
    value = value.slice(hashIndex);
  }

  if (!value.startsWith("#")) {
    value = value.startsWith("/") ? `#${value}` : `#/${value}`;
  }

  value = value.toLowerCase();

  if (value.length > 1 && value.endsWith("/")) {
    value = value.slice(0, -1);
  }

  return value;
}

export function canonicalHashForRoute(routeId) {
  return ROUTES[routeId]?.hash || ROUTES[DEFAULT_ROUTE_ID].hash;
}

export function getRouteLabel(routeId) {
  return ROUTES[routeId]?.label || ROUTES[DEFAULT_ROUTE_ID].label;
}

export function resolveRoute(hash) {
  const normalizedHash = normalizeHash(hash);

  if (!normalizedHash || normalizedHash === "#") {
    const canonicalHash = canonicalHashForRoute(DEFAULT_ROUTE_ID);
    return {
      routeId: DEFAULT_ROUTE_ID,
      canonicalHash,
      normalizedHash,
      redirectedFromLegacy: false,
      isInvalid: false
    };
  }

  if (CANONICAL_HASH_TO_ROUTE_ID[normalizedHash]) {
    const routeId = CANONICAL_HASH_TO_ROUTE_ID[normalizedHash];
    return {
      routeId,
      canonicalHash: normalizedHash,
      normalizedHash,
      redirectedFromLegacy: false,
      isInvalid: false
    };
  }

  if (ALIAS_HASH_TO_ROUTE_ID[normalizedHash]) {
    const routeId = ALIAS_HASH_TO_ROUTE_ID[normalizedHash];
    return {
      routeId,
      canonicalHash: canonicalHashForRoute(routeId),
      normalizedHash,
      redirectedFromLegacy: false,
      isInvalid: false
    };
  }

  if (LEGACY_HASH_TO_ROUTE_ID[normalizedHash]) {
    const routeId = LEGACY_HASH_TO_ROUTE_ID[normalizedHash];
    return {
      routeId,
      canonicalHash: canonicalHashForRoute(routeId),
      normalizedHash,
      redirectedFromLegacy: true,
      isInvalid: false
    };
  }

  const canonicalHash = canonicalHashForRoute(DEFAULT_ROUTE_ID);
  return {
    routeId: DEFAULT_ROUTE_ID,
    canonicalHash,
    normalizedHash,
    redirectedFromLegacy: false,
    isInvalid: true
  };
}
