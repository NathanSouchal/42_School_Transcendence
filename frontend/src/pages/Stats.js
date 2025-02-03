import { createBackArrow } from "../components/backArrow.js";
import DOMPurify from "dompurify";
import API from "../services/api.js";
import { handleHeader } from "../utils";

export default class Stats {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false; // Eviter plusieurs abonnements
    this.isInitialized = false;
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

    const userId = Number(localStorage.getItem("id"));
    if (userId) {
      await this.getStats(userId);
    }
    const content = this.render();
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content;
    }
  }

  attachEventListeners() {}

  handleStateChange() {}

  async getStats(id) {
    try {
      const res = await API.get(`/stats/${id}/`);
      const data = res.data.stats;
      this.stats = data;
    } catch (error) {
      console.error(error);
    }
  }

  destroy() {}

  render(routeParams = {}) {
    handleHeader(this.state.isUserLoggedIn, false);
    console.log(
      "STATS: " +
        Object.entries(this.stats).map(([key, value]) => `${key}: ${value}`)
    );
    let template;
    const backArrow = createBackArrow(this.state.state.lastRoute);
    if (this.stats && Object.keys(this.stats).length > 0) {
      template = `${backArrow}
      <div class="main-div-stats">
        <h1 class="global-page-title">Stats</h1>
				<div class="stats-list">
					<div class="stats-item">
            <h2>Wins</h2>
            <p>${this.stats.wins || 0}</p>
          </div>
					<div class="stats-item">
            <h2>Losses</h2>
            <p>${this.stats.losses || 0}</p>
          </div>
					<div class="stats-item">
            <h2>Win ratio</h2>
            <p>${this.stats.win_ratio || 0}</p>
          </div>
					<div class="stats-item">
            <h2>Number of games</h2>
            <p>${this.stats.nb_games || 0}</p>
          </div>
					<div class="stats-item">
            <h2>Average score</h2>
            <p>${this.stats.average_score || 0}</p>
          </div>
					<div class="stats-item">
            <h2>Last game</h2>
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
