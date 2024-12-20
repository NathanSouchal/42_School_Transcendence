export function resetZIndex() {
    const canvas = document.querySelector("#c");
    const app = document.querySelector("main#app");

    if (canvas && app) {
      canvas.style.zIndex = "-1"; // Canvas en arrière-plan
      app.style.zIndex = "1"; // App en avant-plan
    }
  }
