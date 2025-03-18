class PaddleControls {
  constructor(paddle, keymaps, size) {
    this.paddle = paddle;
    this.size = size;
    this.keymaps = keymaps;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.paddle.needsRemoving = true;
    this.deltaFactor = 30;
    this.setupEventListeners();
    this.action = "null";
    this.last_action = "null";
  }

  setupEventListeners() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  handleKeyDown(event) {
    if (event.key === this.keymaps.bottom) {
      this.action = "down";
    }
    if (event.key === this.keymaps.top) {
      this.action = "up";
    }
  }

  handleKeyUp(event) {
    if (event.key === this.keymaps.bottom) {
      this.action = "stop";
    }
    if (event.key === this.keymaps.top) {
      this.action = "stop";
    }
  }

  update(deltaTime, gameManager) {
    if (this.action != this.last_action) {
      switch (this.action) {
        case "up":
          gameManager.sendPaddleMove("up", this.paddle.side, deltaTime);
          this.last_action = "up";
          break;
        case "down":
          gameManager.sendPaddleMove("down", this.paddle.side, deltaTime);
          this.last_action = "down";
          break;
        case "stop":
          gameManager.sendPaddleMove("stop", this.paddle.side, deltaTime);
          this.last_action = "stop";
          break;
      }
    }
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }
}

export default PaddleControls;
