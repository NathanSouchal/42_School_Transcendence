import API from "../services/api.js";
import {
  handleHeader,
  updateView,
  createBackArrow,
  checkUserStatus,
} from "../utils.js";
import { router } from "../app.js";

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
    if (validate_button) {
      const validate_btn_fctn = this.validate_btn_fctn.bind(this);
      if (!this.eventListeners.some((e) => e.name === "validate_invit")) {
        validate_button.addEventListener("click", async (e) => {
          await validate_btn_fctn(e.target.value);
        });
      }
      this.eventListeners.push({
        name: "validate_invit",
        type: "click",
        element: validate_button,
        listener: validate_btn_fctn,
      });
    }

    const cancel_button = document.getElementById("cancel_decline_invit");
    if (cancel_button) {
      const cancel_btn_fctn = this.cancel_btn_fctn.bind(this);
      if (!this.eventListeners.some((e) => e.name === "cancel_decline_invit")) {
        cancel_button.addEventListener("click", async (e) => {
          await cancel_btn_fctn(e.target.value);
        });
      }
      this.eventListeners.push({
        name: "cancel_decline_invit",
        type: "click",
        element: cancel_button,
        listener: cancel_btn_fctn,
      });
    }

    const search_bar_user = document.getElementById("search_bar_user");
    if (search_bar_user) {
      const search_bar_user_fctn = this.search_bar_user_fctn.bind(this);
      if (!this.eventListeners.some((e) => e.name === "search_bar_user")) {
        search_bar_user.addEventListener("keydown", async (e) => {
          if (e.key === "Enter") {
            await search_bar_user_fctn(e.target.value);
          }
        });
      }
      this.eventListeners.push({
        name: "search_bar_user",
        type: "input",
        element: search_bar_user,
        listener: search_bar_user_fctn,
      });
    }
  }

  async validate_btn_fctn(invit_id) {
    console.log(invit_id);
    await this.validate_invit_request(invit_id);
  }

  async validate_invit_request(invit_id) {
    const res = await API.put(`/friend-requests/${invit_id}/`, {
      accepted: "true",
    });
  }

  async cancel_btn_fctn(invit_id) {
    console.log(invit_id);
    await this.cancel_invit_request(invit_id);
  }

  async cancel_invit_request(invit_id) {
    const res = await API.put(`/friend-requests/${invit_id}/`, {
      accepted: "false",
    });
  }

  async search_bar_user_fctn(username_to_search) {
    console.log(username_to_search);
    const searchResultDiv = document.getElementById("search_result");
    searchResultDiv.innerHTML = "";
    await this.search_bar_user_request(username_to_search);
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
    }
  }

  async handleStateChange(newState) {
    console.log("NEWGameHasLoaded : " + newState.gameHasLoaded);
    console.log("PREVGameHasLoaded2 : " + this.previousState.gameHasLoaded);
    if (newState.gameHasLoaded && !this.previousState.gameHasLoaded) {
      console.log("GameHasLoaded state changed, rendering Social page");
      await updateView(this);
    }
    this.previousState = { ...newState };
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
    handleHeader(this.state.isUserLoggedIn, false);
    try {
      await checkUserStatus();
      await this.getFriends(this.state.state.userId);
      await this.getInvitations(this.state.state.userId);
    } catch (error) {
      if (error.response.status === 401) return "";
      if (error.response.status === 404) {
        router.navigate("/404");
        return;
      }
    }
    const backArrow = createBackArrow(this.state.state.lastRoute);
    if (this.friends && this.invitations) {
      return `${backArrow}<div class="main-div-social">
                <h1>Social</h1>
                <div class="content-social">
                  <div class="search-bar-and-result-social">
                    <input type="text" id="search_bar_user" placeholder="Search..." />
                    <div id="search_result"></div>
                  </div>
                  <div class="friends-div-social">
                    <h2>FRIENDS</h2>
                    ${
                      Object.keys(this.friends).length > 0
                        ? `
                      ${Object.values(this.friends)
                        .map(
                          (value) =>
                            `<div class="friends-list-social">
                                <a href="/user/${this.search_result.id}/">${value.username}</a>
                            </div>`
                        )
                        .join("")} `
                        : `<div>
                            <p>zero friend, sniff sniff</p>
                          </div>`
                    }
                  </div>
                  <div class="invitations-div-social">
                    <h2>INVITATIONS</h2>
                    ${
                      Object.keys(this.invitations).length > 0
                        ? `
                      ${Object.values(this.invitations)
                        .map(
                          (value) =>
                            `<div class="invitations-list-div-social">
                                ${
                                  value.from_user.id == this.state.state.userId
                                    ? `<p>To ${value.to_user.username}, waiting for acceptation...</p>`
                                    : `<div>
                                    <p>From ${value.from_user.username}</p>
                                    <button class="btn border-0 bg-transparent" value="${value.id}" id="validate_invit">V</button>
                                  </div>`
                                }
                                <button class="btn border-0 bg-transparent" value="${value.id}" id="cancel_decline_invit">X</button>
                            </div>`
                        )
                        .join("")}`
                        : `
                      <h4>no pending invitations</h4>`
                    }
                  </div>
                </div>
              </div>`;
    } else {
      return `<h1>No data</h1>`;
    }
  }
}
