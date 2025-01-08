export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentPage = window.location.pathname; // Garde une référence de la page actuelle

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

  async navigate(path, shouldPushState = true) {
    if (this.currentPath === path) return; // Éviter de naviguer vers la même route

    const view = this.routes[path] || this.routes["/404"];

    if (this.currentPage && typeof this.currentPage.destroy === "function") {
      this.currentPage.destroy();
    }

    this.currentPage = view;
    this.currentPath = path;

    console.log("INITIALISED ? " + view.isInitialized);
    if (typeof view.initialize === "function" && !view.isInitialized) {
      console.log("Appel à initialize pour :", path);
      await view.initialize();
    } else if (typeof view.render === "function") {
      const app = document.getElementById("app");
      if (app) {
        app.innerHTML = view.render();
        console.log("Appel à render pour :", path);
      }
    }
    if (typeof view.attachEventListeners === "function") {
      view.attachEventListeners(); // Appelle attachEventListeners si cette méthode existe
    }
    if (shouldPushState) {
      window.history.pushState({}, "", path);
    }
  }
}
