import DOMPurify from "dompurify";
import { handleHeader, updateView } from "../utils.js";

export default class page404 {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
  }
  async initialize(routeParams = {}) {
    await updateView(this);
  }

  async handleStateChange(newState) {
    console.log("NEWGameHasLoaded : " + newState.gameHasLoaded);
    console.log("PREVGameHasLoaded2 : " + this.previousState.gameHasLoaded);
    if (newState.gameHasLoaded && !this.previousState.gameHasLoaded) {
      console.log("GameHasLoaded state changed, rendering 404 page");
      await updateView(this);
    }
    this.previousState = { ...newState };
  }

  async render(routeParams = {}) {
    handleHeader(this.state.isUserLoggedIn, false);
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData);
    return `<div class="container mt-5">
				<h1 class="text-capitalize w-100 text-center">Error 404</h1>
				<h2 class="text-center mt-4">woooops this page was not found</h2>
			</div>`;
  }
}
