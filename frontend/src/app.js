import { Router } from "./router.js";
import Home from "./pages/Home.js";
import Login from "./pages/Login.js";
import Account from "./pages/Account.js";
import GamePage from "./pages/Game.js";
import Register from "./pages/Register.js";
import Stats from "./pages/Stats.js";
import User from "./pages/User.js";
import State from "./services/state.js";
import MatchHistory from "./pages/MatchHistory.js";
import Social from "./pages/Social.js";
import LocalTournament from "./pages/LocalTournament.js";
import Rules from "./pages/Rules.js";
import page404 from "./pages/page404.js";
import page500 from "./pages/page500.js";
import { Header } from "./components/Header.js";
import { Lang } from "./components/Lang.js";

const state = new State();
export default state;

const header = new Header(state);
export { header };

new Lang(state);

const routes = {
  "/": new Home(state),
  "/account": new Account(state),
  "/login": new Login(state),
  "/register": new Register(state),
  "/game": new GamePage(state),
  "/stats": new Stats(state),
  "/match-history": new MatchHistory(state),
  "/social": new Social(state),
  "/local-tournament": new LocalTournament(state),
  "/user/:id/": new User(state),
  "/rules": new Rules(state),
  "/404": new page404(state),
  "/500": new page500(state),
};

const router = new Router(routes);
export { router };

// Exposez le router et l'état globalement si nécessaire
window.app = { router, state };

// Charger la route initiale
router.navigate(window.location.pathname);
