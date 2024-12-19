import DOMPurify from "dompurify";
import axios from "axios";

export default class Account {
  constructor(state) {
    this.state = state;
    this.userData = {
      id: 0,
      is_superuser: false,
      username: "",
    };
    this.lastDeleted = 0;
    this.isLoading = true;
  }

  async initialize() {
    const container = document.getElementById("app");

    // Vérifiez si le conteneur existe avant de continuer
    if (!container) {
      console.error("Le conteneur principal #app est introuvable.");
      return;
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

    // Rendre le contenu final dans le conteneur
    const content = this.render();
    container.innerHTML = content;

    // Ajouter les écouteurs d'événements après le rendu
    this.attachEventListeners();
  }

  attachEventListeners() {}

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

  async deleteUser(id) {
    try {
      await axios.delete(`https://localhost:8000/user/${id}/`, {
        withCredentials: true,
      });
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
