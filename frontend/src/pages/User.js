import axios from "axios";
import { createBackArrow } from "../components/backArrow.js";
import { Router } from "../router.js";
import API from "../services/api.js";

export default class User {
  constructor(state) {
    this.state = state;
    this.pageId = null;
    this.isInitialized = false;
    this.isSubscribed = false;
    this.errorCode = null;
    this.eventListeners = [];

    this.userData = {};
    this.isFriend = false;
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("User page subscribed to state");
    }

    this.pageId = routeParams.id;
    await this.fetchUserInfo();
    if (this.errorCode === 404) {
      return setTimeout(() => {
        this.state.state.lastLastRoute = this.state.state.lastRoute;
        window.app.router.navigate("/404");
      }, 100);
    }
    if (!this.state.state.gameHasLoaded) return;
    else {
      const content = this.render();
      const container = document.getElementById("app");
      if (container) {
        container.innerHTML = content;
        this.removeEventListeners();
        this.attachEventListeners();
      }
    }
  }

  attachEventListeners() {}

  async fetchUserInfo() {
    try {
      const response = await API.get(`/user/public-profile/${this.pageId}/`);
      const data = response.data;
      this.userData = data.user;
      console.log(data);
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          this.errorCode = 404;
          console.error(`Error while trying to get data : ${error}`);
        }
      } else {
        console.error(`Error while trying to get data : ${error}`);
      }
    }
  }

  handleStateChange(newState) {
    console.log("GameHasLoaded : " + newState.gameHasLoaded);
    if (newState.gameHasLoaded) {
      console.log("GameHasLoaded state changed, rendering User page");
      const content = this.render();
      const container = document.getElementById("app");
      if (container) {
        container.innerHTML = content;
        this.removeEventListeners();
        this.attachEventListeners();
      }
    }
  }

  removeEventListeners() {}

  destroy() {
    this.removeEventListeners();
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange); // Nettoyage de l'abonnement
      this.isSubscribed = false;
      console.log("User page unsubscribed from state");
    }
  }

  render(routeParams = {}) {
    const { id } = routeParams;
    const backArrow = createBackArrow(this.state.state.lastRoute);
    if (this.errorCode === 404) {
      return setTimeout(() => {
        this.errorCode = null;
        window.app.router.navigate(this.state.state.lastLastRoute);
      }, 100);
    }
    return `${backArrow}
			<div class="d-flex flex-column justify-content-center align-items-center h-100">
				<div class="title-div mb-4">
					<h1 class="text-capitalize w-100 text-center">Public user page</h1>
				</div>
				<div id="user-main-div">
					<div id="avatar-main-div">
					${this.userData.avatar ? `<img width="200" height="200" src="https://127.0.0.1:8000${this.userData.avatar}" class="rounded-circle">` : ``}
					</div>
					<div id="username-main-div">
						<h2 class="text-capitalize">
						Username : ${this.userData.username ? `${this.userData.username}` : ""}
						</h2>
					</div>
					</div>
					<div id="alias-main-div">
						<h2 class="text-capitalize">
						Alias : ${this.userData.alias ? `${this.userData.alias}` : ""}
						</h2>
					</div>
					${
            this.state.isUserLoggedIn && !isFriend
              ? `<button class="btn btn-success m-3" id="add-friend">
						Add friend
					</button>`
              : this.state.isUserLoggedIn && isFriend
                ? `<button class="btn btn-error m-3" id="add-friend">
						Unfriend
					</button>`
                : ``
          }
				</div>
			</div>
	`;
  }
}
