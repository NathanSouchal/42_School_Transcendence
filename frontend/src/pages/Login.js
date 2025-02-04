import DOMPurify from "dompurify";
import { createBackArrow } from "../components/backArrow.js";
import API from "../services/api.js";
import { handleHeader } from "../utils.js";

export default class Login {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;

    this.formState = {
      username: "",
      password: "",
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
      console.log("Login page subscribed to state");
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
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      const handleSubmitBound = this.handleSubmit.bind(this);
      loginForm.addEventListener("submit", handleSubmitBound);
      this.eventListeners.push({
        name: "login-form",
        element: loginForm,
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
    this.formState[key] = value;
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (!this.formState.username.length || !this.formState.password.length) {
      return console.error("Please complete all fields");
    }
    try {
      const response = await API.post("/auth/login/", this.formState);
      const { id } = response.data.user;
      console.log(response.data);
      localStorage.setItem("id", id);
      window.app.router.navigate("/account");
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
      this.formState.username = "";
      this.formState.password = "";
    }
  }

  async handleStateChange(newState) {
    console.log("GameHasLoaded : " + newState.gameHasLoaded);
    if (newState.gameHasLoaded) {
      console.log("GameHasLoaded state changed, rendering Login page");
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
      console.log("Login page unsubscribed from state");
    }
  }

  async render(routeParams = {}) {
    handleHeader(this.state.isUserLoggedIn, false);
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData);
    const backArrow = createBackArrow(this.state.state.lastRoute);
    return `${backArrow}
        <form id="login-form" class="form-div-login-register">
          <h1 class="form-title-login-register">Login</h1>
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
