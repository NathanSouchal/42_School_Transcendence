import axios from "axios";
import state from "../app.js";

const API = axios.create({
  baseURL: "https://localhost:8000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

async function getNewAccessToken() {
  console.log("Getting new access token");
  try {
    await API.post(`/auth/custom-token/access/`);
  } catch (error) {
    state.setIsUserLoggedIn(false);
    console.error(`Error while trying to get new access token : ${error}`);
    throw error;
  }
}

let isRetrying = false;

API.interceptors.response.use(
  (response) => response, // Laisser passer les réponses réussies
  async (error) => {
    const originalRequest = error.config;
    // Vérifier si l'erreur est une 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      const requestedURL = error.config?.url;

      if (isRetrying || !state.isUserLoggedIn) {
        if (
          currentPath !== "/" &&
          requestedURL !== "/" &&
          currentPath !== "/login" &&
          requestedURL !== "/login"
        ) {
          alert("HOOO");
          window.location.href = "/login";
        } // Rediriger vers la page de connexion
        return Promise.reject(error);
      }
      isRetrying = true;
      console.log("Error 401, will try to get new access token");
      //Attention, a rajouter : 401 ne veut pas forcement dire token, ca peut aussi etre
      //page interdite, donc il y aura un comportement different pour ca
      try {
        // Essayer d'obtenir un nouveau token
        await getNewAccessToken();

        // Relancer la requête originale avec le nouveau token
        state.setIsUserLoggedIn(true);
        return API(originalRequest);
      } catch (tokenError) {
        // Si l'obtention d'un nouveau token échoue, gérer l'erreur (ex : déconnexion)
        console.error("Token refresh failed:", tokenError);

        return Promise.reject(tokenError);
      }
    }
    // Si ce n'est pas une erreur 401, ou si le rafraîchissement échoue, rejeter l'erreur
    return Promise.reject(error);
  }
);

export default API;
