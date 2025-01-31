import DOMPurify from "dompurify";
import { handleHeader } from "../utils.js";

export default class page404 {
  constructor(state) {
    this.state = state;
  }
  async initialize(routeParams = {}) {
    const content = this.render();
    const container = document.getElementById("app");
    if (container) {
      container.innerHTML = content;
    }
  }
  render(routeParams = {}) {
    handleHeader(this.state.isUserLoggedIn, false);
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData);
    return `<div class="container mt-5">
				<h1 class="text-capitalize w-100 text-center">Error 404</h1>
				<h2 class="text-center mt-4">woooops this page was not found</h2>
			</div>`;
  }
}
