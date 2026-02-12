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

test("learning shell derives dashboard defaults from runtime context", () => {
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
      activeWeekLabel: "w03",
      activeDayLabel: "Tue",
      activeDayContent: {
        day_id: "W03_D02",
        session_script: [
          { title: "Input dirigido", duration_min: 10 },
          { title: "Roleplay guiado", duration_min: 15 }
        ]
      },
      weekSummaries: [
        {
          week: 3,
          week_profile: { cefr_target: "A2", focus_theme: "Past Simple" },
          days: {
            Wed: {
              session_script: [
                { title: "Shadowing operativo", duration_min: 20 }
              ]
            }
          }
        }
      ],
      program: {
        weekNumber: 3,
        programWeeks: 20,
        sessionMinutes: 120,
        phases: [{ id: "phase1", title: "Foundation", cefr: "A1 -> A2" }]
      },
      config: {
        pace_mode: "accelerated_sustainable",
        target_cefr: "B2",
        user: {
          name: "QA",
          level: "Nivel 3",
          progress: { phase_id: "phase1" }
        }
      },
      getSessionSnapshot: () => ({
        progressPct: 40,
        currentStepIndex: 2,
        totalSteps: 5,
        status: "active",
        currentStepTitle: "Roleplay guiado"
      })
    });

    const metrics = shell.getDashboardMetrics();
    assert.equal(metrics.weeklyProgressLabel, "15%");
    assert.equal(metrics.sessionMinutesLabel, "25 min");
    assert.equal(metrics.sessionRewardLabel, "2/5 pasos");
    assert.equal(metrics.rankingTier, "Objetivo A2");
    assert.equal(metrics.themeTitle, "Past Simple");
    assert.equal(metrics.upcomingTag, "MIERCOLES");

    const html = shell.renderLayout({ view: "hoy" });
    assert.match(html, /15%/);
    assert.match(html, /Past Simple/);
    assert.match(html, /Objetivo A2/);
    assert.ok(!/85%/.test(html));
    assert.ok(!/Word of the Day/.test(html));
  } finally {
    globalThis.document = originalDocument;
    globalThis.CustomEvent = originalCustomEvent;
  }
});

test("learning shell reads persisted theme and toggles ui mode", () => {
  const originalDocument = globalThis.document;
  const originalCustomEvent = globalThis.CustomEvent;

  const bodyAttributes = new Map();
  const bodyClasses = new Set();
  const fakeBody = {
    setAttribute(name, value) {
      bodyAttributes.set(name, value);
    },
    classList: {
      toggle(className, force) {
        if (force) {
          bodyClasses.add(className);
        } else {
          bodyClasses.delete(className);
        }
      }
    }
  };

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

  let persistedTheme = "dark";
  const fakeWindow = {
    localStorage: {
      getItem(key) {
        return key === "hxc_ui_theme" ? persistedTheme : null;
      },
      setItem(key, value) {
        if (key === "hxc_ui_theme") {
          persistedTheme = value;
        }
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
    body: fakeBody,
    getElementById(id) {
      return id === "v4-root" ? fakeContainer : null;
    },
    dispatchEvent() {}
  };

  try {
    const shell = new LearningShell("v4-root", {
      activeWeekLabel: "w01",
      activeDayLabel: "Mon",
      windowRef: fakeWindow,
      program: {
        weekNumber: 1,
        phases: [{ id: "phase1", title: "Foundation", cefr: "A1" }]
      },
      config: {
        user: {
          name: "QA",
          level: "Nivel 1",
          progress: { phase_id: "phase1" }
        }
      }
    });

    shell.render({ view: "hoy" });
    assert.equal(bodyAttributes.get("data-ui-theme"), "dark");
    assert.match(fakeContainer.innerHTML, /Modo Luz/);

    shell.toggleTheme();
    assert.equal(bodyAttributes.get("data-ui-theme"), "light");
    assert.equal(persistedTheme, "light");
    assert.equal(bodyClasses.has("theme-light"), true);
    assert.match(fakeContainer.innerHTML, /Modo Oscuro/);
  } finally {
    globalThis.document = originalDocument;
    globalThis.CustomEvent = originalCustomEvent;
  }
});
