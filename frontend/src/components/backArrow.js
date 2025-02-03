export function createBackArrow(route) {
  return `<a href="${route || "/"}" class="back-arrow">←</a>`;
}

// export function createBackArrow(href = "/") {
//   const backArrow = document.createElement("a");
//   backArrow.href = href;
//   backArrow.className = "back-arrow";
//   backArrow.id = "back-arrow";
//   backArrow.textContent = "←";
//   return backArrow;
// }
