import API from "../services/api.js";
import {
  handleHeader,
  updateView,
  checkUserStatus,
  setDisable,
} from "../utils";
import { router } from "../app.js";
import { trad } from "../trad.js";
import axios from "axios";

export default class User {
  constructor(state) {
    this.pageName = "User";
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.pageId = null;
    this.isInitialized = false;
    this.isRouteId = false;
    this.isSubscribed = false;
    this.eventListeners = [];
    this.publicUserData = {};
    this.friends = [];
    this.friendRequests = [];
    this.friendStatus = "";
    this.friendRequestId = null;
    this.lang = null;
    this.routeParams;
    this.matchHistory = {};
  }

  async initialize(routeParams = {}) {
    const newPageId = routeParams.id;
    this.routeParams = routeParams;

    if (this.pageId === newPageId) this.isRouteId = true;
    if (this.isRouteId && this.isInitialized) return;
    if (!this.isInitialized) this.isInitialized = true;
    this.pageId = newPageId;
    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    this.pageId = routeParams.id;
    if (!this.state.state.gameHasLoaded) return;
    else await updateView(this, routeParams || {});
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

    const friendButtonConfigs = [
      { id: "cancel-friend-request", action: "cancel-friend-request" },
      { id: "send-friend-request", action: "send-friend-request" },
      { id: "unfriend", action: "unfriend" },
      { id: "accept-friend-request", action: "accept-friend-request" },
      {
        id: "delete-recieved-friend-request",
        action: "delete-recieved-friend-request",
      },
    ];

    friendButtonConfigs.forEach(({ id, action }) => {
      const button = document.getElementById(id);
      if (button && !this.eventListeners.some((e) => e.name === action)) {
        const boundHandleFriend = this.handleFriend.bind(this, action, "");
        button.addEventListener("click", boundHandleFriend);
        this.eventListeners.push({
          name: action,
          type: "click",
          element: button,
          listener: boundHandleFriend,
        });
      }
    });
  }

  async buildAvatarImgLink(link) {
    try {
      const res = await axios.head(`${link}`);
      if (res.status === 200) this.publicUserData.avatar = `${link}`;
    } catch (error) {
      this.publicUserData.avatar = "/profile.jpeg";
    }
  }

  async getPublicUserInfo() {
    try {
      const response = await API.get(`/user/public-profile/${this.pageId}/`);
      const data = response.data;
      this.publicUserData = data.user;
      if (data.user.avatar) this.buildAvatarImgLink(data.user.avatar);
      else this.publicUserData.avatar = "/profile.jpeg";
    } catch (error) {
      console.error(`Error while trying to get PublicUserInfo : ${error}`);
      if (error.response.status === 404) {
        router.navigate("/404");
      }
      throw error;
    }
  }

  async getMyFriends() {
    try {
      const response = await API.get(
        `/friend-requests/byuser/${this.state.state.userId}/`
      );
      const data = response.data;
      this.friends = response.data.friends;
      this.friendRequests = response.data.pending_friend_requests;
      await this.checkFriendStatus();
      console.log(this.friends, this.friendRequests);
    } catch (error) {
      console.error(`Error while trying to get MyFriends : ${error}`);
      throw error;
    }
  }

  async sendFriendRequest() {
    try {
      const res = await API.post("/friend-requests/create/", {
        from_user: this.state.state.userId.toString(),
        to_user: this.pageId,
      });
      console.log(res);
    } catch (error) {
      console.error(`Error while trying to add friend : ${error}`);
      throw error;
    }
  }

