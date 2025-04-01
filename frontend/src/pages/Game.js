import {
  handleHeader,
  updateView,
  checkUserStatus,
  setDisable,
  handleLangDiv,
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
    this.isProcessing = false;
    this.lastClickTime = Date.now();
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;
    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
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
      { id: "exit-opponent-left-game", action: "exit-opponent-left-game" },
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
    let elapsedTime;
    switch (param) {
      case "easy-btn":
        this.handleDifficultyChange(4);
        break;
      case "normal-btn":
        this.handleDifficultyChange(5);
        break;
      case "difficult-btn":
        this.handleDifficultyChange(6);
        break;
      case "start-pvp-game":
        if (this.state.state.isSearching) await this.state.cancelMatchmaking();
        this.state.setGameStarted("PVP");
        break;
      case "start-pvr-game":
        this.haveToSelectBotDifficulty = true;
        await updateView(this, {});
        break;
      case "start-online-pvp-game":
        elapsedTime = Date.now() - this.lastClickTime;
        if (this.state.state.gameIsTimer || elapsedTime < 1000) break;
        if (!this.state.state.isSearching) {
          this.state.startMatchmaking();
          await updateView(this, {});
          this.lastClickTime = Date.now(); // Correct Date.now() usage
        }
        break;
      case "resume-game":
        this.state.togglePause();
        break;
      case "exit-game":
        await this.destroy();
        await updateView(this, {});
        break;
      case "exit-opponent-left-game":
        await this.destroy();
        await updateView(this, {});
        break;
      case "toggle-pause":
        this.state.togglePause();
        break;
      case "cancel-pvp-search":
        elapsedTime = Date.now() - this.lastClickTime;
        if (this.state.state.gameIsTimer || elapsedTime < 1000) break;
        await this.state.cancelMatchmaking();
        await updateView(this, {});
        break;
    }
    setDisable(false, param);
  }

  renderOnlinePVP() {
    let template;

    if (this.state.state.isSearching) {
      template = `<div class="global-nav-items online-pvp-div">
					<div class="loading-pvp-game" id="loading-pvp-game">
						<h2 class="searching-online-pvp">${trad[this.lang].game.searching}</h2>
						<span class="dot">.</span>
						<span class="dot">.</span>
						<span class="dot">.</span>
					</div>
					<button type="button" class="btn btn-danger m-3" id="cancel-pvp-search">${trad[this.lang].game.cancel}</button>
				</div>`;
    } else
      template = `<div class="global-nav-items">
					<button id="start-online-pvp-game">${trad[this.lang].game.onlineGame}</button>
				</div>`;
    return template;
  }

  async saveGame() {
    if (!this.state.isUserLoggedIn || this.isProcessing) return;
    this.isProcessing = true;
    //No user logged in so no score to save in database
    console.log("saveGame()1");
    if (this.state.state.opponentId && this.state.state.userSide === "left")
      return;
    console.log("saveGame()2");
    //Right player posts data only
    const { left, right } = this.state.score;

    this.formState.player1 = this.state.state.userId;
    this.formState.player2 = this.state.state.opponentId;
    if (
      !this.state.state.opponentId &&
      this.state.state.previousGameMode == "PVR"
    )
      this.formState.opponentName = "Robot";
    this.formState.score_player1 = parseInt(right);
    this.formState.score_player2 = parseInt(left);

    try {
      console.log("posting data for game");
      await API.post(`/game/list/`, this.formState);
      console.log("saveGame()3");
    } catch (error) {
      console.error(error);
    } finally {
      this.state.state.opponentId = null;
      this.state.state.userSide = null;
      this.formState = {};
      this.isProcessing = false;
    }
  }

  async saveGameOpponentLeft() {
    console.log("saveGameOpponentLeft()");
    if (!this.state.isUserLoggedIn || this.isProcessing) return;
    this.isProcessing = true;
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
      this.state.state.userSide = null;
      this.formState = {};
      this.isProcessing = false;
    }
  }

  async handleStateChange(newState) {
    if (newState.opponentLeft && !this.previousState.opponentLeft) {
      this.previousState = { ...newState };
      this.oldscore = { ...this.state.score };
      await this.saveGameOpponentLeft();
      await updateView(this, {});
    } else if (newState.gameHasBeenWon && !this.previousState.gameHasBeenWon) {
      this.oldscore = { ...this.state.score };
      await this.saveGame();
      this.previousState = { ...newState };
      await updateView(this, {});
    } else if (
      newState.gameIsPaused !== this.previousState.gameIsPaused ||
      newState.gameStarted !== this.previousState.gameStarted ||
      newState.gameHasBeenWon !== this.previousState.gameHasBeenWon ||
      newState.gameHasLoaded !== this.previousState.gameHasLoaded ||
      this.state.score["left"] !== this.oldscore["left"] ||
      this.state.score["right"] !== this.oldscore["right"] ||
      newState.lang !== this.previousState.lang
    ) {
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
      }
    });
    this.eventListeners = [];
  }

  async destroy() {
    const renderGame = document.getElementById("app");
    if (renderGame) renderGame.className = "app";
    const menuButton = document.getElementById("toggle-button");
    if (menuButton) menuButton.className = "toggle-button";
    console.log("DESTROYYY");
    this.removeEventListeners();
    if (this.state.state.isSearching) await this.state.cancelMatchmaking();
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
    }
    if (this.haveToSelectBotDifficulty) this.haveToSelectBotDifficulty = false;
    if (this.state.state.opponentLeft) this.state.state.opponentLeft = false;
    this.state.setGameEnded();
    this.state.resetScore();
    this.state.state.gameHasBeenWon = false;
    this.state.state.opponentUsername = null;
    handleLangDiv(false);
    this.state.state.waitingOtherPlayer = false;
    if (this.state.abortController) {
      this.state.abortController.abort();
      this.state.abortController = null;
    }
  }

  renderSelectBotDifficulty() {
    handleLangDiv(false);
    return `
			  <div class="select-difficulty" id="select-difficulty">
				  <button id="easy-btn">${trad[this.lang].game.easy}</button>
				  <button id="normal-btn">${trad[this.lang].game.normal}</button>
				  <button id="difficult-btn">${trad[this.lang].game.difficult}</button>
			  </div>`;
  }

  renderGameMenu() {
    handleLangDiv(false);
    return `
			  <div class="position-relative d-flex justify-content-center align-items-center">
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
					<div id="cancel-matchmaking"></div>
				</div>
			  </div>
		  `;
  }

  renderGameHUD() {
    const { left, right } = this.state.score;
    const { gameIsPaused } = this.state.state.gameIsPaused;
    handleLangDiv(true);
    this.state.state.previousGameMode = this.state.gameMode;

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

    return `
        <div class="game-hud">
			<div class="game-score">
            <h1>${this.leftPlayerName}</h1>
            <h1>${left} - ${right}</h1>
            <h1>${this.rightPlayerName}</h1>
				  </div>

				  ${
            this.state.gameMode !== "OnlineLeft" &&
            this.state.gameMode !== "OnlineRight"
              ? `
					<button id="toggle-pause" class="pause-play-btn">
            <div id="toggle-pause-styling" class="${gameIsPaused ? "play-icon" : "pause-icon"}" ></div>
					</button>`
              : ``
          }
			  </div>
	`;
  }

  renderPauseMenu() {
    const homeImg = document.getElementById("home-img-div");
    if (homeImg) {
      homeImg.style.opacity = 0;
      homeImg.style.pointerEvents = "none";
    }
    handleLangDiv(false);
    return `<div>
				  <div class="position-relative d-flex justify-content-center align-items-center">
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
    handleLangDiv(false);

    return `
			  <div>
				  <div class="position-relative d-flex justify-content-center align-items-center">
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

  renderOpponentLeft() {
    const { left, right } = this.state.score;
    handleLangDiv(false);

    return `
			  <div>
				  <div class="position-relative d-flex justify-content-center align-items-center">
					  <div class="global-nav-section">
						  <div class="game-ended-score">
							<h1>${this.state.state.opponentUsername}${trad[this.lang].game.leave}</h1>
							<h1>${left} - ${right}</h1>
						  </div>
						  <h2 class="mt-2">
							  ${left > right ? `${this.leftPlayerName} ${trad[this.lang].game.wins}` : left < right ? `${this.rightPlayerName} ${trad[this.lang].game.wins}` : `${trad[this.lang].game.noWinner}`}
						  </h2>
						  <div class="global-nav-items">
							  <button id="exit-opponent-left-game">${trad[this.lang].game.back}</button>
						  </div>
					  </div>
				  </div>
			  </div>
	`;
  }

  async render(routeParams = {}) {
    await checkUserStatus();
    console.log("render GamePage");

    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    const { gameStarted, gameIsPaused, gameHasBeenWon } = this.state.state;

    const renderGame = document.getElementById("app");
    const menuButton = document.getElementById("toggle-button");

    console.log(
      "gameStarted, gameHasBeenWon, opponentLeft : ",
      gameStarted,
      gameHasBeenWon,
      this.state.state.opponentLeft
    );
    if (this.state.state.opponentLeft) {
      renderGame.className = "app";
      menuButton.className = "toggle-button";
      if (this.lang !== this.state.state.lang)
        handleHeader(this.state.isUserLoggedIn, false, true);
      else handleHeader(this.state.isUserLoggedIn, false, false);
      this.lang = this.state.state.lang;
      return this.renderOpponentLeft();
    } else if (
      !gameStarted &&
      !gameHasBeenWon &&
      !this.haveToSelectBotDifficulty
    ) {
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
      if (this.state.state.isSearching) await this.state.cancelMatchmaking();
      return this.renderSelectBotDifficulty();
    } else if (!gameStarted && gameHasBeenWon) {
      renderGame.className = "app";
      menuButton.className = "toggle-button";
      if (this.lang !== this.state.state.lang)
        handleHeader(this.state.isUserLoggedIn, false, true);
      else handleHeader(this.state.isUserLoggedIn, false, false);
      this.lang = this.state.state.lang;
      return this.renderGameEnded();
    } else if (gameIsPaused) {
      renderGame.className = "app";
      menuButton.className = "toggle-button";
      if (this.lang !== this.state.state.lang)
        handleHeader(this.state.isUserLoggedIn, true, false);
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
