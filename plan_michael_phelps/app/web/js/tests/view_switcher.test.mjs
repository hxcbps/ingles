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
  const actionNode = createFakeElement({ "data-route-group": "action" });
  const sessionNode = createFakeElement({ "data-route-group": "session" });

  const actionLink = createFakeElement({ "data-route-link": "action" });
  const sessionLink = createFakeElement({ "data-route-link": "session" });

  const actionFocus = createFakeElement({ "data-route-focus": "action" });
  const fallbackFocus = createFakeElement({ "data-route-focus": "always" });

  const queryLookup = {
    '[data-route-focus="action"]': actionFocus,
    '[data-route-focus="always"]': fallbackFocus
  };

  return {
    nodes: { alwaysNode, actionNode, sessionNode, actionLink, sessionLink, actionFocus, fallbackFocus },
    querySelectorAll(selector) {
      if (selector === "[data-route-group]") {
        return [alwaysNode, actionNode, sessionNode];
      }
      if (selector === "[data-route-link]") {
        return [actionLink, sessionLink];
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
  const { alwaysNode, actionNode, sessionNode, actionLink, sessionLink, actionFocus } =
    fakeDocument.nodes;

  const route = applyRouteVisibility({ documentRef: fakeDocument, routeId: "action" });

  assert.equal(route, "action");
  assert.equal(alwaysNode.hidden, false);
  assert.equal(actionNode.hidden, false);
  assert.equal(sessionNode.hidden, true);
  assert.equal(actionLink.getAttribute("aria-current"), "page");
  assert.equal(sessionLink.getAttribute("aria-current"), null);
  assert.equal(actionLink.classList.contains("is-active"), true);
  assert.equal(sessionLink.classList.contains("is-active"), false);
  assert.equal(actionFocus.focusCalls, 1);
});

test("view switcher falls back to default route for unknown route id", () => {
  const fakeDocument = createFakeDocument();
  const { actionNode, sessionNode } = fakeDocument.nodes;

  const route = applyRouteVisibility({ documentRef: fakeDocument, routeId: "unknown" });

  assert.equal(route, "action");
  assert.equal(actionNode.hidden, false);
  assert.equal(sessionNode.hidden, true);
});
