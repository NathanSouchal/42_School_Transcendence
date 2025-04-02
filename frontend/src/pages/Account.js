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

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "blablabla";

export default class Account {
  constructor(state) {
    this.pageName = "Account";
    this.state = state;
    this.previousState = { ...state.state };
    this.isSubscribed = false;
    this.isInitialized = false;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.userData = {};
    this.formData = {};
    this.lastDeleted = 0;
    this.isForm = false;
    this.eventListeners = [];
    this.deleteUserVerification = false;
    this.lang = null;
    this.isProcessing = false;
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;
    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    if (!this.state.state.gameHasLoaded) return;
    await updateView(this, {});
  }

  attachEventListeners() {
    // Attache le listener de navigation sur tous les liens <a>
    document.querySelectorAll("a").forEach((link) => {
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
      { id: "confirm-delete-user", action: "confirm-delete-user" },
      { id: "cancel-delete-user", action: "cancel-delete-user" },
      { id: "cancel-button", action: "cancel-button" },
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
        const listener = this.handleChangeInput.bind(this);
        input.addEventListener("input", listener);
        this.eventListeners.push({
          name: input.name,
          type: "input",
          element: input,
          listener,
        });
      }
    });
  }

  handleNavigation(e) {
    const target = e.target.closest("a");
    if (target && target.href.startsWith(window.location.origin)) {
      e.preventDefault();
      router.navigate(target.getAttribute("href"));
    }
  }

  async handleStateChange(newState) {
    if (
      (newState.gameHasLoaded && !this.previousState.gameHasLoaded) ||
      newState.lang !== this.previousState.lang
    ) {
      this.previousState = { ...newState };
      await updateView(this, {});
    } else {
      this.previousState = { ...newState };
    }
  }

  handleChangeInput(e) {
    this.formData[e.target.name] = e.target.value;
  }

  async handleFile(key, file) {
    setDisable(true, "avatar");
    if (key == "avatar") {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      const maxSize = 5 * 1024 * 1024;
      const fileInput = file;
      const label = document.querySelector(".file-label");
      if (fileInput) {
        if (!allowedTypes.includes(fileInput.type)) {
          this.displayAccountErrorMessage(trad[this.lang].errors.imgType);
          label.textContent = trad[this.lang].account.fileLabel;
          setDisable(false, "avatar");
          return;
        }
        if (fileInput.size > maxSize) {
          this.displayAccountErrorMessage(trad[this.lang].errors.imgSize);
          label.textContent = trad[this.lang].account.fileLabel;
          setDisable(false, "avatar");
          return;
        }
        let filename = fileInput.name;
        if (fileInput.name.length > 10) {
          filename =
            fileInput.name.slice(0, 7) + `...${fileInput.type.slice(6)}`;
        }
        label.textContent = filename;
        const reader = new FileReader();
        reader.onload = (e) => {
          this.formData.avatar = e.target.result;
        };
        reader.readAsDataURL(fileInput);
      } else label.textContent = trad[this.lang].account.fileLabel;
    }
    setDisable(false, "avatar");
  }

  async handleClick(key) {
    setDisable(true, key);
    if (key === "cancel-button" || key === "update-user-info") {
      this.isForm = !this.isForm;
      await updateView(this, {});
      if (this.isForm) {
        const checked2fa = document.getElementById("app2FA-checkbox")?.checked;
        if (checked2fa) {
          await this.getQrcode();
        }
      }
    } else if (key === "delete-user-button") {
      await this.deleteUser();
    } else if (key === "confirm-delete-user") {
      await this.confirmDeleteUser(this.state.state.userId);
    } else if (key === "cancel-delete-user") {
      await this.cancelDeleteUser();
    }
    setDisable(false, key);
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      await this.updateUserInfo(this.state.state.userId);
      await this.fetchData(this.userData.id);
      this.isForm = !this.isForm;
      await updateView(this, {});
    } catch (error) {
      console.error(error);
    } finally {
      this.isProcessing = false;
    }
  }

  async handleCheckBox(checkbox, inputField, checkboxes) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    checkboxes.forEach(({ id }) => {
      const otherCheckbox = document.getElementById(id);
      if (otherCheckbox !== checkbox) otherCheckbox.checked = false;
    });

    document
      .querySelectorAll(".email2FA-input, .sms2FA-input")
      .forEach((input) => {
        input.disabled = true;
        input.required = false;
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

    this.isProcessing = false;
  }

  async fetchData(id) {
    try {
      const response = await API.get(`/user/${id}/`);
      const data = response.data;
      this.userData = data.user;
      if (data.user.avatar) await this.buildAvatarImgLink(data.user.avatar);
      else this.userData.avatar = "/profile.jpeg";
      this.formData.username = data.user.username;
      this.formData.alias = data.user.alias;
      this.formData.email = data.user.email;
      this.formData.phone_number = data.user.phone_number;
      this.formData.two_factor_method = data.user.two_factor_method;
    } catch (error) {
      console.error("Error while trying to get data:", error);
      this.userData = {};
      throw error;
    }
  }

  async buildAvatarImgLink(link) {
    try {
      const res = await axios.head(`${link}`);
      if (res.status === 200) this.userData.avatar = `${link}`;
    } catch (error) {
      this.userData.avatar = "/profile.jpeg";
    }
  }

  async getQrcode() {
    try {
      const response = await API.get(`/auth/generate-qrcode/`);
      const data = response.data;
      const qrCode = document.getElementById("totp-qr-code");
      if (qrCode) {
        qrCode.src = `data:image/png;base64,${data.qr_code}`;
        qrCode.style.display = "block";
      }
    } catch (error) {
      console.error(`Error while trying to get qrcode : ${error}`);
    }
  }

  async updateUserInfo(id) {
    setDisable(true, "form-button");
    try {
      if (
        !Object.keys(this.formData).length ||
        !this.formData.username?.length ||
        !this.formData.alias?.length
      ) {
        this.displayAccountErrorMessage(trad[this.lang].errors.fields);
        throw new Error(trad[this.lang].errors.fields);
      }
      let regex = /^\w+$/;
      if (!regex.test(this.formData.username)) {
        this.displayAccountErrorMessage(trad[this.lang].errors.username);
        throw new Error(trad[this.lang].errors.username);
      }
      if (this.formData.username.length < 4) {
        this.displayAccountErrorMessage(
          trad[this.lang].errors.usernameMinlength
        );
        throw new Error(trad[this.lang].errors.usernameMinlength);
      }
      if (this.formData.username.length > 10) {
        this.displayAccountErrorMessage(
          trad[this.lang].errors.usernameMaxlength
        );
        throw new Error(trad[this.lang].errors.usernameMaxlength);
      }
      if (!regex.test(this.formData.alias)) {
        this.displayAccountErrorMessage(trad[this.lang].errors.alias);
        throw new Error(trad[this.lang].errors.alias);
      }
      if (this.formData.username.alias < 4) {
        this.displayAccountErrorMessage(trad[this.lang].errors.aliasMinlength);
        throw new Error(trad[this.lang].errors.aliasMinlength);
      }
      if (this.formData.username.alias > 10) {
        this.displayAccountErrorMessage(trad[this.lang].errors.aliasMaxlength);
        throw new Error(trad[this.lang].errors.aliasMaxlength);
      }
      if (
        document.getElementById("sms2FA-checkbox").checked &&
        this.formData?.phone_number &&
        this.formData?.phone_number.slice(0, 3) !== "+33"
      ) {
        this.displayAccountErrorMessage(trad[this.lang].errors.phone);
        throw new Error(trad[this.lang].errors.phone);
      }
      const res = await API.put(`/user/${id}/`, this.formData);
      this.state.state.username = res.data.user.username;
      this.state.state.userAlias = res.data.user.alias;
      this.state.saveState();
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data
      ) {
        const errorData = error.response.data;
        if (errorData.phone_number)
          this.displayAccountErrorMessage(
            Object.values(errorData.phone_number)
          );
        if (errorData.errors)
          this.displayAccountErrorMessage(Object.values(errorData.errors)[0]);
        else if (errorData.no_phone_number)
          this.displayAccountErrorMessage(errorData.no_phone_number);
        else if (errorData.no_email)
          this.displayAccountErrorMessage(errorData.no_email);
        else if (errorData.wrong_avatar)
          this.displayAccountErrorMessage(errorData.wrong_avatar);
      } else if (error.response && error.response.status === 409)
        this.displayAccountErrorMessage(error.response.data.error);
      console.error(`Error while trying to update user data : ${error}`);
      throw error;
    } finally {
      setDisable(false, "form-button");
    }
  }

  async deleteUser() {
    const deleteVerificationDiv = document.getElementById(
      "delete-verification-div"
    );
    const deleteUserButton = document.getElementById("delete-user-button");
    if (deleteVerificationDiv && deleteUserButton) {
      deleteVerificationDiv.style.display = "block";
      deleteUserButton.style.display = "none";
    }
  }

  async cancelDeleteUser() {
    const deleteVerificationDiv = document.getElementById(
      "delete-verification-div"
    );
    const deleteUserButton = document.getElementById("delete-user-button");
    if (deleteVerificationDiv && deleteUserButton) {
      deleteVerificationDiv.style.display = "none";
      deleteUserButton.style.display = "block";
    }
  }

  async confirmDeleteUser(id) {
    this.deleteUserVerification = false;
    setDisable(true, "confirm-delete-user");
    try {
      await API.delete(`/user/${id}/`);
      this.lastDeleted = id;
      await updateView(this, {});
    } catch (error) {
      console.error("Error while trying to delete data:", error);
    } finally {
      setDisable(false, "confirm-delete-user");
    }
  }

  displayAccountErrorMessage(errorMsg) {
    const errorTitle = document.getElementById("account-error-message");
    if (errorTitle) errorTitle.textContent = errorMsg;
  }

  removeEventListener(name) {
    const event = this.eventListeners.find((el) => el.name === name);
    if (event) {
      event.element.removeEventListener(event.type, event.listener);
      console.log("Removed unique eventListener:", name);
      this.eventListeners = this.eventListeners.filter(
        (el) => el.name !== name
      );
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
    this.isForm = false;
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
    }
  }

  async render(routeParams = {}) {
    const isAuthenticated = await checkUserStatus();
    if (!isAuthenticated) return;

    await this.fetchData(this.state.state.userId);

    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    if (this.lang !== this.state.state.lang)
      handleHeader(this.state.isUserLoggedIn, false, true);
    else handleHeader(this.state.isUserLoggedIn, false, false);
    this.lang = this.state.state.lang;
    return `<div class="user-main-div account-main-div">
						<div class="user-main-content">
                          <div class="title-div">
                            <h1>${trad[this.lang].account.pageTitle}</h1>
                          </div>
              <div class="text-center mb-4" id="user-info-div">
			  ${
          this.isForm
            ? `<div id="userinfo-main-div">
				<form id="user-form">
			 	<div class="input-main-div" id="avatar-main-div">
					<img src="${this.userData.avatar}">
					<div class="input-div file-input-div">
						<label class="file-label" for="avatar">
							${trad[this.lang].account.fileLabel}
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
						${trad[this.lang].account.username}
					</label>
					<input
					type="text"
					class="form-control"
					minLength="4"
					maxLength="10"
					value="${this.formData.username ? this.formData.username : ``}"
					name="username"
					autocomplete="username"
					required
					/>
				</div>
				<div class="input-div" id="alias-main-div">
					<label for="alias">
						${trad[this.lang].account.alias}
					</label>
					<input
					type="text"
					class="form-control"
					minLength="4"
					maxLength="10"
					value="${this.formData.alias ? this.formData.alias : ``}"
					name="alias"
					autocomplete="auto"
					required
					/>
				</div>
				<div class="form-2FA-main-div" id="form-2FA-main-div">
					<div class="app2FA-div" id="app2FA-div">
						<div class="checkbox-div">
						<label for="app2FA-checkbox" id="app2FA-checkbox-label">
							${trad[this.lang].account.totp2faLabel}
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
						</div>
					</div>
					<div class="email2FA-div" id="email2FA-div">
						<div class="checkbox-div">
						<label for="email2FA-checkbox" id="email2FA-checkbox-label">
							${trad[this.lang].account.email2faLabel}
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
						autocomplete="email"
						${this.userData.two_factor_method == "email" ? `` : `disabled`}
						/>
						</div>
					</div>
					<div class="sms2FA-div" id="sms2FA-div">
						<div class="checkbox-div">
						<label for="sms2FA-checkbox" id="sms2FA-checkbox-label">
							${trad[this.lang].account.sms2faLabel}
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
						autocomplete="tel"
						${this.userData.two_factor_method == "sms" ? `` : `disabled`}
						/>
						</div>
					</div>
				</div>
				<h2 class="account-error-message" id="account-error-message"></h2>
				<div class="d-flex flex-column align-items-center">
					<button type="submit" class="btn btn-success m-3 account-button" id="form-button">
						${trad[this.lang].account.update}
					</button>
				</div>
				</form>
              </div>`
            : `
			  <div id="userinfo-main-div">
			 	<div class="avatar-main-div" id="avatar-main-div">
				<img src="${this.userData.avatar}">
				</div>
				<div class="username-title-div" id="username-main-div">
					<h2 class="username-title">
					${trad[this.lang].account.username + `` + `:`}
					</h2>
					<h2 class="username-title-value">
					${this.userData.username ? `${this.userData.username}` : ""}
					</h2>
				</div>
				<div class="alias-title-div" id="alias-main-div">
					<h2 class="alias-title">
					${trad[this.lang].account.alias + `` + `:`}
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
            ? `<button type="button" class="btn btn-dark m-3 account-button" id="cancel-button">
								${trad[this.lang].account.cancel}
								</button>`
            : `<button type="button" class="btn btn-dark m-3 account-button" id="update-user-info">
								${trad[this.lang].account.change}
								</button>`
        }
        <button class="btn btn-danger mb-2" id="delete-user-button" style="display: block">${trad[this.lang].account.delete}</button>
        <div id="delete-verification-div" style="display: none">
				  <p class="text-danger">${trad[this.lang].account.sure}</p>
				  <div class="delete-account-confirm-div">
					<button type="button" class="btn btn-success mb-2" id="confirm-delete-user">${trad[this.lang].account.yes}</button>
					<button type="button" class="btn btn-danger mb-2" id="cancel-delete-user">${trad[this.lang].account.no}</button>
				  </div>
				</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
