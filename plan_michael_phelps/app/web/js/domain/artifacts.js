export function getDefaultArtifacts() {
  return {
    audio_path: "",
    writing_path: ""
  };
}

export function normalizeArtifacts(artifacts) {
  const defaults = getDefaultArtifacts();
  return {
    audio_path: typeof artifacts?.audio_path === "string" ? artifacts.audio_path : defaults.audio_path,
    writing_path: typeof artifacts?.writing_path === "string" ? artifacts.writing_path : defaults.writing_path
  };
}
