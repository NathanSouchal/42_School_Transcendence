import DOMPurify from "dompurify";

export default class GamePage {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false; // Eviter plusieurs abonnements
    this.isInitialized = false;
  }
  async initialize() {
    if (this.isInitialized) return;

    this.isInitialized = true; // Marquer l'initialisation

    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    // Appeler render pour obtenir le contenu HTML
    const content = this.render();

    // Insérer le contenu dans le conteneur dédié
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content;
    }
    console.log("Appel à setIsGamePage depuis GamePage.initialize");
    this.state.setIsGamePage({ isGamePage: true });
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

  destroy() {
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange); // Nettoyage de l'abonnement
      this.isSubscribed = false;
    }
  }

  render() {
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData);
    return `<div class="d-flex justify-content-center align-items-center h-100"><h1>Game</h1></div>`;
  }
}