  async deleteFriend() {
    try {
      const res = await API.delete(`/friends/friend/${this.pageId}/`);
      console.log(res.data);
    } catch (error) {
      console.error(`Error while trying to add friend : ${error}`);
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
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

  async handleFriend(key, value) {
    setDisable(true, key);
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
    updateView(this, this.routeParams || {});
    setDisable(false, key);
  }

  async checkFriendStatus() {
    if (this.friends.some((el) => el.id.toString() === this.pageId))
      this.friendStatus = "friend";
    else if (
      this.friendRequests.some(
        (el) =>
          !el.accepted &&
          el.to_user?.id.toString() === this.pageId &&
          this.pageId.toString() !== this.state.state.userId.toString()
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
          this.pageId.toString() !== this.state.state.userId.toString()
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
      if (this.pageId.toString() === this.state.state.userId.toString())
        this.friendStatus = "me";
      else this.friendStatus = "free";
    }
    console.log(this.friendStatus);
  }

  async getMatchHistory(id) {
    try {
      const res = await API.get(`/match-history/${id}/`);
      const data = res.data.match_history;
      this.matchHistory = data;
      console.log(
        "MatchHistory: " +
          Object.entries(this.matchHistory).map(
            ([key, value]) =>
              `${key}: ${Object.entries(value).map(([ky, val]) => `${ky}: ${val}`)}`
          )
      );
    } catch (error) {
      console.error(error);
    }
  }

  async handleStateChange(newState) {
    if (
      (newState.gameHasLoaded && !this.previousState.gameHasLoaded) ||
      newState.lang !== this.previousState.lang
    ) {
      this.previousState = { ...newState };
      await updateView(this, this.routeParams || {});
    } else this.previousState = { ...newState };
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
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
    }
    this.pageId = null;
    this.isInitialized = false;
    this.isRouteId = false;
    this.isSubscribed = false;
    this.publicUserData = {};
    this.friends = [];
    this.friendRequests = [];
    this.friendStatus = "";
    this.friendRequestId = null;
  }

  async render(routeParams = {}) {
    const { id } = routeParams;
    const isAuthenticated = await checkUserStatus();
    if (!isAuthenticated) return;

    await this.getPublicUserInfo();
    await this.getMyFriends();
    await this.getMatchHistory(this.pageId);

    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    if (this.lang !== this.state.state.lang)
      handleHeader(this.state.isUserLoggedIn, false, true);
    else handleHeader(this.state.isUserLoggedIn, false, false);
    this.lang = this.state.state.lang;
    console.log(`rendering page ${this.pageId}`);
    return `
			<div class="user-main-div">
			<div class="user-main-content">
				<div class="title-div">
				<h1>${this.publicUserData.username ? `${this.publicUserData.username}` : `${trad[this.lang].user.pageTitle}`}</h1>
				</div>
				<div id="user-main-div">
					<div class="avatar-main-div" id="avatar-main-div">
					<img src="${this.publicUserData.avatar}">
					</div>
					<div class="username-title-div" id="username-main-div">
						<h2 class="username-title">
						${trad[this.lang].user.username}
						</h2>
						<h2 class="username-title-value">
						${this.publicUserData.username ? `${this.publicUserData.username}` : ""}
						</h2>
					</div>
					<div class="alias-title-div" id="alias-main-div">
						<h2 class="alias-title">
						${trad[this.lang].user.alias}
						</h2>
						<h2 class="alias-title-value">
						${this.publicUserData.alias ? `${this.publicUserData.alias}` : ""}
						</h2>
					</div>
					${
            this.friendStatus === "free"
              ? `<button type="button" class="btn btn-success m-3" id="send-friend-request">
						${trad[this.lang].user.addFriend}
					</button>`
              : this.friendStatus === "friend"
                ? `<button type="button" class="btn btn-danger m-3" id="unfriend">
						${trad[this.lang].user.unfriend}
					</button>`
                : this.friendStatus === "pending"
                  ? `<button type="button" class="btn btn-info m-3" id="cancel-friend-request">
						${trad[this.lang].user.cancel}
					</button>`
                  : this.friendStatus === "recieved"
                    ? `<button type="button" class="btn btn-info m-3" id="accept-friend-request">
						${trad[this.lang].user.accept}
					</button><button type="button" class="btn btn-info m-3" id="delete-recieved-friend-request">
						${trad[this.lang].user.delete}
					</button>`
                    : ``
          }
				</div>
				<div class="user-match-history-main-div">
				<div class="title-div match-history-title-div">
					<h1>${trad[this.lang].matchHistory.pageTitle}</h1>
				</div>
							${
                this.matchHistory && Object.keys(this.matchHistory).length
                  ? Object.values(this.matchHistory)
                      .map(
                        (value) =>
                          `<div class="match-history-main-game-div">
								<div class="match-history-game-div ${
                  (value.player1 === this.state.state.userAlias &&
                    value.score_player1 > value.score_player2) ||
                  (value.player2 === this.state.state.userAlias &&
                    value.score_player2 > value.score_player1)
                    ? `won`
                    : (value.player1 === this.state.state.userAlias &&
                          value.score_player1 < value.score_player2) ||
                        (value.player2 === this.state.state.userAlias &&
                          value.score_player2 < value.score_player1)
                      ? `lost`
                      : `equality`
                }">
									<h4 class="mh-date">${value.created_at.split("T")[0]}</h4>
									<h3 class="mh-player">${value.player1}</h3>
									<h3 class="mh-score">${value.score_player1}</h3>
									<span>-</span>
									<h3 class="mh-score">${value.score_player2}</h3>
									<h3 class="mh-player">${value.player2 ? value.player2 : value.opponentName}</h3>
								</div>
							</div>`
                      )
                      .join("")
                  : `<div class="match-history-main-div">
				  		<div class="match-history-main-game-div">
							<h3>${trad[this.lang].matchHistory.noContent}</h3>
						</div>
					</div>`
              }</div>
			</div>
			</div>
	`;
  }
}
