import API from "../services/api.js";
import { handleHeader, updateView, setDisable } from "../utils.js";
import { router } from "../app.js";
import { trad } from "../trad.js";

export default class Register {
  constructor(state) {
    this.pageName = "Register";
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.formState = {
      username: "",
      password: "",
      passwordConfirmation: "",
    };
    this.eventListeners = [];
    this.lang = null;
    this.isProcessing = false;
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Register page subscribed to state");
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

    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      const handleSubmitBound = this.handleSubmit.bind(this);
      if (!this.eventListeners.some((e) => e.name === "register-form")) {
        registerForm.addEventListener("submit", handleSubmitBound);
        this.eventListeners.push({
          name: "register-form",
          type: "submit",
          element: registerForm,
          listener: handleSubmitBound,
        });
      }
    }

    const popup = document.getElementById("popup-div");
    if (popup) {
      const showPopup = this.showPopup.bind(this);
      if (!this.eventListeners.some((e) => e.name === "popup")) {
        popup.addEventListener("click", showPopup);
        this.eventListeners.push({
          name: "popup",
          type: "click",
          element: popup,
          listener: showPopup,
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

  showPopup() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    const popup = document.getElementById("popup");
    if (popup) popup.classList.toggle("show");
    this.isProcessing = false;
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

    if (key === "username") {
      if (value.length < 4) {
        inputElement.classList.remove("is-valid");
        inputElement.classList.add("is-invalid");
      } else {
        inputElement.classList.remove("is-invalid");
        inputElement.classList.add("is-valid");
      }
    } else if (key === "password") {
      const regex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).*$/;
      if (!regex.test(value)) {
        inputElement.classList.remove("is-valid");
        inputElement.classList.add("is-invalid");
      } else {
        inputElement.classList.remove("is-invalid");
        inputElement.classList.add("is-valid");
      }
    } else if (key === "passwordConfirmation") {
      const passwordField = document.querySelector("input[name='password']");
      if (value !== passwordField.value) {
        inputElement.classList.remove("is-valid");
        inputElement.classList.add("is-invalid");
      } else {
        inputElement.classList.remove("is-invalid");
        inputElement.classList.add("is-valid");
      }
    }

    this.formState[key] = value;
  }

  async handleSubmit(e) {
    e.preventDefault();
    setDisable(true, "register-form");
    if (
      !this.formState.username?.length ||
      !this.formState.password?.length ||
      !this.formState.passwordConfirmation?.length
    ) {
      setDisable(false, "register-form");
      return this.displayRegisterErrorMessage(trad[this.lang].errors.fields);
    }
    let regex = /^\w+$/;
    if (!regex.test(this.formState.username)) {
      setDisable(false, "register-form");
      return this.displayRegisterErrorMessage(trad[this.lang].errors.username);
    }
    if (this.formState.username.length < 4) {
      setDisable(false, "register-form");
      return this.displayRegisterErrorMessage(
        trad[this.lang].errors.usernameMinlength
      );
    }
    if (this.formState.username.length > 10) {
      setDisable(false, "register-form");
      return this.displayRegisterErrorMessage(
        trad[this.lang].errors.usernameMaxlength
      );
    }
    regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).*$/;
    if (!regex.test(this.formState.password)) {
      setDisable(false, "register-form");
      return this.displayRegisterErrorMessage(
        trad[this.lang].register.restrictions
      );
    }
    try {
      await API.post("/auth/register/", this.formState);
      window.app.router.navigate("/login");
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data
      ) {
        const errorData = error.response.data;
        if (errorData.username) {
          this.displayRegisterErrorMessage(Object.values(errorData.username));
          console.log(Object.values(errorData.username));
        } else if (errorData.password_match)
          this.displayRegisterErrorMessage(errorData.password_match);
        else if (errorData.password_format)
          this.displayRegisterErrorMessage(errorData.password_format);
      } else if (error.response && error.response.status === 409)
        this.displayRegisterErrorMessage(
          trad[this.lang].errors.usernameUnavailable
        );
    } finally {
      this.formState = {};
      const inputs = document.querySelectorAll("input");
      inputs.forEach((input) => {
        input.value = "";
        input.classList.remove("is-valid");
        input.classList.remove("is-invalid");
      });
      setDisable(false, "register-form");
    }
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

  displayRegisterErrorMessage(errorMsg) {
    const errorTitle = document.getElementById("register-error-message");
    if (errorTitle) errorTitle.textContent = errorMsg;
  }

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
      console.log("Register page unsubscribed from state");
    }
    this.formState = {
      username: "",
      password: "",
      passwordConfirmation: "",
    };
  }

  async render(routeParams = {}) {
    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Register page subscribed to state");
    }
    if (this.lang !== this.state.state.lang)
      handleHeader(this.state.isUserLoggedIn, false, true);
    else handleHeader(this.state.isUserLoggedIn, false, false);
    this.lang = this.state.state.lang;
    return `
        <form id="register-form" class="form-div-login-register">
          <h1 class="global-page-title">${trad[this.lang].register.pageTitle}</h1>
          <div class="inputs-button-form-login-register">
            <input
              type="text"
              class="form-control"
              placeholder="${trad[this.lang].register.enterUsername}"
              minLength="4"
              maxLength="10"
              value="${this.formState.username ? this.formState.username : ``}"
              name="username"
              aria-label="Username"
			  autocomplete="username"
              required
            />
            <input
              type="password"
              class="form-control"
              placeholder="${trad[this.lang].register.enterPassword}"
              value="${this.formState.password ? this.formState.password : ``}"
			  minLength="8"
			  maxLength="20"
              name="password"
              aria-label="Password"
			  autocomplete="nwe-password"
              required
            />
            <input
              type="password"
              class="form-control"
              placeholder="${trad[this.lang].register.confirmPassword}"
              value="${this.formState.passwordConfirmation ? this.formState.passwordConfirmation : ``}"
			  minLength="8"
			  maxLength="20"
              name="passwordConfirmation"
              aria-label="Confirm Password"
			  autocomplete="nwe-password"
              required
            />
            <button type="submit" class="form-button-login-register">
			${trad[this.lang].register.signUp}
            </button>
			<div class="popup" id="popup-div">
			<h3>Password restrictions</h3>
				<span class="popup-text" id="popup">${trad[this.lang].register.restrictions}</span>
			</div>
			<h2 class="register-error-message" id="register-error-message"></h2>
          </div>
        </form>`;
  }
}
