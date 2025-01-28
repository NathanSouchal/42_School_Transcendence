import { addCSS, removeCSS } from "../utils";

export class Header {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.eventListeners = [];
    this.cssLink = null;
  }

  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Header component subscribed to state");
    }
    this.cssLink = addCSS("src/style/header.css");
    const content = this.render();
    const container = document.getElementById("header");
    if (container) {
      container.innerHTML = content;
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }

  show() {
    const container = document.getElementById("header");
    if (container) {
      container.style.display = "block";
    }
  }

  hide() {
    const container = document.getElementById("header");
    if (container) {
      container.style.display = "none";
    }
  }

  attachEventListeners() {
    const toggleButton = document.getElementsByClassName("toggle-button")[0];
    const navbarLinks = document.getElementsByClassName("navbar-links")[0];
    const navBar = document.querySelector(".navbar");
    let menuOpen = false;

    toggleButton.addEventListener("click", () => {
      navBar.classList.toggle("show-nav");
      navbarLinks.classList.toggle("show-nav");
      if (!menuOpen) {
        toggleButton.classList.add("open");
        menuOpen = true;
      } else {
        toggleButton.classList.remove("open");
        menuOpen = false;
      }
    });
  }

  handleStateChange(newState) {}

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
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      console.log("Header component unsubscribed from state");
      removeCSS(this.cssLink);
    }
  }

  render() {
    const header = `<nav class="navbar">
		<a href="#" class="toggle-button">
          <span class="bar2"></span>
        </a>
        <ul class="navbar-links">
			<li class="navbar-link">
		  		<a class="active" href="/login">Login</a>
			</li>
			<li class="navbar-link">
            	<a class="active" href="/register">Register</a>
			</li>
        </ul>
      </nav>`;
    return header;
  }
}
