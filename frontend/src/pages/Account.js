import DOMPurify from "dompurify";
import axios from "axios";
import { resetZIndex } from "/src/utils.js";
import { createBackArrow } from "../components/backArrow.js";
import state from "../app.js";

export default class Account {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.userData = {};
    this.formData = {
      username: "",
      alias: "",
    };
    this.lastDeleted = 0;
    this.isForm = false;
    this.isLoading = true;
    this.isInitialized = false;
    this.isSubscribed = false;
    this.eventListeners = [];
  }

  async initialize(routeParams = {}) {
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Account page subscribed to state");
    }
    if (this.isInitialized) return;
    this.isInitialized = true;
    resetZIndex();

    // Récupérer l'ID utilisateur depuis le stockage local
    const userId = Number(localStorage.getItem("id"));

    // Charger les données utilisateur si un ID existe
    try {
      await this.fetchData(userId);
      this.isLoading = false;
      const content = this.render();
      const container = document.getElementById("app");
      if (container) {
        container.innerHTML = content;
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.formData.username = this.userData.username;
      this.formData.alias = this.userData.alias;
      //   this.render();
      // Ajouter les écouteurs d'événements après le rendu
      this.attachEventListeners();
    }
  }

  updateView() {
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = this.render();
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }

  attachEventListeners() {
    const avatarInput = document.getElementById("avatar");
    if (avatarInput) {
      const handleChangeBound = this.handleChange.bind(this);
      if (!this.eventListeners.some((e) => e.name === "avatar")) {
        avatarInput.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          await handleChangeBound("avatar", file);
        });
        this.eventListeners.push({
          name: "avatar",
          type: "change",
          element: avatarInput,
          listener: handleChangeBound,
        });
      }
    }

    const updateButton = document.getElementById("update-user-info");
    if (updateButton) {
      const handleChangeBound = this.handleChange.bind(this);
      if (!this.eventListeners.some((e) => e.name === "updateUserInfo")) {
        updateButton.addEventListener("click", async () => {
          await handleChangeBound("update-user-info", "");
        });
        this.eventListeners.push({
          name: "updateUserInfo",
          type: "click",
          element: updateButton,
          listener: handleChangeBound,
        });
      }
    }

    const refreshButton = document.getElementById("refresh-token-button");
    if (refreshButton) {
      const handleChangeBound = this.handleChange.bind(this);
      if (!this.eventListeners.some((e) => e.name === "refreshButton")) {
        refreshButton.addEventListener("click", async () => {
          await handleChangeBound("refresh-token-button", "");
        });
        this.eventListeners.push({
          name: "refreshButton",
          type: "click",
          element: refreshButton,
          listener: handleChangeBound,
        });
      }
    }

    const accessButton = document.getElementById("access-token-button");
    if (accessButton) {
      const handleChangeBound = this.handleChange.bind(this);
      console.log("checking if accessButton object exists");
      if (!this.eventListeners.some((e) => e.name === "accessButton")) {
        accessButton.addEventListener("click", async () => {
          await handleChangeBound("access-token-button", "");
        });
        console.log("pushing accessButton object");
        this.eventListeners.push({
          name: "accessButton",
          type: "click",
          element: accessButton,
          listener: handleChangeBound,
        });
      }
    }

    const deleteUserButton = document.getElementById("delete-user-button");
    if (deleteUserButton) {
      const handleChangeBound = this.handleChange.bind(this);
      if (!this.eventListeners.some((e) => e.name === "deleteUserButton")) {
        deleteUserButton.addEventListener("click", async () => {
          await handleChangeBound("delete-user-button", "");
        });
        this.eventListeners.push({
          name: "deleteUserButton",
          type: "click",
          element: deleteUserButton,
          listener: handleChangeBound,
        });
      }
    }

    const formButton = document.getElementById("form-button");
    if (formButton) {
      const handleChangeBound = this.handleChange.bind(this);
      // Vérifie si le gestionnaire d'événements a déjà été ajouté
      if (!this.eventListeners.some((e) => e.name === "formButton")) {
        formButton.addEventListener("click", async () => {
          await handleChangeBound("form-button", "");
        });
        this.eventListeners.push({
          name: "formButton",
          type: "click",
          element: formButton,
          listener: handleChangeBound,
        });
      }
    }

    const inputs = document.querySelectorAll("input");
    inputs.forEach((input) => {
      const handleChangeInputBound = this.handleChangeInput.bind(this);
      if (!this.eventListeners.some((e) => e.name === input.name)) {
        input.addEventListener("input", (e) => {
          handleChangeInputBound(e.target.name, e.target.value, e.target);
        });
        this.eventListeners.push({
          name: input.name,
          type: "input",
          element: input,
          listener: handleChangeInputBound,
        });
      }
    });
  }

  handleStateChange(newState) {
    // console.log("État mis à jour:", newState);
    const content = this.render();
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content; // Remplacer le contenu du conteneur
      this.attachEventListeners(); // Réattacher les écouteurs après chaque rendu
    }
  }

  handleChangeInput(key, value, inputElement) {
    this.formData[key] = value;
    console.log(this.formData.alias);
    console.log(this.formData.username);
    console.log(this.formData.avatar);
  }

  async handleChange(key, value) {
    console.log("handlechange");
    if (key == "avatar") {
      const fileInput = value;
      if (fileInput) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = e.target.result;
          console.log(base64String);
          this.formData.avatar = base64String;
        };
        reader.readAsDataURL(fileInput);
      }
    } else if (key == "form-button") {
      this.isForm = !this.isForm;
      this.updateView();
    } else if (key == "update-user-info") {
      try {
        const promise1 = this.updateUserInfo(this.userData.id);
        const promise2 = this.fetchData(this.userData.id);
        await Promise.all([promise1, promise2]);
        this.isForm = !this.isForm;
        this.updateView();
      } catch (error) {
        console.error(error);
      }
    } else if (key == "refresh-token-button") {
      try {
        await this.getNewRefreshToken(this.userData.id);
      } catch (error) {
        console.error(error);
      }
    } else if (key == "access-token-button") {
      try {
        await this.getNewAccessToken(this.userData.id);
      } catch (error) {
        console.error(error);
      }
    } else if (key == "delete-user-button") {
      try {
        await this.deleteUser(this.userData.id);
      } catch (error) {
        console.error(error);
      }
    }
  }

  async fetchData(id) {
    try {
      const response = await axios.get(`https://localhost:8000/user/${id}/`, {
        withCredentials: true,
      });
      const data = response.data;
      console.log(data);
      this.userData = data.user || { id: 0, username: "" };
      this.state.isUserLoggedIn = true;
    } catch (error) {
      console.error(`Error while trying to get data : ${error}`);
      this.userData = { id: 0, username: "" };
      this.state.isUserLoggedIn = false;
    }
  }

  async updateUserInfo(id) {
    try {
      const res = await axios.put(
        `https://localhost:8000/user/${id}/`,
        this.formData,
        {
          withCredentials: true,
        }
      );
      console.log(res);
    } catch (error) {
      console.error(`Error while trying to update user data : ${error}`);
    }
  }

  async deleteUser(id) {
    try {
      await axios.delete(
        `https://localhost:8000/user/${id}/`,
        {},
        {
          withCredentials: true,
        }
      );
      this.lastDeleted = id;
      this.render();
    } catch (error) {
      console.error(`Error while trying to delete data : ${error}`);
      this.render();
    }
  }

  async getNewAccessToken(id) {
    try {
      await axios.post(
        `https://localhost:8000/auth/custom-token/access/`,
        {},
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error(`Error while trying to get new access token : ${error}`);
    }
  }

  async getNewRefreshToken(id) {
    try {
      await axios.post(
        `https://localhost:8000/auth/custom-token/refresh/`,
        {},
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error(`Error while trying to get new refresh token : ${error}`);
    }
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ element, listener, type }) => {
      if (element) {
        element.removeEventListener(type, listener);
        console.log("Removed ${type} eventListener from input");
      }
    });
    this.eventListeners = [];
  }

  removeEventListener(name) {
    const event = this.eventListeners.find((el) => el.name === name);
    if (event) {
      event.element.removeEventListener(event.type, event.listener);
      console.log("Removed unique eventListener from input");
      // Supprimez l'événement de la liste
      this.eventListeners = this.eventListeners.filter(
        (el) => el.name !== name
      );
    }
  }

  destroy() {
    this.removeEventListeners();
  }

  render(routeParams = {}) {
    // if (this.isLoading) {
    //   return "<p>Loading...</p>";
    // }
    // const userData = this.state.data.username;
    // const sanitizedData = DOMPurify.sanitize(userData);
    const hasUsername =
      this.userData.username && this.userData.username.length > 0;
    console.log("hasUsername:", hasUsername, "this.userData:", this.userData);
    const template = `<div class="d-flex flex-column justify-content-center align-items-center h-100">
          <div class="title-div mb-4">
            <h1 class="text-capitalize w-100 text-center">Account</h1>
          </div>
            ${
              this.state.isUserLoggedIn
                ? `
              <div class="text-center mb-4" id="user-info-div">
			  ${
          this.isForm
            ? `<div id="user-main-div">
				<form id="user-form">
			 	<div id="avatar-main-div">
					<img width="200" height="200" src="https://127.0.0.1:8000/${this.userData.avatar}" class="rounded-circle">
					<div class="custom-file m-2">
						<label class="form-label" for="avatar">
							Avatar
						</label>
						<input
						type="file"
						class="form-control"
						name="avatar"
						id="avatar"
						/>
					</div>
				</div>
				<div id="username-main-div">
					<label class="text-capitalize">
						Username : ${this.userData.username ? `${this.userData.username}` : ""}
					</label>
					<input
					type="text"
					class="form-control"
					placeholder="${this.userData.username}"
					minLength="4"
					maxLength="10"
					value="${this.formData.username}"
					name="username"
					required
					/>
				</div>
				<div id="alias-main-div">
					<label class="text-capitalize">
						Alias : ${this.userData.alias ? `${this.userData.alias}` : ""}
					</label>
					<input
					type="text"
					class="form-control"
					placeholder="${this.userData.alias}"
					minLength="4"
					maxLength="10"
					value="${this.formData.alias}"
					name="alias"
					required
					/>
				</div>
				<button class="btn btn-success m-3" id="update-user-info">
					Update my info
				</button>
				</form>
              </div>`
            : `
			  <div id="user-main-div">
			 	<div id="avatar-main-div">
				${this.userData.avatar ? `<img width="200" height="200" src="https://127.0.0.1:8000/${this.userData.avatar}" class="rounded-circle">` : ``}
				</div>
				<div id="username-main-div">
					<h2 class="text-capitalize">
					Username : ${this.userData.username ? `${this.userData.username}` : ""}
					</h2>
				</div>
				</div>
				<div id="alias-main-div">
					<h2 class="text-capitalize">
					Alias : ${this.userData.alias ? `${this.userData.alias}` : ""}
					</h2>
				</div>
              </div>`
        }
			  <div class="d-flex flex-column align-items-center">
				<button class="btn btn-dark m-3" id="form-button">
					${this.isForm ? `Cancel` : `Change my info`}
				</button>
				<button
					class="btn btn-danger mb-2"
					id="delete-user-button"
				>
					Delete Account
				</button>
				<button
					class="btn btn-danger mb-2"
					id="access-token-button"
				>
					Get New Access Token
				</button>
				<button
					class="btn btn-danger mb-2"
					id="refresh-token-button"
				>
					Get New Refresh Token
				</button>
                </div>
            `
                : `
              <div class="text-center">
                <h1>No info, please log in</h1>
                <button
                  class="btn btn-danger mb-2"
				  id="refresh-token-button"
                >
                  Get New Refresh Token
                </button>
              </div>
            `
            }
      </div>`;
    const tmpContainer = document.createElement("div");
    tmpContainer.innerHTML = template;
    const backArrow = createBackArrow();
    tmpContainer.insertBefore(backArrow, tmpContainer.firstChild);
    return tmpContainer.innerHTML;
  }
}
