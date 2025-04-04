import API from "../services/api.js";
import { handleHeader, updateView, checkUserStatus } from "../utils";
import { router } from "../app.js";
import { trad } from "../trad.js";

export default class MatchHistory {
  constructor(state) {
    this.pageName = "MatchHistory";
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.matchHistory = {};
    this.eventListeners = [];
    this.lang = null;
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }

    if (!this.state.state.gameHasLoaded) return;
    await updateView(this, {});
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
      this.previousState = { ...newState };
      await updateView(this, {});
    } else this.previousState = { ...newState };
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
      }
    });
    this.eventListeners = [];
  }

  destroy() {
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
    }
  }

  async render(routeParams = {}) {
    const isAuthenticated = await checkUserStatus();
    if (!isAuthenticated) return;

    await this.getMatchHistory(this.state.state.userId);

    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    if (this.lang !== this.state.state.lang)
      handleHeader(this.state.isUserLoggedIn, false, true);
    else handleHeader(this.state.isUserLoggedIn, false, false);
    this.lang = this.state.state.lang;
    return `<div class="user-main-div">
						<div class="user-main-content">
							<div class="title-div match-history-title-div">
								<h1>${trad[this.lang].matchHistory.pageTitle}</h1>
							</div>
							<div class="match-history-main-div">
							${
                this.matchHistory && Object.keys(this.matchHistory).length
                  ? Object.values(this.matchHistory)
                      .map(
                        (value) =>
                          `<div class="match-history-main-game-div">
								<div class="match-history-game-div ${
                  (value.player1 === this.state.state.userAlias &&
                    value.score_player1 > value.score_player2) ||
                  (value.player2 === this.state.state.userAlias &&
                    value.score_player2 > value.score_player1)
                    ? `won`
                    : (value.player1 === this.state.state.userAlias &&
                          value.score_player1 < value.score_player2) ||
                        (value.player2 === this.state.state.userAlias &&
                          value.score_player2 < value.score_player1)
                      ? `lost`
                      : `equality`
                }">
									<h4 class="mh-date">${value.created_at.split("T")[0]}</h4>
									<h3 class="mh-player">${value.player1}</h3>
									<h3 class="mh-score">${value.score_player1}</h3>
									<span>-</span>
									<h3 class="mh-score">${value.score_player2}</h3>
									<h3 class="mh-player">${value.player2 ? value.player2 : value.opponentName}</h3>
								</div>
							</div>`
                      )
                      .join("")
                  : `<div class="match-history-main-div">
				  		<div class="match-history-main-game-div">
							<h3>${trad[this.lang].matchHistory.noContent}</h3>
						</div>
					</div>`
              }
						</div>
						</div>
					</div>`;
  }
}
