import test from "node:test";
import assert from "node:assert/strict";

import { LearningShell } from "../ui/learning_shell.js";

test("learning shell renders dashboard metrics without reference errors", () => {
  const originalDocument = globalThis.document;
  const originalCustomEvent = globalThis.CustomEvent;

  const fakeContainer = {
    innerHTML: "",
    _clickHandler: null,
    querySelectorAll() {
      return [];
    },
    addEventListener(eventName, handler) {
      if (eventName === "click") {
        this._clickHandler = handler;
      }
    },
    removeEventListener(eventName, handler) {
      if (eventName === "click" && this._clickHandler === handler) {
        this._clickHandler = null;
      }
    }
  };

  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  };

  globalThis.document = {
    getElementById(id) {
      return id === "v4-root" ? fakeContainer : null;
    },
    dispatchEvent() {}
  };

  try {
    const shell = new LearningShell("v4-root", {
      activeWeekLabel: "w12",
      activeDayLabel: "martes",
      program: {
        weekNumber: 12,
        dayNumber: 2,
        phases: [{ id: "phase1", title: "Foundation", cefr: "A1" }]
      },
      config: {
        user: {
          name: "QA",
          level: "Nivel 12",
          progress: { phase_id: "phase1" }
        }
      },
      metrics: {
        heroRewardLabel: "+200 XP",
        sessionRewardLabel: "XP objetivo",
        rankingTitle: "Top 1% Local",
        rankingTier: "Liga Diamante",
        streakLabel: "12 dias",
        xpLabel: "1240",
        accuracyLabel: "85%"
      }
    });

    const html = shell.renderLayout({ view: "hoy" });
    assert.equal(typeof html, "string");
    assert.match(html, /\+200 XP/);
    assert.match(html, /Top 1% Local/);
    assert.match(html, /Liga Diamante/);
    assert.doesNotThrow(() => shell.render({ view: "hoy" }));
    assert.match(fakeContainer.innerHTML, /XP objetivo/);
  } finally {
    globalThis.document = originalDocument;
    globalThis.CustomEvent = originalCustomEvent;
  }
});
