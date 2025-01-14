import DOMPurify from "dompurify";
import axios from "axios";
import { resetZIndex } from "/src/utils.js";
import { createBackArrow } from "../components/backArrow.js";

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
    this.eventListeners = { registerForm: null, inputs: [] };
  }

  async initialize() {
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Register page subscribed to state");
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
    this.eventListeners.registerForm = document.getElementById("register-form");
    if (this.eventListeners.registerForm) {
      this.handleSubmitBound = this.handleSubmit.bind(this);
      this.eventListeners.registerForm.addEventListener(
        "submit",
        this.handleSubmitBound,
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

  handleSubmitBound() {}

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
      const response = await axios.post(
        "https://localhost:8000/user/register/",
        this.formState,
      );
      window.app.router.navigate("/login");
    } catch (error) {
      console.error(`Error while trying to post data : ${error}`);
    } finally {
      this.formState.username = "";
      this.formState.password = "";
      this.formState.passwordConfirmation = "";
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
    if (this.eventListeners.registerForm) {
      this.eventListeners.registerForm.removeEventListener(
        "submit",
        this.handleSubmitBound,
      );
      this.eventListeners.registerForm = null;
      console.log("Removed eventListener fron submit");
    }
    this.eventListeners.inputs.forEach(({ element, listener }) => {
      element.removeEventListener("input", listener);
      console.log("Removed eventListener fron input");
    });
    this.eventListeners.inputs = [];
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange); // Nettoyage de l'abonnement
      this.isSubscribed = false;
      console.log("Register page unsubscribed from state");
    }
    resetZIndex();
  }

  render() {
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData || "");
    const template = `<div class="d-flex justify-content-center align-items-center h-100">
        <form id="register-form">
          <h3 class="text-center">Register</h3>
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
          <div class="mb-3">
            <label>Confirm password</label>
            <input
              type="password"
              class="form-control"
              placeholder="Confirm password"
              value="${this.formState.passwordConfirmation}"
              name="passwordConfirmation"
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

    const tmpContainer = document.createElement("div");
    tmpContainer.innerHTML = template;
    const backArrow = createBackArrow();
    tmpContainer.insertBefore(backArrow, tmpContainer.firstChild);
    return tmpContainer.innerHTML;
  }
}
