import DOMPurify from "dompurify";
import { resetZIndex } from "/src/utils.js";
import state from "../app.js";
import {addCSS, removeCSS} from "../utils";

export default class Home {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.cssLink;
  }
  async initialize(routeParams = {}) {
    console.log("Home initialized");
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Home page subscribed to state");
    }
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.state.state.gameHasLoaded) return;
    else {
      const content = this.render();
      const container = document.getElementById("app");
      if (container) {
        container.innerHTML = content;
        this.removeEventListeners();
        this.attachEventListeners();
      }
    }
  }

  attachEventListeners() {}

  handleStateChange(newState) {
    console.log("GameHasLoaded : " + newState.gameHasLoaded);
    if (newState.gameHasLoaded) {
      console.log("GameHasLoaded state changed, rendering Home page");
      const content = this.render();
      const container = document.getElementById("app");
      if (container) {
        container.innerHTML = content;
        this.removeEventListeners();
        this.attachEventListeners();
      }
    }
  }

  removeEventListeners() {}

  destroy() {
    console.log("Home destroy");
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      console.log("Home page unsubscribed from state");
    }
    removeCSS(this.cssLink);
  }

  render(routeParams = {}) {
    console.log("Home rendered");
    this.cssLink = addCSS("src/style/home.css");
    const { id } = routeParams;
    let links;
    if (this.state.isUserLoggedIn) {
      links = [
        { href: "/game", text: "Play" },
        { href: "/account", text: "Account" },
        { href: "/stats", text: "Stats" },
        { href: "/match-history", text: "MatchHistory" },
        { href: "/social", text: "Social" },
        { href: "/user/1", text: "User 1" },
        { href: "/user/2", text: "User 2" },
        { href: "/user/3", text: "User 3" },
        { href: "/user/200", text: "User 200" },
      ];
    } else {
      links = [
        { href: "/login", text: "Login" },
        { href: "/game", text: "Guest Mode" },
      ];
    }
    return `
    <div class="home-main-div">
      <div class="home-title">
        <h1>PONG</h1>
        <h1>GAME</h1>
      </div>
      <div>
        <div class="global-nav-section">
          ${links
            .map(
              (link) =>
                `<div  class="global-nav-items"><a class="nav-link" href="${link.href}">${link.text}</a></div>`
            )
            .join("")}
        </div>
      </div>
    </div>
	`;
  }
}
