export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentPage = null; // Garde une référence de la page actuelle

    // Bind this.navigate pour qu'il conserve le contexte de l'instance
    this.navigate = this.navigate.bind(this);

    // Attache les gestionnaires d'événements
    window.addEventListener("popstate", () => {
      this.handleRoute.bind(this);
    });

    // Gère les clics sur les liens
    document.addEventListener("click", (e) => {
      if (
        (e.target.tagName === "A" && e.target.classList.contains("nav-link")) ||
        e.target.classList.contains("link")
      ) {
        e.preventDefault();
        const path = e.target.getAttribute("href");
        this.navigate(path); // Maintenant, navigate est correctement lié
      }
    });

    // Charge la route initiale
    this.handleRoute();
  }

  updateZIndex() {
    const canvas = document.querySelector("#c"); // Récupère le canvas par son id
    const app = document.querySelector("main#app"); // Récupère le main par son id

    if (canvas && app) {
      if (window.location.pathname === "/game") {
        // Si on est sur la page /game, mettre le canvas au-dessus
        canvas.style.zIndex = "1"; // Canvas au-dessus de main
        app.style.zIndex = "0"; // Main en dessous
      } else {
        // Sinon, mettre main au-dessus du canvas
        canvas.style.zIndex = "0"; // Canvas en dessous
        app.style.zIndex = "1"; // Main au-dessus du canvas
      }
    }
  }

  handleRoute() {
    const path = window.location.pathname;
    const view = this.routes[path] || this.routes["/404"];

    if (this.currentPage && typeof this.currentPage.destroy === "function") {
      this.currentPage.destroy(); // Nettoyage de la page précédente
    }
    console.log("Appel à initialize pour :", path);
    this.currentPage = view; // Mettez à jour la page actuelle

    if (typeof view.initialize === "function" && !view.isInitialized) {
      view.initialize(); // L'initialisation inclut généralement le rendu
    } else if (typeof view.render === "function") {
      const app = document.getElementById("app");
      if (app) {
        app.innerHTML = view.render();
      }
    }

    // Attache les écouteurs d'événements après que la vue a été rendue
    if (typeof view.attachEventListeners === "function") {
      view.attachEventListeners(); // Appelle attachEventListeners si cette méthode existe
    }
  }

  navigate(path) {
    if (this.currentPath === path) return; // Éviter de naviguer vers la même route
    this.currentPath = path;
    window.history.pushState({}, "", path);
    this.handleRoute();
  }
}
