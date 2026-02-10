import test from "node:test";
import assert from "node:assert/strict";

import { evaluateSoftGuard } from "../routing/route_guards.js";

function baseChecklist() {
  return {
    listening: false,
    speaking: false,
    reading: false,
    writing: false,
    evidence: false
  };
}

test("soft guard warns on cierre when execution blocks are incomplete", () => {
  const checklist = baseChecklist();
  checklist.listening = true;

  const guard = evaluateSoftGuard({ routeId: "cierre", checklist });

  assert.equal(guard.level, "warning");
  assert.equal(guard.recommendedRouteId, "sesion");
  assert.match(guard.message, /Faltan bloques de ejecucion/);
});

test("soft guard warns on evaluacion when evidence is missing", () => {
  const checklist = baseChecklist();
  checklist.listening = true;
  checklist.speaking = true;
  checklist.reading = true;
  checklist.writing = true;

  const guard = evaluateSoftGuard({ routeId: "evaluacion", checklist });

  assert.equal(guard.level, "warning");
  assert.equal(guard.recommendedRouteId, "cierre");
  assert.match(guard.message, /Completa evidencia/);
});

test("soft guard returns none when route is valid for current progress", () => {
  const checklist = baseChecklist();
  checklist.listening = true;
  checklist.speaking = true;
  checklist.reading = true;
  checklist.writing = true;
  checklist.evidence = true;

  const guard = evaluateSoftGuard({ routeId: "evaluacion", checklist });

  assert.equal(guard.level, "none");
  assert.equal(guard.message, "");
  assert.equal(guard.recommendedRouteId, "evaluacion");
});
