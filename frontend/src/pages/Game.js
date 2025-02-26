import { handleHeader, updateView, checkUserStatus } from "../utils";
import DOMPurify from "dompurify";
import { router } from "../app.js";
import { createBackArrow } from "../utils";
import { trad } from "../trad.js";

export default class GamePage {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.eventListeners = [];
    this.oldscore = state.score;
    this.lang = null;
    this.haveToSelectBotDifficulty = false;
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;
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

    const selectDifficulty = document.getElementById("select-difficulty");
    if (selectDifficulty) {
      const handleDifficultyChange = this.handleDifficultyChange.bind(this);
      if (!this.eventListeners.some((e) => e.name === "selectDifficulty")) {
        selectDifficulty.addEventListener("change", handleDifficultyChange);
      }
      this.eventListeners.push({
        name: "selectDifficulty",
        type: "change",
        element: selectDifficulty,
        listener: handleDifficultyChange,
      });
    }

    const buttons = [
      { id: "toggle-pause", action: "toggle-pause" },
      { id: "start-pvp-game", action: "start-pvp-game" },
      { id: "start-pvr-game", action: "start-pvr-game" },
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

  handleDifficultyChange(e) {
    const selectedValue = e.target.value;
    if (selectedValue) {
      this.state.botDifficulty = selectedValue;
      this.state.setGameStarted("PVR");
    }
  }

  async handleClick(param) {
    switch (param) {
      case "start-pvp-game":
        this.state.setGameStarted("PVP");
        console.log("coucou");
        break;
      case "start-pvr-game":
        this.haveToSelectBotDifficulty = true;
        await updateView(this);
        this.haveToSelectBotDifficulty = false;
        // this.state.setGameStarted("PVR");
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
      newState.gameHasLoaded !== this.previousState.gameHasLoaded ||
      this.state.score["left"] !== this.oldscore["left"] ||
      this.state.score["right"] !== this.oldscore["right"] ||
      newState.lang !== this.previousState.lang
    ) {
      console.log("State changed, rendering Game page");
      this.previousState = { ...newState };
      this.oldscore = { ...this.state.score };
      await updateView(this);
    } else this.previousState = { ...newState };
    this.oldscore = { ...this.state.score };
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

  renderSelectBotDifficulty() {
    const backArrow = createBackArrow(this.state.state.lastRoute);
    const template = `${backArrow}
            <div class="container-selector">
              <div class="select-container">
                <label for="select-difficulty">Difficulty</label>
                <select id="select-difficulty">
                  <option value="" disabled selected>Select...</option>
                  <option value="4">Easy</option>
                  <option value="5">Normal</option>
                  <option value="6">Hard</option>
                </select>
              </div>
            </div>`;
    const sanitizedTemplate = DOMPurify.sanitize(template);
    return sanitizedTemplate;
  }

  renderGameMenu() {
    const backArrow = createBackArrow(this.state.state.lastRoute);
    const template = `${backArrow}
            <div>
            <div class="position-relative d-flex justify-content-center align-items-center min-vh-100">
              <div class="global-nav-section nav-section-game">
                  <div class="global-nav-items">
                    <button id="start-pvp-game">${trad[this.lang].game.pvp}</button>
                  </div>
                  <div class="global-nav-items">
                    <button id="start-pvr-game">${trad[this.lang].game.pvr}</button>
                  </div>
                  <div id="start-local-tournament" class="global-nav-items">
                     <a class="nav-link" href="/local-tournament">${trad[this.lang].game.local}</a>
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
							<h1>${trad[this.lang].game.paused}</h1>
						</div>
						<div class="global-nav-items">
							<button id="resume-game">${trad[this.lang].game.resume}</button>
						</div>
						<div class="global-nav-items">
							<button id="exit-game">${trad[this.lang].game.quit}</button>
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
							${left > right ? `${trad[this.lang].game.leftWins}` : `${trad[this.lang].game.rightWins}`}
						</h2>
						<div class="global-nav-items">
							<button id="restart-game">${trad[this.lang].game.playAgain}</button>
						</div>
						<div class="global-nav-items">
							<button id="exit-game">${trad[this.lang].game.back}</button>
						</div>
					</div>
				</div>
			</div>
  `;
    const sanitizedTemplate = DOMPurify.sanitize(template);
    return sanitizedTemplate;
  }

  async render(routeParams = {}) {
    try {
      await checkUserStatus();
    } catch (error) {
      console.error(error);
    }
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("GamePage subscribed to state");
    }
    const { gameStarted, gameIsPaused, gameHasBeenWon } = this.state.state;
    const renderGame = document.getElementById("app");
    const menuButton = document.getElementById("toggle-button");

    if (!gameStarted && !gameHasBeenWon && !this.haveToSelectBotDifficulty) {
      renderGame.className = "app";
      menuButton.className = "toggle-button";
      if (this.lang !== this.state.state.lang)
        handleHeader(this.state.isUserLoggedIn, false, true);
      else handleHeader(this.state.isUserLoggedIn, false, false);
      this.lang = this.state.state.lang;
      return this.renderGameMenu();
    } else if (
      !gameStarted &&
      !gameHasBeenWon &&
      this.haveToSelectBotDifficulty
    ) {
      if (this.lang !== this.state.state.lang)
        handleHeader(this.state.isUserLoggedIn, false, true);
      else handleHeader(this.state.isUserLoggedIn, false, false);
      this.lang = this.state.state.lang;
      return this.renderSelectBotDifficulty();
    } else if (!gameStarted && gameHasBeenWon) {
      renderGame.className = "app";
      menuButton.className = "toggle-button";
      if (this.lang !== this.state.state.lang)
        handleHeader(this.state.isUserLoggedIn, true, true);
      else handleHeader(this.state.isUserLoggedIn, true, false);
      this.lang = this.state.state.lang;
      return this.renderGameEnded();
    } else if (gameIsPaused) {
      renderGame.className = "app";
      menuButton.className = "toggle-button";
      if (this.lang !== this.state.state.lang)
        handleHeader(this.state.isUserLoggedIn, true, true);
      else handleHeader(this.state.isUserLoggedIn, true, false);
      this.lang = this.state.state.lang;
      return this.renderPauseMenu();
    } else {
      renderGame.className = "";
      menuButton.className = "";
      if (this.lang !== this.state.state.lang)
        handleHeader(this.state.isUserLoggedIn, true, true);
      else handleHeader(this.state.isUserLoggedIn, true, false);
      this.lang = this.state.state.lang;
      return this.renderGameHUD();
    }
  }
}
