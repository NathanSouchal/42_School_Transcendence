import API from "../services/api.js";
import { handleHeader } from "../utils.js";

export default class Social {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false; // Eviter plusieurs abonnements
    this.isInitialized = false;
    this.friends = {};
    this.invitations = {};
    this.eventListeners = [];
    this.search_result = {};
    this.userId;
  }

  async initialize() {
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Social page subscribed to state");
    }
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.userId = Number(localStorage.getItem("id"));
    if (this.userId) {
      await this.getFriends(this.userId);
      await this.getInvitations(this.userId);
    }
    // Appeler render pour obtenir le contenu HTML
    const content = this.render();
    // Insérer le contenu dans le conteneur dédié
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content;
    }
    // Ajouter les écouteurs d'événements après avoir rendu le contenu
    this.attachEventListeners();
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

  updateSearchResult() {
    const searchResultDiv = document.getElementById("search_result");
    if (this.search_result.username) {
      searchResultDiv.innerHTML = `
          <a href="/user/${this.search_result.id}/" class="user-search-result-social">
            ${this.search_result.username}
          </a>`;
    }
  }

  handleStateChange(newState) {
    console.log("GameHasLoaded : " + newState.gameHasLoaded);
    if (newState.gameHasLoaded) {
      console.log("GameHasLoaded state changed, rendering Social page");
      const content = this.render();
      const container = document.getElementById("app");
      if (container) {
        container.innerHTML = content;
        this.removeEventListeners();
        this.attachEventListeners();
      }
    }
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

  render(userId) {
    handleHeader(this.state.isUserLoggedIn, false);
    if (this.friends && this.invitations) {
      return `<div class="main-div-social">
                <h1 class="global-page-title">Social</h1>
                <div class="content-social">
                  <div class="search-bar-and-result-social">
                    <input type="text" id="search_bar_user" placeholder="Search..." />
                    <div id="search_result"></div>
                  </div>
                  <div class="friends-and-invitations-social">
                    <div class="friends-div-social">
                      <h2>FRIENDS</h2>
                      <div class="friends-list-social">
                        ${
                          Object.keys(this.friends).length > 0
                            ? `
                          ${Object.values(this.friends)
                            .map(
                              (value) =>
                                `<div class="friends-item-social">
                                    <div class="friends-item-img-username">
                                      <img width="50" height="50" src="https://127.0.0.1:8000/${value.avatar}" class="rounded-circle">
                                      <a href="/user/${value.id}/">${value.username}</a>
                                    </div>
                                    <p>Online</p>
                                </div>`
                            )
                            .join("")} `
                            : `<div>
                                <p>zero friend, sniff sniff</p>
                              </div>`
                        }
                      </div>
                    </div>
                    <div class="invitations-div-social">
                      <h2>REQUESTS</h2>
                      <div class="invitations-list-div-social">
                        ${
                          Object.keys(this.invitations).length > 0
                            ? `
                          ${Object.values(this.invitations)
                            .map(
                              (value) =>
                                `
                                    ${value.from_user.id == this.userId
                                    ? `<div class="invitation-item-social">
                                        <div class="invitation-item-img-username">
                                          <img width="50" height="50" src="https://127.0.0.1:8000/${value.to_user.avatar}" class="rounded-circle">
                                          <p>${value.to_user.username}, waiting for acceptation...</p>
                                        </div>
                                        <button class="cancel-button-invitation-social" value="${value.id}" id="cancel_decline_invit">⛌</button>
                                      </div>`
                                    : `<div class="invitation-item-social">
                                        <div class="invitation-item-img-username">
                                          <img width="50" height="50" src="https://127.0.0.1:8000/${value.from_user.avatar}" class="rounded-circle">
                                          <p>${value.from_user.username}</p>
                                        </div>
                                        <div class="two-buttons-invitation-social">
                                          <button class="validate-button-invitation-social" value="${value.id}" id="validate_invit">✓</button>
                                          <button class="cancel-button-invitation-social" value="${value.id}" id="cancel_decline_invit">⛌</button>
                                        </div>
                                      </div>`
                                    }`
                            )
                            .join("")}`
                            : `<div>
                                <p>no pending invitations</p>
                              </div>`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>`;
    } else {
      return `<h1>No data</h1>`;
    }
  }
}
