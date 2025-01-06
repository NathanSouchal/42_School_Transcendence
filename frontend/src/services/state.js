export class State {
  constructor() {
    this.data = {};
    this.listeners = [];
  }

  update(newData) {
    this.data = { ...this.data, ...newData };
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.data));
  }
}
