import {
  handleHeader,
  updateView,
  checkUserStatus,
  setDisable,
} from "../utils";
import { router } from "../app.js";
import { trad } from "../trad.js";
import API from "../services/api.js";

export default class GamePage {
  constructor(state) {
    this.pageName = "Game";
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.container = null;
    this.isMatchmaking = false;
    this.isSubscribed = false;
    this.isInitialized = false;
    this.eventListeners = [];
    this.oldscore = state.score;
    this.lang = null;
    this.haveToSelectBotDifficulty = false;
    this.formState = {};
    this.leftPlayerName = "";
    this.rightPlayerName = "";
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;
    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      // console.log("GamePage subscribed to state");
    }
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
      { id: "start-online-pvp-game", action: "start-online-pvp-game" },
      { id: "resume-game", action: "resume-game" },
      { id: "exit-game", action: "exit-game" },
      { id: "easy-btn", action: "easy-btn" },
      { id: "normal-btn", action: "normal-btn" },
      { id: "difficult-btn", action: "difficult-btn" },
      { id: "cancel-pvp-search", action: "cancel-pvp-search" },
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

  handleDifficultyChange(param) {
    this.state.botDifficulty = param;
    this.state.setGameStarted("PVR");
    this.haveToSelectBotDifficulty = false;
  }

  async handleClick(param) {
    setDisable(true, param);
    switch (param) {
      case "easy-btn":
        this.handleDifficultyChange("Easy");
        break;
      case "normal-btn":
        this.handleDifficultyChange("Normal");
        break;
      case "difficult-btn":
        this.handleDifficultyChange("Hard");
        break;
      case "start-pvp-game":
        this.state.setGameStarted("PVP");
        break;
      case "start-pvr-game":
        this.haveToSelectBotDifficulty = true;
        await updateView(this, {});
        // this.state.setGameStarted("PVR");
        break;
      case "start-online-pvp-game":
        if (!this.state.state.isSearching) {
          this.state.startMatchmaking();
          await updateView(this, {});
        } else {
          this.state.cancelMatchmaking();
          await updateView(this, {});
        }
        console.log(`isSearching: ${this.state.state.isSearching}`);
        break;
      case "resume-game":
        this.state.togglePause();
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
      case "cancel-pvp-search":
        this.state.cancelMatchmaking();
        await updateView(this, {});
        break;
    }
    setDisable(false, param);
  }

  renderOnlinePVP() {
    let template;

    if (this.state.state.isSearching)
      template = `<div class="global-nav-items online-pvp-div">
					<div class="loading-pvp-game" id="loading-pvp-game">
						<h2 class="searching-online-pvp">${trad[this.lang].game.searching}</h2>
						<span class="dot">.</span>
						<span class="dot">.</span>
						<span class="dot">.</span>
					</div>
					<button type="button" class="btn btn-danger m-3" id="cancel-pvp-search">${trad[this.lang].game.cancel}</button>
				</div>`;
    else
      template = `<div class="global-nav-items">
					<button id="start-online-pvp-game">${trad[this.lang].game.onlineGame}</button>
				</div>`;
    return template;
  }

  async saveGame() {
    if (!this.state.isUserLoggedIn) return;
    //No user logged in so no score to save in database
    if (this.state.state.opponentId && this.state.state.userSide === "left")
      return;
    //Right player posts data only
    const { left, right } = this.state.score;

    this.formState.player1 = this.state.state.userId;
    this.formState.player2 = this.state.state.opponentId;
    this.formState.score_player1 = parseInt(right);
    this.formState.score_player2 = parseInt(left);

    try {
      await API.post(`/game/list/`, this.formState);
    } catch (error) {
      console.error(error);
    } finally {
      this.state.state.opponentId = null;
      this.state.state.opponentUsername = null;
      this.state.state.userSide = null;
    }
  }

