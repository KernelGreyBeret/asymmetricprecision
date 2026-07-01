const responses = {
  yes: "Then this page did its job. Follow a connection and keep sharpening the model.",
  thinking: "Good. Complex systems are worth thinking about. Let the question stay alive for a while.",
  notYet: "That is useful signal. AP should make hard systems clearer, not merely sound impressive."
};

export function initializeLearningCheckpoints() {
  document.querySelectorAll("[data-ap-learning-checkpoint]").forEach((checkpoint) => {
    const output = checkpoint.querySelector("[data-ap-learning-response]");
    checkpoint.querySelectorAll("button[data-ap-reflection]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.getAttribute("data-ap-reflection");
        if (output) output.textContent = responses[key] || "Reflection recorded locally.";
      });
    });
  });
}
