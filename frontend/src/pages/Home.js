import DOMPurify from "dompurify";
import { handleHeader } from "../utils";
import API from "../services/api.js";
import { updateView, checkUserStatus } from "../utils";
import { router } from "../app.js";

export default class Home {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.eventListeners = [];
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
    console.log("PREVGameHasLoaded1 : " + this.previousState.gameHasLoaded);
    if (!this.state.state.gameHasLoaded) return;
    else await updateView(this);
  }

  attachEventListeners() {
    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      if (!this.eventListeners.some((e) => e.element === link)) {
        const handleNavigation = this.handleNavigation.bind(this);
        link.addEventListener("click", handleNavigation);
        this.eventListeners.push({
          name: link.getAttribute("href") || "unknown-link",
          type: "click",
          element: link,
          listener: handleNavigation,
        });
      }
    });
  }

  handleNavigation(e) {
    const target = e.target.closest("a");
    if (target && target.href.startsWith(window.location.origin)) {
      e.preventDefault();
      const path = target.getAttribute("href");
      router.navigate(path);
    }
  }

  async handleStateChange(newState) {
    console.log("NEWGameHasLoaded : " + newState.gameHasLoaded);
    console.log("PREVGameHasLoaded2 : " + this.previousState.gameHasLoaded);
    if (newState.gameHasLoaded && !this.previousState.gameHasLoaded) {
      console.log("GameHasLoaded state changed, rendering Home page");
      await updateView(this);
    }
    this.previousState = { ...newState };
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ element, listener, type }) => {
      if (element) {
        element.removeEventListener(type, listener);
        console.log(`Removed ${type} eventListener from input`);
      }
    });
    this.eventListeners = [];
  }

  destroy() {
    this.removeEventListeners();
    console.log("Home destroy");
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      console.log("Home page unsubscribed from state");
    }
  }

  async render(routeParams = {}) {
    try {
      await checkUserStatus();
    } catch (error) {
      console.error(error);
    }
    handleHeader(this.state.isUserLoggedIn, false);
    console.log("Home rendered");
    const container = document.getElementById("app");
    if (container) container.className = "app";
    const { id } = routeParams;
    let links;
    if (this.state.isUserLoggedIn) {
      links = [
        { href: "/game", text: "Play" },
        // { href: "/user/1", text: "User 1" },
        // { href: "/user/2", text: "User 2" },
        // { href: "/user/3", text: "User 3" },
        // { href: "/user/200", text: "User 200" },
      ];
    } else {
      links = [
        { href: "/login", text: "Login" },
        { href: "/game", text: "Guest Mode" },
        { href: "/user/200", text: "User 200" },
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
                `<div class="global-nav-items"><a class="nav-link" href="${link.href}">${link.text}</a></div>`
            )
            .join("")}
        </div>
      </div>
    </div>
	`;
  }
}
