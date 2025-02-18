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
    this.formData = {};
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

    const buttons = [
      { id: "delete-user-button", action: "delete-user-button" },
      { id: "update-user-info", action: "update-user-info" },
    ];

    buttons.forEach(({ id, action }) => {
      const button = document.getElementById(id);
      if (button) {
        const handleClick = this.handleClick.bind(this, action);
        if (!this.eventListeners.some((e) => e.name === action)) {
          button.addEventListener("click", handleClick);
          this.eventListeners.push({
            name: action,
            type: "click",
            element: button,
            listener: handleClick,
          });
        }
      }
    });

    const checkboxes = [
      { id: "app2FA-checkbox", action: "app2FA-checkbox" },
      {
        id: "email2FA-checkbox",
        action: "email2FA-checkbox",
        input: ".email2FA-input",
      },
      {
        id: "sms2FA-checkbox",
        action: "sms2FA-checkbox",
        input: ".sms2FA-input",
      },
    ];

    checkboxes.forEach(({ id, action, input }) => {
      const checkbox = document.getElementById(id);
      const inputField = input ? document.querySelector(input) : null;
      if (checkbox) {
        const handleCheckBox = this.handleCheckBox.bind(
          this,
          checkbox,
          inputField,
          checkboxes
        );
        if (!this.eventListeners.some((e) => e.name === action)) {
          checkbox.addEventListener("click", handleCheckBox);
          this.eventListeners.push({
            name: action,
            type: "change",
            element: checkbox,
            listener: handleCheckBox,
          });
        }
      }
    });

    const avatarInput = document.getElementById("avatar");
    if (avatarInput) {
      if (!this.eventListeners.some((e) => e.name === "avatar")) {
        const handleFile = (e) => {
          const file = e.target.files[0];
          if (file) this.handleFile("avatar", file);
        };
        avatarInput.addEventListener("change", handleFile);
        this.eventListeners.push({
          name: "avatar",
          type: "change",
          element: avatarInput,
          listener: handleFile,
        });
      }
    }

    const formSubmit = document.getElementById("user-form");
    if (formSubmit) {
      const handleSubmit = this.handleSubmit.bind(this);
      if (!this.eventListeners.some((e) => e.name === "formSubmit")) {
        formSubmit.addEventListener("submit", handleSubmit);
        this.eventListeners.push({
          name: "formSubmit",
          type: "submit",
          element: formSubmit,
          listener: handleSubmit,
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
      this.previousState = { ...newState };
      await updateView(this);
    } else this.previousState = { ...newState };
  }

  handleChangeInput(e) {
    this.formData[e.target.name] = e.target.value;
    console.log(this.formData.alias);
    console.log(this.formData.username);
    console.log(this.formData.avatar);
  }

  async handleFile(key, file) {
    if (key == "avatar") {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      const maxSize = 5 * 1024 * 1024; // 5MB
      const fileInput = file;
      const label = document.querySelector(".file-label");
      if (fileInput) {
        if (!allowedTypes.includes(fileInput.type)) {
          this.displayAccountErrorMessage("Only JPG and PNG files are allowed");
          label.textContent = "Upload file";
          return;
        }
        if (fileInput.size > maxSize) {
          this.displayAccountErrorMessage("File size can't exceed 5MB");
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
    }
  }

  async handleClick(key) {
    console.log("handleClick");
    if (key == "cancel-button" || key == "update-user-info") {
      this.isForm = !this.isForm;
      await updateView(this);
      if (this.isForm) {
        const checked2fa = document.getElementById("app2FA-checkbox")?.checked;
        if (checked2fa) {
          await this.getQrcode();
        }
      }
    } else if (key == "delete-user-button") {
      try {
        await this.deleteUser(this.state.state.userId);
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    try {
      await this.updateUserInfo(this.state.state.userId);
      await this.fetchData(this.userData.id);
      this.isForm = !this.isForm;
      await updateView(this);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async handleCheckBox(checkbox, inputField, checkboxes) {
    checkboxes.forEach(({ id }) => {
      const otherCheckbox = document.getElementById(id);
      if (otherCheckbox !== checkbox) otherCheckbox.checked = false;
    });

    document
      .querySelectorAll(".email2FA-input, .sms2FA-input")
      .forEach((input) => {
        input.disabled = true;
        input.required = false;
        console.log("input.name : " + input.name);
        if (
          input.classList.contains("email2FA-input") &&
          !document.getElementById("email2FA-checkbox").checked
        ) {
          this.formData.email = "";
          input.value = "";
        }
        if (
          input.classList.contains("sms2FA-input") &&
          !document.getElementById("sms2FA-checkbox").checked
        ) {
          this.formData.phone_number = "";
          input.value = "";
        }
      });

    if (checkbox.checked) this.formData.two_factor_method = checkbox.value;
    else this.formData.two_factor_method = "none";
    if (checkbox.checked && inputField) {
      inputField.disabled = false;
      inputField.required = true;
    }
    if (document.getElementById("app2FA-checkbox").checked) {
      await this.getQrcode();
    }
    if (!document.getElementById("app2FA-checkbox").checked) {
      document.getElementById("totp-qr-code").style.display = "none";
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
      this.formData.email = data.user.email;
      this.formData.phone_number = data.user.phone_number;
      this.formData.two_factor_method = data.user.two_factor_method;
    } catch (error) {
      console.error(`Error while trying to get data : ${error}`);
      this.userData = {};
      throw error;
    }
  }

  async getQrcode() {
    try {
      const response = await API.get(`/auth/generate-qrcode/`);
      const data = response.data;
      console.log(data);
      const qrCode = document.getElementById("totp-qr-code");
      if (qrCode) {
        qrCode.src = `data:image/png;base64,${data.qr_code}`;
        qrCode.style.display = "block";
      }
    } catch (error) {
      console.error(`Error while trying to get qrcode : ${error}`);
      throw error;
    }
  }

  async updateUserInfo(id) {
    console.log("Updating data...");
    console.log("this.formData.username: " + this.formData.username);
    console.log("this.formData.alias: " + this.formData.alias);
    try {
      if (
        !Object.keys(this.formData).length ||
        !this.formData.username?.length ||
        !this.formData.alias?.length
      ) {
        console.error("Please complete all fields");
        throw new Error("Please complete all fields");
      }
      const res = await API.put(`/user/${id}/`, this.formData);
      console.log(res);
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data
      ) {
        const errorData = error.response.data;
        if (errorData.phone_number)
          console.log(Object.values(errorData.phone_number));
        if (errorData.errors)
          this.displayAccountErrorMessage(Object.values(errorData.errors)[0]);
        else if (errorData.no_phone_number)
          this.displayAccountErrorMessage(errorData.no_phone_number);
        else if (errorData.no_email)
          this.displayAccountErrorMessage(errorData.no_email);
        else if (errorData.wrong_avatar)
          this.displayAccountErrorMessage(errorData.wrong_avatar);
      }
      console.error(`Error while trying to update user data : ${error}`);
      throw error;
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

  displayAccountErrorMessage(errorMsg) {
    console.log("ici");
    const errorTitle = document.getElementById("account-error-message");
    if (errorTitle) errorTitle.textContent = errorMsg;
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
			 	<div class="input-main-div" id="avatar-main-div">
					${this.userData.avatar ? `<img src="https://127.0.0.1:8000/${this.userData.avatar}">` : `<img src="/profile.jpeg">`}
					<div class="input-div file-input-div">
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
				<div class="input-div" id="username-main-div">
					<label for="username">
						Username
					</label>
					<input
					type="text"
					class="form-control"
					minLength="4"
					maxLength="10"
					value="${this.formData.username ? this.formData.username : ``}"
					name="username"
					required
					/>
				</div>
				<div class="input-div" id="alias-main-div">
					<label for="alias">
						Alias
					</label>
					<input
					type="text"
					class="form-control"
					minLength="4"
					maxLength="10"
					value="${this.formData.alias ? this.formData.alias : ``}"
					name="alias"
					required
					/>
				</div>
				<div class="form-2FA-main-div" id="form-2FA-main-div">
					<div class="app2FA-div" id="app2FA-div">
						<div class="checkbox-div">
						<label for="app2FA-checkbox" id="app2FA-checkbox-label">
							2FA with Google Authenticator
						</label>
						<label class="switch">
						<input
						type="checkbox"
						id="app2FA-checkbox"
						name="app2FA-checkbox"
						value="TOTP"
						${this.userData.two_factor_method == "TOTP" ? `checked` : ``}
						/>
						<div class="slider round"></div>
						</label>
						<div class="totp-qr-code-div">
							<img id="totp-qr-code" width=200 height=200 style="display: none" src="" alt="TOTP QR Code" />
						<div>
						</div>
					</div>
					<div class="email2FA-div" id="email2FA-div">
						<div class="checkbox-div">
						<label for="email2FA-checkbox" id="email2FA-checkbox-label">
							2FA with e-mail
						</label>
						<label class="switch">
						<input
						type="checkbox"
						id="email2FA-checkbox"
						name="email2FA-checkbox"
						value="email"
						${this.userData.two_factor_method == "email" ? `checked` : ``}
						/>
						<div class="slider round"></div>
						</label>
						</div>
						<div class="input-div email2FA-input-div">
						<input
						type="email"
						class="email2FA-input"
						minLength="4"
						maxLength="50"
						placeholder="E-mail"
						value="${this.formData.email ? this.formData.email : ``}"
						name="email"
						${this.userData.two_factor_method == "email" ? `` : `disabled`}
						/>
						</div>
					</div>
					<div class="sms2FA-div" id="sms2FA-div">
						<div class="checkbox-div">
						<label for="sms2FA-checkbox" id="sms2FA-checkbox-label">
							2FA with SMS
						</label>
						<label class="switch">
						<input
						type="checkbox"
						id="sms2FA-checkbox"
						name="sms2FA-checkbox"
						value="sms"
						${this.userData.two_factor_method == "sms" ? `checked` : ``}
						/>
						<div class="slider round"></div>
						</label>
						</div>
						<div class="input-div sms2FA-input-div">
						<input
						type="text"
						class="sms2FA-input"
						minLength="12"
						maxLength="12"
						placeholder="Phone number"
						value="${this.formData.phone_number ? this.formData.phone_number : ``}"
						name="phone_number"
						${this.userData.two_factor_method == "sms" ? `` : `disabled`}
						/>
						</div>
					</div>
				</div>
				<h2 class="account-error-message" id="account-error-message"></h2>
				<div class="d-flex flex-column align-items-center">
					<button type="submit" class="btn btn-success m-3 account-button" id="form-button">
						Update my info
					</button>
				</div>
				</form>
              </div>`
            : `
			  <div id="userinfo-main-div">
			 	<div class="avatar-main-div" id="avatar-main-div">
				${this.userData.avatar ? `<img src="https://127.0.0.1:8000/${this.userData.avatar}">` : `<img src="/profile.jpeg">`}
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
			  <div class="d-flex justify-center flex-column align-items-center app2FA-div">
				${
          this.isForm
            ? `<button class="btn btn-dark m-3 account-button" id="cancel-button">
								Cancel
								</button>`
            : `<button class="btn btn-dark m-3 account-button" id="update-user-info">
								Change my info
								</button>`
        }
				<button
					class="btn btn-danger m-3 account-button"
					id="delete-user-button"
				>
					Delete Account
				</button>
            </div>
			</div>
			</div>`;
  }
}
