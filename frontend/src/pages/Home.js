import DOMPurify from "dompurify";

export default class Home {
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
    const test = "Accueil";
    const sanitizedData = DOMPurify.sanitize(userData);
    return `<div class="container mt-5"><h1>${test}</h1></div>`;
  }
}
