import API from "../services/api.js";
import { handleHeader, updateView, setDisable } from "../utils.js";
import { router } from "../app.js";
import { trad } from "../trad.js";

export default class Login {
  constructor(state) {
    this.pageName = "Login";
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.is2fa = false;
    this.method2fa = null;
    this.formState = {};
    this.eventListeners = [];
    this.lang = null;
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    if (!this.state.state.gameHasLoaded) return;
    else await updateView(this, {});
  }

  attachEventListeners() {
    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      if (!this.eventListeners.some((e) => e.element === link)) {
        const handleNavigation = this.handleNavigation.bind(this);
        link.addEventListener("click", handleNavigation);
        this.eventListeners.push({
          name: link.getAttribute("href") || "unknown-link",
          type: "click",
          element: link,
          listener: handleNavigation,
        });
      }
    });

    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      const handleSubmitBound = this.handleSubmit.bind(this);
      if (!this.eventListeners.some((e) => e.name === "login-form")) {
        loginForm.addEventListener("submit", handleSubmitBound);
        this.eventListeners.push({
          name: "login-form",
          type: "submit",
          element: loginForm,
          listener: handleSubmitBound,
        });
      }
    }

    const loginForm2FA = document.getElementById("2fa-login-form");
    if (loginForm2FA) {
      const handleSubmit2FA = this.handleSubmit2FA.bind(this);
      if (!this.eventListeners.some((e) => e.name === "2fa-login-form")) {
        loginForm2FA.addEventListener("submit", handleSubmit2FA);
        this.eventListeners.push({
          name: "2fa-login-form",
          type: "submit",
          element: loginForm2FA,
          listener: handleSubmit2FA,
        });
      }
    }

    const inputs = document.querySelectorAll("input");
    inputs.forEach((input) => {
      if (!this.eventListeners.some((e) => e.element === input)) {
        const handleChangeBound = this.handleChange.bind(this);
        input.addEventListener("input", handleChangeBound);
        this.eventListeners.push({
          name: input.name,
          type: "input",
          element: input,
          listener: handleChangeBound,
        });
      }
    });

    const retryLink = document.getElementById("link-to-retry");
    if (retryLink) {
      const resetLoginPage = this.resetLoginPage.bind(this);
      if (!this.eventListeners.some((e) => e.name === "link-to-retry")) {
        retryLink.addEventListener("click", resetLoginPage);
        this.eventListeners.push({
          name: "link-to-retry",
          type: "click",
          element: retryLink,
          listener: resetLoginPage,
        });
      }
    }
  }

  async resetLoginPage() {
    this.is2fa = false;
    await updateView(this, {});
  }

  handleNavigation(e) {
    const target = e.target.closest("a");
    if (target && target.href.startsWith(window.location.origin)) {
      e.preventDefault();
      const path = target.getAttribute("href");
      router.navigate(path);
    }
  }

  handleChange(e) {
    let key = e.target.name;
    let value = e.target.value;
    this.formState[key] = value;
  }

  async handleSubmit(e) {
    e.preventDefault();
    setDisable(true, "login-form");
    if (!this.formState.username.length || !this.formState.password.length) {
      return console.error(trad[this.lang].errors.fields);
    }
    try {
      const response = await API.post("/auth/login/", this.formState);
      if (response.data.message == "2FA_REQUIRED") {
        this.is2fa = true;
        if (response.data.method === "TOTP") this.method2fa = "Auth App";
        if (response.data.method === "sms") this.method2fa = "phone";
        if (response.data.method === "email") this.method2fa = "e-mail";
        return updateView(this, {});
      }
      this.updateUserInfo(response.data.user);
      router.navigate("/account");
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          this.displayLoginErrorMessage(trad[this.lang].errors.credentials);
        }
      }
    } finally {
      this.formState = {};
      const inputs = document.querySelectorAll("input");
      inputs.forEach((input) => {
        input.value = "";
      });
      setDisable(false, "login-form");
    }
  }

  async handleSubmit2FA(e) {
    e.preventDefault();
    setDisable(true, "2fa-login-form");
    console.log("Sending 2FA verification:", this.formState.code);
    if (!this.formState.code?.length) {
      return this.displayLoginErrorMessage(trad[this.lang].errors.enterCode);
    }
    try {
      const response = await API.post("/auth/verify-2fa/", this.formState);
      this.updateUserInfo(response.data.user);
      if (this.is2fa) this.is2fa = false;
      router.navigate("/account");
    } catch (error) {
      if (!this.is2fa) this.is2fa = true;
      if (error.response.data.error == "Invalid OTP") {
        this.displayLoginErrorMessage(trad[this.lang].errors.codeInvalid);
      } else if (error.response.data.error == "Expired OTP") {
        this.displayLoginErrorMessage(trad[this.lang].errors.codeExpired);
        const retry = document.getElementById("link-to-retry");
        if (retry) retry.style.display = "block";
        this.attachEventListeners();
      }
      console.error(`Error while trying to login ${error}`);
    } finally {
      this.formState = {};
      const inputs = document.querySelectorAll("input");
      inputs.forEach((input) => {
        input.value = "";
      });
      setDisable(false, "2fa-login-form");
    }
  }

  updateUserInfo(data) {
    this.state.state.lang = data.lang;
    this.state.state.userId = data.id.toString();
    this.state.state.username = data.username;
    this.state.state.userAlias = data.alias;
    this.state.saveState();
    const selectedLangImg = document.getElementById("selected-lang-img");
    const loading = document.querySelector(".loading-h2");
    if (selectedLangImg && loading) {
      const loadingText = loading.childNodes[0];
      if (data.lang === "EN") {
        selectedLangImg.src = "english.jpg";
        loadingText.nodeValue = "Loading Game";
      } else if (data.lang === "ES") {
        selectedLangImg.src = "spanish.jpg";
        loadingText.nodeValue = "Cargando Juego";
      } else if (data.lang === "FR") {
        selectedLangImg.src = "french.jpg";
        loadingText.nodeValue = "Chargement du jeu";
      } else if (data.lang === "CR") {
        selectedLangImg.src = "crab.jpg";
        loadingText.nodeValue = "Crabing Crab";
      }
    }
  }

  displayLoginErrorMessage(errorMsg) {
    const errorTitle = document.getElementById("login-error-message");
    if (errorTitle) errorTitle.textContent = errorMsg;
  }

  async handleStateChange(newState) {
    if (
      (newState.gameHasLoaded && !this.previousState.gameHasLoaded) ||
      newState.lang !== this.previousState.lang
    ) {
      this.previousState = { ...newState };
      await updateView(this, {});
    } else this.previousState = { ...newState };
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ element, listener, type }) => {
      if (element) {
        element.removeEventListener(type, listener);
      }
    });
    this.eventListeners = [];
  }

  destroy() {
    this.removeEventListeners();
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
    }
    if (this.is2fa) this.is2fa = false;
    this.method2fa = null;
    this.formState = {};
  }

  render2FA() {
    return `
		<form id="2fa-login-form" class="form-div-login-register">
          <h1 class="global-page-title">${trad[this.lang].login.pageTitle}</h1>
          <div class="inputs-button-form-login-register">
		  	<label>
				${trad[this.lang].login.label2fa}${this.method2fa}
		  	</label>
            <input
              type="text"
              class="form-control"
              minLength="6"
              maxLength="6"
			  placeholder="${trad[this.lang].login.oneTimeCode}"
              value="${this.formState.code ? this.formState.code : ``}"
              name="code"
			  autocomplete="off"
              required
            />
            <button type="submit" class="form-button-login-register">
			${trad[this.lang].login.login}
            </button>
			<h2 class="login-error-message" id="login-error-message"></h2>
			<div class="link-to-register" id="link-to-retry" style="display: none">
              <h2>${trad[this.lang].login.retry}</h2>
            </div>
          </div>
        </form>`;
  }

  async render(routeParams = {}) {
    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    if (this.lang !== this.state.state.lang)
      handleHeader(this.state.isUserLoggedIn, false, true);
    else handleHeader(this.state.isUserLoggedIn, false, false);
    this.lang = this.state.state.lang;
    if (this.is2fa) return this.render2FA();
    else
      return `
        <form id="login-form" class="form-div-login-register">
          <h1 class="global-page-title">${trad[this.lang].login.pageTitle}</h1>
          <div class="inputs-button-form-login-register">
            <input
              type="text"
              class="form-control"
              placeholder="${trad[this.lang].login.enterUsername}"
              minLength="4"
              maxLength="10"
              value="${this.formState.username ? this.formState.username : ``}"
              name="username"
              aria-label="Username"
			  autocomplete="off"
              required
            />
            <input
              type="password"
              class="form-control"
              placeholder="${trad[this.lang].login.enterPassword}"
              value="${this.formState.password ? this.formState.password : ``}"
			  minLength="8"
			  maxLength="20"
              name="password"
              aria-label="Password"
			  autocomplete="off"
              required
            />
            <button type="submit" class="form-button-login-register">
			${trad[this.lang].login.login}
            </button>
            <div class="link-to-register">
              <a class="nav-link" href="/register">${trad[this.lang].login.register}</a>
            </div>
			<h2 class="login-error-message" id="login-error-message"></h2>
          </div>
        </form>`;
  }
}
