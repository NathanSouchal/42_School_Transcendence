import DOMPurify from "dompurify";
import API from "../services/api.js";
import { handleHeader, updateView, createBackArrow } from "../utils";
import { router } from "../app.js";

export default class MatchHistory {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false; // Eviter plusieurs abonnements
    this.isInitialized = false;
    this.matchHistory = {};
    this.eventListeners = [];
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Match_history page subscribed to state");
    }

    const userId = Number(localStorage.getItem("id"));
    if (userId) {
      await this.getMatchHistory(userId);
    }
    if (!this.state.state.gameHasLoaded) return;
    await updateView(this);
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
      console.log("GameHasLoaded state changed, rendering MatchHistory page");
      await updateView(this);
    }
    this.previousState = { ...newState };
  }

  async getMatchHistory(id) {
    try {
      const res = await API.get(`/match-history/${id}/`);
      const data = res.data.match_history;
      this.matchHistory = data;
      console.log(
        "MatchHistory: " +
          Object.entries(this.matchHistory).map(
            ([key, value]) =>
              `${key}: ${Object.entries(value).map(([ky, val]) => `${ky}: ${val}`)}`
          )
      );
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
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      console.log("Match history page unsubscribed from state");
    }
  }

  async render(routeParams = {}) {
    let template;
    handleHeader(this.state.isUserLoggedIn, false);
    const backArrow = createBackArrow(this.state.state.lastRoute);
    if (this.matchHistory && Object.keys(this.matchHistory).length > 0) {
      template = `${backArrow}${Object.values(this.matchHistory)
        .map(
          (value) =>
            `<div class="d-flex flex-column m-3"><h3>Game n°${value.id}</h3>
                <div class="d-flex gap-3 align-items-center">
                    <h5>${value.created_at.split("T")[0]}</h5>
                    <h4>${value.player1}</h4>
                    <h5>${value.score_player1}</h5>
                    <span>-</span>
                    <h5>${value.score_player2}</h5>
                    <h4>${value.player2}</h4>
                </div>

            </div>`
        )
        .join("")}`;
    } else {
      template = `${backArrow}<h1>No data</h1>`;
    }
    const sanitizedTemplate = DOMPurify.sanitize(template);
    return sanitizedTemplate;
  }
}
