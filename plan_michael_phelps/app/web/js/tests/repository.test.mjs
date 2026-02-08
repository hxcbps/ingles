import test from "node:test";
import assert from "node:assert/strict";

import {
  FALLBACK_CONFIG,
  buildWeekContentPath,
  buildWeekContentV4Path,
  loadAdaptiveHistory,
  loadBookModulesRegistry,
  loadConfig,
  loadResourcesCatalog,
  loadWeekContent,
  loadWeekContentV4
} from "../content/repository.js";

test("repository builds canonical week path", () => {
  assert.equal(buildWeekContentPath(1), "../../learning/content/week01.json");
  assert.equal(buildWeekContentPath("20"), "../../learning/content/week20.json");
});

test("repository builds canonical V4 week path", () => {
  assert.equal(buildWeekContentV4Path(1), "../../learning/content/week01.v4.json");
  assert.equal(buildWeekContentV4Path("20"), "../../learning/content/week20.v4.json");
});

test("repository loadConfig merges and normalizes numeric fields", async () => {
  const fakeFetch = async () => ({
    ok: true,
    async json() {
      return {
        start_date: "2026-01-26",
        program_weeks: "18",
        daily_minutes: "130",
        sunday_minutes: 320,
        domain: "custom_domain"
      };
    }
  });

  const config = await loadConfig(fakeFetch);
  assert.equal(config.start_date, "2026-01-26");
  assert.equal(config.program_weeks, 18);
  assert.equal(config.daily_minutes, 130);
  assert.equal(config.sunday_minutes, 320);
  assert.equal(config.domain, "custom_domain");
});

test("repository loadConfig falls back when fetch fails", async () => {
  const failingFetch = async () => {
    throw new Error("network down");
  };

  const config = await loadConfig(failingFetch);
  assert.deepEqual(config, FALLBACK_CONFIG);
});

test("repository loadWeekContent returns path and data", async () => {
  const fakeFetch = async (path) => ({
    ok: true,
    async json() {
      return { title: `loaded:${path}` };
    }
  });

  const week = await loadWeekContent("07", fakeFetch);
  assert.equal(week.path, "../../learning/content/week07.json");
  assert.equal(week.data.title, "loaded:../../learning/content/week07.json");
});

test("repository loadWeekContentV4 returns path and data", async () => {
  const fakeFetch = async (path) => ({
    ok: true,
    async json() {
      return { title: `loaded:${path}` };
    }
  });

  const week = await loadWeekContentV4("07", fakeFetch);
  assert.equal(week.path, "../../learning/content/week07.v4.json");
  assert.equal(week.data.title, "loaded:../../learning/content/week07.v4.json");
});

test("repository loadWeekContent throws when file is missing", async () => {
  const fakeFetch = async () => ({ ok: false });

  await assert.rejects(() => loadWeekContent("02", fakeFetch), {
    message: "No se pudo cargar ../../learning/content/week02.json"
  });
});

test("repository loads resources and book registries", async () => {
  const fakeFetch = async (path) => ({
    ok: true,
    async json() {
      return { path };
    }
  });

  const resources = await loadResourcesCatalog(fakeFetch);
  const books = await loadBookModulesRegistry(fakeFetch);

  assert.equal(resources.path, "../../learning/resources/resources_catalog.v1.json");
  assert.equal(resources.data.path, "../../learning/resources/resources_catalog.v1.json");
  assert.equal(books.path, "../../learning/books/book_modules.v1.json");
  assert.equal(books.data.path, "../../learning/books/book_modules.v1.json");
});

test("repository loads adaptive history and falls back when missing", async () => {
  const fakeOkFetch = async (path) => ({
    ok: true,
    async json() {
      return { path, history: [] };
    }
  });
  const fakeFailFetch = async () => ({ ok: false });

  const loaded = await loadAdaptiveHistory(fakeOkFetch);
  assert.equal(loaded.path, "../../tracking/state/adaptive_history.v1.json");
  assert.equal(loaded.data.path, "../../tracking/state/adaptive_history.v1.json");

  const fallback = await loadAdaptiveHistory(fakeFailFetch);
  assert.equal(fallback.path, "../../tracking/state/adaptive_history.v1.json");
  assert.equal(Array.isArray(fallback.data.history), true);
  assert.equal(fallback.data.extension.weeks_assigned, 0);
});
