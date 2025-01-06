import { Router } from "./router.js";
import Home from "./pages/Home.js";
import Login from "./pages/Login.js";
import Account from "./pages/Account.js";
import Game from "./pages/Game.js";
import Register from "./pages/Register.js";
import page404 from "./pages/page404.js";
import { State } from "./services/state.js";

const state = new State();

const routes = {
  "/": new Home(state),
  "/account": new Account(state),
  "/login": new Login(state),
  "/register": new Register(state),
  "/game": new Game(state),
  "/404": new page404(state),
};

const router = new Router(routes);

router.navigate = async function (path) {
  const page = this.routes[path] || this.routes["/404"];

  if (typeof page.initialize === "function") {
    await page.initialize();
  } else if (typeof page.render === "function") {
    page.render();
  }

  window.history.pushState({}, "", path);

  window.onpopstate = () => {
    const currentPath = window.location.pathname;
    this.navigate(currentPath);
  };
};

// Gestion des clics sur les liens
document.addEventListener("click", (event) => {
  const target = event.target.closest("a");
  if (target && target.href.startsWith(window.location.origin)) {
    event.preventDefault();
    const path = target.getAttribute("href");
    router.navigate(path);
  }
});

// Exemple d'utilisation de l'état
state.subscribe((data) => {
  console.log("État mis à jour:", data);
});

// Exposez le router et l'état globalement si nécessaire
window.app = { router, state };

// Charger la route initiale
router.navigate(window.location.pathname);
