import { logout, setDisable } from "../utils";
import { router } from "../app";
import { trad } from "../trad";

export class Header {
  constructor(state) {
    this.state = state;
    this.isUserRendered = false;
    this.isGuestRendered = false;
    this.eventListeners = [];
    this.lang = null;
    this.isProcessing = false;
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

    const homeButton = document.getElementById("home-img-div");
    if (homeButton) {
      const redirectHome = this.redirectHome.bind(this);
      if (!this.eventListeners.some((e) => e.name === "home-img-div")) {
        homeButton.addEventListener("click", redirectHome);
        this.eventListeners.push({
          name: "home-img-div",
          type: "click",
          element: homeButton,
          listener: redirectHome,
        });
      }
    }

    const links = Array.from(document.querySelectorAll(".navbar-link a"));
    links.forEach((link) => {
      const closeMenu = this.closeMenu.bind(this, "");
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

    const logoutCloseMenu = document.getElementById("logout-button");
    if (logoutCloseMenu) {
      if (!this.eventListeners.some((e) => e.name === "logoutCloseMenu")) {
        const closeMenu = this.closeMenu.bind(this, "logout");
        logoutCloseMenu.addEventListener("click", closeMenu);
        this.eventListeners.push({
          name: "logoutCloseMenu",
          type: "click",
          element: logoutCloseMenu,
          listener: closeMenu,
        });
      }
    }
  }

  handleNavigation(e) {
    const target = e.target.closest("a");
    if (target && target.href.startsWith(window.location.origin)) {
      e.preventDefault();
      const path = target.getAttribute("href");
      if (path === "/") this.redirectHome();
      else router.navigate(path);
    }
  }

  redirectHome() {
    const homeImg = document.getElementById("home-img-div");
    if (homeImg && homeImg.style.opacity) {
      homeImg.style.opacity = 0;
      router.navigate("/");
    }
  }

  async handleToggleButton() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      const toggleButton = document.getElementsByClassName("toggle-button")[0];
      const navbarLinks = document.querySelector(".navbar-links");
      const navBar = document.querySelector(".navbar");
      const header = document.getElementById("header");
      const app = document.getElementById("app");
      const homeImg = document.getElementById("home-img-div");

      if (toggleButton && navBar && navbarLinks && header && homeImg) {
        const isOpen = navBar.classList.toggle("show-nav");
        navbarLinks.classList.toggle("show-nav");

        if (isOpen) {
          toggleButton.classList.add("open");
          navBar.classList.remove("closed");
          header.style.zIndex = "1";
          app.style.pointerEvents = "none";
          homeImg.style.opacity = 0;
          homeImg.style.pointerEvents = "none";
        } else await this.closeMenu();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => {
        this.isProcessing = false;
      }, 500);
    }
  }

  async closeMenu(key) {
    if (key === "logout") setDisable(true, key);

    try {
      const toggleButton = document.getElementsByClassName("toggle-button")[0];
      const navbarLinks = document.querySelector(".navbar-links");
      const navBar = document.querySelector(".navbar");
      const header = document.getElementById("header");
      const app = document.getElementById("app");
      const homeImg = document.getElementById("home-img-div");

      if (toggleButton && navBar && navbarLinks && header && homeImg) {
        toggleButton.classList.remove("open");
        if (window.location.pathname !== "/") {
          homeImg.style.opacity = 1;
          homeImg.style.pointerEvents = "auto";
        }
        navBar.classList.add("closed");
        navbarLinks.classList.remove("show-nav");
        navBar.classList.remove("show-nav");
        app.style.pointerEvents = "auto";
        setTimeout(() => {
          header.style.zIndex = "0";
        }, 500);
        if (key === "logout") await logout();
      }
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      if (key === "logout") setDisable(false, key);
    }
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
      ];

      links.forEach((link, index) => {
        if (index < paths.length && paths[index])
          link.innerHTML = trad[this.lang].header[paths[index]];
      });
    }
    const logoutBtn = document.getElementById("logout-button");
    if (logoutBtn) logoutBtn.innerHTML = trad[this.lang].header.logout;
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
                        <button type="button" class="btn btn-danger mb-2" id="logout-button">
						${trad[this.lang].header.logout}
                        </button>
                      </li>
                    </ul>
                    </nav>`;
    const container = document.getElementById("header");
    const toggleButton = document.getElementById("toggle-button-container");
    if (toggleButton) toggleButton.style.display = "block";
    if (container) {
      container.style.display = "block";
      container.innerHTML = header;
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }

  updateLangGuestUser() {
    this.lang = this.state.state.lang;
    const nav = document.getElementById("navbar");
    if (nav) {
      const links = nav.querySelectorAll(".nav-link");
      const paths = ["home", "play", "register", "login"];

      links.forEach((link, index) => {
        if (index < paths.length && paths[index]) {
          link.innerHTML = trad[this.lang].header[paths[index]];
        }
      });
    }
  }

  renderGuestUser() {
    console.log("renderGuestUser Header");
    this.lang = this.state.state.lang;
    this.isUserRendered = false;
    this.isGuestRendered = true;
    const header = `<nav class="navbar" id="navbar">
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
    const container = document.getElementById("header");
    const toggleButton = document.getElementById("toggle-button-container");
    if (toggleButton) toggleButton.style.display = "block";
    if (container) {
      container.style.display = "block";
      container.innerHTML = header;
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }
}
