export class State {
  constructor() {
    if (State.instance) {
      return State.instance; // Retourner l'instance existante si elle existe déjà
    }
    this.state = { isGamePage: false };
    this.data = {};
    this.listeners = [];
  }

  updateData(newData) {
    this.data = { ...this.data, ...newData };
    this.notifyListeners();
  }

  setIsGamePage(isGamePage) {
    if (this.state.isGamePage !== isGamePage) {
      this.state.isGamePage = isGamePage;
      console.log(this.state.isGamePage);
      this.notifyListeners();
    }
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.data));
  }
}
