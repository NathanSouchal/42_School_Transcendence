import DOMPurify from "dompurify";
import { addCSS, removeCSS } from "../utils";

export class Header {
  constructor() {
    this.isUserRendered = false;
    this.isGuestRendered = false;
    this.eventListeners = [];
    this.cssLink = null;
  }

  attachEventListeners() {
    const toggleButton = document.getElementsByClassName("toggle-button")[0];
    const navbarLinks = document.getElementsByClassName("navbar-links")[0];
    const navBar = document.querySelector(".navbar");
    const header = document.getElementById("header");
    let menuOpen = false;

    if (toggleButton && navBar && navbarLinks && header) {
      const toggleMenu = () => {
        navBar.classList.toggle("show-nav");
        navbarLinks.classList.toggle("show-nav");

        if (!menuOpen) {
          toggleButton.classList.add("open");
          navBar.classList.remove("closed");
          header.style.zIndex = "1";
          menuOpen = true;
        } else {
          toggleButton.classList.remove("open");
          navBar.classList.add("closed");
          header.style.zIndex = "0";
          menuOpen = false;
        }
      };

      if (!this.eventListeners.some((e) => e.name === "toggle-menu")) {
        toggleButton.addEventListener("click", toggleMenu);
        this.eventListeners.push({
          name: "toggle-menu",
          type: "click",
          element: toggleButton,
          listener: toggleMenu,
        });
      }
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
    console.log("Destroying Header");
    this.removeEventListeners();
    this.isUserRendered = false;
    this.isGuestRendered = false;
    removeCSS(this.cssLink);
    const container = document.getElementById("header");
    if (container) container.style.display = "none";
  }

  renderUserLoggedIn() {
    console.log("renderUserLoggedIn Header");
    this.isUserRendered = true;
    this.isGuestRendered = false;
    this.cssLink = addCSS("src/style/header.css");
    const header = `<nav class="navbar">
    <ul class="navbar-links">
  <li class="navbar-link">
      <a class="active" href="/login">Login</a>
  </li>
  <li class="navbar-link">
          <a class="active" href="/register">Register</a>
  </li>
    </ul>
  </nav>`;
    const sanitizedData = DOMPurify.sanitize(header);
    const container = document.getElementById("header");
    if (container) {
      container.style.display = "block";
      container.innerHTML = sanitizedData; // Insérer le rendu dans le container
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }

  renderGuestUser() {
    console.log("renderGuestUser Header");
    this.isUserRendered = false;
    this.isGuestRendered = true;
    this.cssLink = addCSS("src/style/header.css");
    const header = `<nav class="navbar">
    <ul class="navbar-links">
  <li class="navbar-link">
      <a class="active" href="/">Home</a>
  </li>
  <li class="navbar-link">
          <a class="active" href="/social">Social</a>
  </li>
    </ul>
  </nav>`;
    const sanitizedData = DOMPurify.sanitize(header);
    const container = document.getElementById("header");
    if (container) {
      container.style.display = "block";
      container.innerHTML = sanitizedData; // Insérer le rendu dans le container
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }
}
