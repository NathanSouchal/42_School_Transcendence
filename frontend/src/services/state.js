import { checkUserStatus } from "../utils";

export default class State {
  constructor() {
    if (State.instance) {
      return State.instance;
    }

    this.state = {
      isGamePage: false,
      gameStarted: false,
      gameModeHasChanged: false,
      gameHasLoaded: false,
      gameLoadPercentage: 0,
      lastRoute: null,
      lastLastRoute: null,
      gameNeedsReset: false,
      gameIsPaused: false,
      gameHasBeenWon: false,
      isSearching: false,
      userId: "0",
      lang: "EN",
      opponentId: null,
      opponentUsername: null,
      userSide: null,
      username: null,
      userAlias: null,
      latency: 0,
      gameIsTimer: false,
    };
    this.gameMode = "default";
    this.isUserLoggedIn = false;
    this.connectionIssue = false;

    const savedState = JSON.parse(localStorage.getItem("pongState"));
    if (savedState) {
      this.isUserLoggedIn = savedState.isUserLoggedIn || false;
      this.state.userId = savedState.userId || "0";
      this.state.lang = savedState.lang || "EN";
      this.state.username = savedState.username || null;
      this.state.userAlias = savedState.userAlias || null;
    } else this.saveState();

    document.getElementById("app").classList.add("hidden");
    document.getElementById("c").classList.add("hidden");

    // this.gamePoints = 10;
    this.gamePoints = 2;

    this.botDifficulty = 6;

    this.player_types = {
      default: {
        left: "robot",
        right: "robot",
      },
      PVP: {
        left: "player",
        right: "player",
      },
      PVR: {
        left: "robot",
        right: "player",
      },
      OnlineLeft: {
        left: "player",
        right: "none",
      },
      OnlineRight: {
        left: "none",
        right: "player",
      },
    };

    this.players = this.player_types.default;

    this.score = { left: 0, right: 0 };
    this.scores = [];
    this.data = {};
    this.listeners = [];
    this.collision = {};

    State.instance = this;
  }

  updateLang(lang) {
    this.state.lang = lang;
    this.saveState();
    this.notifyListeners();
  }

  saveState() {
    const stateToSave = {
      isUserLoggedIn: this.isUserLoggedIn,
      userId: this.state.userId,
      username: this.state.username,
      userAlias: this.state.userAlias,
      lang: this.state.lang,
    };
    localStorage.setItem("pongState", JSON.stringify(stateToSave));
  }

  resetState() {
    localStorage.removeItem("pongState");
    this.isUserLoggedIn = false;
  }

  setIsUserLoggedIn(value) {
    this.isUserLoggedIn = value;
    this.saveState();
    this.notifyListeners();
  }

  setGameHasLoaded() {
    this.state.gameHasLoaded = true;
    // console.log("gameHasLoaded set to true in state");
    this.notifyListeners();
    document.getElementById("loading-overlay").classList.add("hidden");
    document.getElementById("main").classList.remove("hidden");
    document.getElementById("c").classList.remove("hidden");
    document.getElementById("lang-div").style.display = "block";
  }

  setGameNeedsReset(bool) {
    this.state.gameNeedsReset = bool;
    this.notifyListeners();
  }

  async setGameStarted(gameMode) {
    console.log("setGameStarted()");
    console.log("gameMode: " + gameMode);
    if (gameMode !== "default") {
      await this.displayTimerBeforeGameStart();
      if (!this.state.gameIsTimer) return;
      //   if (!this.gameManager || typeof this.gameManager.connect !== "function") {
      //     console.warn("⚠️ gameManager is undefined or not ready.");
      //     return;
      //   }
      this.state.gameIsTimer = false;
    }
    if (
      !["PVR", "PVP", "OnlineLeft", "OnlineRight", "default"].includes(gameMode)
    )
      gameMode = "default";
    this.gameMode = gameMode;
    this.players = this.player_types[gameMode];

    if (this.gameMode !== "OnlineLeft" && this.gameMode !== "OnlineRight")
      this.gameManager.connect();

    if (this.state.gameIsPaused) this.state.gameIsPaused = false;

    this.resetScore();
    if (gameMode !== "default") this.state.gameStarted = true;
    this.state.gameHasBeenWon = false;
    this.setGameNeedsReset(true);
  }

