export default class State {
  constructor() {
    if (State.instance) {
      return State.instance; // Retourner l'instance existante si elle existe déjà
    }
    this.state = {
      isGamePage: false,
      PVPgameStarted: false,
      PVRgameStarted: false,
      gameStarted: false,
      gameModeHasChanged: false,
      gameHasLoaded: false,
      gameLoadPercentage: 0,
    };

    document.getElementById("app").classList.add("hidden");
    document.getElementById("c").classList.add("hidden");

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

  increaseLoadPercentage(value) {
    this.state.gameLoadPercentage += value;
  }

  setIsGamePage(isGamePage) {
    console.log("setIsGamePage appelé avec :", isGamePage);
    if (this.state.isGamePage !== isGamePage) {
      this.state.isGamePage = isGamePage;
      this.notifyListeners();
    } else {
      console.log("setIsGamePage appelé sans changement.");
    }
  }

  setPVPGameStarted(value) {
    this.state.PVPgameStarted = value;
    this.state.PVRgameStarted = !value;
    this.state.gameStarted = true;
    this.state.gameModeHasChanged = true;
    this.players = this.player_types.PVP;
    this.resetScore();
    this.notifyListeners();
  }

  setPVRGameStarted(value) {
    this.state.PVRgameStarted = value;
    this.state.PVPgameStarted = !value;
    this.state.gameStarted = true;
    this.state.gameModeHasChanged = true;
    this.players = this.player_types.PVR;
    this.resetScore();
    this.notifyListeners();
  }

  updateScore(side, points) {
    this.score[side] += points;
    this.notifyListeners();
  }

  resetScore() {
    this.score = { left: 0, right: 0 };
  }

  setGameStarted(value) {
    this.state.gameStarted = value;
    this.notifyListeners();
  }

  getState() {
    return this.state;
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
