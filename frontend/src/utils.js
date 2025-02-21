import { header } from "./app";
import API from "./services/api";
import state from "./app";
import { router } from "./app";
import DOMPurify from "dompurify";

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

// export async function updateView(context) {
//   const container = document.getElementById("app");
//   if (container) {
//     container.innerHTML = await context.render();
//     // Attendre que le DOM soit mis a jour de façon asynchrone
//     requestAnimationFrame(() => {
//       context.removeEventListeners();
//       context.attachEventListeners();
//     });
//   }
// }

export async function updateView(context) {
  const container = document.getElementById("app");
  if (container) {
    const template = await context.render();
    const sanitizedTemplate = DOMPurify.sanitize(template);
    container.innerHTML = sanitizedTemplate;
    // Attendre que le DOM soit mis a jour de façon asynchrone
    requestAnimationFrame(() => {
      if (typeof context.removeEventListeners === "function")
        context.removeEventListeners();
      if (typeof context.attachEventListeners === "function")
        context.attachEventListeners();
    });
  }
}

export async function handleHeader(isUserLoggedIn, needsToDestroy, langChange) {
  if (header.isUserRendered || header.isGuestRendered) {
    if (needsToDestroy) header.destroy();
    else if (langChange) {
      console.log("Lang reset in handleHeader");
      if (isUserLoggedIn) header.updateLangUserLoggedIn();
      else if (!isUserLoggedIn) header.updateLangGuestUser();
    } else if (isUserLoggedIn && !header.isUserRendered) {
      header.destroy();
      header.renderUserLoggedIn();
    } else if (!isUserLoggedIn && !header.isGuestRendered) {
      header.destroy();
      header.renderGuestUser();
    }
  } else if (!header.isUserRendered && !header.isGuestRendered) {
    if (isUserLoggedIn) header.renderUserLoggedIn();
    else header.renderGuestUser();
  }
}

// export async function handleHeader(isUserLoggedIn, needsToDestroy) {
//   if (needsToDestroy && (header.isUserRendered || header.isGuestRendered)) {
//     header.destroy();
//   } else if (isUserLoggedIn && !header.isUserRendered) {
//     if (header.isGuestRendered) {
//       header.destroy();
//     }
//     header.renderUserLoggedIn();
//   } else if (!isUserLoggedIn && !header.isGuestRendered) {
//     if (header.isUserRendered) {
//       header.destroy();
//     }
//     header.renderGuestUser();
//   }
// }

export function setDisable(bool, id) {
  const button = document.getElementById(id);
  if (button) button.disabled = bool;
}

export async function logout() {
  setDisable(true, "logout-button");
  try {
    await API.post(`/auth/logout/`);
    state.setIsUserLoggedIn(false);
    //remove user id also
    router.navigate("/");
  } catch (error) {
    console.error(`Error while trying to logout : ${error}`);
    throw error;
  } finally {
    setDisable(false, "logout-button");
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
