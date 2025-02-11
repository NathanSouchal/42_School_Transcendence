import DOMPurify from "dompurify";
import API from "../services/api.js";
import { handleHeader, updateView, checkUserStatus } from "../utils";
import { createBackArrow } from "../utils";
import { router } from "../app.js";

export default class Account {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;

    this.userData = {};
    this.formData = {
      username: "",
      alias: "",
    };
    this.lastDeleted = 0;
    this.isForm = false;
    this.eventListeners = [];
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("Account page subscribed to state");
    }
    if (!this.state.state.gameHasLoaded) return;
    else await updateView(this);
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

    const avatarInput = document.getElementById("avatar");
    if (avatarInput) {
      if (!this.eventListeners.some((e) => e.name === "avatar")) {
        const handleChange = (e) => {
          const file = e.target.files[0];
          if (file) this.handleChange("avatar", file);
        };
        avatarInput.addEventListener("change", handleChange);
        this.eventListeners.push({
          name: "avatar",
          type: "change",
          element: avatarInput,
          listener: handleChange,
        });
      }
    }

    const updateButton = document.getElementById("update-user-info");
    if (updateButton) {
      const handleChange = this.handleChange.bind(this, "update-user-info", "");
      if (!this.eventListeners.some((e) => e.name === "updateUserInfo")) {
        updateButton.addEventListener("click", handleChange);
        this.eventListeners.push({
          name: "updateUserInfo",
          type: "click",
          element: updateButton,
          listener: handleChange,
        });
      }
    }

    const deleteUserButton = document.getElementById("delete-user-button");
    if (deleteUserButton) {
      const handleChange = this.handleChange.bind(
        this,
        "delete-user-button",
        ""
      );
      if (!this.eventListeners.some((e) => e.name === "deleteUserButton")) {
        deleteUserButton.addEventListener("click", handleChange);
        this.eventListeners.push({
          name: "deleteUserButton",
          type: "click",
          element: deleteUserButton,
          listener: handleChange,
        });
      }
    }

    const formButton = document.getElementById("form-button");
    if (formButton) {
      const handleChange = this.handleChange.bind(this, "form-button", "");
      if (!this.eventListeners.some((e) => e.name === "formButton")) {
        formButton.addEventListener("click", handleChange);
        this.eventListeners.push({
          name: "formButton",
          type: "click",
          element: formButton,
          listener: handleChange,
        });
      }
    }

    const formSubmit = document.getElementById("user-form");
    if (formSubmit) {
      const handleChange = this.handleChange.bind(this, "form-submit", "");
      if (!this.eventListeners.some((e) => e.name === "formSubmit")) {
        formButton.addEventListener("submit", handleChange);
        this.eventListeners.push({
          name: "formSubmit",
          type: "form-submit",
          element: formSubmit,
          listener: handleChange,
        });
      }
    }

    const inputs = document.querySelectorAll("input");
    inputs.forEach((input) => {
      const handleChangeInput = this.handleChangeInput.bind(this);
      if (!this.eventListeners.some((e) => e.name === input.name)) {
        input.addEventListener("input", handleChangeInput);
        this.eventListeners.push({
          name: input.name,
          type: "input",
          element: input,
          listener: handleChangeInput,
        });
      }
    });
  }

  handleNavigation(e) {
    const target = e.target.closest("a");
    if (target && target.href.startsWith(window.location.origin)) {
      e.preventDefault();
      const path = target.getAttribute("href");
      router.navigate(path);
    }
  }

  async handleStateChange(newState) {
    console.log("NEWGameHasLoaded : " + newState.gameHasLoaded);
    console.log("PREVGameHasLoaded2 : " + this.previousState.gameHasLoaded);
    if (newState.gameHasLoaded && !this.previousState.gameHasLoaded) {
      console.log("GameHasLoaded state changed, rendering Account page");
      await updateView(this);
    }
    this.previousState = { ...newState };
  }

  handleChangeInput(e) {
    this.formData[e.target.name] = e.target.value;
    console.log(this.formData.alias);
    console.log(this.formData.username);
    console.log(this.formData.avatar);
  }

  async handleChange(key, value) {
    console.log("handlechange");
    if (key == "avatar") {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      const maxSize = 5 * 1024 * 1024; // 5MB
      const fileInput = value;
      const label = document.querySelector(".file-label");
      if (fileInput) {
        if (!allowedTypes.includes(fileInput.type)) {
          alert("Only JPG and PNG files are allowed");
          value = "";
          label.textContent = "Upload file";
          return;
        }
        if (fileInput.size > maxSize) {
          alert("File size can't exceed 5MB");
          value = "";
          label.textContent = "Upload file";
          return;
        }
        let filename = fileInput.name;
        if (fileInput.name.length > 10)
          filename = fileInput.name
            .slice(0, 7)
            .concat(`...${fileInput.type.slice(6)}`);
        label.textContent = filename;
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = e.target.result;
          console.log(base64String);
          this.formData.avatar = base64String;
        };
        reader.readAsDataURL(fileInput);
      } else label.textContent = "Upload file";
    } else if (key == "form-button") {
      this.isForm = !this.isForm;
      await updateView(this);
    } else if (key == "update-user-info") {
      try {
        await this.updateUserInfo(this.state.state.userId);
        await this.fetchData(this.userData.id);
        this.isForm = !this.isForm;
        await updateView(this);
      } catch (error) {
        console.error(error);
      }
    } else if (key == "delete-user-button") {
      try {
        await this.deleteUser(this.state.state.userId);
      } catch (error) {
        console.error(error);
      }
    }
  }

  async fetchData(id) {
    console.log("Fetching data...");
    try {
      const response = await API.get(`/user/${id}/`);
      const data = response.data;
      console.log(data);
      this.userData = data.user;
      this.formData.username = data.user.username;
      this.formData.alias = data.user.alias;
      if (!this.state.isUserLoggedIn) this.state.setIsUserLoggedIn(true);
    } catch (error) {
      console.error(`Error while trying to get data : ${error}`);
      this.userData = {};
      if (this.state.isUserLoggedIn) this.state.setIsUserLoggedIn(false);
      throw error;
    }
  }

  async updateUserInfo(id) {
    console.log("Updating data...");
    if (this.formData.username.length < 4 || this.formData.alias.length < 4) {
      return console.error("Please complete all fields");
    }
    try {
      const res = await API.put(`/user/${id}/`, this.formData);
      console.log(res);
    } catch (error) {
      console.error(`Error while trying to update user data : ${error}`);
    }
  }

  async deleteUser(id) {
    try {
      await API.delete(`/user/${id}/`);
      this.lastDeleted = id;
      await updateView(this);
    } catch (error) {
      console.error(`Error while trying to delete data : ${error}`);
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

  removeEventListener(name) {
    const event = this.eventListeners.find((el) => el.name === name);
    if (event) {
      event.element.removeEventListener(event.type, event.listener);
      console.log("Removed unique eventListener from input");
      this.eventListeners = this.eventListeners.filter(
        (el) => el.name !== name
      );
    }
  }

  destroy() {
    this.removeEventListeners();
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      console.log("Account page unsubscribed from state");
    }
  }

  async render(routeParams = {}) {
    try {
      await checkUserStatus();
      await this.fetchData(this.state.state.userId);
    } catch (error) {
      if (error.response.status === 401) return "";
      if (error.response.status === 404) {
        router.navigate("/404");
        return;
      }
    }
    handleHeader(this.state.isUserLoggedIn, false);
    // const userData = this.state.data.username;
    // const sanitizedData = DOMPurify.sanitize(userData);
    const backArrow = createBackArrow(this.state.state.lastRoute);
    return `${backArrow}<div class="user-main-div">
						<div class="user-main-content">
                          <div class="title-div">
                            <h1>Account</h1>
                          </div>
              <div class="text-center mb-4" id="user-info-div">
			  ${
          this.isForm
            ? `<div id="userinfo-main-div">
				<form id="user-form">
			 	<div class="avatar-main-div" id="avatar-main-div">
					${this.userData.avatar ? `<img src="https://127.0.0.1:8000/${this.userData.avatar}">` : `<img src="/profile.jpeg">`}
					<div class="search-bar-and-result-social">
						<label class="file-label" for="avatar">
							Upload file
						</label>
						<input
						type="file"
						class="file-input"
						name="avatar"
						id="avatar"
						/>
					</div>
				</div>
				<div class="form-username-title-div search-bar-and-result-social" id="username-main-div">
					<label for="username">
						Username
					</label>
					<input
					type="text"
					class="form-control"
					minLength="4"
					maxLength="10"
					value="${this.formData.username}"
					name="username"
					required
					/>
				</div>
				<div class="form-alias-title-div search-bar-and-result-social" id="alias-main-div">
					<label for="alias">
						Alias
					</label>
					<input
					type="text"
					class="form-control"
					minLength="4"
					maxLength="10"
					value="${this.formData.alias}"
					name="alias"
					required
					/>
				</div>
				<button type="button" class="btn btn-success m-3" id="update-user-info">
					Update my info
				</button>
				</form>
              </div>`
            : `
<<<<<<< HEAD
			  <div id="user-main-div">
			 	<div id="avatar-main-div">
				${this.userData.avatar ? `<img width="200" height="200" src="https://localhost:8443/${this.userData.avatar}" class="rounded-circle">` : ``}
=======
			  <div id="userinfo-main-div">
			 	<div class="avatar-main-div" id="avatar-main-div">
				${this.userData.avatar ? `<img src="https://127.0.0.1:8000/${this.userData.avatar}">` : `<img src="/profile.jpeg">`}
>>>>>>> dev
				</div>
				<div class="username-title-div" id="username-main-div">
					<h2 class="username-title">
					Username :
					</h2>
					<h2 class="username-title-value">
					${this.userData.username ? `${this.userData.username}` : ""}
					</h2>
				</div>
				<div class="alias-title-div" id="alias-main-div">
					<h2 class="alias-title">
					Alias :
					</h2>
					<h2 class="alias-title-value">
					${this.userData.alias ? `${this.userData.alias}` : ""}
					</h2>
				</div>
              </div>`
        }
			  <div class="d-flex flex-column align-items-center">
				<button class="btn btn-dark m-3" id="form-button">
					${this.isForm ? `Cancel` : `Change my info`}
				</button>
				<button
					class="btn btn-danger mb-2"
					id="delete-user-button"
				>
					Delete Account
				</button>
            </div>
			</div>
			</div>`;
  }
}
