import DOMPurify from "dompurify";
import { handleHeader } from "../utils";
import { updateView, checkUserStatus } from "../utils";
import { router } from "../app.js";
import { trad } from "../trad.js";

export default class Home {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.eventListeners = [];
    this.lang = null;
  }
  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Home page subscribed to state");
    }
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
    if (
      (newState.gameHasLoaded && !this.previousState.gameHasLoaded) ||
      newState.lang !== this.previousState.lang
    ) {
      console.log("GameHasLoaded state changed, rendering Home page");
      this.previousState = { ...newState };
      await updateView(this);
    } else this.previousState = { ...newState };
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
      throw error;
    }
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Home page subscribed to state");
    }
    this.lang = this.state.state.lang;
    handleHeader(this.state.isUserLoggedIn, false);
    console.log("Home rendered");
    const template = `
    <div class="home-main-div">
      <div class="home-title">
        <h1>PONG</h1>
        <h1>GAME</h1>
      </div>
      <div>
        <div class="global-nav-section">
			<div class="global-nav-items">
				${
          this.state.isUserLoggedIn
            ? `<a class="nav-link" href="/game">${trad[this.lang].home.play}</a>`
            : `<a class="nav-link" href="/login">${trad[this.lang].home.login}</a>
				<a class="nav-link" href="/game">${trad[this.lang].home.guestMode}</a>`
        }
			</div>
        </div>
      </div>
    </div>
	`;
    const sanitizedTemplate = DOMPurify.sanitize(template);
    return sanitizedTemplate;
  }
}
