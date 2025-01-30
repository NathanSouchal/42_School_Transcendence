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
    this.updateView();
  }

  updateView() {
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = this.render();
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }

  attachEventListeners() {
    const togglePause = document.getElementById("toggle-pause");
    if (togglePause) {
      const handleClick = this.handleClick.bind(this);
      if (!this.eventListeners.some((e) => e.name === "toggle-pause")) {
        togglePause.addEventListener("click", handleClick("toggle-pause"));
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
      const handleClick = this.handleClick.bind(this);
      if (!this.eventListeners.some((e) => e.name === "start-pvp-game")) {
        pvpButton.addEventListener("click", handleClick("start-pvp-game"));

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
      const handleClick = this.handleClick.bind(this);
      if (!this.eventListeners.some((e) => e.name === "start-pvr-game")) {
        pvrButton.addEventListener("click", handleClick("start-pvr-game"));
        this.eventListeners.push({
          name: "start-pvr-game",
          type: "click",
          element: pvrButton,
          listener: handleClick,
        });
      }
    }
  }

  handleClick = (e) => {
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
      case "toggle-pause":
        this.state.togglePause();
        break;
    }
  };

  handleStateChange(newState) {
    if (
      newState.gameIsPaused !== this.previousState.gameIsPaused ||
      newState.gameStarted !== this.previousState.gameStarted
    ) {
      this.previousState = { ...newState };
      this.render();
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
    this.removeEventListeners();
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      console.log("Account page unsubscribed from state");
    }
  }

  renderGameMenu() {
    return `
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
                     <button id="local-tournament"><a class="nav-link" href="/local-tournament">Local tournament</a></button>
                  </div>
              </div>
            </div>
          </div>
        `;
  }

  render(routeParams = {}) {
    handleHeader(this.state.isUserLoggedIn, false);
    const { gameStarted, gameIsPaused, gameHasBeenWon } = this.state.state;
    if (!gameStarted && !gameHasBeenWon) {
      renderGame.className = "app";
      menuButton.className = "toggle-button";
      return this.getGameMenuTemplate();
    } else if (!gameStarted && gameHasBeenWon) {
      renderGame.className = "app";
      menuButton.className = "toggle-button";
      return this.getGameEndingTemplate();
    } else if (gameIsPaused) {
      return this.getPauseMenuTemplate();
      renderGame.className = "app";
      menuButton.className = "toggle-button";
    } else {
      return this.getGameHUDTemplate();
      renderGame.className = "";
      menuButton.className = "";
    }
  }
}
