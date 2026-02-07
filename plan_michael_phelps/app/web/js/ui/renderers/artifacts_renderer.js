export function renderArtifacts(dom, artifacts, onArtifactChange) {
  dom.artifactAudio.value = artifacts.audio_path || "";
  dom.artifactWriting.value = artifacts.writing_path || "";

  dom.artifactAudio.oninput = () => {
    onArtifactChange("audio_path", dom.artifactAudio.value);
  };

  dom.artifactWriting.oninput = () => {
    onArtifactChange("writing_path", dom.artifactWriting.value);
  };
}
