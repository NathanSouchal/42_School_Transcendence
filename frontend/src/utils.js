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
  const selectedLangImg = document.getElementById("selected-lang-img");
  if ((state.state.lang !== context.lang) & selectedLangImg)
    if (state.state.lang === "EN") {
      selectedLangImg.src = "english.jpg";
    } else if (state.state.lang === "ES") {
      selectedLangImg.src = "spanish.jpg";
    } else if (state.state.lang === "FR") {
      selectedLangImg.src = "french.jpg";
    } else if (state.state.lang === "CR") {
      selectedLangImg.src = "crab.jpg";
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

export function handleLangDiv(remove) {
  const langDiv = document.getElementById("lang-div");
  if (langDiv && remove) langDiv.classList.add("hidden");
  else if (langDiv && !remove) langDiv.classList.remove("hidden");
}

export function showToogleBar(show) {
  const toogleBar = document.getElementById("toggle-button-container");
  if (toogleBar && !show)
    toogleBar.style.display = "none";
  else if (toogleBar && show)
    toogleBar.style.display = "block";
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

  if (
    (isUserLoggedIn && !header.isUserRendered) ||
    (!isUserLoggedIn && !header.isGuestRendered)
  ) {
    header.destroy();
    if (isUserLoggedIn) {
      header.renderUserLoggedIn();
    } else {
      header.renderGuestUser();
    }
    return;
  }

  if (isUserLoggedIn && header.isUserRendered) return;
  if (!isUserLoggedIn && header.isGuestRendered) return;
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
    const selectedLangImg = document.getElementById("selected-lang-img");
    if (selectedLangImg) selectedLangImg.src = "english.jpg";
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
      state.state.lang = res.data.user.lang;
      state.state.userId = res.data.user.id.toString();
      state.state.username = res.data.user.username;
      state.state.userAlias = res.data.user.alias;
      state.saveState();
    }
    return true;
  } catch (error) {
    console.error(`Error while trying to check user status : ${error}`);
    return false;
  }
}
