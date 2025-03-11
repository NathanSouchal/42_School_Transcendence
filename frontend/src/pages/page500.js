import { handleHeader, updateView } from "../utils.js";
import { router } from "../app.js";
import { trad } from "../trad.js";

export default class page500 {
  constructor(state) {
    this.pageName = "page500";
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.eventListeners = [];
    this.lang = null;
  }
  async initialize(routeParams = {}) {
    await updateView(this, {});
  }

  async handleStateChange(newState) {
    if (
      (newState.gameHasLoaded && !this.previousState.gameHasLoaded) ||
      newState.lang !== this.previousState.lang
    ) {
      await updateView(this, {});
    } else this.previousState = { ...newState };
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
  }

  async render(routeParams = {}) {
    if (!this.isSubscribed) {
		this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    if (this.lang !== this.state.state.lang)
      handleHeader(this.state.isUserLoggedIn, false, true);
    else handleHeader(this.state.isUserLoggedIn, false, false);
    this.lang = this.state.state.lang;
    return `<div class="main-error-container">
				<div class="error-title-container">
				<h1>${trad[this.lang].page500.pageTitle}</h1>
				<h2>${trad[this.lang].page500.message}</h2>
				</div>
				<img src="/error/500.jpg" alt="500img" class="img500">
			</div>`;
  }
}
