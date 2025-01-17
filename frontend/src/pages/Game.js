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

  async initialize(routeParams = {}) {
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Game page subscribed to state");
    }
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Appeler render pour obtenir le contenu HTML
    const content = this.render();
    // Insérer le contenu dans le conteneur dédié
    const container = document.getElementById("app");
    if (container) {
      // container.innerHTML = "";
      container.innerHTML = content;
    }
    this.state.setIsGamePage(true);
    // Ajouter les écouteurs d'événements après avoir rendu le contenu
    this.attachEventListeners();
  }

  handleStateUpdate(state) {
    // Re-render the component when state changes
    this.updateDisplay();
  }

  updateDisplay() {
    if (this.container) {
      this.container.innerHTML = this.render();
    }
  }

  attachEventListeners() {
    const startPVPGameButton = document.getElementById("start-pvp-game");
    const startPVRGameButton = document.getElementById("start-pvr-game");
    if (startPVPGameButton) {
      startPVPGameButton.addEventListener("click", () => {
        this.state.setPVPGameStarted(true);
        this.updateZIndex();
      });
    }
    if (startPVRGameButton) {
      startPVRGameButton.addEventListener("click", () => {
        this.state.setPVRGameStarted(true);
        this.updateZIndex();
      });
    }
  }

  updateZIndex() {
    const canvas = document.querySelector("#c");
    const app = document.querySelector("#app");

    if (this.state.state.gameStarted) {
      // Canvas au-dessus, app en dessous
      //   if (canvas) canvas.style.zIndex = "1";
      //   if (app) app.style.zIndex = "0";
      app.classList.remove("view1");
      app.classList.add("view2");
      if (canvas) canvas.style.zIndex = "0";
    } else {
      // Canvas en dessous, app au-dessus
      //   if (canvas) canvas.style.zIndex = "-1";
      //   if (app) app.style.zIndex = "1";
      app.classList.remove("view2");
      app.classList.add("view1");
      if (canvas) canvas.style.zIndex = "-1";
    }
  }

  handleStateChange(newState) {
    // Cette méthode sera appelée à chaque fois que l'état est mis à jour
    // Vous pouvez traiter ici ce que vous souhaitez faire lorsque isGamePage change
    // console.log("État mis à jour:", newState);
    const content = this.render();
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content; // Remplacer le contenu du conteneur
      this.attachEventListeners(); // Réattacher les écouteurs après chaque rendu
    }
    this.updateZIndex();
  }

  destroy() {
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange); // Nettoyage de l'abonnement
      this.isSubscribed = false;
      console.log("Game page unsubscribed from state");
    }
    this.state.state.PVRgameStarted = false;
    this.state.state.PVPgameStarted = false;
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

  render(routeParams = {}) {
    const userData = this.state.data.username || "";
    const sanitizedData = DOMPurify.sanitize(userData);

    let template;
    if (!this.state.state.PVRgameStarted && !this.state.state.PVPgameStarted) {
      template = this.gameNotStartedMenu();
    } else {
      template = this.gameStartedMenu();
    }
    return template;
  }
}
