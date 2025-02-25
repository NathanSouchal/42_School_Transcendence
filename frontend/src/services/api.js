import axios from "axios";
import state from "../app.js";
import { router } from "../app.js";

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
    if (!error.response || (error.response && error.response.status === 500)) {
      router.navigate("/500");
      return Promise.reject(error);
    }
    if (error.response.status == 401 && window.location.pathname === "/login")
      return Promise.reject(error);
    if (error.response.status === 401) {
      if (isRetrying) {
        setTimeout(() => {
          if (
            window.location.pathname !== "/" &&
            window.location.pathname !== "/login" &&
            window.location.pathname !== "/register" &&
            window.location.pathname !== "/game" &&
            window.location.pathname !== "/local-tournament"
          ) {
            router.navigate("/login");
          }
        }, 100);
        return Promise.reject(error);
      }
      isRetrying = true;
      console.log("Error 401, will try to get new access token");
      //Attention, a rajouter : 401 ne veut pas forcement dire token, ca peut aussi etre
      //page interdite, donc il y aura un comportement different pour ca
      try {
        await getNewAccessToken();
        state.setIsUserLoggedIn(true);
        isRetrying = false;
        return API(originalRequest);
      } catch (tokenError) {
        console.error("Token refresh failed:", tokenError);
        return Promise.reject(tokenError);
      }
    } else if (error.response && error.response.status === 404) {
      setTimeout(() => {
        router.navigate("/404");
      }, 100);
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default API;
