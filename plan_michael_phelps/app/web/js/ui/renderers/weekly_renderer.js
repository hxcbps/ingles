import { setList } from "../../core/dom.js";

export function renderWeekly(dom, weekView) {
  dom.weekTitle.textContent = weekView.title;
  setList(dom.weeklyTargets, weekView.targets);
  setList(dom.weekGateChecks, weekView.gateChecks);
  const profile = weekView.profile || {};
  dom.weekProfile.textContent = `Phase: ${profile.phase || "N/A"} | CEFR: ${
    profile.cefr_target || "N/A"
  } | Mix: general ${profile?.domain_mix?.general ?? "?"}% / tech ${
    profile?.domain_mix?.tech ?? "?"
  }%`;
  const assessment = weekView.assessment || {};
  dom.weekAssessment.textContent = `Assessment: ${assessment.type || "N/A"} | checkpoint: ${
    assessment.checkpoint_week ? "yes" : "no"
  }`;
  dom.weekSource.textContent = weekView.sourcePath;
}
