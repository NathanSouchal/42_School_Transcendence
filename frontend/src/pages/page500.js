import DOMPurify from "dompurify";
import { handleHeader, updateView, createBackArrow } from "../utils.js";
import { router } from "../app.js";

export default class page500 {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.eventListeners = [];
  }
  async initialize(routeParams = {}) {
    await updateView(this);
  }

  async handleStateChange(newState) {
    console.log("NEWGameHasLoaded : " + newState.gameHasLoaded);
    console.log("PREVGameHasLoaded2 : " + this.previousState.gameHasLoaded);
    if (newState.gameHasLoaded && !this.previousState.gameHasLoaded) {
      console.log("GameHasLoaded state changed, rendering 404 page");
      await updateView(this);
    }
    this.previousState = { ...newState };
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
    this.eventListeners.forEach(({ name, element, listener }) => {
      element.removeEventListener(element, listener);
      console.log("Removed eventListener from input");
    });
    this.eventListeners = [];
  }

  destroy() {
    this.removeEventListeners();
  }

  async render(routeParams = {}) {
    handleHeader(this.state.isUserLoggedIn, false);
    const backArrow = createBackArrow(this.state.state.lastLastRoute);
    let template = `${backArrow}<div class="container mt-5">
				<h1 class="text-capitalize w-100 text-center">Error 500</h1>
				<h2 class="text-center mt-4">Internal server error</h2>
			</div>`;
    const sanitizedData = DOMPurify.sanitize(template);
    return sanitizedData;
  }
}
