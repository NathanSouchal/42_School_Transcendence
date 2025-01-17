import state from "../app.js";

export default class LoadingPage {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.currentPercentage = 0;
  }

  async initialize(routeParams = {}) {
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Loading page subscribed to state");
    }
    if (this.isInitialized) return;
    this.isInitialized = true;

    const content = this.render();
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content;
    }
  }

  handleStateChange(newState) {
    const content = this.render();
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content; // Remplacer le contenu du conteneur
      // this.attachEventListeners(); // Réattacher les écouteurs après chaque rendu
    }
    if (state.state.gameLoadPercentage !== this.currentPercentage) {
      this.currentPercentage = state.state.gameLoadPercentage;
      this.render();
    }
    if (state.state.gameHasLoaded === true) {
      this.destroy();
      return;
    }
  }

  destroy() {
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange); // Nettoyage de l'abonnement
      this.isSubscribed = false;
      console.log("Home page unsubscribed from state");
    }
  }

  render(routeParams = {}) {
    const percentage = state.state.gameLoadPercentage || 0;
    const loadingContainer = document.createElement("div");
    loadingContainer.className = "loading-container text-center mb-4";

    const progressBarOuter = document.createElement("div");
    progressBarOuter.className = "progress";
    progressBarOuter.style.height = "20px";
    progressBarOuter.style.width = "300px";
    progressBarOuter.style.backgroundColor = "#f0f0f0";
    progressBarOuter.style.borderRadius = "10px";
    progressBarOuter.style.overflow = "hidden";
    progressBarOuter.style.margin = "10px auto";

    const progressBarInner = document.createElement("div");
    progressBarInner.className = "progress-bar";
    progressBarInner.style.width = `${percentage}%`;
    progressBarInner.style.height = "100%";
    progressBarInner.style.backgroundColor = "#007bff";
    progressBarInner.style.transition = "width 0.3s ease-in-out";

    const loadingText = document.createElement("div");
    loadingText.className = "loading-text";
    loadingText.textContent = `Loading game... ${Math.round(percentage)}%`;

    progressBarOuter.appendChild(progressBarInner);
    loadingContainer.appendChild(loadingText);
    loadingContainer.appendChild(progressBarOuter);

    return loadingContainer.outerHTML;
  }
}
