import { handleHeader, updateView } from "../utils";
import DOMPurify from "dompurify";
import { router } from "../app.js";
import { createBackArrow } from "../utils";

export default class GamePage {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
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
      console.log("GamePage subscribed to state");
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

    const togglePause = document.getElementById("toggle-pause");
    if (togglePause) {
      const handleClick = this.handleClick.bind(this, "toggle-pause");
      if (!this.eventListeners.some((e) => e.name === "toggle-pause")) {
        togglePause.addEventListener("click", handleClick);
        this.eventListeners.push({
          name: "toggle-pause",
          type: "click",
          element: togglePause,
          listener: handleClick,
        });
      }
    }

    const pvpButton = document.getElementById("start-pvp-game");
    if (pvpButton) {
      const handleClick = this.handleClick.bind(this, "start-pvp-game");
      if (!this.eventListeners.some((e) => e.name === "start-pvp-game")) {
        pvpButton.addEventListener("click", handleClick);
        this.eventListeners.push({
          name: "start-pvp-game",
          type: "click",
          element: pvpButton,
          listener: handleClick,
        });
      }
    }

    const pvrButton = document.getElementById("start-pvr-game");
    if (pvrButton) {
      const handleClick = this.handleClick.bind(this, "start-pvr-game");
      if (!this.eventListeners.some((e) => e.name === "start-pvr-game")) {
        pvrButton.addEventListener("click", handleClick);
        this.eventListeners.push({
          name: "start-pvr-game",
          type: "click",
          element: pvrButton,
          listener: handleClick,
        });
      }
    }

    const restartGameButton = document.getElementById("restart-game");
    if (restartGameButton) {
      const handleClick = this.handleClick.bind(this, "restart-game");
      if (!this.eventListeners.some((e) => e.name === "restart-game")) {
        restartGameButton.addEventListener("click", handleClick);
        this.eventListeners.push({
          name: "restart-game",
          type: "click",
          element: restartGameButton,
          listener: handleClick,
        });
      }
    }

    const resumeGameButton = document.getElementById("resume-game");
    if (resumeGameButton) {
      const handleClick = this.handleClick.bind(this, "resume-game");
      if (!this.eventListeners.some((e) => e.name === "resume-game")) {
        resumeGameButton.addEventListener("click", handleClick);
        this.eventListeners.push({
          name: "resume-game",
          type: "click",
          element: resumeGameButton,
          listener: handleClick,
        });
      }
    }

    const exitGameButton = document.getElementById("exit-game");
    if (exitGameButton) {
      const handleClick = this.handleClick.bind(this, "exit-game");
      if (!this.eventListeners.some((e) => e.name === "exit-game")) {
        exitGameButton.addEventListener("click", handleClick);
        this.eventListeners.push({
          name: "exit-game",
          type: "click",
          element: exitGameButton,
          listener: handleClick,
        });
      }
    }
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
    switch (param) {
      case "start-pvp-game":
        this.state.setGameStarted("PVP");
        console.log("coucou");
        break;
      case "start-pvr-game":
        this.state.setGameStarted("PVR");
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
    if (
      newState.gameIsPaused !== this.previousState.gameIsPaused ||
      newState.gameStarted !== this.previousState.gameStarted ||
      newState.gameHasBeenWon !== this.previousState.gameHasBeenWon ||
      newState.gameHasLoaded !== this.previousState.gameHasLoaded
    ) {
      console.log("State changed, rendering Game page");
      await updateView(this);
    }
    this.previousState = { ...newState };
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
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      console.log("Game page unsubscribed from state");
    }
  }

  renderGameMenu() {
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
    const backArrow = createBackArrow(this.state.state.lastRoute);

    const template = `${backArrow}
			<div class="game-hud">
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
    const backArrow = createBackArrow(this.state.state.lastRoute);
    const template = `${backArrow}
			<div>
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
