export default class State {
  constructor() {
    if (State.instance) {
      return State.instance; // Retourner l'instance existante si elle existe déjà
    }

    this.state = {
      isGamePage: false,
      gameStarted: false,
      gameModeHasChanged: false,
      gameHasLoaded: true,
      gameLoadPercentage: 0,
      lastRoute: null,
      lastLastRoute: null,
      gameNeedsReset: false,
      gameIsPaused: false,
      gameHasBeenWon: false,
    };

    document.getElementById("app").classList.add("hidden");
    document.getElementById("c").classList.add("hidden");

    this.gamePoints = 10;

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
    };

    this.players = this.player_types.default;

    this.score = { left: 0, right: 0 };
    this.scores = [];
    this.data = {};
    this.listeners = [];
    State.instance = this;
    this.isUserLoggedIn = false;
  }

  updateData(newData) {
    this.data = { ...this.data, ...newData };
    this.notifyListeners();
  }

  setGameHasLoaded() {
    this.state.gameHasLoaded = true;
    this.notifyListeners();

    document.getElementById("loading-overlay").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    document.getElementById("c").classList.remove("hidden");
  }

  setGameNeedsReset(bool) {
    this.state.gameNeedsReset = bool;
    this.notifyListeners();
  }

  setGameStarted(gameMode) {
    if (gameMode) {
      this.gameMode = gameMode;
      switch (gameMode) {
        case "PVR":
          this.players = this.player_types.PVR;
          break;
        case "PVP":
          this.players = this.player_types.PVP;
          break;
        case "default":
          this.players = this.player_types.default;
          break;
      }
    }
    this.state.gameIsPaused = false;
    this.resetScore();
    if (gameMode && gameMode !== "default") this.state.gameStarted = true;
    this.state.gameHasBeenWon = false;
    this.setGameNeedsReset(true);
    this.notifyListeners();
  }

  setGameEnded() {
    this.state.gameIsPaused = false;
    this.scores.push(this.score);
    this.state.gameStarted = false;
    this.setGameNeedsReset(true);
    this.notifyListeners();
  }

  backToBackgroundPlay() {
    this.state.gameHasBeenWon = false;
    this.setGameStarted("default");
  }

  togglePause(bool) {
    if (bool) this.state.gameIsPaused = bool;
    else this.state.gameIsPaused = !this.state.gameIsPaused;
    this.notifyListeners();
  }

  restart() {
    this.setGameStarted(this.gameMode);
  }

  updateScore(side, points) {
    this.score[side] += points;
    if (this.score[side] === this.gamePoints) {
      this.setGameEnded();
      this.state.gameHasBeenWon = true;
    }
    this.notifyListeners();
  }

  resetScore() {
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
    if (this.state.gameHasLoaded)
      this.listeners.forEach((listener) => listener(this.state));
  }
}
