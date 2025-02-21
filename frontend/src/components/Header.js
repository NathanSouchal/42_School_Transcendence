import DOMPurify from "dompurify";
import { logout } from "../utils";
import { router } from "../app";
import { trad } from "../trad";

export class Header {
  constructor(state) {
    this.state = state;
    this.isUserRendered = false;
    this.isGuestRendered = false;
    this.eventListeners = [];
    this.lang = null;
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
        logoutButton.addEventListener("click", logout);
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
    this.lang = null;
    const container = document.getElementById("header");
    const toggleButton = document.getElementById("toggle-button-container");
    if (container) container.style.display = "none";
    if (toggleButton) toggleButton.style.display = "none";
  }

  updateLangUserLoggedIn() {
    this.lang = this.state.state.lang;
    const nav = document.getElementById("navbar");
    if (nav) {
      const links = nav.querySelectorAll(".nav-link");
      const paths = [
        "home",
        "play",
        "account",
        "stats",
        "matchHistory",
        "social",
        "logout",
      ];

      links.forEach((link, index) => {
        if (paths[index]) link.innerHTML = trad[this.lang].header[paths[index]];
      });
    }
  }

  renderUserLoggedIn() {
    console.log("renderUserLoggedIn Header");
    this.lang = this.state.state.lang;
    this.isUserRendered = true;
    this.isGuestRendered = false;
    const header = `<nav class="navbar" id="navbar">
                    <ul class="navbar-links global-nav-section">
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/">${trad[this.lang].header.home}</a>
                      </li>
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/game">${trad[this.lang].header.play}</a>
                      </li>
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/account">${trad[this.lang].header.account}</a>
                      </li>
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/stats">${trad[this.lang].header.stats}</a>
                      </li>
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/match-history">${trad[this.lang].header.matchHistory}</a>
                      </li>
                      <li class="navbar-link global-nav-items">
                          <a class="nav-link" href="/social">${trad[this.lang].header.social}</a>
                      </li>
                      <li class="navbar-link">
                        <a><button type="button" class="btn btn-danger mb-2" id="logout-button">
						${trad[this.lang].header.logout}
                        </button></a>
                      </li>
                    </ul>
                    </nav>`;
    const sanitizedData = DOMPurify.sanitize(header);
    const container = document.getElementById("header");
    const toggleButton = document.getElementById("toggle-button-container");
    if (toggleButton) toggleButton.style.display = "block";
    if (container) {
      container.style.display = "block";
      container.innerHTML = sanitizedData;
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }

  updateLangGuestUser() {
    console.log("ici");
    this.lang = this.state.state.lang;
    const nav = document.getElementById("navbar");
    if (nav) {
      const links = nav.querySelectorAll(".nav-link");
      const paths = ["home", "play", "register", "login"];

      links.forEach((link, index) => {
        console.log(trad[this.lang].header[paths[index]]);
        if (paths[index]) link.innerHTML = trad[this.lang].header[paths[index]];
      });
    }
  }

  renderGuestUser() {
    console.log("renderGuestUser Header");
    this.lang = this.state.state.lang;
    this.isUserRendered = false;
    this.isGuestRendered = true;
    const header = `<nav class="navbar">
                    <ul class="global-nav-section navbar-links">
                      <li class="global-nav-items navbar-link">
                          <a class="nav-link" href="/">${trad[this.lang].header.home}</a>
                      </li>
                      <li class="global-nav-items navbar-link">
                          <a class="nav-link" href="/game">${trad[this.lang].header.play}</a>
                      </li>
                      <li class="global-nav-items navbar-link">
                          <a class="nav-link" href="/register">${trad[this.lang].header.register}</a>
                      </li>
                      <li class="global-nav-items navbar-link">
                          <a class="nav-link" href="/login">${trad[this.lang].header.login}</a>
                      </li>
                    </ul>
                    </nav>`;
    const sanitizedData = DOMPurify.sanitize(header);
    const container = document.getElementById("header");
    const toggleButton = document.getElementById("toggle-button-container");
    if (toggleButton) toggleButton.style.display = "block";
    if (container) {
      container.style.display = "block";
      container.innerHTML = sanitizedData;
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }
}
