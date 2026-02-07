export function extractSection(markdown, heading) {
  const lines = markdown.split("\n");
  let start = -1;

  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim() === `## ${heading}`) {
      start = i + 1;
      break;
    }
  }

  if (start === -1) return "";

  const out = [];
  for (let i = start; i < lines.length; i += 1) {
    if (lines[i].startsWith("## ")) break;
    out.push(lines[i]);
  }

  return out.join("\n").trim();
}

export function parseMission(sectionText) {
  const lines = sectionText.split("\n").map((line) => line.trim()).filter(Boolean);
  const targetLine = lines.find((line) => line.startsWith("Target to force today:")) || "";
  const target = targetLine.replace("Target to force today:", "").trim();
  const bullets = lines
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-\s*/, ""));

  return { target, bullets };
}

export function parseWeekTitle(markdown) {
  const first = markdown.split("\n").find((line) => line.startsWith("# "));
  return first ? first.replace(/^#\s*/, "").trim() : "Semana";
}

export function parseWeeklyTargets(markdown) {
  const section = extractSection(markdown, "Weekly targets");
  if (!section) return [];

  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-\s*/, ""));
}
