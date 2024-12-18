export class Router {
  constructor(routes) {
    this.routes = routes;

    // Bind this.navigate pour qu'il conserve le contexte de l'instance
    this.navigate = this.navigate.bind(this);

    // Attache les gestionnaires d'événements
    window.addEventListener("popstate", this.handleRoute.bind(this));

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

  handleRoute() {
    const path = window.location.pathname;
    const view = this.routes[path] || this.routes["/404"];
    document.getElementById("app").innerHTML = view.render();
    // Attache les écouteurs d'événements après que la vue a été rendue
    if (typeof view.attachEventListeners === "function") {
      view.attachEventListeners(); // Appelle attachEventListeners si cette méthode existe
    }
  }

  navigate(path) {
    window.history.pushState({}, "", path);
    this.handleRoute();
  }
}
