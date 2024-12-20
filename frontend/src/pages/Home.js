import DOMPurify from "dompurify";
import { resetZIndex } from "/src/utils.js";

export default class Home {
  constructor(state) {
    this.state = state;
  }
  async initialize() {
    resetZIndex();
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
    const test = "Accueil";
    const sanitizedData = DOMPurify.sanitize(userData);
    return `<div class="d-flex justify-content-center align-items-center h-100"><h1>${test}</h1></div>`;
  }
}
