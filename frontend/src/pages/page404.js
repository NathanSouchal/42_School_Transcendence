import DOMPurify from "dompurify";

export default class page404 {
  constructor(state) {
    this.state = state;
  }
  initialize(routeParams = {}) {
    this.render();
  }
  render(routeParams = {}) {
    const userData = this.state.data.username;
    const sanitizedData = DOMPurify.sanitize(userData);
    return `<div class="container mt-5"><h1>404</h1></div>`;
  }
}