  displayTimerBeforeGameStart(durationSeconds = 3) {
    this.state.gameIsTimer = true;
    return new Promise((resolve) => {
      const container = document.getElementById("app");
      const toogleBar = document.getElementById("toggle-button-container");
      const langDiv = document.getElementById("lang-div");
      if (toogleBar) toogleBar.style.display = "none";
      if (langDiv) langDiv.style.display = "none";

      const template = `
        <div class="timer-overlay">
          <div class="timer-countdown">${durationSeconds}</div>
        </div>
      `;
      container.innerHTML = template;

      const countdownElement = container.querySelector(".timer-countdown");
      let countdown = durationSeconds;

      const interval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;

        if (countdown <= 0) {
          clearInterval(interval);
          const timerOverlay = container.querySelector(".timer-overlay");
          if (timerOverlay) timerOverlay.remove();
          //   if (langDiv) langDiv.style.display = "block";
          resolve();
        }
      }, 1000);
    });
  }

  async startMatchmaking() {
    if (this.state.isSearching) {
      console.warn("Matchmaking is already in progress!");
      return;
    }
    this.setIsSearching(true);
    this.gameMode = "Online";
    console.log("Starting Machmaking");
    if (this.gameManager) this.gameManager.connect();
    else {
      console.error("GameManager is not initialized!");
      return;
    }
    while (this.state.isSearching) {
      console.log("Searching for opponent...");
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    this.setGameStarted(this.gameMode);
  }

  cancelMatchmaking() {
    this.setIsSearching(false);
    if (this.gameManager?.socket) this.gameManager.socket.close();
    this.gameMode = "default";
    console.log("Cancelled Matchmaking");
    //this.setGameStarted("default");
  }

  setIsSearching(bool) {
    this.state.isSearching = bool;
    this.notifyListeners();
  }

  setGameEnded() {
    console.log("setGameEnded()");
    this.scores.push(this.score);
    this.setDestroyGame();
    this.setGameNeedsReset(true);
    this.notifyListeners();
  }

  setDestroyGame() {
    this.state.gameIsTimer = false;
    console.log("setDestroyGame()");
    if (this.state.gameIsPaused) this.state.gameIsPaused = false;
    if (this.state.gameStarted) this.state.gameStarted = false;
    this.gameMode = "default";
    if (this.gameManager?.socket) this.gameManager.socket.close();
  }

  backToBackgroundPlay() {
    this.state.gameHasBeenWon = false;
    this.setGameStarted("default");
  }

  togglePause(bool) {
    if (bool) this.state.gameIsPaused = bool;
    else this.state.gameIsPaused = !this.state.gameIsPaused;
    this.gameManager.sendPause(this.state.gameIsPaused);
    this.notifyListeners();
  }

  restart() {
    this.setGameStarted(this.gameMode);
  }

  updateScore(side, points) {
    this.score[side] += points;
    console.log(
      `${side} has scored : score is ${this.score["left"]} - ${this.score["right"]}`
    );
    if (this.score[side] === this.gamePoints) {
      this.setGameEnded();
      this.state.gameHasBeenWon = true;
    }
    this.notifyListeners();
  }

  resetScore() {
    if (this.state.gameStarted) {
      console.warn("Attempted to reset score while the game is in progress.");
      return;
    }
    this.score = { left: 0, right: 0 };
  }

  subscribe(listener) {
    if (typeof listener !== "function") {
      throw new TypeError("Le listener doit être une fonction.");
    }
    //console.log("Abonnement ajouté :", listener.name || listener);
    this.listeners.push(listener);
  }

  unsubscribe(listener) {
    //console.log("Abonnement retiré :", listener.name || listener);
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }
}
