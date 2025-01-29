import { createBackArrow } from "../components/backArrow.js";
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
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Stats page subscribed to state");
    }
    if (this.isInitialized) return;
    this.isInitialized = true;
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
    if (this.stats && Object.keys(this.stats).length > 0) {
      template = `<div class="d-flex flex-column m-5">
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
      template = `<div class="d-flex flex-column m-5">
          <h1>No data</h1>
      </div>`;
    }
    const tmpContainer = document.createElement("div");
    tmpContainer.innerHTML = template;
    const backArrow = createBackArrow();
    tmpContainer.insertBefore(backArrow, tmpContainer.firstChild);
    return tmpContainer.innerHTML;
  }
}
