export class State {
  constructor() {
    if (State.instance) {
      return State.instance; // Retourner l'instance existante si elle existe déjà
    }
    this.state = { isGamePage: false, gameStarted: false };
    this.data = {};
    this.listeners = [];
    State.instance = this;
  }

  updateData(newData) {
    this.data = { ...this.data, ...newData };
    this.notifyListeners();
  }

  setIsGamePage(isGamePage) {
    console.log("setIsGamePage appelé avec :", isGamePage);
    if (this.state.isGamePage !== isGamePage) {
      this.state.isGamePage = isGamePage;
      this.notifyListeners();
    } else {
      console.log("setIsGamePage appelé sans changement.");
    }
  }

  setGameStarted(value) {
    this.state.gameStarted = value;
    this.notifyListeners();
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    //console.log("Abonnement ajouté :", listener.name || listener);
    this.listeners.push(listener);
  }

  unsubscribe(listener) {
    //console.log("Abonnement retiré :", listener.name || listener);
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }
}
