import DOMPurify from "dompurify";
import { resetZIndex } from "/src/utils.js";
import { createBackArrow } from "../components/backArrow.js";

export default class GamePage {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false; // Eviter plusieurs abonnements
    this.isInitialized = false;
    this.startGameButton = null;
  }

  async initialize() {
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Appeler render pour obtenir le contenu HTML
    const content = this.render();
    // Insérer le contenu dans le conteneur dédié
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content;
    }
    this.state.setIsGamePage(true);
    this.attachEventListeners();
  }

  handleStateUpdate(state) {
    if (this.container) {
      this.container.innerHTML = this.render();
    }
  }

  attachEventListeners() {
    const PVPGameButton = document.getElementById("start-pvp-game");
    const PVRGameButton = document.getElementById("start-pvr-game");
    if (PVPGameButton) {
      PVPGameButton.addEventListener("click", () => {
        this.state.setGameStarted(true);
        this.updateZIndex();
      });
    }
    if (PVRGameButton) {
      PVRGameButton.addEventListener("click", () => {
        this.state.setGameStarted(true);
        this.updateZIndex();
      });
    }
  }

  updateZIndex() {
    const canvas = document.querySelector("#c");
    const app = document.querySelector("#app");

    if (this.state.state.gameStarted && !this.state.state.gameIsPaused) {
      // Canvas au-dessus, app en dessous
      //   if (canvas) canvas.style.zIndex = "1";
      //   if (app) app.style.zIndex = "0";
      app.classList.remove("view1");
      app.classList.add("view2");
      if (canvas) canvas.style.zIndex = "0";
    } else if (!this.state.state.gameIsPaused) {
      // Canvas en dessous, app au-dessus
      //   if (canvas) canvas.style.zIndex = "-1";
      //   if (app) app.style.zIndex = "1";
      app.classList.remove("view2");
      app.classList.add("view1");
      if (canvas) canvas.style.zIndex = "-1";
    }
  }

  handleStateChange(newState) {
    if (this.state.state.gameIsPaused) {
      const app = document.querySelector("#app");
      app.classList.remove("view2");
      app.classList.add("view1");
    } else {
      const app = document.querySelector("#app");
      app.classList.remove("view1");
      app.classList.add("view2");
    }

    const content = this.render();
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content; // Remplacer le contenu du conteneur
      this.attachEventListeners(); // Réattacher les écouteurs après chaque rendu
    }
    this.updateZIndex();
  }

  startGame() {
    this.state.players = this.state.player_types.PVR;
    this.resetScore();
    this.state.state.gameStarted = value;
    this.setGameNeedsReset(true);
    this.notifyListeners();
  }

  togglePause() {
    this.state.state.gameIsPaused = !this.state.gameIsPaused;
    this.state.notifyListeners();
  }

  resetScore() {
    this.state.score = { left: 0, right: 0 };
  }

  setGameNeedsReset(bool) {
    this.state.state.gameNeedsReset = bool;
    this.state.notifyListeners();
  }

  updateScore(side, points) {
    this.state.score[side] += points;
    this.state.notifyListeners();
  }

  destroy() {
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange); // Nettoyage de l'abonnement
      this.isSubscribed = false;
      console.log("Game page unsubscribed from state");
    }
    this.state.state.gameStarted = false;
    resetZIndex();
    this.state.setGameStarted(false);
    if (this.startGameButton) {
      this.startGameButton.removeEventListener("click", () => {});
    }
  }

  gameNotStartedMenu() {
    const container1 = document.createElement("div");
    container1.className =
      "d-flex justify-content-center align-items-center h-100";

    const backArrow = createBackArrow();
    container1.appendChild(backArrow);

    const container2 = document.createElement("ul");
    container2.className =
      "h3 navbar-nav d-flex align-items-center justify-content-center h-100 ";

    const startPvpText = document.createElement("li");
    startPvpText.className = "nav-item my-5";
    startPvpText.id = "start-pvp-game";
    startPvpText.textContent = "Start PVP Game";
    container2.appendChild(startPvpText);

    const startPvrText = document.createElement("li");
    startPvrText.className = "nav-item my-5";
    startPvrText.id = "start-pvr-game";
    startPvrText.textContent = "Start PVR Game";
    container2.appendChild(startPvrText);

    container1.appendChild(container2);

    return container1.innerHTML;
  }

  gameStartedMenu() {
    const container = document.createElement("div");
    container.className =
      "d-flex flex-column justify-content-center align-items-center h-100";

    const scoreDisplay = document.createElement("h1");
    scoreDisplay.textContent = `${this.state.score.left} - ${this.state.score.right}`;
    container.appendChild(scoreDisplay);

    return container.innerHTML;
  }

  render() {
    const userData = this.state.data.username || "";
    const sanitizedData = DOMPurify.sanitize(userData);

    let template;
    if (!this.state.state.gameStarted) {
      template = this.gameNotStartedMenu();
    } else {
      template = this.gameStartedMenu();
    }
    return template;
  }
}
