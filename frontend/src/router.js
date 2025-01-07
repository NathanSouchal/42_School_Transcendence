import { resetZIndex } from "/src/utils.js";

export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentPage = window.location.pathname; // Garde une référence de la page actuelle

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

    window.onpopstate = () => {
      const currentPath = window.location.pathname;
      this.navigate(currentPath);
    };
  }

  async handleRoute() {
    const path = window.location.pathname;
    const view = this.routes[path] || this.routes["/404"];
    console.log("ROUTER.js path : " + path);

    if (this.currentPage === view) {
      console.log("Reste sur la même page, aucune action requise.");
      return;
    }

    if (this.currentPage && typeof this.currentPage.destroy === "function") {
      this.currentPage.destroy(); // Nettoyage de la page précédente
    }

    if (
      this.currentPath === "/game" &&
      path !== "/game" &&
      this.currentPage?.state?.state?.gameStarted
    ) {
      gamePage.state.setGameStarted(false);
      resetZIndex(); // Réinitialiser les z-index si nécessaire
    }

    this.currentPage = view; // Mettez à jour la page actuelle

    console.log("INITIALISED ? " + view.isInitialized);
    if (typeof view.initialize === "function" && !view.isInitialized) {
      await view.initialize(); // L'initialisation inclut généralement le rendu
      console.log("Appel à initialize pour :", path);
    } else if (typeof view.render === "function") {
      const app = document.getElementById("app");
      console.log("Appel à render pour :", path);
      if (app) {
        app.innerHTML = view.render();
      }
    }
    // Attache les écouteurs d'événements après que la vue a été rendue
    if (typeof view.attachEventListeners === "function") {
      view.attachEventListeners(); // Appelle attachEventListeners si cette méthode existe
    }
  }

  async navigate(path) {
    if (this.currentPath === path) return; // Éviter de naviguer vers la même route
    this.currentPath = path;
    if (this.currentPage && typeof this.currentPage.destroy === "function") {
      this.currentPage.destroy();
    }

    const page = this.routes[path] || this.routes["/404"];
    this.currentPage = page;

    console.log("INITIALISED ? " + page.isInitialized);
    if (typeof page.initialize === "function" && !page.isInitialized) {
      console.log("Appel à initialize pour :", path);
      await page.initialize();
    } else if (typeof page.render === "function") {
      const app = document.getElementById("app");
      if (app) {
        app.innerHTML = page.render();
        console.log("Appel à render pour :", path);
      }
    }
    if (typeof page.attachEventListeners === "function") {
      page.attachEventListeners(); // Appelle attachEventListeners si cette méthode existe
    }
    window.history.pushState({}, "", path);
  }
}
