const IDS = {
  statusLine: "status-line",
  sessionPill: "session-pill",
  weekPill: "week-pill",
  nextAction: "next-action",
  missionTarget: "mission-target",
  missionBullets: "mission-bullets",
  sessionPlan: "session-plan",
  checklist: "checklist",
  progressText: "progress-text",
  progressFill: "progress-fill",
  promptText: "prompt-text",
  copyPrompt: "copy-prompt",
  copyEvidence: "copy-evidence",
  evidencePath: "evidence-path",
  weekTitle: "week-title",
  weeklyTargets: "weekly-targets",
  weekSource: "week-source",
  weekAssessment: "week-assessment",
  weekProfile: "week-profile",
  adaptiveFocus: "adaptive-focus",
  adaptiveRecommendations: "adaptive-recommendations",
  extensionRisk: "extension-risk",
  exercisesList: "exercises-list",
  resourcesList: "resources-list",
  bookModules: "book-modules",
  bookProgress: "book-progress",
  trendSnapshot: "trend-snapshot",
  timerDisplay: "timer-display",
  timerStart: "timer-start",
  timerPause: "timer-pause",
  timerReset: "timer-reset",
  quickNote: "quick-note",
  deliverables: "deliverables",
  dailyGate: "daily-gate",
  weekGateChecks: "week-gate-checks",
  rubricGrid: "rubric-grid",
  scoreSummary: "score-summary",
  metricsGrid: "metrics-grid",
  metricsNotesGrid: "metrics-notes-grid",
  artifactAudio: "artifact-audio",
  artifactWriting: "artifact-writing"
};

function requiredById(documentRef, id) {
  const node = documentRef.getElementById(id);
  if (!node) {
    throw new Error(`Missing DOM node #${id}`);
  }
  return node;
}

export function createDOM(documentRef = document) {
  return {
    ...Object.fromEntries(
      Object.entries(IDS).map(([name, id]) => [name, requiredById(documentRef, id)])
    )
  };
}

export function clearNode(node) {
  node.innerHTML = "";
}

export function setList(node, items) {
  const doc = node.ownerDocument;
  if (!doc) {
    throw new Error("Cannot render list without ownerDocument");
  }
  clearNode(node);
  items.forEach((item) => {
    const li = doc.createElement("li");
    li.textContent = item;
    node.appendChild(li);
  });
}
