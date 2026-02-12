import { getDefaultChecklist } from "../domain/checklist.js";
import { STEP_STATUS } from "./orchestrator.js";

const SKILL_KEYS = Object.freeze(["listening", "speaking", "reading", "writing"]);

const STEP_TYPE_TO_SKILLS = Object.freeze({
  input_video: ["listening"],
  listening_task: ["listening"],
  listening_drill: ["listening"],
  ai_roleplay: ["speaking"],
  speaking_task: ["speaking"],
  recording_task: ["speaking"],
  repair_drill: ["speaking", "writing"],
  reading_task: ["reading"],
  textbook_drill: ["reading", "writing"],
  writing_task: ["writing"],
  evidence_log: ["writing"],
  quiz: ["reading", "writing"]
});

const EVIDENCE_GATE_TYPES = new Set([
  "artifact_uploaded",
  "evidence_upload",
  "min_words",
  "evidence_log_min_words",
  "min_turns",
  "rubric_min",
  "metrics_threshold",
  "self_score"
]);

function asStepType(value) {
  return String(value || "").trim().toLowerCase();
}

function isCompletedStatus(status) {
  return status === STEP_STATUS.DONE || status === STEP_STATUS.RECOVERED;
}

function normalizeJourneyStepStatus(status) {
  if (status === STEP_STATUS.DONE || status === STEP_STATUS.RECOVERED) return "done";
  if (status === STEP_STATUS.ACTIVE) return "active";
  if (status === STEP_STATUS.FAILED) return "failed";
  return "locked";
}

function hasEvidencePayload(payload) {
  if (!payload || typeof payload !== "object") return false;

  if (typeof payload.text === "string" && payload.text.trim()) return true;
  if (typeof payload.log === "string" && payload.log.trim()) return true;
  if (typeof payload.artifactPath === "string" && payload.artifactPath.trim()) return true;
  if (payload.checked === true) return true;
  if (Number.isFinite(Number(payload.score))) return true;
  if (Number.isFinite(Number(payload.turnCount))) return true;

  if (payload.rubric && typeof payload.rubric === "object" && Object.keys(payload.rubric).length > 0) {
    return true;
  }

  if (payload.metrics && typeof payload.metrics === "object" && Object.keys(payload.metrics).length > 0) {
    return true;
  }

  return false;
}

function gateRequiresEvidence(gate) {
  if (!gate || typeof gate !== "object") return false;

  if (gate.type === "compound" && Array.isArray(gate.rules)) {
    return gate.rules.some((rule) => gateRequiresEvidence(rule));
  }

  return EVIDENCE_GATE_TYPES.has(String(gate.type || ""));
}

function resolveSkillTags(step) {
  const type = asStepType(step?.type);
  if (STEP_TYPE_TO_SKILLS[type]) {
    return STEP_TYPE_TO_SKILLS[type];
  }

  const tags = [];
  if (type.includes("listen")) tags.push("listening");
  if (type.includes("speak") || type.includes("roleplay") || type.includes("record")) tags.push("speaking");
  if (type.includes("read") || type.includes("textbook")) tags.push("reading");
  if (type.includes("write") || type.includes("journal") || type.includes("evidence")) tags.push("writing");
  return tags;
}

function safeRoundPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function deriveJourneySnapshot(orchestratorRef) {
  const checklist = getDefaultChecklist();
  const sessionScript = Array.isArray(orchestratorRef?.schema?.session_script)
    ? orchestratorRef.schema.session_script
    : [];
  const primaryStepIds = typeof orchestratorRef?.getPrimaryStepIds === "function"
    ? orchestratorRef.getPrimaryStepIds()
    : [];
  const primaryStepSet = new Set(primaryStepIds);
  const stepStates = (orchestratorRef?.state && orchestratorRef.state.stepStates) || {};
  const stepData = (orchestratorRef?.state && orchestratorRef.state.stepData) || {};

  const progressPct = safeRoundPercent(
    typeof orchestratorRef?.getProgress === "function" ? orchestratorRef.getProgress() : 0
  );

  const skillAvailable = { listening: 0, speaking: 0, reading: 0, writing: 0 };
  const skillDone = { listening: 0, speaking: 0, reading: 0, writing: 0 };
  const steps = [];

  let evidenceRequired = false;

  for (const step of sessionScript) {
    const stepId = step?.step_id;
    if (!primaryStepSet.has(stepId)) {
      continue;
    }

    const tags = resolveSkillTags(step);
    const rawStatus = stepStates[stepId];
    const completed = isCompletedStatus(rawStatus);

    steps.push({
      stepId,
      title: typeof step?.title === "string" && step.title.trim() ? step.title.trim() : `Paso ${steps.length + 1}`,
      type: asStepType(step?.type) || "step",
      durationMin: Number(step?.duration_min) || 0,
      status: normalizeJourneyStepStatus(rawStatus),
      done: completed
    });

    for (const tag of tags) {
      if (!Object.prototype.hasOwnProperty.call(skillAvailable, tag)) {
        continue;
      }
      skillAvailable[tag] += 1;
      if (completed) {
        skillDone[tag] += 1;
      }
    }

    if (gateRequiresEvidence(step?.gate)) {
      evidenceRequired = true;
    }
  }

  for (const skillKey of SKILL_KEYS) {
    if (skillAvailable[skillKey] === 0) {
      checklist[skillKey] = progressPct >= 100 && primaryStepIds.length > 0;
      continue;
    }
    checklist[skillKey] = skillDone[skillKey] > 0;
  }

  const hasEvidence = Object.values(stepData).some((payload) => hasEvidencePayload(payload));
  checklist.evidence = hasEvidence || (progressPct >= 100 && !evidenceRequired);

  const completedPrimarySteps = primaryStepIds.filter((stepId) => isCompletedStatus(stepStates[stepId])).length;
  const totalPrimarySteps = primaryStepIds.length;

  const closureReady =
    totalPrimarySteps > 0 &&
    checklist.listening &&
    checklist.speaking &&
    checklist.reading &&
    checklist.writing;
  const evidenceReady = checklist.evidence;
  const evaluationReady = closureReady && evidenceReady && progressPct >= 100;

  return {
    checklist,
    primary: {
      completed: completedPrimarySteps,
      total: totalPrimarySteps
    },
    stage: {
      closureReady,
      evidenceReady,
      evaluationReady
    },
    nextRecommendedRoute: evaluationReady ? "evaluacion" : closureReady ? "cierre" : "sesion",
    steps
  };
}

export function evaluateRuntimeGuard({ routeId, journey } = {}) {
  const route = typeof routeId === "string" ? routeId : "hoy";
  const safeJourney = journey && typeof journey === "object" ? journey : {};
  const stage = safeJourney.stage && typeof safeJourney.stage === "object" ? safeJourney.stage : {};
  const session = safeJourney.session && typeof safeJourney.session === "object" ? safeJourney.session : {};
  const progressPct = safeRoundPercent(session.progressPct);

  if (route === "cierre" && !stage.closureReady) {
    return {
      level: "warning",
      message: "Completa la sesion guiada y los bloques base antes de cierre.",
      recommendedRouteId: "sesion"
    };
  }

  if (route === "evaluacion" && progressPct < 100) {
    return {
      level: "warning",
      message: "Completa todos los pasos de sesion antes de evaluacion.",
      recommendedRouteId: "sesion"
    };
  }

  if (route === "evaluacion" && !stage.evidenceReady) {
    return {
      level: "warning",
      message: "Registra evidencia en cierre antes de evaluar.",
      recommendedRouteId: "cierre"
    };
  }

  return {
    level: "none",
    message: "",
    recommendedRouteId: route
  };
}
