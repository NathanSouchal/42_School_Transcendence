import DOMPurify from "dompurify";
import { resetZIndex } from "/src/utils.js";
import { handleHeader } from "../utils";

export default class Home {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
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
    this.removeEventListeners();
    console.log("Home destroy");
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      console.log("Home page unsubscribed from state");
    }
  }

  render(routeParams = {}) {
    handleHeader(this.state.isUserLoggedIn, false);
    console.log("Home rendered");
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
        { href: "/game", text: "Play" },
        { href: "/login", text: "Login" },
        { href: "/register", text: "Register" },
        { href: "/user/1", text: "User 1" },
        { href: "/user/2", text: "User 2" },
        { href: "/user/3", text: "User 3" },
        { href: "/user/200", text: "User 200" },
      ];
    }
    return `
	<div class="d-flex justify-content-center align-items-center h-100">
		<ul class="h3 navbar-nav mr-auto mt-2 mb-4 mt-lg-4">
			${links
        .map(
          (link) =>
            `<li class="nav-item my-2"><a class="nav-link" href="${link.href}">${link.text}</a></li>`
        )
        .join("")}
		</ul>
	</div>`;
  }
}
