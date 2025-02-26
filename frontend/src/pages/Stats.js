import DOMPurify from "dompurify";
import API from "../services/api.js";
import {
  handleHeader,
  updateView,
  createBackArrow,
  checkUserStatus,
} from "../utils";
import { router } from "../app.js";
import { trad } from "../trad.js";

export default class Stats {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.eventListeners = [];
    this.stats = {};
    this.lang = null;
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
    if (
      (newState.gameHasLoaded && !this.previousState.gameHasLoaded) ||
      newState.lang !== this.previousState.lang
    ) {
      console.log("GameHasLoaded state changed, rendering Stats page");
      this.previousState = { ...newState };
      await updateView(this);
    } else this.previousState = { ...newState };
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
      console.log("Stats page unsubscribed from state");
    }
  }

  async render(routeParams = {}) {
    try {
      await checkUserStatus();
      await this.getStats(this.state.state.userId);
    } catch (error) {
      if (error.response.status === 401) return "";
      if (error.response.status === 404) {
        setTimeout(() => {
          router.navigate("/404");
        }, 50);
        return "";
      }
    }
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Stats page subscribed to state");
    }
    if (this.lang !== this.state.state.lang)
      handleHeader(this.state.isUserLoggedIn, false, true);
    else handleHeader(this.state.isUserLoggedIn, false, false);
    this.lang = this.state.state.lang;
    console.log(
      "STATS: " +
        Object.entries(this.stats).map(([key, value]) => `${key}: ${value}`)
    );
    let template;
    const backArrow = createBackArrow(this.state.state.lastRoute);
    if (this.stats && Object.keys(this.stats).length > 0) {
      template = `${backArrow}
      <div class="main-div-stats">
        <h1 class="global-page-title">${trad[this.lang].stats.pageTitle}</h1>
				<div class="stats-list">
					<div class="stats-item">
            <h2>${trad[this.lang].stats.wins}</h2>
            <p>${this.stats.wins || 0}</p>
          </div>
					<div class="stats-item">
            <h2>${trad[this.lang].stats.losses}</h2>
            <p>${this.stats.losses || 0}</p>
          </div>
					<div class="stats-item">
            <h2>${trad[this.lang].stats.winRatio}</h2>
            <p>${this.stats.win_ratio || 0}</p>
          </div>
					<div class="stats-item">
            <h2>${trad[this.lang].stats.gameNum}</h2>
            <p>${this.stats.nb_games || 0}</p>
          </div>
					<div class="stats-item">
            <h2>${trad[this.lang].stats.avergaeScore}</h2>
            <p>${this.stats.average_score || 0}</p>
          </div>
					<div class="stats-item">
            <h2>${trad[this.lang].stats.lastGane}</h2>
            <p>${this.stats.last_game || 0}</p>
          </div>
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
