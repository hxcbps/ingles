import test from "node:test";
import assert from "node:assert/strict";

import { getChecklistProgress, getDefaultChecklist, getNextAction } from "../domain/checklist.js";

test("checklist progress returns done/total/percent", () => {
  const checklist = getDefaultChecklist();
  checklist.listening = true;
  checklist.speaking = true;

  const progress = getChecklistProgress(checklist);
  assert.equal(progress.done, 2);
  assert.equal(progress.total, 5);
  assert.equal(progress.percent, 40);
});

test("checklist next action follows execution order", () => {
  const checklist = getDefaultChecklist();
  assert.equal(getNextAction(checklist), "1) Ejecuta listening intensivo.");

  checklist.listening = true;
  assert.equal(getNextAction(checklist), "2) Haz las rondas de Sesame.");

  checklist.speaking = true;
  checklist.reading = true;
  checklist.writing = true;
  checklist.evidence = true;
  assert.equal(getNextAction(checklist), "Dia completo. Cierra con revision corta y plan de mejora.");
});
