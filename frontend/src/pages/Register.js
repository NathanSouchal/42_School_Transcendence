import DOMPurify from "dompurify";
import { createBackArrow } from "../components/backArrow.js";
import API from "../services/api.js";
import { handleHeader } from "../utils.js";

export default class Register {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;

    this.formState = {
      username: "",
      password: "",
      passwordConfirmation: "",
    };
    this.eventListeners = [];
    this.cssLink;
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Register page subscribed to state");
    }
    if (!this.state.state.gameHasLoaded) return;
    else {
      const content = await this.render();
      const container = document.getElementById("app");
      if (container) {
        container.innerHTML = content;
        this.removeEventListeners();
        this.attachEventListeners();
      }
    }
  }

  attachEventListeners() {
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      const handleSubmitBound = this.handleSubmit.bind(this);
      registerForm.addEventListener("submit", handleSubmitBound);
      this.eventListeners.push({
        name: "register-form",
        element: registerForm,
        listener: handleSubmitBound,
      });
    }

    const inputs = document.querySelectorAll("input");
    inputs.forEach((input) => {
      const handleChangeBound = (e) => {
        this.handleChange(e.target.name, e.target.value, e.target);
      };
      input.addEventListener("input", handleChangeBound);
      this.eventListeners.push({
        name: input.name,
        element: input,
        listener: handleChangeBound,
      });
    });
  }

  handleChange(key, value, inputElement) {
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
    console.log(this.formState.username);
    console.log(this.formState.password);
    console.log(this.formState.passwordConfirmation);
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (
      !this.formState.username.length ||
      !this.formState.password.length ||
      !this.formState.passwordConfirmation.length
    ) {
      return console.error("Please complete all fields");
    }
    try {
      const response = await API.post("/auth/register/", this.formState);
      window.app.router.navigate("/login");
    } catch (error) {
      console.error(`Error while trying to post data : ${error}`);
    } finally {
      this.formState.username = "";
      this.formState.password = "";
      this.formState.passwordConfirmation = "";
    }
  }

  async handleStateChange(newState) {
    console.log("GameHasLoaded : " + newState.gameHasLoaded);
    if (newState.gameHasLoaded) {
      console.log("GameHasLoaded state changed, rendering Register page");
      const content = await this.render();
      const container = document.getElementById("app");
      if (container) {
        container.innerHTML = content;
        this.removeEventListeners();
        this.attachEventListeners();
      }
    }
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ name, element, listener }) => {
      element.removeEventListener(element, listener);
      console.log("Removed eventListener fron input");
    });
    this.eventListeners = [];
  }

  destroy() {
    this.removeEventListeners();
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange); // Nettoyage de l'abonnement
      this.isSubscribed = false;
      console.log("Register page unsubscribed from state");
    }
  }

  async render(routeParams = {}) {
    handleHeader(this.state.isUserLoggedIn, false);
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData || "");
    const backArrow = createBackArrow(this.state.state.lastRoute);
    return `
        <form id="register-form" class="form-div-login-register">
          <h1 class="form-title-login-register">Register</h1>
          <div class="inputs-button-form-login-register">
            <input
              type="text"
              class="form-control"
              placeholder="Enter username"
              minLength="4"
              maxLength="10"
              value="${this.formState.username}"
              name="username"
              aria-label="Username"
              required
            />
            <input
              type="password"
              class="form-control"
              placeholder="Enter password"
              value="${this.formState.password}"
              name="password"
              aria-label="Password"
              required
            />
            <input
              type="password"
              class="form-control"
              placeholder="Confirm password"
              value="${this.formState.passwordConfirmation}"
              name="passwordConfirmation"
              aria-label="Confirm Password"
              required
            />
            <button type="submit" class="form-button-login-register">
              Sign up
            </button>
          </div>
        </form>`;
  }
}
