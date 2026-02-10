import test from "node:test";
import assert from "node:assert/strict";

import { applyRouteVisibility } from "../routing/view_switcher.js";

function createFakeElement(attributes = {}) {
  const attrs = { ...attributes };
  const classes = new Set();

  return {
    hidden: false,
    focusCalls: 0,
    classList: {
      toggle(name, enabled) {
        if (enabled) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
      },
      contains(name) {
        return classes.has(name);
      }
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
    },
    setAttribute(name, value) {
      attrs[name] = String(value);
    },
    removeAttribute(name) {
      delete attrs[name];
    },
    focus() {
      this.focusCalls += 1;
    }
  };
}

function createFakeDocument() {
  const alwaysNode = createFakeElement({ "data-route-group": "always" });
  const hoyNode = createFakeElement({ "data-route-group": "hoy" });
  const sesionNode = createFakeElement({ "data-route-group": "sesion" });

  const hoyLink = createFakeElement({ "data-route-link": "hoy" });
  const sesionLink = createFakeElement({ "data-route-link": "sesion" });

  const hoyFocus = createFakeElement({ "data-route-focus": "hoy" });
  const fallbackFocus = createFakeElement({ "data-route-focus": "always" });

  const queryLookup = {
    '[data-route-focus="hoy"]': hoyFocus,
    '[data-route-focus="always"]': fallbackFocus
  };

  return {
    nodes: { alwaysNode, hoyNode, sesionNode, hoyLink, sesionLink, hoyFocus, fallbackFocus },
    querySelectorAll(selector) {
      if (selector === "[data-route-group]") {
        return [alwaysNode, hoyNode, sesionNode];
      }
      if (selector === "[data-route-link]") {
        return [hoyLink, sesionLink];
      }
      return [];
    },
    querySelector(selector) {
      return queryLookup[selector] || null;
    }
  };
}

test("view switcher toggles visibility and active link state by route", () => {
  const fakeDocument = createFakeDocument();
  const { alwaysNode, hoyNode, sesionNode, hoyLink, sesionLink, hoyFocus } = fakeDocument.nodes;

  const route = applyRouteVisibility({ documentRef: fakeDocument, routeId: "hoy" });

  assert.equal(route, "hoy");
  assert.equal(alwaysNode.hidden, false);
  assert.equal(hoyNode.hidden, false);
  assert.equal(sesionNode.hidden, true);
  assert.equal(hoyLink.getAttribute("aria-current"), "page");
  assert.equal(sesionLink.getAttribute("aria-current"), null);
  assert.equal(hoyLink.classList.contains("is-active"), true);
  assert.equal(sesionLink.classList.contains("is-active"), false);
  assert.equal(hoyFocus.focusCalls, 1);
});

test("view switcher falls back to default route for unknown route id", () => {
  const fakeDocument = createFakeDocument();
  const { hoyNode, sesionNode } = fakeDocument.nodes;

  const route = applyRouteVisibility({ documentRef: fakeDocument, routeId: "unknown" });

  assert.equal(route, "hoy");
  assert.equal(hoyNode.hidden, false);
  assert.equal(sesionNode.hidden, true);
});
