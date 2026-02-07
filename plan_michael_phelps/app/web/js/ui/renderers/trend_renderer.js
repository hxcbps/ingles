export function renderTrend(dom, trend) {
  if (!trend) {
    dom.trendSnapshot.textContent = "Trend unavailable.";
    return;
  }

  const errorDensity = Number.isFinite(trend.error_density_avg)
    ? trend.error_density_avg.toFixed(2)
    : "n/a";
  const repair = Number.isFinite(trend.repair_success_avg) ? trend.repair_success_avg.toFixed(1) : "n/a";
  const turn = Number.isFinite(trend.turn_length_avg) ? trend.turn_length_avg.toFixed(1) : "n/a";
  const pron = Number.isFinite(trend.pronunciation_avg) ? trend.pronunciation_avg.toFixed(2) : "n/a";

  dom.trendSnapshot.textContent =
    `Last ${trend.days} days | error density avg: ${errorDensity} | repair avg: ${repair}% | ` +
    `turn length avg: ${turn}s | pronunciation avg: ${pron}`;
}
