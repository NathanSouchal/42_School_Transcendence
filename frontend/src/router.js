import state from "./app";
import { updateView } from "./utils";

export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentPage = window.location.pathname;
    this.routeParams = {};

    this.navigate = this.navigate.bind(this);

    window.onpopstate = () => {
      const currentPath = window.location.pathname;
      this.navigate(currentPath, false);
    };

    if (!history.state) {
      this.navigate(this.currentPage, false);
    }
  }

  matchRoute(path) {
    for (const route in this.routes) {
      const regex = new RegExp(
        `^${route.replace(/:\w+/g, "([^/]+)").replace(/\/$/, "")}\/?$`
      );
      const match = path.match(regex);
      if (match) {
        const keys = (route.match(/:(\w+)/g) || []).map((key) =>
          key.substring(1)
        );
        const values = match.slice(1);
        this.routeParams = keys.reduce(
          (params, key, index) => ({ ...params, [key]: values[index] }),
          {}
        );
        return this.routes[route];
      }
    }
    return null;
  }

  async navigate(path, shouldPushState = true) {
    state.state.lastRoute = this.currentPath;
    let view = this.matchRoute(path);
    if (!view) {
      view = this.matchRoute("/404");
      path = "/404";
    }
    if (this.currentPage && typeof this.currentPage.destroy === "function") {
      this.currentPage.destroy();
    }

    this.currentPage = view;
    this.currentPath = path;

    if (
      typeof view.initialize === "function" &&
      !view.isInitialized &&
      !view.isRouteId
    ) {
      await view.initialize(this.routeParams || {});
    } else if (typeof view.render === "function") {
      await updateView(view, this.routeParams || {});
    }

    if (shouldPushState) {
      if (history.state) {
        window.history.pushState({}, "", path);
      } else {
        window.history.replaceState({}, "", path);
      }
    }
  }
}
