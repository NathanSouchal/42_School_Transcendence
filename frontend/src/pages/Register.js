import DOMPurify from "dompurify";
import axios from "axios";

export default class Register {
  constructor(state) {
    this.state = state;

    this.formState = {
      username: "",
      password: "",
      passwordConfirmation: "",
    };
  }

  async initialize() {
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
        // console.log(
        //   `Input name: ${e.target.name}, Input value: ${e.target.value}`
        // );
        this.handleChange(e.target.name, e.target.value, e.target);
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
      const response = await axios.post(
        "https://localhost:8000/user/register/",
        this.formState
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

  render() {
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData || "");
    return `<div class="d-flex justify-content-center align-items-center h-100">
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
  }
}
