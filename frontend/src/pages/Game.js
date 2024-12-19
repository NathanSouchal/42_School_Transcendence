import DOMPurify from "dompurify";
import { State } from "../services/state";

export default class Game {
  constructor(state) {
    this.state = state;
    this.state.setIsGamePage({ isGamePage: true });
    this.state.subscribe(this.handleStateChange.bind(this));
  }
  async initialize() {
    // Appeler render pour obtenir le contenu HTML
    const content = this.render();

    // Insérer le contenu dans le conteneur dédié
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content;
    }
    // Ajouter les écouteurs d'événements après avoir rendu le contenu
    this.attachEventListeners();
    console.log("Initialisation du jeu...");
  }
  attachEventListeners() {}
  handleStateChange(newState) {
    // Cette méthode sera appelée à chaque fois que l'état est mis à jour
    // Vous pouvez traiter ici ce que vous souhaitez faire lorsque isGamePage change
    console.log("État mis à jour:", newState);
  }

  render() {
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData);
    return `<div class="d-flex justify-content-center align-items-center h-100"><h1>Game</h1></div>`;
  }
}
