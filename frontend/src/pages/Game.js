import DOMPurify from "dompurify";
import { createBackArrow } from "../components/backArrow.js";
import { handleHeader } from "../utils";

export default class GamePage {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.container = null;
    this.cssLink;
  }

  async initialize() {
    console.log("GamePage initialized");
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("GamePage subscribed to state");
    }
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.container = document.getElementById("app");
    if (!this.container) return;

    this.state.subscribe(this.handleStateChange);
    this.render();
    this.attachEventListeners();
  }

  attachEventListeners() {
    if (this.container) {
      this.container.removeEventListener("click", this.handleClick);
      this.container.addEventListener("click", this.handleClick);

      const backArrow = document.getElementById("back-arrow");
      if (backArrow) {
        backArrow.removeEventListener("click", this.handleClick);
        backArrow.addEventListener("click", this.handleClick);
      }

      const togglePause = document.getElementById("toggle-pause");
      if (togglePause) {
        togglePause.removeEventListener("click", this.handleClickWithChildren);
        togglePause.addEventListener("click", this.handleClickWithChildren);
      }
    }
  }

  handleClick = (e) => {
    e.stopPropagation();

    let target = e.target.id;
    if (!target && e.target.parentElement) {
      target = e.target.parentElement.id;
    }

    switch (target) {
      case "start-pvp-game":
        this.state.setGameStarted("PVP");
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
      case "quit-game":
        this.state.setGameEnded();
        this.state.backToBackgroundPlay();
        break;
      case "back-arrow":
        this.state.setGameEnded();
        break;
    }
  };

  handleClickWithChildren = (e) => {
    e.stopPropagation();
    const button = e.currentTarget;
    if (button.contains(e.target)) {
      this.state.togglePause();
    }
  };

  handleStateChange(newState) {
    this.render();
    this.attachEventListeners();
  }

  destroy() {
    this.state.unsubscribe(this.handleStateChange);
    this.state.setGameEnded();
    const renderGame = document.getElementById("app");
    renderGame.className = "app";
  }

  getGameMenuTemplate() {
    return `
        <div>
        ${createBackArrow().outerHTML}
        <div class="position-relative d-flex justify-content-center align-items-center min-vh-100">
          <div class="global-nav-section nav-section-game">
              <div id="start-pvp-game" class="global-nav-items">
                <button>Player vs Player</button>
              </div>
              <div id="start-pvr-game" class="global-nav-items">
                <button>Player vs Robot</button>
              </div>
              <div id="start-local-tournament" class="global-nav-items">
                 <a class="nav-link" href="/local-tournament">Local tournament</a>
              </div>
          </div>
        </div>
      </div>
    `;
  }

  getGameHUDTemplate() {
    const { left, right } = this.state.score;
    const { gameIsPaused } = this.state.state;

    return `
  <div class="game-hud">
    <div class="game-score">
      <h1 class="display-4 mb-0">${left} - ${right}</h1>
    </div>
    <button id="toggle-pause" class="pause-play-btn">
      <div id="toggle-pause-styling" class="${gameIsPaused ? "play-icon" : "pause-icon"}" ></div>
    </button>
  </div>
  `;
  }

  getPauseMenuTemplate() {
    return `
  <div>
        <div class="position-relative d-flex justify-content-center align-items-center min-vh-100">
          <div class="text-center">
        <h2 class="mb-4">Game Paused</h2>
        <ul class="h3 navbar-nav mr-auto mt-2 mb-4 mt-lg-4">
          <li id="resume-game" class="nav-item my-2">
            Resume Game
          </li>
          <li id="quit-game" class="nav-item my-2">
            Quit Game
          </li>
        </ul>
      </div>
    </div>
  `;
  }

  getGameEndingTemplate() {
    const { left, right } = this.state.score;
    const { gameMode } = this.state.state;

    return `
  <div>
    <div class="position-relative d-flex justify-content-center align-items-center min-vh-100">
      <div class="text-center">
    <div class="game-score">
      <h1 class="display-4 mb-0">${left} - ${right}</h1>
        </div>
          <p class="h4 mt-2">
            ${left > right ? "Left Player Wins!" : "Right Player Wins!"}
          </p>

          <ul class="h3 navbar-nav mr-auto mt-4 mb-4">
            <li id="restart-game" class="nav-item my-2">
              Play Again
            </li>
            <li id="quit-game" class="nav-item my-2">
              Back to Menu
            </li>
          </ul>
        </div>
      </div>
    </div>
  `;
  }

  render() {
    const renderGame = document.getElementById("app");
    const menuButton = document.getElementById("toggle-button");
    if (!this.container) return;
    handleHeader(this.state.isUserLoggedIn, false);
    const { gameStarted, gameIsPaused, gameHasBeenWon } = this.state.state;
    let template;
    if (!gameStarted && !gameHasBeenWon) {
      renderGame.className = "app";
      menuButton.className = "toggle-button";
      template = this.getGameMenuTemplate();
    } else if (!gameStarted && gameHasBeenWon) {
      renderGame.className = "app";
      menuButton.className = "toggle-button";
      template = this.getGameEndingTemplate();
    } else {
      template = this.getGameHUDTemplate();
      renderGame.className = "";
      menuButton.className = "";
      if (gameIsPaused) {
        template += `
          ${this.getPauseMenuTemplate()}
      `;
        renderGame.className = "app";
        menuButton.className = "toggle-button";
      }
    }

    const sanitizedTemplate = DOMPurify.sanitize(template);
    this.container.innerHTML = sanitizedTemplate;
  }
}
