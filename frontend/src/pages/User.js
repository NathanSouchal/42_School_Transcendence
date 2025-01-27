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
    this.friendRequestId = null;
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

  updateView() {
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = this.render();
      this.removeEventListeners();
      this.attachEventListeners();
    }
  }

  attachEventListeners() {
    const cancelFriendRequestButton = document.getElementById(
      "cancel-friend-request"
    );
    if (cancelFriendRequestButton) {
      const handleFriend = this.handleFriend.bind(this);
      if (
        !this.eventListeners.some((e) => e.name === "cancel-friend-request")
      ) {
        cancelFriendRequestButton.addEventListener(
          "click",
          async (e) => await handleFriend("cancel-friend-request", "")
        );
        this.eventListeners.push({
          name: "cancel-friend-request",
          type: "click",
          element: cancelFriendRequestButton,
          listener: handleFriend,
        });
      }
    }

    const sendFriendRequestButton = document.getElementById(
      "send-friend-request"
    );
    if (sendFriendRequestButton) {
      const handleFriend = this.handleFriend.bind(this);
      if (!this.eventListeners.some((e) => e.name === "send-friend-request")) {
        sendFriendRequestButton.addEventListener(
          "click",
          async (e) => await handleFriend("send-friend-request", "")
        );
        this.eventListeners.push({
          name: "send-friend-request",
          type: "click",
          element: sendFriendRequestButton,
          listener: handleFriend,
        });
      }
    }

    const unfriendButton = document.getElementById("unfriend");
    if (unfriendButton) {
      const handleFriend = this.handleFriend.bind(this);
      if (!this.eventListeners.some((e) => e.name === "unfriend")) {
        unfriendButton.addEventListener(
          "click",
          async (e) => await handleFriend("unfriend", "")
        );
        this.eventListeners.push({
          name: "unfriend",
          type: "click",
          element: unfriendButton,
          listener: handleFriend,
        });
      }
    }

    const acceptFriendButton = document.getElementById("accept-friend-request");
    if (acceptFriendButton) {
      const handleFriend = this.handleFriend.bind(this);
      if (
        !this.eventListeners.some((e) => e.name === "accept-friend-request")
      ) {
        acceptFriendButton.addEventListener(
          "click",
          async (e) => await handleFriend("accept-friend-request", "")
        );
        this.eventListeners.push({
          name: "accept-friend-request",
          type: "click",
          element: acceptFriendButton,
          listener: handleFriend,
        });
      }
    }

    const deleteRecievedFriendRequestButton = document.getElementById(
      "delete-recieved-friend-request"
    );
    if (deleteRecievedFriendRequestButton) {
      const handleFriend = this.handleFriend.bind(this);
      if (
        !this.eventListeners.some(
          (e) => e.name === "delete-recieved-friend-request"
        )
      ) {
        deleteRecievedFriendRequestButton.addEventListener(
          "click",
          async (e) => await handleFriend("delete-recieved-friend-request", "")
        );
        this.eventListeners.push({
          name: "delete-recieved-friend-request",
          type: "click",
          element: deleteRecievedFriendRequestButton,
          listener: handleFriend,
        });
      }
    }
  }

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
      const response = await API.get(`/friend-requests/byuser/${this.userId}/`);
      const data = response.data;
      this.friends = response.data.friends;
      this.friendRequests = response.data.pending_friend_requests;
      await this.checkFriendStatus();
      console.log(this.friends, this.friendRequests);
    } catch (error) {
      console.error(`Error while trying to get MyFriends : ${error}`);
    }
  }

  async sendFriendRequest() {
    try {
      const res = await API.post("/friend-requests/create/", {
        from_user: this.userId.toString(),
        to_user: this.pageId,
      });
      console.log(res);
    } catch (error) {
      console.error(`Error while trying to add friend : ${error}`);
    }
  }

  async deleteFriend() {
    try {
      const res = await API.delete(`/friends/friend/${this.pageId}/`);
      console.log(res.data);
    } catch (error) {
      console.error(`Error while trying to add friend : ${error}`);
    }
  }

  async cancelFriendRequest() {
    try {
      const res = await API.put(`/friend-requests/${this.friendRequestId}/`, {
        accepted: "false",
      });
      console.log(res);
    } catch (error) {
      console.error(`Error while trying to cancel friend request : ${error}`);
    }
  }

  async acceptFriendRequest() {
    try {
      const res = await API.put(`/friend-requests/${this.friendRequestId}/`, {
        accepted: "true",
      });
      console.log(res);
    } catch (error) {
      console.error(`Error while trying to accept friend request : ${error}`);
    }
  }

  async deleteRecievedFriendRequest() {
    try {
      const res = await API.put(`/friend-requests/${this.friendRequestId}/`, {
        accepted: "false",
      });
      console.log(res.data);
    } catch (error) {
      console.error(
        `Error while trying to delete recieved friend request : ${error}`
      );
    }
  }

  async handleFriend(key, value) {
    if (key === "cancel-friend-request") {
      await this.cancelFriendRequest();
    } else if (key === "send-friend-request") {
      await this.sendFriendRequest();
    } else if (key === "unfriend") {
      await this.deleteFriend();
    } else if (key === "accept-friend-request") {
      await this.acceptFriendRequest();
    } else if (key === "delete-recieved-friend-request") {
      await this.deleteRecievedFriendRequest();
    }
    await this.getMyFriends();
    this.updateView();
  }

  async checkFriendStatus() {
    if (this.friends.some((el) => el.id.toString() === this.pageId))
      this.friendStatus = "friend";
    else if (
      this.friendRequests.some(
        (el) =>
          !el.accepted &&
          el.to_user?.id.toString() === this.pageId &&
          this.pageId.toString() !== this.userId.toString()
      )
    ) {
      const matchingRequest = this.friendRequests.find(
        (el) => !el.accepted && el.to_user?.id.toString() === this.pageId
      );
      if (matchingRequest) {
        this.friendRequestId = matchingRequest.id;
        this.friendStatus = "pending";
      }
    } else if (
      this.friendRequests.some(
        (el) =>
          !el.accepted &&
          el.from_user?.id.toString() === this.pageId &&
          this.pageId.toString() !== this.userId.toString()
      )
    ) {
      const matchingRequest = this.friendRequests.find(
        (el) => !el.accepted && el.from_user?.id.toString() === this.pageId
      );
      if (matchingRequest) {
        this.friendRequestId = matchingRequest.id;
        this.friendStatus = "recieved";
      }
    } else {
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
    this.friendRequestId = null;
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
              ? `<button type="button" class="btn btn-success m-3" id="send-friend-request">
						Add friend
					</button>`
              : this.friendStatus === "friend"
                ? `<button type="button" class="btn btn-danger m-3" id="unfriend">
						Unfriend
					</button>`
                : this.friendStatus === "pending"
                  ? `<button type="button" class="btn btn-info m-3" id="cancel-friend-request">
						Cancel friend request
					</button>`
                  : this.friendStatus === "recieved"
                    ? `<button type="button" class="btn btn-info m-3" id="accept-friend-request">
						Accept friend request
					</button><button type="button" class="btn btn-info m-3" id="delete-recieved-friend-request">
						Delete friend request
					</button>`
                    : ``
          }
				</div>
			</div>
	`;
  }
}
