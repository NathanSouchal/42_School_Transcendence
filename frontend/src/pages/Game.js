import DOMPurify from "dompurify";

export default class Game {
  constructor(state) {
    this.state = state;
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
  }
  attachEventListeners() {}
  render() {
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData);
    return `<div class="d-flex justify-content-center align-items-center h-100"><h1>Game</h1></div>`;
  }
}
