import DOMPurify from "dompurify";
import API from "../services/api.js";
import {
  handleHeader,
  updateView,
  createBackArrow,
  checkUserStatus,
} from "../utils";
import { router } from "../app.js";

export default class MatchHistory {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
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
      this.previousState = { ...newState };
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
    try {
      await checkUserStatus();
      await this.getMatchHistory(this.state.state.userId);
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
      console.log("Match_history page subscribed to state");
    }
    handleHeader(this.state.isUserLoggedIn, false, false);
    const backArrow = createBackArrow(this.state.state.lastRoute);
    const template = `${backArrow}<div class="user-main-div">
						<div class="user-main-content">
							<div class="title-div match-history-title-div">
								<h1>Match History</h1>
							</div>
							<div class="match-history-main-div">
							${
                this.matchHistory && Object.keys(this.matchHistory).length
                  ? Object.values(this.matchHistory)
                      .map(
                        (value) =>
                          `<div class="match-history-main-game-div">
								<div class="match-history-game-div ${value.score_player1 > value.score_player2 ? `won` : `lost`}">
									<h4 class="mh-date">${value.created_at.split("T")[0]}</h4>
									<h3 class="mh-player">${value.player1}</h3>
									<h3 class="mh-score">${value.score_player1}</h3>
									<span>-</span>
									<h3 class="mh-score">${value.score_player2}</h3>
									<h3 class="mh-player">${value.player2}</h3>
								</div>
							</div>`
                      )
                      .join("")
                  : `<div class="match-history-main-div">
				  		<div class="match-history-main-game-div">
							<h3>No match history</h3>
						</div>
					</div>`
              }
						</div>
						</div>
					</div>`;
    const sanitizedTemplate = DOMPurify.sanitize(template);
    return sanitizedTemplate;
  }
}
