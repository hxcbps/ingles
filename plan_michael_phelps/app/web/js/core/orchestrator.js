import { checkGate } from "../routing/hard_guards.js";
import { metricsEngine } from "./metrics_engine.js";
import { EVENT_NAMES, buildRuntimeEvent, createSessionId } from "./events_schema_v1.js";

const STORAGE_KEY = "english-sprint:v4:session";
const STATE_SCHEMA_VERSION = 2;

const METADATA_RESERVED_KEYS = new Set([
  "metadata",
  "dayId",
  "day_id",
  "stepId",
  "step_id",
  "routeId",
  "route_id"
]);

export const STEP_STATUS = {
  LOCKED: "locked",
  ACTIVE: "active",
  DONE: "done",
  FAILED: "failed",
  RECOVERED: "recovered"
};

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    }
  };
}

function resolveStorage(adapter) {
  if (adapter && typeof adapter.getItem === "function" && typeof adapter.setItem === "function") {
    return adapter;
  }

  if (typeof localStorage !== "undefined") {
    return localStorage;
  }

  return createMemoryStorage();
}

function resolveMaxRetries(policy) {
  if (!policy) return 0;
  if (typeof policy === "object" && Number.isInteger(policy.max_attempts) && policy.max_attempts >= 0) {
    return policy.max_attempts;
  }
  if (typeof policy === "string") {
    if (policy === "repeat_once") return 1;
    if (policy === "repeat_twice") return 2;
  }
  return 0;
}

function toIsoNow() {
  return new Date().toISOString();
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    const entries = keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

function buildSchemaSignature(dayContent) {
  const steps = Array.isArray(dayContent?.session_script) ? dayContent.session_script : [];
  const contract = {
    day_id: typeof dayContent?.day_id === "string" ? dayContent.day_id : "unknown_day",
    goal: typeof dayContent?.goal === "string" ? dayContent.goal : "",
    steps: steps.map((step, index) => ({
      index,
      step_id: typeof step?.step_id === "string" && step.step_id.trim() ? step.step_id.trim() : `index_${index}`,
      type: typeof step?.type === "string" && step.type.trim() ? step.type.trim() : "unknown",
      difficulty_level:
        typeof step?.difficulty_level === "string" && step.difficulty_level.trim()
          ? step.difficulty_level.trim()
          : "",
      duration_min: Number.isFinite(step?.duration_min) ? Number(step.duration_min) : null,
      gate: step?.gate ?? null,
      retry_policy: step?.retry_policy ?? null,
      fallback_step_id:
        typeof step?.fallback_step_id === "string" && step.fallback_step_id.trim()
          ? step.fallback_step_id.trim()
          : "",
      success_criteria: step?.success_criteria ?? null,
      content: step?.content ?? null
    }))
  };

  return stableSerialize(contract);
}

function asObjectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeEventMetadata(payload = {}) {
  const baseMetadata =
    payload.metadata && typeof payload.metadata === "object" && !Array.isArray(payload.metadata)
      ? { ...payload.metadata }
      : {};

  Object.entries(payload).forEach(([key, value]) => {
    if (METADATA_RESERVED_KEYS.has(key)) return;
    baseMetadata[key] = value;
  });

  return baseMetadata;
}

function resolveEventField(value, fallback = null) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return fallback;
}

