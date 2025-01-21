import { resetZIndex } from "/src/utils.js";
import { createBackArrow } from "../components/backArrow.js";

export default class User {
  constructor(state) {
    this.state = state;
    this.pageId = null;
    this.isInitialized = false;
    this.isSubscribed = false;
    this.eventListeners = [];
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("User page subscribed to state");
    }

    this.pageId = routeParams.id;

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
      console.log("GameHasLoaded state changed, rendering User page");
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
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange); // Nettoyage de l'abonnement
      this.isSubscribed = false;
      console.log("User page unsubscribed from state");
    }
  }

  render(routeParams = {}) {
    const { id } = routeParams;
    const backArrow = createBackArrow(this.state.state.lastRoute);
    return `${backArrow}
        <div>
          <h1>Page ID: ${this.pageId || id}</h1>
          <p>Ceci est une page dynamique avec l'ID : ${this.pageId || id}</p>
        </div>
      `;
  }
}
