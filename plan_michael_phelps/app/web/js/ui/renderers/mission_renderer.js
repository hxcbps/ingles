import { setList } from "../../core/dom.js";

export function renderMission(dom, dayView) {
  dom.missionTarget.textContent = dayView.goal;
  setList(dom.missionBullets, dayView.missionBullets);
}
