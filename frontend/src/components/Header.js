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

  initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Header component subscribed to state");
    }
    this.updateHeader();
  }

  updateHeader() {
    const content = this.render();
    const container = document.getElementById("header");
    if (container) {
      container.innerHTML = content; // Insérer le rendu dans le container
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }

  attachEventListeners() {
    const toggleButton = document.getElementsByClassName("toggle-button")[0];
    const navbarLinks = document.getElementsByClassName("navbar-links")[0];
    const navBar = document.querySelector(".navbar");
    let menuOpen = false;

    toggleButton.addEventListener("click", () => {
      // Basculez la classe show-nav pour ouvrir/fermer le menu
      navBar.classList.toggle("show-nav");
      navbarLinks.classList.toggle("show-nav");

      // Ajouter/retirer la classe 'closed' pour réduire la navbar quand elle est fermée
      if (!menuOpen) {
        toggleButton.classList.add("open");
        navBar.classList.remove("closed"); // Agrandir la navbar
        menuOpen = true;
      } else {
        toggleButton.classList.remove("open");
        navBar.classList.add("closed"); // Réduire la navbar
        menuOpen = false;
      }
    });
  }

  handleStateChange(newState) {
    if (this.state.isUserLoggedIn != newState.isUserLoggedIn) {
      this.updateHeader();
    }
    this.state = newState;
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
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      console.log("Header component unsubscribed from state");
    }
    this.removeCSS(this.cssLink);
  }

  render() {
    this.cssLink = addCSS("src/style/header.css");
    const header = `${
      this.state.isUserLoggedIn
        ? `<div class="toggle-button">
          <span class="bar2"></span>
        </div><nav class="navbar">

        <ul class="navbar-links">
			<li class="navbar-link">
		  		<a class="active" href="/login">Login</a>
			</li>
			<li class="navbar-link">
            	<a class="active" href="/register">Register</a>
			</li>
        </ul>
      </nav>`
        : `<nav class="navbar">
	  <div class="toggle-button">
		<span class="bar2"></span>
	  </div>
	  <ul class="navbar-links">
		  <li class="navbar-link">
				<a class="active" href="/social">Social</a>
		  </li>
		  <li class="navbar-link">
			  <a class="active" href="/">Home</a>
		  </li>
	  </ul>
	</nav>`
    }`;
    return header;
  }
}
