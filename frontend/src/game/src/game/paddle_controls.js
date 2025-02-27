import * as THREE from "three";

class PaddleControls {
  constructor(paddle, keymaps, size) {
    this.paddle = paddle;
    this.size = size;
    this.keymaps = keymaps;
    this.state = {
      bottom: false,
      top: false,
    };
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.paddle.needsRemoving = true;
    this.deltaFactor = 30;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  handleKeyDown(event) {
    if (event.key === this.keymaps.bottom) {
      this.state.bottom = true;
    }
    if (event.key === this.keymaps.top) {
      this.state.top = true;
    }
  }

  handleKeyUp(event) {
    if (event.key === this.keymaps.bottom) {
      this.state.bottom = false;
    }
    if (event.key === this.keymaps.top) {
      this.state.top = false;
    }
  }

  update(deltaTime, gameManager) {
    if (this.state.bottom) {
      gameManager.sendPaddleMove("down", this.paddle.side, deltaTime);
    }
    if (this.state.top) {
      gameManager.sendPaddleMove("up", this.paddle.side, deltaTime);
    }
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }
}

export default PaddleControls;
