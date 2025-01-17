import { resetZIndex } from "/src/utils.js";

export default class User {
  constructor(state) {
    this.state = state;
    this.pageId = null;
    this.isInitialized = false;
    this.isSubscribed = false;
    this.eventListeners = [];
  }

  async initialize(routeParams = {}) {
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("User page subscribed to state");
    }
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.pageId = routeParams.id;
    resetZIndex();
    this.render();
  }

  attachEventListeners() {}

  handleStateChange(newState) {}

  removeEventListeners() {}

  destroy() {
    this.removeEventListeners();
  }

  render(routeParams = {}) {
    const { id } = routeParams;
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = `
        <div>
          <h1>Page ID: ${this.pageId || id}</h1>
          <p>Ceci est une page dynamique avec l'ID : ${this.pageId || id}</p>
        </div>
      `;
    }
  }
}
