import { header } from "./app";
import API from "./services/api";
import state from "./app";
import { router } from "./app";
import DOMPurify from "dompurify";

export async function updateView(context) {
  const container = document.getElementById("app");
  if (container) {
    const template = await context.render();
    const sanitizedTemplate = DOMPurify.sanitize(template, {
      ALLOWED_TAGS: [], // Bloque toutes les balises HTML
      ALLOWED_ATTR: [], // Bloque tous les attributs (onmouseover, onclick, etc.)
    });
    container.innerHTML = sanitizedTemplate;
    // Attendre que le DOM soit mis a jour de façon asynchrone
    if (typeof context.removeEventListeners === "function")
      context.removeEventListeners();
    requestAnimationFrame(() => {
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

export function setDisable(bool, id) {
  const button = document.getElementById(id);
  if (button) button.disabled = bool;
}

export async function logout() {
  setDisable(true, "logout-button");
  try {
    await API.post(`/auth/logout/`);
    state.setIsUserLoggedIn(false);
    state.state.userId = "0";
    state.state.lang = "EN";
    state.saveState();
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
    // throw error;
  }
}

export function createBackArrow(route) {
  return `<a href="${route || "/"}" class="back-arrow">←</a>`;
}
