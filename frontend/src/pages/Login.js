import DOMPurify from "dompurify";
import axios from "axios";
import { resetZIndex } from "/src/utils.js";

export default class Login {
  constructor(state) {
    this.state = state;
    this.formState = {
      username: "",
      password: "",
    };
  }

  async initialize() {
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
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => {
        this.handleSubmit(e);
      });
    }

    const inputs = document.querySelectorAll("input");
    inputs.forEach((input) => {
      input.addEventListener("input", (e) => {
        this.handleChange(e.target.name, e.target.value, e.target);
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

  render() {
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData);
    return `<div class="d-flex justify-content-center align-items-center h-100">
        <form id="register-form">
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
