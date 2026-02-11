const DEFAULT_STORAGE_KEY = "english-sprint:v4:telemetry";
const DEFAULT_MAX_EVENTS = 250;

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    }
  };
}

function resolveStorage(adapter) {
  if (
    adapter &&
    typeof adapter.getItem === "function" &&
    typeof adapter.setItem === "function" &&
    typeof adapter.removeItem === "function"
  ) {
    return adapter;
  }

  if (typeof localStorage !== "undefined") {
    return localStorage;
  }

  return createMemoryStorage();
}

function normalizeEvent(input) {
  const safe = input && typeof input === "object" ? { ...input } : {};

  return {
    event: typeof safe.event === "string" ? safe.event : "runtime_event",
    at: typeof safe.at === "string" && !Number.isNaN(Date.parse(safe.at))
      ? safe.at
      : new Date().toISOString(),
    session_id: typeof safe.session_id === "string" ? safe.session_id : null,
    day_id: typeof safe.day_id === "string" ? safe.day_id : null,
    step_id: typeof safe.step_id === "string" ? safe.step_id : null,
    route_id: typeof safe.route_id === "string" ? safe.route_id : null,
    metadata: safe.metadata && typeof safe.metadata === "object" && !Array.isArray(safe.metadata)
      ? { ...safe.metadata }
      : {}
  };
}

function asPositiveInteger(value, fallback) {
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric > 0) {
    return numeric;
  }
  return fallback;
}

export class TelemetrySink {
  constructor({
    storageKey = DEFAULT_STORAGE_KEY,
    maxEvents = DEFAULT_MAX_EVENTS,
    storageAdapter
  } = {}) {
    this.storageKey = storageKey;
    this.maxEvents = asPositiveInteger(maxEvents, DEFAULT_MAX_EVENTS);
    this.storage = resolveStorage(storageAdapter);
    this.buffer = this.load();
  }

  load() {
    let raw = null;

    try {
      raw = this.storage.getItem(this.storageKey);
    } catch {
      return [];
    }

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((item) => normalizeEvent(item)).slice(-this.maxEvents);
    } catch {
      return [];
    }
  }

  persist() {
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(this.buffer));
    } catch {
      // Keep runtime alive if storage is unavailable.
    }
  }

  write(event) {
    const entry = normalizeEvent(event);
    this.buffer.push(entry);

    if (this.buffer.length > this.maxEvents) {
      this.buffer = this.buffer.slice(-this.maxEvents);
    }

    this.persist();
    return entry;
  }

  list() {
    return this.buffer.map((entry) => ({ ...entry, metadata: { ...entry.metadata } }));
  }

  clear() {
    this.buffer = [];

    try {
      this.storage.removeItem(this.storageKey);
    } catch {
      this.persist();
    }
  }
}

export function createTelemetrySink(options = {}) {
  return new TelemetrySink(options);
}
