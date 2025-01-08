import DOMPurify from "dompurify";
import axios from "axios";
import { resetZIndex } from "/src/utils.js";

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
    this.eventListeners = { loginForm: null, inputs: [] };
  }

  async initialize() {
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Login page subscribed to state");
    }
    if (this.isInitialized) return;
    this.isInitialized = true;

    resetZIndex();
    // Appeler render pour obtenir le contenu HTML
    const content = this.render();
    // Insérer le contenu dans le conteneur dédié
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content;
    }
    // Ajouter les écouteurs d'événements après avoir rendu le contenu
    this.attachEventListeners();
  }

  attachEventListeners() {
    this.eventListeners.loginForm = document.getElementById("login-form");
    if (this.eventListeners.loginForm) {
      this.handleSubmitBound = this.handleSubmit.bind(this);
      this.eventListeners.loginForm.addEventListener(
        "submit",
        this.handleSubmitBound
      );
    }

    const inputs = document.querySelectorAll("input");
    inputs.forEach((input) => {
      const handleChangeBound = (e) => {
        this.handleChange(e.target.name, e.target.value, e.target);
      };
      input.addEventListener("input", handleChangeBound);
      this.eventListeners.inputs.push({
        element: input,
        listener: handleChangeBound,
      });
    });
  }

  handleChange(key, value, inputElement) {
    this.formState[key] = value;
  }

  handleSubmitBound() {}

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
    const content = this.render();
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content; // Remplacer le contenu du conteneur
      this.attachEventListeners(); // Réattacher les écouteurs après chaque rendu
    }
  }

  destroy() {
    if (this.eventListeners.loginForm) {
      this.eventListeners.loginForm.removeEventListener(
        "submit",
        this.handleSubmitBound
      );
      this.eventListeners.loginForm = null;
    }
    this.eventListeners.inputs.forEach(({ element, listener }) => {
      element.removeEventListener("input", listener);
    });
    this.eventListeners.inputs = [];
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange); // Nettoyage de l'abonnement
      this.isSubscribed = false;
      console.log("Login page unsubscribed from state");
    }
    resetZIndex();
  }

  render() {
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData);
    return `<div class="d-flex justify-content-center align-items-center h-100">
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
