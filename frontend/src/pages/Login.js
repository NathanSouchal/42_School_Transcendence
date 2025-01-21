import DOMPurify from "dompurify";
import axios from "axios";
import { resetZIndex } from "/src/utils.js";
import { createBackArrow } from "../components/backArrow.js";
import state from "../app.js";

export default class Login {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.formState = {
      username: "",
      password: "",
    };
    this.isSubscribed = false;
    this.isInitialized = false;
    this.eventListeners = [];
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
      const content = this.render();
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
      const response = await axios.post(
        "https://localhost:8000/user/login/",
        this.formState,
        {
          withCredentials: true,
        }
      );
      const { id } = response.data.user;
      console.log(response.data);
      localStorage.setItem("id", id);
      window.app.router.navigate("/account");
    } catch (error) {
      console.error(`Error while trying to post data : ${error}`);
    } finally {
      this.formState.username = "";
      this.formState.password = "";
    }
  }

  handleStateChange(newState) {
    console.log("GameHasLoaded : " + newState.gameHasLoaded);
    if (newState.gameHasLoaded) {
      console.log("GameHasLoaded state changed, rendering Login page");
      const content = this.render();
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
    resetZIndex();
  }

  render(routeParams = {}) {
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData);
    const backArrow = createBackArrow(this.state.state.lastRoute);
    return `${backArrow}<div class="d-flex justify-content-center align-items-center h-100">
        <form id="login-form">
          <h3 class="text-center">Login</h3>
          <div class="mb-3">
            <label>Username</label>
            <input
              type="text"
              class="form-control"
              placeholder="Enter username"
              minLength="4"
              maxLength="10"
              value="${this.formState.username}"
              name="username"
              required
            />
          </div>
          <div class="mb-3">
            <label>Password</label>
            <input
              type="password"
              class="form-control"
              placeholder="Enter password"
              value="${this.formState.password}"
              name="password"
              required
            />
          </div>
          <div class="d-grid">
            <button
              type="submit"
              class="btn btn-primary"
            >
              Submit
            </button>
          </div>
        </form>
      </div>`;
  }
}
