import axios from "axios";
import state from "../app.js";
import { router } from "../app.js";

const API_BASE_URL = import.meta.env.VITE_URL;

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

async function getNewAccessToken() {
  try {
    const response = await API.post(`/auth/custom-token/access/`);
    const data = response.data.user;
    state.state.lang = data.lang;
    state.state.userId = data.id.toString();
    state.state.username = data.username;
    state.state.userAlias = data.alias;
    state.saveState();
  } catch (error) {
    state.setIsUserLoggedIn(false);
    throw error;
  }
}

let isRetrying = false;

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 500) {
      router.navigate("/500");
      return Promise.reject(error);
    }
    if (error.response.status === 401 && window.location.pathname === "/login")
      return Promise.reject(error);
	if (error.response.status === 404 && window.location.pathname !== "/social")
		return router.navigate("/404");
    if (error.response.status === 401) {
      if (isRetrying) {
        setTimeout(() => {
          if (
            window.location.pathname !== "/" &&
            window.location.pathname !== "/login" &&
            window.location.pathname !== "/register" &&
            window.location.pathname !== "/game" &&
            window.location.pathname !== "/local-tournament" &&
            window.location.pathname !== "/rules"
          ) {
            router.navigate("/login");
          }
        }, 100);
        isRetrying = false;
        return Promise.reject(error);
      }
      isRetrying = true;
      try {
        await getNewAccessToken();
        state.setIsUserLoggedIn(true);
        isRetrying = false;
        return API(originalRequest);
      } catch (tokenError) {
        return Promise.reject(tokenError);
      }
    }
    return Promise.reject(error);
  },
);

export default API;
