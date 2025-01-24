import axios from "axios";
import { createBackArrow } from "../components/backArrow.js";
import { Router } from "../router.js";
import API from "../services/api.js";

export default class User {
  constructor(state) {
    this.state = state;
    this.pageId = null;
    this.isInitialized = false;
    this.isRouteId = false;
    this.isSubscribed = false;
    this.errorCode = null;
    this.eventListeners = [];

    this.publicUserData = {};
    this.friends = [];
    this.friendRequests = [];
    this.userId = null;
    this.friendStatus = "";
  }

  async initialize(routeParams = {}) {
    const newPageId = routeParams.id;
    if (this.pageId === newPageId) this.isRouteId = true;
    if (this.isRouteId && this.isInitialized) return;
    if (!this.isInitialized) this.isInitialized = true;
    this.pageId = newPageId;
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("User page subscribed to state");
    }

    this.pageId = routeParams.id;
    this.userId = Number(localStorage.getItem("id"));
    console.log("INITIALIZE ON USER");
    await this.getPublicUserInfo();
    if (this.errorCode === 404) {
      this.state.state.lastLastRoute = this.state.state.lastRoute;
      window.location.href = "/404";
    }
    await this.getMyFriends();
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

  async getPublicUserInfo() {
    try {
      const response = await API.get(`/user/public-profile/${this.pageId}/`);
      const data = response.data;
      this.publicUserData = data.user;
      console.log(data);
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          this.errorCode = 404;
          console.error(`Error while trying to get PublicUserInfo : ${error}`);
        }
      } else {
        console.error(`Error while trying to get PublicUserInfo : ${error}`);
      }
    }
  }

  async getMyFriends() {
    try {
      const response = await API.get(`/friendship/byuser/${this.userId}/`);
      const data = response.data;
      this.friends = response.data.friends;
      this.friendRequests = response.data.pending_friendships;
      this.checkFriendStatus();
      console.log(this.friends, this.friendRequests);
    } catch (error) {
      console.error(`Error while trying to get MyFriends : ${error}`);
    }
  }

  checkFriendStatus() {
    if (this.friends.some((el) => el.id.toString() === this.pageId))
      this.friendStatus = "friend";
    else if (
      this.friendRequests.some(
        (el) => !el.accepted && el.to_user?.id.toString() === this.pageId
      )
    )
      this.friendStatus = "pending";
    else {
      if (this.pageId.toString() === this.userId.toString())
        this.friendStatus = "me";
      else this.friendStatus = "free";
    }
    console.log(this.friendStatus);
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
    this.pageId = null;
    this.isInitialized = false;
    this.isRouteId = false;
    this.isSubscribed = false;
    this.errorCode = null;
    this.publicUserData = {};
    this.friends = [];
    this.friendRequests = [];
    this.userId = null;
    this.friendStatus = "";
  }

  render(routeParams = {}) {
    const { id } = routeParams;
    const backArrow = createBackArrow(this.state.state.lastRoute);
    // if (this.errorCode === 404) {
    //   return setTimeout(() => {
    //     this.errorCode = null;
    //     window.app.router.navigate(this.state.state.lastLastRoute);
    //   }, 100);
    // }
    if (this.errorCode === 404) {
      this.errorCode = null;
      window.location.href = `/404`;
    }
    console.log(`rendering page ${this.pageId}`);
    return `${backArrow}
			<div class="d-flex flex-column justify-content-center align-items-center h-100">
				<div class="title-div mb-4">
					<h1 class="text-capitalize w-100 text-center">Public user page</h1>
				</div>
				<div id="user-main-div">
					<div id="avatar-main-div">
					${this.publicUserData.avatar ? `<img width="200" height="200" src="https://127.0.0.1:8000${this.publicUserData.avatar}" class="rounded-circle">` : ``}
					</div>
					<div id="username-main-div">
						<h2 class="text-capitalize">
						Username : ${this.publicUserData.username ? `${this.publicUserData.username}` : ""}
						</h2>
					</div>
					</div>
					<div id="alias-main-div">
						<h2 class="text-capitalize">
						Alias : ${this.publicUserData.alias ? `${this.publicUserData.alias}` : ""}
						</h2>
					</div>
					${
            this.friendStatus === "free"
              ? `<button type="button" class="btn btn-success m-3" id="add-friend">
						Add friend
					</button>`
              : this.friendStatus === "friend"
                ? `<button type="button" class="btn btn-danger m-3" id="unfriend">
						Unfriend
					</button>`
                : this.friendStatus === "pending"
                  ? `<button type="button" class="btn btn-info m-3" id="pending-request">
						Pending request
					</button>`
                  : ``
          }
				</div>
			</div>
	`;
  }
}
