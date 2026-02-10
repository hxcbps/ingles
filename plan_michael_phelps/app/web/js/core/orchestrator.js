import { checkGate } from "../routing/hard_guards.js";
import { metricsEngine } from "./metrics_engine.js";
import { buildRuntimeEvent, createSessionId } from "./events_schema_v1.js";

const STORAGE_KEY = "english-sprint:v4:session";

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
      completedAt: null
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

  resetState(dayId) {
    this.requireSchema();
    const firstStepId = this.getFirstPrimaryStepId();

    this.state = {
      sessionId: createSessionId(),
      dayId,
      currentStepId: firstStepId,
      stepStates: {},
      stepData: {},
      retries: {},
      metrics: {},
      adaptation: null,
      recovery: null,
      startedAt: toIsoNow(),
      completedAt: null
    };

    this.schema.session_script.forEach((step) => {
      this.state.stepStates[step.step_id] = STEP_STATUS.LOCKED;
    });

    if (firstStepId) {
      this.state.stepStates[firstStepId] = STEP_STATUS.ACTIVE;
    }
  }

  normalizeState() {
    this.requireSchema();

    const safeState = this.state && typeof this.state === "object" ? this.state : {};
    this.state = {
      ...this.buildEmptyState(),
      ...safeState,
      stepStates: safeState.stepStates && typeof safeState.stepStates === "object" ? safeState.stepStates : {},
      stepData: safeState.stepData && typeof safeState.stepData === "object" ? safeState.stepData : {},
      retries: safeState.retries && typeof safeState.retries === "object" ? safeState.retries : {},
      metrics: safeState.metrics && typeof safeState.metrics === "object" ? safeState.metrics : {}
    };

    if (!resolveEventField(this.state.sessionId, null)) {
      this.state.sessionId = createSessionId();
    }

    this.schema.session_script.forEach((step) => {
      if (!this.state.stepStates[step.step_id]) {
        this.state.stepStates[step.step_id] = STEP_STATUS.LOCKED;
      }
      if (!Number.isInteger(this.state.retries[step.step_id])) {
        this.state.retries[step.step_id] = 0;
      }
    });

    if (!this.state.currentStepId || !this.stepExists(this.state.currentStepId)) {
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
    const raw = this.storage.getItem(this.storageKey);
    if (!raw) {
      this.state = this.buildEmptyState();
      return;
    }

    try {
      this.state = JSON.parse(raw);
    } catch {
      this.state = this.buildEmptyState();
    }
  }

  saveState() {
    this.storage.setItem(this.storageKey, JSON.stringify(this.state));
  }

  init(dayContent, options = {}) {
    if (!dayContent || !Array.isArray(dayContent.session_script) || dayContent.session_script.length === 0) {
      throw new Error("Contenido V4 invalido: session_script vacio.");
    }

    this.setOptions(options);
    this.schema = dayContent;
    this.loadState();

    const isNewSession =
      !this.state.dayId ||
      this.state.dayId !== dayContent.day_id ||
      !this.stepExists(this.state.currentStepId);

    if (isNewSession) {
      this.resetState(dayContent.day_id);
      this.emit("session_started", {
        stepId: null,
        metadata: {
          day_goal: dayContent.goal || "",
          total_steps: this.getPrimaryStepIds().length
        }
      });
    } else {
      this.normalizeState();
    }

    this.saveState();
    this.emitStepStarted(this.state.currentStepId, { resumed: !isNewSession });
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
