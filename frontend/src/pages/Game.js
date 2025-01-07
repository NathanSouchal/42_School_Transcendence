import DOMPurify from "dompurify";
import { resetZIndex } from "/src/utils.js";

export default class GamePage {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false; // Eviter plusieurs abonnements
    this.isInitialized = false;
  }
  async initialize() {
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
      container.innerHTML = content;
    }
    this.state.setIsGamePage(true);
    // Ajouter les écouteurs d'événements après avoir rendu le contenu
    this.attachEventListeners();
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
    const app = document.querySelector("main#app");

    if (this.state.state.gameStarted) {
      // Canvas au-dessus, app en dessous
      if (canvas) canvas.style.zIndex = "1";
      if (app) app.style.zIndex = "0";
    } else {
      // Canvas en dessous, app au-dessus
      if (canvas) canvas.style.zIndex = "-1";
      if (app) app.style.zIndex = "1";
    }
  }

  handleStateChange(newState) {
    // Cette méthode sera appelée à chaque fois que l'état est mis à jour
    // Vous pouvez traiter ici ce que vous souhaitez faire lorsque isGamePage change
    console.log("État mis à jour:", newState);
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
    resetZIndex();
    this.state.setGameStarted(false);
  }

  render() {
    const userData = this.state.data.username || "";
    const sanitizedData = DOMPurify.sanitize(userData);
    return `${`<div class="d-flex flex-column justify-content-center align-items-center h-100">
				<h1>Game</h1>
				<button class="btn btn-danger mt-2 mb-2" id="start-pvp-game">
						Start PVP Game
				</button>  
				<button class="btn btn-danger mt-2 mb-2" id="start-pvr-game">
						Start PVR Game
				</button>
			</div>`}`;
  }
}
