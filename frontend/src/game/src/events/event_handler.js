export default class EventHandler {
  constructor(game) {
    this.game = game;
  }

  setPlayerType(paddle, type) {
    if (paddle === "top") {
      this.game.paddleTop.choosePlayer(type);
      this.game.player_types.top = type;
    } else {
      this.game.paddleBottom.choosePlayer(type);
      this.game.player_types.bottom = type;
    }
    this.updateControlButtons();
  }

  updateControlButtons() {
    document
      .getElementById("top-player")
      .classList.toggle("active", this.game.player_types.top === "player");
    document
      .getElementById("top-robot")
      .classList.toggle("active", this.game.player_types.top === "robot");

    document
      .getElementById("bottom-player")
      .classList.toggle("active", this.game.player_types.bottom === "player");
    document
      .getElementById("bottom-robot")
      .classList.toggle("active", this.game.player_types.bottom === "robot");
  }

  setupControls() {
    document
      .getElementById("top-player")
      .addEventListener("click", () => this.setPlayerType("top", "player"));
    document
      .getElementById("top-robot")
      .addEventListener("click", () => this.setPlayerType("top", "robot"));
    document
      .getElementById("bottom-player")
      .addEventListener("click", () => this.setPlayerType("bottom", "player"));
    document
      .getElementById("bottom-robot")
      .addEventListener("click", () => this.setPlayerType("bottom", "robot"));

    this.updateControlButtons();
  }
}
