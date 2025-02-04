import { createBackArrow } from "../components/backArrow.js";
import DOMPurify from "dompurify";
import API from "../services/api.js";
import { handleHeader } from "../utils";

export default class MatchHistory {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false; // Eviter plusieurs abonnements
    this.isInitialized = false;
    this.matchHistory = {};
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

    const content = await this.render();
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content;
    }
  }

  attachEventListeners() {}

  handleStateChange() {}

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
