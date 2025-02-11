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
    container.innerHTML = await context.render();
    // Attendre que le DOM soit mis a jour de façon asynchrone
    requestAnimationFrame(() => {
      context.removeEventListeners();
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
    const res = await API.get("/auth/is-auth/");
    const id = res.data.user_id.toString();
    console.log(id);
    if (!state.isUserLoggedIn) state.setIsUserLoggedIn(true);
    if (id !== state.state.userId) {
      state.state.userId = id;
      state.saveState();
    }
  } catch (error) {
    console.error(`Error while trying to check user status : ${error}`);
    throw error;
  }
}

export function createBackArrow(route) {
  return `<a href="${route || "/"}" class="back-arrow">←</a>`;
}
