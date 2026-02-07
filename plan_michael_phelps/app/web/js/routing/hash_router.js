import { canonicalHashForRoute, DEFAULT_ROUTE_ID, resolveRoute } from "./routes.js";

function readHash(windowRef) {
  return typeof windowRef?.location?.hash === "string" ? windowRef.location.hash : "";
}

function replaceHash(windowRef, nextHash) {
  const history = windowRef?.history;
  const location = windowRef?.location;

  if (!history || typeof history.replaceState !== "function" || !location) {
    return false;
  }

  const pathname = typeof location.pathname === "string" ? location.pathname : "";
  const search = typeof location.search === "string" ? location.search : "";
  history.replaceState(null, "", `${pathname}${search}${nextHash}`);
  return true;
}

function assignHash(windowRef, nextHash) {
  if (windowRef?.location) {
    windowRef.location.hash = nextHash;
  }
}

export function createHashRouter({
  windowRef = window,
  onRouteChange = () => {},
  onInvalidRoute = () => {}
} = {}) {
  let mounted = false;
  let currentState = {
    routeId: DEFAULT_ROUTE_ID,
    canonicalHash: canonicalHashForRoute(DEFAULT_ROUTE_ID),
    rawHash: "",
    redirectedFromLegacy: false,
    isInvalid: false
  };

  function emitRoute(resolved, rawHash, force = false) {
    const nextState = {
      routeId: resolved.routeId,
      canonicalHash: resolved.canonicalHash,
      rawHash: typeof rawHash === "string" ? rawHash : "",
      redirectedFromLegacy: Boolean(resolved.redirectedFromLegacy),
      isInvalid: Boolean(resolved.isInvalid)
    };

    const changed =
      force ||
      currentState.routeId !== nextState.routeId ||
      currentState.canonicalHash !== nextState.canonicalHash ||
      currentState.isInvalid !== nextState.isInvalid;

    if (!changed) {
      return currentState;
    }

    currentState = nextState;
    onRouteChange({ ...currentState });
    return currentState;
  }

  function syncHash(rawHash, { replace = false, force = false } = {}) {
    const resolved = resolveRoute(rawHash);
    const currentHash = readHash(windowRef);
    const targetHash = resolved.canonicalHash;

    if (resolved.isInvalid) {
      onInvalidRoute({
        rawHash: typeof rawHash === "string" ? rawHash : "",
        canonicalHash: targetHash,
        routeId: resolved.routeId
      });
    }

    const needsCanonicalization = currentHash !== targetHash;
    if (needsCanonicalization) {
      const replaced = replace ? replaceHash(windowRef, targetHash) : false;
      if (!replaced) {
        assignHash(windowRef, targetHash);
      }
    }

    return emitRoute(resolved, rawHash, force || needsCanonicalization || replace || resolved.isInvalid);
  }

  function onHashChange() {
    syncHash(readHash(windowRef));
  }

  return {
    start() {
      if (mounted) return { ...currentState };
      mounted = true;
      windowRef.addEventListener("hashchange", onHashChange);
      return syncHash(readHash(windowRef), { replace: true, force: true });
    },
    navigate(routeId, { replace = false } = {}) {
      const targetHash = canonicalHashForRoute(routeId);
      return syncHash(targetHash, { replace, force: true });
    },
    current() {
      return { ...currentState };
    },
    dispose() {
      if (!mounted) return;
      mounted = false;
      windowRef.removeEventListener("hashchange", onHashChange);
    }
  };
}
