import API from "../services/api.js";
import {
  handleHeader,
  updateView,
  createBackArrow,
  checkUserStatus,
} from "../utils.js";
import { router } from "../app.js";
import { trad } from "../trad.js";

export default class Social {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false; // Eviter plusieurs abonnements
    this.isInitialized = false;
    this.friends = {};
    this.invitations = {};
    this.eventListeners = [];
    this.search_result = {};
    this.lang = null;
  }

  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Social page subscribed to state");
    }

    if (!this.state.state.gameHasLoaded) return;
    else await updateView(this);
  }

  async getFriends(id) {
    try {
      const res = await API.get(`/friends/list/${id}/`);
      const data = res.data.friend_list;
      this.friends = data;
      console.log(
        "Friends: " +
          Object.entries(this.friends).map(
            ([key, value]) =>
              `${key}: ${Object.entries(value).map(([ky, val]) => `${ky}: ${val}`)}`
          )
      );
    } catch (error) {
      console.error(error);
    }
  }

  async getInvitations(id) {
    try {
      const res = await API.get(`/friend-requests/byuser/${id}/`);
      const data = res.data.pending_friend_requests;
      this.invitations = data;
      console.log(
        "Invitations: " +
          Object.entries(this.invitations).map(
            ([key, value]) =>
              `${key}: ${Object.entries(value).map(([ky, val]) => `${ky}: ${val}`)}`
          )
      );
    } catch (error) {
      console.error(error);
    }
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

    const validate_button = document.getElementById("validate_invit");
    if (
      validate_button &&
      !this.eventListeners.some((e) => e.name === "validate_invit")
    ) {
      const validate_btn_fctn = this.validate_btn_fctn.bind(this);
      validate_button.addEventListener("click", validate_btn_fctn);
      this.eventListeners.push({
        name: "validate_invit",
        type: "click",
        element: validate_button,
        listener: validate_btn_fctn,
      });
    }

    const cancel_button = document.getElementById("cancel_decline_invit");
    if (
      cancel_button &&
      !this.eventListeners.some((e) => e.name === "cancel_decline_invit")
    ) {
      const cancel_btn_fctn = this.cancel_btn_fctn.bind(this);
      cancel_button.addEventListener("click", cancel_btn_fctn);
      this.eventListeners.push({
        name: "cancel_decline_invit",
        type: "click",
        element: cancel_button,
        listener: cancel_btn_fctn,
      });
    }

    const search_bar_user = document.getElementById("search_bar_user");
    if (
      search_bar_user &&
      !this.eventListeners.some((e) => e.name === "search_bar_user")
    ) {
      const search_bar_user_fctn = this.search_bar_user_fctn.bind(this);
      search_bar_user.addEventListener("keydown", search_bar_user_fctn);
      this.eventListeners.push({
        name: "search_bar_user",
        type: "input",
        element: search_bar_user,
        listener: search_bar_user_fctn,
      });
    }
  }

  async validate_btn_fctn(e) {
    const invit_id = e.target.value;
    console.log(invit_id);
    await this.validate_invit_request(invit_id);
  }

  async validate_invit_request(invit_id) {
    try {
      await API.put(`/friend-requests/${invit_id}/`, {
        accepted: "true",
      });
      await updateView(this);
    } catch (error) {
      console.error(`Error while trying to accept friend request : ${error}`);
    }
  }

  async cancel_btn_fctn(e) {
    const invit_id = e.target.value;
    console.log(invit_id);
    await this.cancel_invit_request(invit_id);
  }

  async cancel_invit_request(invit_id) {
    try {
      await API.put(`/friend-requests/${invit_id}/`, {
        accepted: "false",
      });
      await updateView(this);
    } catch (error) {
      console.error(
        `Error while trying to cancel or denie friend request : ${error}`
      );
    }
  }

  async search_bar_user_fctn(e) {
    if (e.key === "Enter") {
      console.log(e.target.value);
      const searchResultDiv = document.getElementById("search_result");
      searchResultDiv.innerHTML = "";
      await this.search_bar_user_request(e.target.value);
    }
  }

  async search_bar_user_request(username_to_search) {
    const res = await API.get(`/user/${username_to_search}/`);
    this.search_result = res.data.user;
    this.updateSearchResult();
    console.log(this.search_result);
  }

  handleNavigation(e) {
    const target = e.target.closest("a");
    if (target && target.href.startsWith(window.location.origin)) {
      e.preventDefault();
      const path = target.getAttribute("href");
      router.navigate(path);
    }
  }

  updateSearchResult() {
    const searchResultDiv = document.getElementById("search_result");
    if (this.search_result.username) {
      searchResultDiv.innerHTML = `
          <a href="/user/${this.search_result.id}/" class="user-search-result-social">
            ${this.search_result.username}
          </a>`;
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }

  async handleStateChange(newState) {
    if (
      (newState.gameHasLoaded && !this.previousState.gameHasLoaded) ||
      newState.lang !== this.previousState.lang
    ) {
      console.log("GameHasLoaded state changed, rendering Social page");
      this.previousState = { ...newState };
      await updateView(this);
    } else this.previousState = { ...newState };
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ element, listener, type }) => {
      if (element) {
        element.removeEventListener(type, listener);
        console.log("Removed ${type} eventListener from input");
      }
    });
    this.eventListeners = [];
  }

  destroy() {
    this.removeEventListeners();
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      console.log("Social page unsubscribed from state");
    }
  }

  async render(userId) {
    try {
      await checkUserStatus();
      await this.getFriends(this.state.state.userId);
      await this.getInvitations(this.state.state.userId);
    } catch (error) {
      console.error(error);
    }
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Social page subscribed to state");
    }
    if (this.lang !== this.state.state.lang)
      handleHeader(this.state.isUserLoggedIn, false, true);
    else handleHeader(this.state.isUserLoggedIn, false, false);
    this.lang = this.state.state.lang;
    const backArrow = createBackArrow(this.state.state.lastRoute);

    if (this.friends && this.invitations) {
      return `
        ${backArrow}
        <div class="main-div-social">
          <h1 class="global-page-title">${trad[this.lang].social.pageTitle}</h1>
          <div class="content-social">
            <div class="search-bar-and-result-social">
              <input type="text" id="search_bar_user" placeholder="${trad[this.lang].social.search}" />
              <div id="search_result"></div>
            </div>
            <div class="friends-and-invitations-social">
              <div class="friends-div-social">
                <h2>${trad[this.lang].social.friends}</h2>
                <div class="friends-list-social">
                  ${
                    Object.keys(this.friends).length > 0
                      ? Object.values(this.friends)
                          .map(
                            (value) => `
                      <div class="friends-item-social">
                        <div class="friends-item-img-username">
                          <img width="50" height="50" src="https://127.0.0.1:8000/${value.avatar}" class="rounded-circle">
                          <a href="/user/${value.id}/">
                            ${value.username}
                          </a>
                        </div>
                        <p>${trad[this.lang].social.online}</p>
                      </div>
                    `
                          )
                          .join("")
                      : `
                    <div>
                      <p>${trad[this.lang].social.noFriends}</p>
                    </div>
                  `
                  }
                </div>
              </div>
              <div class="invitations-div-social">
                <h2>${trad[this.lang].social.requests}</h2>
                <div class="invitations-list-div-social">
                  ${
                    Object.keys(this.invitations).length > 0
                      ? Object.values(this.invitations)
                          .map(
                            (value) => `
                      ${
                        value.from_user.id == this.state.state.userId
                          ? `
                        <div class="invitation-item-social">
                          <a href="/user/${value.to_user.id}/">
                            <div class="invitation-item-img-username">
                              <img width="50" height="50" src="https://127.0.0.1:8000/${value.to_user.avatar}" class="rounded-circle">
                              <p>${value.to_user.username}${trad[this.lang].social.waitingAcceptation}</p>
                            </div>
                          </a>
                          <button class="cancel-button-invitation-social" value="${value.id}" id="cancel_decline_invit">⛌</button>
                        </div>
                      `
                          : `
                        <div class="invitation-item-social">
                          <a href="/user/${value.from_user.id}/">
                            <div class="invitation-item-img-username">
                              <img width="50" height="50" src="https://127.0.0.1:8000/${value.from_user.avatar}" class="rounded-circle">
                              <p>${value.from_user.username}</p>
                            </div>
                          </a>
                          <div class="two-buttons-invitation-social">
                            <button class="validate-button-invitation-social" value="${value.id}" id="validate_invit">✓</button>
                            <button class="cancel-button-invitation-social" value="${value.id}" id="cancel_decline_invit">⛌</button>
                          </div>
                        </div>
                      `
                      }
                    `
                          )
                          .join("")
                      : `
                    <div>
                      <p>${trad[this.lang].social.noInvitation}</p>
                    </div>
                  `
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        ${backArrow}
        <h1>No data</h1>
      `;
    }
  }
}
