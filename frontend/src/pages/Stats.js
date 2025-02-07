import DOMPurify from "dompurify";
import API from "../services/api.js";
import {
  handleHeader,
  updateView,
  createBackArrow,
  checkUserStatus,
} from "../utils";
import { router } from "../app.js";

export default class Stats {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.eventListeners = [];
    this.stats = {};
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Stats page subscribed to state");
    }

    if (!this.state.state.gameHasLoaded) return;
    else await updateView(this);
  }

  attachEventListeners() {
    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      if (!this.eventListeners.some((e) => e.element === link)) {
        const handleNavigation = this.handleNavigation.bind(this);
        link.addEventListener("click", handleNavigation);
        this.eventListeners.push({
          name: link.getAttribute("href") || "unknown-link",
          type: "click",
          element: link,
          listener: handleNavigation,
        });
      }
    });
  }

  handleNavigation(e) {
    const target = e.target.closest("a");
    if (target && target.href.startsWith(window.location.origin)) {
      e.preventDefault();
      const path = target.getAttribute("href");
      router.navigate(path);
    }
  }

  async handleStateChange(newState) {
    console.log("NEWGameHasLoaded : " + newState.gameHasLoaded);
    console.log("PREVGameHasLoaded2 : " + this.previousState.gameHasLoaded);
    if (newState.gameHasLoaded && !this.previousState.gameHasLoaded) {
      console.log("GameHasLoaded state changed, rendering Stats page");
      await updateView(this);
    }
    this.previousState = { ...newState };
  }

  async getStats(id) {
    try {
      const res = await API.get(`/stats/${id}/`);
      const data = res.data.stats;
      this.stats = data;
    } catch (error) {
      console.error(error);
    }
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ element, listener, type }) => {
      if (element) {
        element.removeEventListener(type, listener);
        console.log(`Removed ${type} eventListener from input`);
      }
    });
    this.eventListeners = [];
  }

  destroy() {
    this.removeEventListeners();
    console.log("Stats destroy");
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      console.log("Home page unsubscribed from state");
    }
  }

  async render(routeParams = {}) {
    handleHeader(this.state.isUserLoggedIn, false);
    try {
      await checkUserStatus();
      await this.getStats(this.state.state.userId);
    } catch (error) {
      if (error.response.status === 401) return "";
      if (error.response.status === 404) {
        router.navigate("/404");
        return;
      }
    }
    console.log(
      "STATS: " +
        Object.entries(this.stats).map(([key, value]) => `${key}: ${value}`)
    );
    let template;
    const backArrow = createBackArrow(this.state.state.lastRoute);
    if (this.stats && Object.keys(this.stats).length > 0) {
      template = `${backArrow}<div class="d-flex flex-column m-5">
				<div class="d-flex justify-content-center" >
	  				<h1 class="m-3 mb-5">User Statistics</h1>
	  			</div>
				<div class="mt-5">
					<div class="d-flex m-3"><h1 class="me-5 w-75">Wins</h1><h1>${this.stats.wins || 0}</h1></div>
					<div class="d-flex m-3"><h1 class="me-5 w-75">Losses</h1><h1>${this.stats.losses || 0}</h1></div>
					<div class="d-flex m-3"><h1 class="me-5 w-75">Win ratio</h1><h1>${this.stats.win_ratio || 0}</h1></div>
					<div class="d-flex m-3"><h1 class="me-5 w-75">Number of games</h1><h1>${this.stats.nb_games || 0}</h1></div>
					<div class="d-flex m-3"><h1 class="me-5 w-75">Average score</h1><h1>${this.stats.average_score || 0}</h1></div>
					<div class="d-flex m-3"><h1 class="me-5 w-75">Last game</h1><h1>${this.stats.last_game || 0}</h1></div>
				</div>
			</div>`;
    } else {
      template = `${backArrow}<div class="d-flex flex-column m-5">
          <h1>No data</h1>
      </div>`;
    }
    const sanitizedTemplate = DOMPurify.sanitize(template);
    return sanitizedTemplate;
  }
}
