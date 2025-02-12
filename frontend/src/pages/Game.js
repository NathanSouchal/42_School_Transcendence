import { handleHeader, updateView } from "../utils";
import DOMPurify from "dompurify";
import { router } from "../app.js";
import { createBackArrow } from "../utils";

export default class GamePage {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.container = null;
    this.isMatchmaking = false;
    this.isSubscribed = false;
    this.isInitialized = false;
    this.eventListeners = [];
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log("GamePage initialized");
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      // console.log("GamePage subscribed to state");
    }
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

    const buttons = [
      { id: "toggle-pause", action: "toggle-pause" },
      { id: "start-pvp-game", action: "start-pvp-game" },
      { id: "start-pvr-game", action: "start-pvr-game" },
      { id: "start-online-pvp-game", action: "start-online-pvp-game" },
      { id: "restart-game", action: "restart-game" },
      { id: "resume-game", action: "resume-game" },
      { id: "exit-game", action: "exit-game" },
    ];

    buttons.forEach(({ id, action }) => {
      const button = document.getElementById(id);
      if (button) {
        const handleClick = this.handleClick.bind(this, action);
        if (!this.eventListeners.some((e) => e.name === action)) {
          button.addEventListener("click", handleClick);
          this.eventListeners.push({
            name: action,
            type: "click",
            element: button,
            listener: handleClick,
          });
        }
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

  handleClick(param) {
    // console.log(param);
    switch (param) {
      case "start-pvp-game":
        this.state.setGameStarted("PVP");
        console.log("coucou");
        break;
      case "start-pvr-game":
        this.state.setGameStarted("PVR");
        break;
      case "start-online-pvp-game":
        if (!this.state.state.isSearching) {
          this.state.startMatchmaking();
        } else {
          this.state.cancelMatchmaking();
        }
        console.log(`isSearching: ${this.state.state.isSearching}`);
        break;
      case "resume-game":
        this.state.togglePause();
        break;
      case "restart-game":
        this.state.restart();
        break;
      case "exit-game":
        this.state.setGameEnded();
        this.state.backToBackgroundPlay();
        break;
      case "back-arrow":
        this.state.setGameEnded();
        break;
      case "toggle-pause":
        this.state.togglePause();
        break;
    }
  }

  async handleStateChange(newState) {
    // console.log("Checking if state has changed");
    if (
      newState.gameIsPaused !== this.previousState.gameIsPaused ||
      newState.gameStarted !== this.previousState.gameStarted ||
      newState.gameHasBeenWon !== this.previousState.gameHasBeenWon ||
      newState.gameHasLoaded !== this.previousState.gameHasLoaded ||
      newState.isSearching !== this.previousState.isSearching
    ) {
      // console.log("State changed, rendering Game page");
      await updateView(this);
    }
    this.previousState = { ...newState };
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ element, listener, type }) => {
      if (element) {
        element.removeEventListener(type, listener);
        // console.log(`Removed ${type} eventListener from input`);
      }
    });
    this.eventListeners = [];
  }

  destroy() {
    this.removeEventListeners();
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      // console.log("Game page unsubscribed from state");
    }
  }

  renderGameMenu() {
    const { isSearching } = this.state.state;
    const backArrow = createBackArrow(this.state.state.lastRoute);
    const template = `${backArrow}
            <div>
            <div class="position-relative d-flex justify-content-center align-items-center min-vh-100">
              <div class="global-nav-section nav-section-game">
                  <div class="global-nav-items">
                    <button id="start-pvp-game">Player vs Player</button>
                  </div>
                  <div class="global-nav-items">
                    <button id="start-pvr-game">Player vs Robot</button>
                  </div>
                  <div id="start-local-tournament" class="global-nav-items">
                     <a class="nav-link" href="/local-tournament">Local tournament</a>
                  </div>

                  <div class="global-nav-items">
                    <button id="start-online-pvp-game">
                      ${
                        isSearching
                          ? '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Searching opponent...</span></div>'
                          : "Online PVP"
                      }
                    </button>
                  </div>
              </div>
            </div>
          </div>
        `;
    const sanitizedTemplate = DOMPurify.sanitize(template);
    return sanitizedTemplate;
  }

  renderGameHUD() {
    const { left, right } = this.state.score;
    const { gameIsPaused } = this.state.state;

    const template = `<div class="game-hud">
				<div class="game-score">
					<h1 class="display-4 mb-0">${left} - ${right}</h1>
				</div>
					<button id="toggle-pause" class="pause-play-btn">
					<div id="toggle-pause-styling" class="${gameIsPaused ? "play-icon" : "pause-icon"}" ></div>
				</button>
			</div>
  `;
    const sanitizedTemplate = DOMPurify.sanitize(template);
    return sanitizedTemplate;
  }

  renderPauseMenu() {
    const template = `<div>
				<div class="position-relative d-flex justify-content-center align-items-center min-vh-100">
					<div class="global-nav-section">
						<div class="game-paused-title">
							<h1>Game Paused</h1>
						</div>
						<div class="global-nav-items">
							<button id="resume-game">Resume Game</button>
						</div>
						<div class="global-nav-items">
							<button id="exit-game">Quit Game</button>
						</div>
					</div>
				</div>
			</div>
  `;
    const sanitizedTemplate = DOMPurify.sanitize(template);
    return sanitizedTemplate;
  }

  renderGameEnded() {
    const { left, right } = this.state.score;
    const backArrow = createBackArrow(this.state.state.lastRoute);

    const template = `${backArrow}
			<div>
				<div class="position-relative d-flex justify-content-center align-items-center min-vh-100">
					<div class="global-nav-section">
						<div class="game-score">
							<h1 class="display-4 mb-0">${left} - ${right}</h1>
						</div>
						<h2 class="mt-2">
							${left > right ? "Left Player Wins!" : "Right Player Wins!"}
						</h2>
						<div class="global-nav-items">
							<button id="restart-game">Play Again</button>
						</div>
						<div class="global-nav-items">
							<button id="exit-game">Back to Menu</button>
						</div>
					</div>
				</div>
			</div>
  `;
    const sanitizedTemplate = DOMPurify.sanitize(template);
    return sanitizedTemplate;
  }

  async render(routeParams = {}) {
    const { gameStarted, gameIsPaused, gameHasBeenWon } = this.state.state;
    const renderGame = document.getElementById("app");
    const menuButton = document.getElementById("toggle-button");

    if (!gameStarted && !gameHasBeenWon) {
      renderGame.className = "app";
      menuButton.className = "toggle-button";
      handleHeader(this.state.isUserLoggedIn, false);
      return this.renderGameMenu();
    } else if (!gameStarted && gameHasBeenWon) {
      renderGame.className = "app";
      menuButton.className = "toggle-button";
      handleHeader(this.state.isUserLoggedIn, true);
      return this.renderGameEnded();
    } else if (gameIsPaused) {
      renderGame.className = "app";
      menuButton.className = "toggle-button";
      handleHeader(this.state.isUserLoggedIn, true);
      return this.renderPauseMenu();
    } else {
      renderGame.className = "";
      menuButton.className = "";
      handleHeader(this.state.isUserLoggedIn, true);
      return this.renderGameHUD();
    }
  }
}
