import { checkGate } from "../routing/hard_guards.js";
import { metricsEngine } from "./metrics_engine.js";

const STORAGE_KEY = "english-sprint:v4:session";

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
    if (typeof this.onEvent !== "function") return;
    this.onEvent({
      event,
      at: new Date().toISOString(),
      dayId: this.state.dayId,
      currentStepId: this.state.currentStepId,
      ...payload
    });
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
      dayId,
      currentStepId: firstStepId,
      stepStates: {},
      stepData: {},
      retries: {},
      metrics: {},
      adaptation: null,
      recovery: null,
      startedAt: new Date().toISOString(),
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
        dayGoal: dayContent.goal || "",
        totalSteps: this.getPrimaryStepIds().length
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
    this.emit("step_started", {
      ...extra,
      stepId,
      stepType: step.type,
      gateType: step.gate?.type || "none"
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
    this.state.completedAt = new Date().toISOString();
    this.emit("session_completed", {
      progress: this.getProgress()
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

    this.state.stepData[stepId] = {
      ...(this.state.stepData[stepId] || {}),
      ...input,
      submittedAt: new Date().toISOString()
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
        gateType: step.gate?.type || "none"
      });
      this.advanceStep(stepId);
      this.saveState();
      return { success: true, action: "advance", gate: gateResult };
    }

    this.state.stepStates[stepId] = STEP_STATUS.FAILED;
    this.emit("gate_failed", {
      stepId,
      gateType: step.gate?.type || "none",
      reason: gateResult.message
    });

    const maxRetries = resolveMaxRetries(step.retry_policy);
    const attempt = (this.state.retries[stepId] || 0) + 1;
    this.state.retries[stepId] = attempt;

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
        startedAt: new Date().toISOString()
      };
      this.activateStep(step.fallback_step_id);
      this.emit("recovery_started", {
        fromStepId: stepId,
        fallbackStepId: step.fallback_step_id
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
      reason
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
