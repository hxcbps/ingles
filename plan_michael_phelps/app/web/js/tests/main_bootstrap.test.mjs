import test from "node:test";
import assert from "node:assert/strict";

import { renderBootFailure, startApp } from "../main.js";

function createFakeDom() {
  const listeners = {};

  const reloadButton = {
    addEventListener(eventName, handler) {
      listeners[eventName] = handler;
    }
  };

  const root = {
    innerHTML: "",
    querySelector(selector) {
      if (selector === "#btn-fatal-reload") {
        return reloadButton;
      }
      return null;
    }
  };

  const documentRef = {
    getElementById(id) {
      return id === "v4-root" ? root : null;
    }
  };

  let reloadCalls = 0;
  const windowRef = {
    location: {
      reload() {
        reloadCalls += 1;
      }
    }
  };

  return {
    root,
    documentRef,
    windowRef,
    listeners,
    getReloadCalls: () => reloadCalls
  };
}

test("startApp boots when bootstrapV4 is available", async () => {
  const dom = createFakeDom();

  let called = false;
  await startApp({
    documentRef: dom.documentRef,
    windowRef: dom.windowRef,
    loadBootstrapModule: async () => ({
      bootstrapV4: async () => {
        called = true;
      }
    })
  });

  assert.equal(called, true);
  assert.equal(dom.root.innerHTML, "");
});

test("startApp renders fatal shell when module import fails", async () => {
  const dom = createFakeDom();

  await startApp({
    documentRef: dom.documentRef,
    windowRef: dom.windowRef,
    loadBootstrapModule: async () => {
      throw new Error("module import exploded");
    }
  });

  assert.match(dom.root.innerHTML, /Fallo critico/);
  assert.match(dom.root.innerHTML, /module import exploded/);
});

test("startApp renders fatal shell when bootstrapV4 export is missing", async () => {
  const dom = createFakeDom();

  await startApp({
    documentRef: dom.documentRef,
    windowRef: dom.windowRef,
    loadBootstrapModule: async () => ({})
  });

  assert.match(dom.root.innerHTML, /No se encontro bootstrapV4/);
});

test("renderBootFailure wires reload action", () => {
  const dom = createFakeDom();

  renderBootFailure({
    documentRef: dom.documentRef,
    windowRef: dom.windowRef,
    message: "fatal"
  });

  assert.equal(typeof dom.listeners.click, "function");
  dom.listeners.click();
  assert.equal(dom.getReloadCalls(), 1);
});