  async handleStateChange(newState) {
    if (newState.gameHasBeenWon && !this.previousState.gameHasBeenWon)
      await this.saveGame();
    else if (
      newState.gameIsPaused !== this.previousState.gameIsPaused ||
      newState.gameStarted !== this.previousState.gameStarted ||
      newState.gameHasBeenWon !== this.previousState.gameHasBeenWon ||
      newState.gameHasLoaded !== this.previousState.gameHasLoaded ||
      this.state.score["left"] !== this.oldscore["left"] ||
      this.state.score["right"] !== this.oldscore["right"] ||
      newState.lang !== this.previousState.lang
    ) {
      // console.log("State changed, rendering Game page");
      this.previousState = { ...newState };
      this.oldscore = { ...this.state.score };
      await updateView(this, {});
    } else this.previousState = { ...newState };
    this.oldscore = { ...this.state.score };
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
    if (this.state.state.isSearching) this.state.cancelMatchmaking();
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      // console.log("Game page unsubscribed from state");
    }
    this.haveToSelectBotDifficulty = false;
  }

  renderSelectBotDifficulty() {
    return `
			  <div class="select-difficulty" id="select-difficulty">
				  <button id="easy-btn">${trad[this.lang].game.easy}</button>
				  <button id="normal-btn">${trad[this.lang].game.normal}</button>
				  <button id="difficult-btn">${trad[this.lang].game.difficult}</button>
			  </div>`;
  }

  renderGameMenu() {
    return `
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
					${this.state.isUserLoggedIn ? this.renderOnlinePVP() : ``}
					<div id="rules" class="rules-link-div">
					   <a class="nav-link" href="/rules">${trad[this.lang].game.rules}</a>
					</div>
				</div>
			  </div>
		  `;
  }

  renderGameHUD() {
    const { left, right } = this.state.score;
    const { gameIsPaused } = this.state.state.gameIsPaused;

    if (this.state.gameMode === "PVP") {
      this.leftPlayerName = trad[this.lang].game.player1;
      this.rightPlayerName = this.state.isUserLoggedIn
        ? this.state.state.userAlias
        : trad[this.lang].game.player2;
    } else if (this.state.gameMode === "PVR") {
      this.leftPlayerName = trad[this.lang].game.computer;
      this.rightPlayerName = this.state.isUserLoggedIn
        ? this.state.state.userAlias
        : trad[this.lang].game.player;
    } else if (
      this.state.gameMode === "OnlineLeft" ||
      this.state.gameMode === "OnlineRight"
    ) {
      if (this.state.state.userSide === "left") {
        this.leftPlayerName = this.state.state.userAlias;
        this.rightPlayerName = this.state.state.opponentUsername;
      } else {
        this.leftPlayerName = this.state.state.opponentUsername;
        this.rightPlayerName = this.state.state.userAlias;
      }
    }

    return `<div class="game-hud">
				  <div class="game-score">
					<h1>${this.leftPlayerName}</h1>
					<h1>${left} - ${right}</h1>
					<h1>${this.rightPlayerName}</h1>
				  </div>
					  <button id="toggle-pause" class="pause-play-btn">
					  ${
              this.state.gameMode !== "OnlineLeft" &&
              this.state.gameMode !== "OnlineRight"
                ? `<div id="toggle-pause-styling" class="${gameIsPaused ? "play-icon" : "pause-icon"}" ></div>`
                : ``
            }
				  </button>
			  </div>
	`;
  }

  renderPauseMenu() {
    return `<div>
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
  }

  renderGameEnded() {
    const { left, right } = this.state.score;
    console.log("left :" + left + "right : " + right);

    return `
			  <div>
				  <div class="position-relative d-flex justify-content-center align-items-center min-vh-100">
					  <div class="global-nav-section">
						  <div class="game-ended-score">
							  <h1>${left} - ${right}</h1>
						  </div>
						  <h2 class="mt-2">
							  ${left > right ? `${this.leftPlayerName} ${trad[this.lang].game.wins}` : `${this.rightPlayerName} ${trad[this.lang].game.wins}`}
						  </h2>
						  <div class="global-nav-items">
							  <button id="exit-game">${trad[this.lang].game.back}</button>
						  </div>
					  </div>
				  </div>
			  </div>
	`;
  }

  async render(routeParams = {}) {
    await checkUserStatus();

    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("GamePage subscribed to state");
    }
    const { gameStarted, gameIsPaused, gameHasBeenWon } = this.state.state;
    console.log(
      "gameStarted :" + gameStarted,
      " gameIsPaused :" + gameIsPaused,
      " gameHasBeenWon : " + gameHasBeenWon,
      " this.haveToSelectBotDifficulty :" + this.haveToSelectBotDifficulty
    );
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
