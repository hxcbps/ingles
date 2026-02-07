import test from "node:test";
import assert from "node:assert/strict";

import { createHashRouter } from "../routing/hash_router.js";

function createFakeWindow(initialHash = "") {
  const listeners = new Map();
  const location = {
    hash: initialHash,
    pathname: "/app/web/",
    search: ""
  };
  const history = {
    replaceCalls: [],
    replaceState(_state, _title, url) {
      this.replaceCalls.push(url);
      const index = String(url).indexOf("#");
      location.hash = index >= 0 ? String(url).slice(index) : "";
    }
  };

  return {
    location,
    history,
    addEventListener(event, handler) {
      listeners.set(event, handler);
    },
    removeEventListener(event, handler) {
      if (listeners.get(event) === handler) {
        listeners.delete(event);
      }
    },
    dispatchHashChange() {
      const handler = listeners.get("hashchange");
      if (typeof handler === "function") {
        handler();
      }
    }
  };
}

test("hash router starts with canonical default route", () => {
  const fakeWindow = createFakeWindow("");
  const routeChanges = [];

  const router = createHashRouter({
    windowRef: fakeWindow,
    onRouteChange: (state) => routeChanges.push(state)
  });

  router.start();

  assert.equal(fakeWindow.location.hash, "#/today/action");
  assert.equal(routeChanges.length, 1);
  assert.equal(routeChanges[0].routeId, "action");
  assert.equal(routeChanges[0].isInvalid, false);
});

test("hash router canonicalizes legacy hash route", () => {
  const fakeWindow = createFakeWindow("#step-checklist");
  const routeChanges = [];

  const router = createHashRouter({
    windowRef: fakeWindow,
    onRouteChange: (state) => routeChanges.push(state)
  });

  router.start();

  assert.equal(fakeWindow.location.hash, "#/today/close");
  assert.equal(routeChanges.length, 1);
  assert.equal(routeChanges[0].routeId, "close");
  assert.equal(routeChanges[0].redirectedFromLegacy, true);
});

test("hash router reports invalid hashes and redirects", () => {
  const fakeWindow = createFakeWindow("#/bad/path");
  const invalidRoutes = [];
  const routeChanges = [];

  const router = createHashRouter({
    windowRef: fakeWindow,
    onRouteChange: (state) => routeChanges.push(state),
    onInvalidRoute: (payload) => invalidRoutes.push(payload)
  });

  router.start();

  assert.equal(fakeWindow.location.hash, "#/today/action");
  assert.equal(invalidRoutes.length, 1);
  assert.equal(invalidRoutes[0].rawHash, "#/bad/path");
  assert.equal(invalidRoutes[0].canonicalHash, "#/today/action");
  assert.equal(routeChanges[0].isInvalid, true);
});

test("hash router navigate updates state and dispose stops listener", () => {
  const fakeWindow = createFakeWindow("#/today/action");
  const routeChanges = [];

  const router = createHashRouter({
    windowRef: fakeWindow,
    onRouteChange: (state) => routeChanges.push(state)
  });

  router.start();
  routeChanges.length = 0;

  router.navigate("evaluate");
  assert.equal(fakeWindow.location.hash, "#/today/evaluate");
  assert.equal(routeChanges.at(-1).routeId, "evaluate");
  assert.equal(router.current().routeId, "evaluate");

  router.dispose();

  fakeWindow.location.hash = "#/today/session";
  fakeWindow.dispatchHashChange();

  assert.equal(routeChanges.at(-1).routeId, "evaluate");
});