export class Orchestrator {
  constructor({ storageKey = STORAGE_KEY, storageAdapter, onEvent } = {}) {
    this.storageKey = storageKey;
    this.storage = resolveStorage(storageAdapter);
    this.onEvent = typeof onEvent === "function" ? onEvent : null;
    this.schema = null;
    this.state = this.buildEmptyState();
  }

buildEmptyState() {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    schemaSignature: "",
    sessionId: null,
    dayId: null,
    currentStepId: null,
    stepStates: {},
    stepData: {},
    retries: {},
    metrics: {},
    adaptation: null,
    recovery: null,
    startedAt: null,
    completedAt: null,
    resumeCount: 0,
    lastPersistedAt: null
  };
}

  setOptions(options = {}) {
    if (typeof options.onEvent === "function") {
      this.onEvent = options.onEvent;
    }
  }

  emit(event, payload = {}) {
    if (typeof this.onEvent !== "function") return null;

    if (!this.state.sessionId) {
      this.state.sessionId = createSessionId();
    }

    const dayId =
      resolveEventField(payload.day_id, null) ||
      resolveEventField(payload.dayId, null) ||
      resolveEventField(this.state.dayId, "unknown_day");

    const stepId =
      resolveEventField(payload.step_id, null) ||
      resolveEventField(payload.stepId, null) ||
      resolveEventField(this.state.currentStepId, null);

    const routeId =
      resolveEventField(payload.route_id, null) ||
      resolveEventField(payload.routeId, null) ||
      null;

    const runtimeEvent = buildRuntimeEvent({
      event,
      at: toIsoNow(),
      session_id: this.state.sessionId,
      day_id: dayId,
      step_id: stepId,
      route_id: routeId,
      metadata: safeEventMetadata(payload)
    });

    this.onEvent(runtimeEvent);
    return runtimeEvent;
  }

  requireSchema() {
    if (!this.schema || !Array.isArray(this.schema.session_script)) {
      throw new Error("V4 schema no inicializado.");
    }
  }

  getStepById(stepId) {
    this.requireSchema();
    return this.schema.session_script.find((step) => step.step_id === stepId) || null;
  }

  stepExists(stepId) {
    return Boolean(this.getStepById(stepId));
  }

  getFallbackStepIds() {
    this.requireSchema();
    const ids = new Set();
    this.schema.session_script.forEach((step) => {
      if (typeof step.fallback_step_id === "string" && step.fallback_step_id.trim()) {
        ids.add(step.fallback_step_id.trim());
      }
    });
    return ids;
  }

  getPrimaryStepIds() {
    this.requireSchema();
    const fallbackIds = this.getFallbackStepIds();
    return this.schema.session_script
      .map((step) => step.step_id)
      .filter((stepId) => !fallbackIds.has(stepId));
  }

  getFirstPrimaryStepId() {
    const ids = this.getPrimaryStepIds();
    return ids[0] || null;
  }

  getNextPrimaryStepId(fromStepId) {
    this.requireSchema();
    const fallbackIds = this.getFallbackStepIds();
    const index = this.schema.session_script.findIndex((step) => step.step_id === fromStepId);
    if (index < 0) return null;

    for (let i = index + 1; i < this.schema.session_script.length; i += 1) {
      const candidate = this.schema.session_script[i].step_id;
      if (!fallbackIds.has(candidate)) {
        return candidate;
      }
    }
    return null;
  }

resetState(dayId, schemaSignature, startReason = "new_session") {
  this.requireSchema();
  const firstStepId = this.getFirstPrimaryStepId();

  this.state = {
    ...this.buildEmptyState(),
    schemaVersion: STATE_SCHEMA_VERSION,
    schemaSignature,
    sessionId: createSessionId(),
    dayId,
    currentStepId: firstStepId,
    startedAt: toIsoNow(),
    completedAt: null,
    resumeCount: 0,
    lastPersistedAt: null
  };

  this.schema.session_script.forEach((step) => {
    this.state.stepStates[step.step_id] = STEP_STATUS.LOCKED;
  });

  if (firstStepId) {
    this.state.stepStates[firstStepId] = STEP_STATUS.ACTIVE;
  }

  return startReason;
}

