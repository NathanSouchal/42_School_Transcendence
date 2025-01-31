import * as THREE from "three";

class PaddleControls {
  constructor(paddle, controls, size) {
    this.paddle = paddle;
    this.size = size;
    this.controls = controls;
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
    if (this.controls.keyboardControl) {
      window.addEventListener("keydown", this.handleKeyDown);
      window.addEventListener("keyup", this.handleKeyUp);
    }
  }

  handleKeyDown(event) {
    if (!this.controls.keyboardControl) return;

    if (event.key === this.controls.keyboardKeys.bottom) {
      this.state.bottom = true;
    }
    if (event.key === this.controls.keyboardKeys.top) {
      this.state.top = true;
    }
  }

  handleKeyUp(event) {
    if (!this.controls.keyboardControl) return;

    if (event.key === this.controls.keyboardKeys.bottom) {
      this.state.bottom = false;
    }
    if (event.key === this.controls.keyboardKeys.top) {
      this.state.top = false;
    }
  }

  update(deltaTime) {
    if (this.controls.keyboardControl) {
      if (this.state.bottom) {
        this.paddle.pos.x -= deltaTime * this.deltaFactor;
      }
      if (this.state.top) {
        this.paddle.pos.x += deltaTime * this.deltaFactor;
      }
      this.constrainPaddlePosition();
    }
  }

  constrainPaddlePosition() {
    const arenaWidth = this.size.arena_width - this.size.border_width * 2;
    const paddleWidth = this.size.paddle_width;
    const halfArenaWidth = arenaWidth / 2;
    const halfPaddleWidth = paddleWidth / 2;

    this.paddle.pos.x = THREE.MathUtils.clamp(
      this.paddle.pos.x,
      -halfArenaWidth + halfPaddleWidth,
      halfArenaWidth - halfPaddleWidth,
    );
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }
}

export default PaddleControls;
