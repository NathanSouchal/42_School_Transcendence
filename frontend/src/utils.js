import { header } from "./app";
import API from "./services/api";
import state from "./app";
import { router } from "./app";

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

export async function updateView(context) {
  const container = document.getElementById("app");
  if (container) {
    context.removeEventListeners();
    container.innerHTML = await context.render();
    // Attendre que le DOM soit mis a jour de façon asynchrone
    requestAnimationFrame(() => {
      context.attachEventListeners();
    });
  }
}

export async function handleHeader(isUserLoggedIn, needsToDestroy) {
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

export async function logout() {
  try {
    await API.post(`/auth/logout/`);
    state.setIsUserLoggedIn(false);
    //remove user id also
    router.navigate("/");
  } catch (error) {
    console.error(`Error while trying to logout : ${error}`);
  }
}

export async function checkUserStatus() {
  try {
    await API.get("/auth/is-auth/");
    if (!state.isUserLoggedIn) state.setIsUserLoggedIn(true);
  } catch (error) {
    if (state.isUserLoggedIn) state.setIsUserLoggedIn(false);
    console.error(`Error while trying to check user status : ${error}`);
    throw error;
  }
}

export function createBackArrow(route) {
  return `<a href="${route || "/"}" class="back-arrow">←</a>`;
}
