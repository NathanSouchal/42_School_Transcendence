import DOMPurify from "dompurify";
import axios from "axios";
import { resetZIndex } from "/src/utils.js";

export default class Account {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.userData = {
      id: 0,
      is_superuser: false,
      username: "",
      avatar: "",
    };
    this.lastDeleted = 0;
    this.isLoading = true;
    this.isInitialized = false;
    this.isSubscribed = false;
    this.eventListeners = [];
  }

  async initialize() {
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Account page subscribed to state");
    }
    if (this.isInitialized) return;
    this.isInitialized = true;
    resetZIndex();

    const content = this.render();
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content;
    }

    // Récupérer l'ID utilisateur depuis le stockage local
    const userId = Number(localStorage.getItem("id"));

    if (userId) {
      // Charger les données utilisateur si un ID existe
      await this.fetchData(userId);
    } else {
      // Si aucun ID utilisateur n'est trouvé
      this.isLoading = false;
    }

    // Ajouter les écouteurs d'événements après le rendu
    this.attachEventListeners();
  }

  attachEventListeners() {
    const avatarInput = document.getElementById("avatar");
    if (avatarInput) {
      const handleChangeBound = this.handleChange.bind(this);
      avatarInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        handleChangeBound("avatar", file, avatarInput);
      });
      this.eventListeners.push({
        name: "avatar",
        element: avatarInput,
        listener: handleChangeBound,
      });
    }

    const updateButton = document.querySelector(
      "button[onclick^='updateUserInfo']"
    );
    if (updateButton) {
      updateButton.addEventListener("click", async () => {
        console.log("Updating user info...");
        await this.updateUserInfo(this.userData.id);
      });
      this.eventListeners.push({
        name: "updateUserInfo",
        element: updateButton,
        listener: this.updateUserInfo.bind(this, this.userData.id),
      });
    }
  }

  handleStateChange(newState) {
    console.log("État mis à jour:", newState);
    const content = this.render();
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content; // Remplacer le contenu du conteneur
      this.attachEventListeners(); // Réattacher les écouteurs après chaque rendu
    }
  }

  handleChange(key, value, inputElement) {
    console.log("handlechange");
    if (key == "avatar") {
      const fileInput = value;
      if (fileInput) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = e.target.result;
          console.log(base64String);
          this.userData.avatar = base64String;
        };
        reader.readAsDataURL(fileInput);
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
      console.log(`coucou ${data.user.username}`);
      console.log(`coucou ${this.userData.username}`);
      this.render();
    } catch (error) {
      console.error(`Error while trying to get data : ${error}`);
      this.userData = { id: 0, username: "" };
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  async updateUserInfo(id) {
    try {
      const res = await axios.put(
        `https://localhost:8000/user/${id}/`,
        { avatar: this.userData.avatar },
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

  async getNewRefreshToken() {
    try {
      await axios.post(`https://localhost:8000/auth/custom-token/refresh/`, {
        withCredentials: true,
      });
    } catch (error) {
      console.error(`Error while trying to get new refresh token : ${error}`);
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
  }

  render() {
    if (this.isLoading) {
      document.getElementById("app").innerHTML = "<p>Loading...</p>";
      return;
    }
    // const userData = this.state.data.username;
    // const sanitizedData = DOMPurify.sanitize(userData);
    const hasUsername =
      this.userData.username && this.userData.username.length > 0;
    console.log("hasUsername:", hasUsername, "this.userData:", this.userData);
    return `<div class="d-flex flex-column justify-content-center align-items-center h-100">
          <div class="title-div mb-4">
            <h1 class="text-capitalize w-100 text-center">Account</h1>
          </div>
            ${
              hasUsername
                ? `
              <div class="text-center mb-4">
                <h2 class="text-capitalize">
                  ${this.userData.username}
                </h2>
				<div>
					<input
					type="file"
					class="avatar-control"
					placeholder="Enter username"
					value="${this.userData.avatar}"
					name="avatar"
					id="avatar"
					/>
				</div>
				<button onclick="updateUserInfo(${this.userData.id})">
					Update my info
				</button>
                <div class="d-flex flex-column align-items-center">
                  <button
                    onclick="deleteUser(${this.userData.id})"
                    class="btn btn-danger mb-2"
                  >
                    Delete Account
                  </button>
                  <button
                    onclick="getNewAccessToken(${this.userData.id})"
                    class="btn btn-danger mb-2"
                  >
                    Get New Access Token
                  </button>
                  <button
                    onclick="getNewRefreshToken(${this.userData.id})"
                    class="btn btn-danger mb-2"
                  >
                    Get New Refresh Token
                  </button>
                </div>
              </div>
            `
                : `
              <div class="text-center">
                <h1>No info, please log in</h1>
                <button
                  onclick="getNewRefreshToken(${this.userData.id})"
                  class="btn btn-danger mb-2"
                >
                  Get New Access Token
                </button>
              </div>
            `
            }
      </div>`;
  }
}