normalizeState(schemaSignature) {
  this.requireSchema();

  const safeState = asObjectOrEmpty(this.state);
  this.state = {
    ...this.buildEmptyState(),
    ...safeState,
    schemaVersion: STATE_SCHEMA_VERSION,
    schemaSignature,
    stepStates: asObjectOrEmpty(safeState.stepStates),
    stepData: asObjectOrEmpty(safeState.stepData),
    retries: asObjectOrEmpty(safeState.retries),
    metrics: asObjectOrEmpty(safeState.metrics)
  };

  if (!resolveEventField(this.state.sessionId, null)) {
    this.state.sessionId = createSessionId();
  }

  if (!resolveEventField(this.state.dayId, null)) {
    this.state.dayId = this.schema?.day_id || "unknown_day";
  }

  if (!resolveEventField(this.state.startedAt, null) || Number.isNaN(Date.parse(this.state.startedAt))) {
    this.state.startedAt = toIsoNow();
  }

  if (this.state.completedAt && Number.isNaN(Date.parse(this.state.completedAt))) {
    this.state.completedAt = null;
  }

  if (!Number.isInteger(this.state.resumeCount) || this.state.resumeCount < 0) {
    this.state.resumeCount = 0;
  }

  const validStepIds = new Set(this.schema.session_script.map((step) => step.step_id));

  this.schema.session_script.forEach((step) => {
    if (!this.state.stepStates[step.step_id]) {
      this.state.stepStates[step.step_id] = STEP_STATUS.LOCKED;
    }
    if (!Number.isInteger(this.state.retries[step.step_id])) {
      this.state.retries[step.step_id] = 0;
    }
  });

  Object.keys(this.state.stepStates).forEach((stepId) => {
    if (!validStepIds.has(stepId)) {
      delete this.state.stepStates[stepId];
    }
  });

  Object.keys(this.state.stepData).forEach((stepId) => {
    if (!validStepIds.has(stepId)) {
      delete this.state.stepData[stepId];
    }
  });

  Object.keys(this.state.retries).forEach((stepId) => {
    if (!validStepIds.has(stepId)) {
      delete this.state.retries[stepId];
    }
  });

  const isCompletedSession = Boolean(this.state.completedAt) && this.getProgress() >= 100;
  if (isCompletedSession) {
    this.state.currentStepId = null;
  } else if (!this.state.currentStepId || !this.stepExists(this.state.currentStepId)) {
    this.state.currentStepId = this.getFirstPrimaryStepId();
  }

  if (!this.state.completedAt && this.state.currentStepId) {
    const status = this.state.stepStates[this.state.currentStepId];
    if (status === STEP_STATUS.LOCKED || status === STEP_STATUS.FAILED) {
      this.state.stepStates[this.state.currentStepId] = STEP_STATUS.ACTIVE;
    }
  }

  Object.keys(this.state.stepStates).forEach((stepId) => {
    if (
      stepId !== this.state.currentStepId &&
      this.state.stepStates[stepId] === STEP_STATUS.ACTIVE
    ) {
      this.state.stepStates[stepId] = STEP_STATUS.LOCKED;
    }
  });
}

loadState() {
  let raw = null;

  try {
    raw = this.storage.getItem(this.storageKey);
  } catch {
    this.state = this.buildEmptyState();
    return;
  }

  if (!raw) {
    this.state = this.buildEmptyState();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    this.state = asObjectOrEmpty(parsed);
  } catch {
    this.state = this.buildEmptyState();
  }
}

saveState() {
  this.state.lastPersistedAt = toIsoNow();

  try {
    this.storage.setItem(this.storageKey, JSON.stringify(this.state));
  } catch {
    // Best-effort persistence: runtime should continue even if storage is unavailable.
  }
}

resolveSessionStartReason(dayContent, schemaSignature) {
  if (!resolveEventField(this.state.dayId, null)) {
    return "empty_state";
  }

  if (this.state.dayId !== dayContent.day_id) {
    return "day_changed";
  }

  if (!resolveEventField(this.state.schemaSignature, null)) {
    return "schema_signature_missing";
  }

  if (this.state.schemaSignature !== schemaSignature) {
    return "schema_changed";
  }

  if (!resolveEventField(this.state.currentStepId, null)) {
    return this.state.completedAt ? "completed_session" : "missing_current_step";
  }

  if (!this.stepExists(this.state.currentStepId)) {
    return "missing_current_step";
  }

  return null;
}

