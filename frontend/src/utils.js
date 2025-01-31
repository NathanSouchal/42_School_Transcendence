import { header } from "./app";

export function resetZIndex() {
  const canvas = document.querySelector("#c");
  const app = document.querySelector("#app");
  if (canvas && app) {
    canvas.style.zIndex = "-1"; // Canvas en arrière-plan
    //app.style.zIndex = "0"; // App en avant-plan
    app.classList.remove("view2");
    app.classList.add("view1");
  }
}

export function updateView(context) {
  const container = document.getElementById("app");
  if (container) {
    container.innerHTML = context.render();
    context.removeEventListeners();
    context.attachEventListeners();
  }
}

export function handleHeader(isUserLoggedIn, needsToDestroy) {
  if (needsToDestroy && (header.isUserRendered || header.isGuestRendered)) {
    header.destroy();
  } else if (needsToDestroy) {
    header.destroy();
  } else if (isUserLoggedIn && !header.isUserRendered) {
    if (header.isGuestRendered) {
      header.destroy();
    }
    header.renderUserLoggedIn();
  } else if (!isUserLoggedIn && !header.isGuestRendered) {
    if (header.isUserRendered) {
      header.destroy();
    }
    header.renderGuestUser();
  }
}

export function logout() {}
