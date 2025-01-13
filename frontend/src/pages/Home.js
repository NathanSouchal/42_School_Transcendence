import DOMPurify from "dompurify";
import { resetZIndex } from "/src/utils.js";

export default class Home {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
  }
  async initialize() {
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Home page subscribed to state");
    }
    if (this.isInitialized) return;
    this.isInitialized = true;

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

  handleStateChange(newState) {
    const content = this.render();
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content; // Remplacer le contenu du conteneur
      this.attachEventListeners(); // Réattacher les écouteurs après chaque rendu
    }
  }

  destroy() {
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange); // Nettoyage de l'abonnement
      this.isSubscribed = false;
      console.log("Home page unsubscribed from state");
    }
    resetZIndex();
  }

  render() {
    const userData = this.state.data.username || "";
    const sanitizedData = DOMPurify.sanitize(userData);

    const container = document.createElement("div");
    container.className =
      "d-flex justify-content-center align-items-center h-100";

    const list = document.createElement("ul");
    list.className = "h3 navbar-nav mr-auto mt-2 mb-4 mt-lg-4";

    const links = [
      { href: "/login", text: "Login" },
      { href: "/register", text: "Register" },
      { href: "/account", text: "Account" },
      { href: "/stats", text: "Stats" },
      { href: "/game", text: "Play" },
      { href: "/match-history", text: "MatchHistory" },
    ];

    links.forEach((link) => {
      const listItem = document.createElement("li");
      listItem.className = "nav-item my-2";

      const anchor = document.createElement("a");
      anchor.className = "nav-link";
      anchor.href = link.href;
      anchor.textContent = link.text;

      listItem.appendChild(anchor);
      list.appendChild(listItem);
    });

    container.appendChild(list);
    return container.outerHTML;
  }
}
