import { handleHeader } from "../utils";
import { updateView, checkUserStatus } from "../utils";
import { router } from "../app.js";
import { trad } from "../trad.js";

export default class Rules {
  constructor(state) {
    this.pageName = "Rules";
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
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    if (!this.state.state.gameHasLoaded) return;
    else await updateView(this, {});
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
      this.previousState = { ...newState };
      await updateView(this, {});
    } else this.previousState = { ...newState };
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ element, listener, type }) => {
      if (element) {
        element.removeEventListener(type, listener);
      }
    });
    this.eventListeners = [];
  }

  destroy() {
    this.removeEventListeners();
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
    }
  }

  async render(routeParams = {}) {
    await checkUserStatus();

    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    if (this.lang !== this.state.state.lang)
      handleHeader(this.state.isUserLoggedIn, false, true);
    else handleHeader(this.state.isUserLoggedIn, false, false);
    this.lang = this.state.state.lang;
    window.scrollTo(0, 0);
    return `
    <div class="rules-main-div">
		<div class="rules-main-content">
			<div class="rules-main-title">
				<h1>${trad[this.lang].rules.pageTitle}</h1>
			</div>
			<p>${trad[this.lang].rules.rules}</p>
			<div class="controls-main-div">
				<h2>${trad[this.lang].rules.single}</h2>
				<div class="controls-img-div">
					<h4>${trad[this.lang].rules.up}</h4>
					<img src="/up.png" alt="upImg" class="img-up">
					<h4>${trad[this.lang].rules.down}</h4>
					<img src="/down.png" alt="downImg" class="img-down">
				</div>
			</div>
			<div class="controls-main-div">
				<h2>${trad[this.lang].rules.double}</h2>
				<div class="player-div player-div1">
					<h3>${trad[this.lang].rules.leftPlayer}</h3>
					<div class="controls-img-div">
						<h4>${trad[this.lang].rules.up}</h4>
						<img src="/e.png" alt="upImg" class="img-up">
						<h4>${trad[this.lang].rules.down}</h4>
						<img src="/d.png" alt="downImg" class="img-down">
					</div>
				</div>
				<div class="player-div player-div2">
					<h3>${trad[this.lang].rules.rightPlayer}</h3>
					<div class="controls-img-div">
						<h4>${trad[this.lang].rules.up}</h4>
						<img src="/up.png" alt="upImg" class="img-up">
						<h4>${trad[this.lang].rules.down}</h4>
						<img src="/down.png" alt="downImg" class="img-down">
					</div>
				</div>
			</div>
		</div>
    <div>
	`;
  }
}
