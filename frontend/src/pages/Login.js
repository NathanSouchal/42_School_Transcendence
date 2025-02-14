import DOMPurify from "dompurify";
import API from "../services/api.js";
import {
  handleHeader,
  updateView,
  createBackArrow,
  checkUserStatus,
} from "../utils.js";
import { router } from "../app.js";

export default class Login {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.is2fa = false;
    this.is2faInvalid = false;
    this.is2faExpired = false;
    this.errorMessage = "";
    this.formState = {};
    this.eventListeners = [];
    this.cssLink;
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Login page subscribed to state");
    }
    if (!this.state.state.gameHasLoaded) return;
    else await updateView(this);
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
    let inputElement = e.target;
    this.formState[key] = value;
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (!this.formState.username.length || !this.formState.password.length) {
      return console.error("Please complete all fields");
    }
    try {
      const response = await API.post("/auth/login/", this.formState);
      if (response.data.message == "2FA_REQUIRED") {
        console.log("2FAAA");
        this.is2fa = true;
        return updateView(this);
      }
      const id = response.data.user.id;
      console.log(response.data);
      console.log(response.data.user.id.toString());
      this.state.state.userId = id.toString();
      this.state.saveState();
      router.navigate("/account");
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          console.error(`Error 401 while trying to login ${error}`);
        }
      } else {
        console.error(`Error while trying to login ${error}`);
      }
    } finally {
      this.formState = {};
      const inputs = document.querySelectorAll("input");
      inputs.forEach((input) => {
        input.value = "";
      });
    }
  }

  async handleSubmit2FA(e) {
    e.preventDefault();
    console.log("Sending 2FA verification:", this.formState.code);
    if (!this.formState.code.length) {
      return console.error("Please enter your code");
    }
    try {
      const response = await API.post("/auth/verify-2fa/", this.formState);
      const id = response.data.user.id;
      console.log(response.data);
      this.state.state.userId = id.toString();
      this.state.saveState();
      if (this.is2fa) this.is2fa = false;
      if (this.is2faExpired) this.is2faExpired = false;
      if (this.is2faInvalid) this.is2faInvalid = false;
      router.navigate("/account");
    } catch (error) {
      if (!this.is2fa) this.is2fa = true;
      if (error.response.data.error == "Invalid OTP") {
        this.is2faInvalid = true;
        this.errorMessage = "Code is invalid";
        const errorTitle = document.getElementById("login-error-message");
        if (errorTitle) errorTitle.textContent = "Code is invalid";
        alert("Invalid OTP");
      }
      if (error.response.data.error == "Expired OTP") {
        this.is2faExpired = true;
        this.errorMessage = "Code is expired";
        alert("Expired OTP");
      }
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          console.error(`Error 401 while trying to login ${error}`);
        }
      } else {
        console.error(`Error while trying to login ${error}`);
      }
      this.handleServerErrors();
    } finally {
      this.formState = {};
      const inputs = document.querySelectorAll("input");
      inputs.forEach((input) => {
        input.value = "";
      });
    }
  }

  async handleStateChange(newState) {
    console.log("NEWGameHasLoaded : " + newState.gameHasLoaded);
    console.log("PREVGameHasLoaded2 : " + this.previousState.gameHasLoaded);
    if (newState.gameHasLoaded && !this.previousState.gameHasLoaded) {
      console.log("GameHasLoaded state changed, rendering Login page");
      this.previousState = { ...newState };
      await updateView(this);
    }
    this.previousState = { ...newState };
  }

  handleServerErrors() {}

  removeEventListeners() {
    this.eventListeners.forEach(({ element, listener, type }) => {
      if (element) {
        element.removeEventListener(type, listener);
        console.log(`Removed ${type} eventListener from input`);
      }
    });
    this.eventListeners = [];
  }

  destroy() {
    this.removeEventListeners();
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      console.log("Login page unsubscribed from state");
    }
  }

  render2FA() {
    this.is2fa = false;
    return `
		<form id="2fa-login-form" class="form-div-login-register">
          <h1 class="global-page-title">Login</h1>
          <div class="inputs-button-form-login-register">
		  	<label>
				We've sent a verification code to your email
		  	</label>
            <input
              type="text"
              class="form-control"
              minLength="6"
              maxLength="6"
			  placeholder="Enter verification code"
              value="${this.formState.code ? this.formState.code : ``}"
              name="code"
              required
            />
            <button type="submit" class="form-button-login-register">
              Sign in
            </button>
			<h2 class="login-error-message" id="login-error-message">${this.errorMessage ? this.errorMessage : ``}</h2>
          </div>
        </form>`;
  }

  async render(routeParams = {}) {
    // try {
    //   await checkUserStatus();
    // } catch (error) {
    //   if (error.response.status === 404) {
    //     setTimeout(() => {
    //       router.navigate("/404");
    //     }, 50);
    //     return "";
    //   }
    // }
    handleHeader(this.state.isUserLoggedIn, false);
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData);
    const backArrow = createBackArrow(this.state.state.lastRoute);
    if (this.is2fa) return this.render2FA();
    else
      return `${backArrow}
        <form id="login-form" class="form-div-login-register">
          <h1 class="global-page-title">Login</h1>
          <div class="inputs-button-form-login-register">
            <input
              type="text"
              class="form-control"
              placeholder="Enter username"
              minLength="4"
              maxLength="10"
              value="${this.formState.username ? this.formState.username : ``}"
              name="username"
              aria-label="Username"
              required
            />
            <input
              type="password"
              class="form-control"
              placeholder="Enter password"
              value="${this.formState.password ? this.formState.password : ``}"
			  minLength="4"
			  maxLength="20"
              name="password"
              aria-label="Password"
              required
            />
            <button type="submit" class="form-button-login-register">
              Sign in
            </button>
            <div class="link-to-register">
              <a class="nav-link" href="/register">No account? Create one here</a>
            </div>
          </div>
        </form>`;
  }
}
