export function createBackArrow(href = "/") {
  const backArrow = document.createElement("a");
  backArrow.href = href;
  backArrow.className = "back-arrow";
  backArrow.textContent = "←";
  return backArrow;
}