init(dayContent, options = {}) {
  if (!dayContent || !Array.isArray(dayContent.session_script) || dayContent.session_script.length === 0) {
    throw new Error("Contenido V4 invalido: session_script vacio.");
  }

  this.setOptions(options);
  this.schema = dayContent;

  const schemaSignature = buildSchemaSignature(dayContent);
  this.loadState();

  const startReason = this.resolveSessionStartReason(dayContent, schemaSignature);
  const isNewSession = Boolean(startReason);

  if (isNewSession) {
    this.resetState(dayContent.day_id, schemaSignature, startReason);
    this.emit(EVENT_NAMES.SESSION_STARTED, {
      stepId: null,
      metadata: {
        day_goal: dayContent.goal || "",
        total_steps: this.getPrimaryStepIds().length,
        start_reason: startReason,
        schema_signature: schemaSignature
      }
    });
  } else {
    this.normalizeState(schemaSignature);
    this.state.resumeCount += 1;

    this.emit(EVENT_NAMES.SESSION_RESUMED, {
      stepId: this.state.currentStepId,
      metadata: {
        resume_count: this.state.resumeCount,
        progress_pct: this.getProgress(),
        current_step_id: this.state.currentStepId,
        schema_signature: schemaSignature
      }
    });
  }

  this.saveState();

  if (this.state.currentStepId) {
    this.emitStepStarted(this.state.currentStepId, { resumed: !isNewSession });
  }

  return this.getCurrentStep();
}

  emitStepStarted(stepId, extra = {}) {
    const step = this.getStepById(stepId);
    if (!step) return;

    const primarySteps = this.getPrimaryStepIds();
    const stepIndex = primarySteps.indexOf(stepId);

    this.emit("step_started", {
      stepId,
      metadata: {
        resumed: Boolean(extra.resumed),
        step_type: step.type,
        gate_type: step.gate?.type || "none",
        step_index: stepIndex >= 0 ? stepIndex + 1 : 1,
        total_steps: primarySteps.length
      }
    });
  }

  activateStep(stepId) {
    if (!this.stepExists(stepId)) return false;

    Object.keys(this.state.stepStates).forEach((id) => {
      if (this.state.stepStates[id] === STEP_STATUS.ACTIVE && id !== stepId) {
        this.state.stepStates[id] = STEP_STATUS.LOCKED;
      }
    });

    this.state.currentStepId = stepId;
    if (this.state.stepStates[stepId] !== STEP_STATUS.DONE) {
      this.state.stepStates[stepId] = STEP_STATUS.ACTIVE;
    }

    this.emitStepStarted(stepId);
    return true;
  }

  getCurrentStep() {
    if (!this.schema || !this.state.currentStepId) {
      return {
        definition: null,
        status: null,
        data: null,
        retryCount: 0
      };
    }

    const definition = this.getStepById(this.state.currentStepId);
    const primarySteps = this.getPrimaryStepIds();
    const currentIndex = primarySteps.indexOf(this.state.currentStepId);

    return {
      definition,
      status: this.state.stepStates[this.state.currentStepId],
      data: this.state.stepData[this.state.currentStepId] || {},
      retryCount: this.state.retries[this.state.currentStepId] || 0,
      stepIndex: currentIndex >= 0 ? currentIndex + 1 : 1,
      totalSteps: primarySteps.length
    };
  }

  advanceStep(completedStepId) {
    let nextStepId = null;

    if (this.state.recovery && completedStepId === this.state.recovery.fallbackStepId) {
      this.state.stepStates[this.state.recovery.fromStepId] = STEP_STATUS.RECOVERED;
      nextStepId = this.state.recovery.resumeStepId;
      this.state.recovery = null;
    } else {
      nextStepId = this.getNextPrimaryStepId(completedStepId);
    }

    if (nextStepId) {
      this.activateStep(nextStepId);
      return;
    }

    this.state.currentStepId = null;
    this.state.completedAt = toIsoNow();

    const startedAtMs = Date.parse(this.state.startedAt || "");
    const completedAtMs = Date.parse(this.state.completedAt || "");
    const durationSec = Number.isFinite(startedAtMs) && Number.isFinite(completedAtMs)
      ? Math.max(0, Math.round((completedAtMs - startedAtMs) / 1000))
      : 0;

    this.emit("session_completed", {
      stepId: null,
      metadata: {
        progress_pct: this.getProgress(),
        duration_sec: durationSec
      }
    });
  }

  submitStep(stepId, input = {}) {
    const step = this.getStepById(stepId);
    if (!step) return { success: false, action: "invalid", error: "Step invalido." };
    if (this.state.completedAt) {
      return { success: false, action: "completed", error: "La sesion ya fue completada." };
    }
    if (stepId !== this.state.currentStepId) {
      return {
        success: false,
        action: "out_of_order",
        error: "Solo puedes enviar el paso activo."
      };
    }

    const gateResult = checkGate(step.gate, input, {
      metrics: this.state.metrics,
      step,
      state: this.state
    });

    const attempt = (this.state.retries[stepId] || 0) + 1;

    this.state.stepData[stepId] = {
      ...(this.state.stepData[stepId] || {}),
      ...input,
      submittedAt: toIsoNow()
    };

    this.state.metrics = metricsEngine.update(
      this.state.dayId,
      stepId,
      {
        ...input,
        stepType: step.type,
        gateType: step.gate?.type || "none"
      },
      this.state.metrics || {}
    );

    if (gateResult.passed) {
      this.state.stepStates[stepId] = STEP_STATUS.DONE;
      this.emit("gate_passed", {
        stepId,
        metadata: {
          gate_type: step.gate?.type || "none",
          attempt
        }
      });
      this.advanceStep(stepId);
      this.saveState();
      return { success: true, action: "advance", gate: gateResult };
    }

    this.state.stepStates[stepId] = STEP_STATUS.FAILED;
    this.state.retries[stepId] = attempt;

    this.emit("gate_failed", {
      stepId,
      metadata: {
        gate_type: step.gate?.type || "none",
        attempt,
        reason: gateResult.message
      }
    });

    const maxRetries = resolveMaxRetries(step.retry_policy);

    if (attempt <= maxRetries) {
      this.state.stepStates[stepId] = STEP_STATUS.RECOVERED;
      this.saveState();
      return {
        success: false,
        action: "retry",
        attempt,
        maxRetries,
        gate: gateResult,
        error: gateResult.message
      };
    }

    if (step.fallback_step_id && this.stepExists(step.fallback_step_id)) {
      const resumeStepId = this.getNextPrimaryStepId(stepId);
      this.state.recovery = {
        fromStepId: stepId,
        fallbackStepId: step.fallback_step_id,
        resumeStepId,
        startedAt: toIsoNow()
      };
      this.activateStep(step.fallback_step_id);
      this.emit("recovery_started", {
        stepId: step.fallback_step_id,
        metadata: {
          from_step_id: stepId,
          fallback_step_id: step.fallback_step_id
        }
      });
      this.saveState();
      return {
        success: false,
        action: "fallback",
        nextStepId: step.fallback_step_id,
        gate: gateResult,
        error: gateResult.message
      };
    }

    this.saveState();
    return {
      success: false,
      action: "blocked",
      gate: gateResult,
      error: gateResult.message || "Se agotaron intentos y no existe fallback."
    };
  }

  abandon(reason = "manual_exit") {
    if (this.state.completedAt) return;
    this.emit("session_abandoned", {
      stepId: null,
      metadata: {
        reason
      }
    });
    this.saveState();
  }

  getProgress() {
    if (!this.schema) return 0;
    const primaryStepIds = this.getPrimaryStepIds();
    if (primaryStepIds.length === 0) return 0;

    const done = primaryStepIds.filter((stepId) => {
      const status = this.state.stepStates[stepId];
      return status === STEP_STATUS.DONE || status === STEP_STATUS.RECOVERED;
    }).length;

    return Math.round((done / primaryStepIds.length) * 100);
  }
}

export const orchestrator = new Orchestrator();
