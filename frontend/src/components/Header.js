import DOMPurify from "dompurify";
import { logout } from "../utils";
import { router } from "../app";

export class Header {
  constructor() {
    this.isUserRendered = false;
    this.isGuestRendered = false;
    this.eventListeners = [];
  }

  attachEventListeners() {
    const naviguateLinks = document.querySelectorAll("a");
    naviguateLinks.forEach((link) => {
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

    const toggleButton = document.getElementsByClassName("toggle-button")[0];
    if (toggleButton) {
      const handleToggleButton = this.handleToggleButton.bind(this);
      if (!this.eventListeners.some((e) => e.name === "toggle-menu")) {
        toggleButton.addEventListener("click", handleToggleButton);
        this.eventListeners.push({
          name: "toggle-menu",
          type: "click",
          element: toggleButton,
          listener: handleToggleButton,
        });
      }
    }

    const links = Array.from(document.querySelectorAll(".navbar-link a"));
    links.forEach((link) => {
      const closeMenu = this.closeMenu.bind(this);
      if (
        !this.eventListeners.some((e) => e.name === `link-${link.innerText}`)
      ) {
        link.addEventListener("click", closeMenu);
        this.eventListeners.push({
          name: `link-${link.innerText}`,
          type: "click",
          element: link,
          listener: closeMenu,
        });
      }
    });

    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      if (!this.eventListeners.some((e) => e.name === "logoutButton")) {
        logoutButton.addEventListener("click", async () => {
          await logout();
        });
        this.eventListeners.push({
          name: "logoutButton",
          type: "click",
          element: logoutButton,
          listener: logout,
        });
      }
    }
  }

  handleNavigation(e) {
    const target = e.target.closest("a");
    if (target && target.href.startsWith(window.location.origin)) {
      e.preventDefault();
      const path = target.getAttribute("href");
      router.navigate(path);
    }
  }

  handleToggleButton() {
    console.log("click burger");
    const toggleButton = document.getElementsByClassName("toggle-button")[0];
    const navbarLinks = document.getElementsByClassName("navbar-links")[0];
    const navBar = document.querySelector(".navbar");
    const header = document.getElementById("header");
    const app = document.getElementById("app");

    if (toggleButton && navBar && navbarLinks && header) {
      const isOpen = navBar.classList.toggle("show-nav");
      navbarLinks.classList.toggle("show-nav");
      if (isOpen) {
        toggleButton.classList.add("open");
        navBar.classList.remove("closed");
        header.style.zIndex = "1";
        app.style.pointerEvents = "none";
      } else {
        this.closeMenu();
      }
    }
  }

  closeMenu() {
    const toggleButton = document.getElementsByClassName("toggle-button")[0];
    const navbarLinks = document.getElementsByClassName("navbar-links")[0];
    const navBar = document.querySelector(".navbar");
    const header = document.getElementById("header");
    const app = document.getElementById("app");

    if (toggleButton && navBar && navbarLinks && header) {
      toggleButton.classList.remove("open");
      navBar.classList.add("closed");
      navbarLinks.classList.remove("show-nav");
      navBar.classList.remove("show-nav");
      app.style.pointerEvents = "auto";
      setTimeout(() => {
        header.style.zIndex = "0";
      }, 500);
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
    const container = document.getElementById("header");
    const toggleButton = document.getElementById("toggle-button-container");
    if (container) container.style.display = "none";
    if (toggleButton) toggleButton.style.display = "none";
  }

  renderUserLoggedIn() {
    console.log("renderUserLoggedIn Header");
    this.isUserRendered = true;
    this.isGuestRendered = false;
    const header = `<nav class="navbar">
                    <ul class="navbar-links global-nav-section">
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/">Home</a>
                      </li>
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/game">Play</a>
                      </li>
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/account">Account</a>
                      </li>
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/stats">Stats</a>
                      </li>
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/match-history">Match History</a>
                      </li>
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/social">Social</a>
                      </li>
                      <li class="navbar-link">
                        <button type="button" class="btn btn-danger mb-2" id="logout-button">
                          Logout
                        </button>
                      </li>
                    </ul>
                    </nav>`;
    const sanitizedData = DOMPurify.sanitize(header);
    const container = document.getElementById("header");
    const toggleButton = document.getElementById("toggle-button-container");
    if (toggleButton) toggleButton.style.display = "block";
    if (container) {
      container.style.display = "block";
      container.innerHTML = sanitizedData; // Insérer le rendu dans le container
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }

  renderGuestUser() {
    // console.log("renderGuestUser Header");
    this.isUserRendered = false;
    this.isGuestRendered = true;
    const header = `<nav class="navbar">
                    <ul class="navbar-links global-nav-section">
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/">Home</a>
                      </li>
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/game">Play</a>
                      </li>
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/register">Register</a>
                      </li>
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/login">Login</a>
                      </li>
                    </ul>
                    </nav>`;
    const sanitizedData = DOMPurify.sanitize(header);
    const container = document.getElementById("header");
    const toggleButton = document.getElementById("toggle-button-container");
    if (toggleButton) toggleButton.style.display = "block";
    if (container) {
      container.style.display = "block";
      container.innerHTML = sanitizedData; // Insérer le rendu dans le container
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }
}
