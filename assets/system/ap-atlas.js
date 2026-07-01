export function initializeAtlasPreview() {
  document.querySelectorAll(".atlas-map .node").forEach((node) => {
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "button");
    node.setAttribute("aria-label", `Atlas node: ${node.textContent.trim()}`);
  });
}
