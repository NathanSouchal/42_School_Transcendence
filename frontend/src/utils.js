import { header } from "./app";
import API from "./services/api";
import state from "./app";
import { router } from "./app";
import DOMPurify from "dompurify";

export async function updateView(context, routeParams = {}) {
  const homeImg = document.getElementById("home-img-div");
  const open = document.querySelector(".open");
  if (homeImg) {
    if (context.pageName === "Home") {
      homeImg.style.opacity = 0;
    } else if (!open) {
      homeImg.style.opacity = 1;
    }
  }
  const container = document.getElementById("app");
  if (container) {
    const template = await context.render(routeParams);
    const sanitizedTemplate = DOMPurify.sanitize(template);
    container.innerHTML = sanitizedTemplate;
    if (typeof context.removeEventListeners === "function")
      context.removeEventListeners();
    requestAnimationFrame(() => {
      if (typeof context.attachEventListeners === "function")
        context.attachEventListeners();
    });
  }
}

export async function handleHeader(isUserLoggedIn, needsToDestroy, langChange) {
  if (needsToDestroy) {
    header.destroy();
    if (!langChange) return;
  }

  if (langChange) {
    console.log("Lang reset in handleHeader");
    if (isUserLoggedIn) header.updateLangUserLoggedIn();
    else header.updateLangGuestUser();
  }

  if (isUserLoggedIn && header.isUserRendered) return;

  if (!isUserLoggedIn && header.isGuestRendered) return;

  header.destroy();

  if (isUserLoggedIn) {
    header.renderUserLoggedIn();
  } else {
    header.renderGuestUser();
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

    if (!state.isUserLoggedIn) {
      state.setIsUserLoggedIn(true);
      return true;
    }
    state.state.lang = res.data.user.lang;
    state.state.userId = res.data.user.id.toString();
    state.state.username = res.data.user.username;
    state.state.userAlias = res.data.user.alias;
    state.saveState();
    return true;
  } catch (error) {
    console.error(`Error while trying to check user status : ${error}`);
    return false;
  }
}
