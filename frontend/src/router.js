import state from "./app";
import { updateView } from "./utils";

export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentPage = window.location.pathname; // Garde une référence de la page actuelle
    this.routeParams = {};

    // Bind this.navigate pour qu'il conserve le contexte de l'instance
    this.navigate = this.navigate.bind(this);

    window.onpopstate = () => {
      const currentPath = window.location.pathname;
      this.navigate(currentPath, false);
    };

    // Charge la route initiale
    // if (this.currentPath !== window.location.pathname) {
    //   this.navigate(this.currentPath, false);
    // }
    if (!history.state) {
      this.navigate(this.currentPage, false);
    }
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
    if (this.currentPath === path) return; // Éviter de naviguer vers la même route
    console.log("Navigating to:", path); // Log ajouté pour vérifier l'appel

    state.state.lastRoute = this.currentPath;
    const view = this.matchRoute(path) || this.routes["/404"];

    if (this.currentPage && typeof this.currentPage.destroy === "function") {
      this.currentPage.destroy();
    }

    this.currentPage = view;
    this.currentPath = path;

    if (
      typeof view.initialize === "function" &&
      !view.isInitialized &&
      !view.isRouteId
    ) {
      await view.initialize(this.routeParams || {});
    } else if (typeof view.render === "function") {
      await updateView(view, this.routeParams || {});
    }

    if (shouldPushState) {
      if (history.state) {
        window.history.pushState({}, "", path);
      } else {
        window.history.replaceState({}, "", path);
      }
    }
  }
}
