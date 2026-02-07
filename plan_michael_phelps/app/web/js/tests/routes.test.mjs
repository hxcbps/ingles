import test from "node:test";
import assert from "node:assert/strict";

import {
  canonicalHashForRoute,
  DEFAULT_ROUTE_ID,
  resolveRoute
} from "../routing/routes.js";

test("routes resolves canonical hash", () => {
  const resolved = resolveRoute("#/today/session");

  assert.equal(resolved.routeId, "session");
  assert.equal(resolved.canonicalHash, "#/today/session");
  assert.equal(resolved.redirectedFromLegacy, false);
  assert.equal(resolved.isInvalid, false);
});

test("routes resolves aliases and legacy hashes", () => {
  const alias = resolveRoute("#/today");
  assert.equal(alias.routeId, "action");
  assert.equal(alias.canonicalHash, "#/today/action");
  assert.equal(alias.redirectedFromLegacy, false);

  const legacy = resolveRoute("#step-timer");
  assert.equal(legacy.routeId, "session");
  assert.equal(legacy.canonicalHash, "#/today/session");
  assert.equal(legacy.redirectedFromLegacy, true);
  assert.equal(legacy.isInvalid, false);
});

test("routes sends invalid hashes to default route", () => {
  const invalid = resolveRoute("#/unknown/path");
  assert.equal(invalid.routeId, DEFAULT_ROUTE_ID);
  assert.equal(invalid.canonicalHash, canonicalHashForRoute(DEFAULT_ROUTE_ID));
  assert.equal(invalid.isInvalid, true);
});

test("routes uses default route for empty hash without invalid flag", () => {
  const empty = resolveRoute("");
  assert.equal(empty.routeId, DEFAULT_ROUTE_ID);
  assert.equal(empty.canonicalHash, "#/today/action");
  assert.equal(empty.isInvalid, false);
});
