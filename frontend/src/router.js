import state from "./app";

export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentPage = window.location.pathname; // Garde une référence de la page actuelle
    this.routeParams = {};

    // Bind this.navigate pour qu'il conserve le contexte de l'instance
    this.navigate = this.navigate.bind(this);

    window.onpopstate = () => {
      const currentPath = window.location.pathname;
      this.navigate(currentPath);
    };
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
    this.navigate(this.currentPath, false);
  }

  matchRoute(path) {
    for (const route in this.routes) {
      // Remplace les segments dynamiques (e.g., :id) par une expression régulière
      const regex = new RegExp(
        `^${route.replace(/:\w+/g, "([^/]+)").replace(/\/$/, "")}\/?$`
      );
      const match = path.match(regex);
      if (match) {
        // Extrait les noms des paramètres dynamiques
        const keys = (route.match(/:(\w+)/g) || []).map((key) =>
          key.substring(1)
        );
        const values = match.slice(1);
        this.routeParams = keys.reduce(
          (params, key, index) => ({ ...params, [key]: values[index] }),
          {}
        );
        return this.routes[route]; // Retourne la vue correspondante
      }
    }
    return null; // Aucun match trouvé
  }

  async navigate(path, shouldPushState = true) {
    console.log("Navigating to:", path); // Log ajouté pour vérifier l'appel
    if (this.currentPath === path) return; // Éviter de naviguer vers la même route

    state.state.lastRoute = this.currentPath;
    const view = this.matchRoute(path) || this.routes["/404"];

    if (this.currentPage && typeof this.currentPage.destroy === "function") {
      this.currentPage.destroy();
    }

    this.currentPage = view;
    this.currentPath = path;

    if (typeof view.initialize === "function" && !view.isInitialized) {
      await view.initialize(this.routeParams || {});
    } else if (typeof view.render === "function") {
      const app = document.getElementById("app");
      if (app) {
        app.innerHTML = view.render(this.routeParams || {});
        console.log("Appel à render pour :", path);
        if (typeof view.attachEventListeners === "function") {
          view.attachEventListeners(); // Appelle attachEventListeners si cette méthode existe
        }
      }
    }

    if (shouldPushState) {
      window.history.pushState({}, "", path);
    }
  }
}
