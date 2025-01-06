export default class EventHandler {
  constructor(game) {
    this.game = game;
  }

  setPlayerType(paddle, type) {
    if (paddle === "left") {
      this.game.paddleLeft.choosePlayer(type);
      this.game.player_types.left = type;
    } else {
      this.game.paddleRight.choosePlayer(type);
      this.game.player_types.right = type;
    }
    this.updateControlButtons();
  }

  updateControlButtons() {
    document
      .getElementById("left-player")
      .classList.toggle("active", this.game.player_types.left === "player");
    document
      .getElementById("left-robot")
      .classList.toggle("active", this.game.player_types.left === "robot");

    document
      .getElementById("right-player")
      .classList.toggle("active", this.game.player_types.right === "player");
    document
      .getElementById("right-robot")
      .classList.toggle("active", this.game.player_types.right === "robot");
  }

  setupControls() {
    document
      .getElementById("left-player")
      .addEventListener("click", () => this.setPlayerType("left", "player"));
    document
      .getElementById("left-robot")
      .addEventListener("click", () => this.setPlayerType("left", "robot"));
    document
      .getElementById("right-player")
      .addEventListener("click", () => this.setPlayerType("right", "player"));
    document
      .getElementById("right-robot")
      .addEventListener("click", () => this.setPlayerType("right", "robot"));

    this.updateControlButtons();
  }
}
