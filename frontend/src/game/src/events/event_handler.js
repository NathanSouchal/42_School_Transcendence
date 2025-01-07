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
  //
  // updateControlButtons() {
  //   document
  //     .getElementById("top-player")
  //     .classList.toggle("active", this.game.player_types.top === "player");
  //   document
  //     .getElementById("top-robot")
  //     .classList.toggle("active", this.game.player_types.top === "robot");
  //
  //   document
  //     .getElementById("bottom-player")
  //     .classList.toggle("active", this.game.player_types.bottom === "player");
  //   document
  //     .getElementById("bottom-robot")
  //     .classList.toggle("active", this.game.player_types.bottom === "robot");
  // }
  //
  // setupControls() {
  //   document
  //     .getElementById("start-pvp-game")
  //     .addEventListener("click", () => this.setPlayerType("left", "player"));
  //   document
  //     .getElementById("start-pvp-game")
  //     .addEventListener("click", () => this.setPlayerType("right", "player"));
  //   document
  //     .getElementById("start-pvr-game")
  //     .addEventListener("click", () => this.setPlayerType("left", "robot"));
  //   document
  //     .getElementById("start-pvr-game")
  //     .addEventListener("click", () => this.setPlayerType("right", "player"));
  //
  //   this.updateControlButtons();
  // }
}
