import * as THREE from "three";

class PaddleControls {
  constructor(paddle, controls, size) {
    this.paddle = paddle;
    this.size = size;
    this.controls = controls;
    this.state = {
      left: false,
      right: false,
    };
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.paddle.needsRemoving = true;
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

    if (event.key === this.controls.keyboardKeys.left) {
      this.state.left = true;
    }
    if (event.key === this.controls.keyboardKeys.right) {
      this.state.right = true;
    }
  }

  handleKeyUp(event) {
    if (!this.controls.keyboardControl) return;

    if (event.key === this.controls.keyboardKeys.left) {
      this.state.left = false;
    }
    if (event.key === this.controls.keyboardKeys.right) {
      this.state.right = false;
    }
  }

  update(deltaTime, ballX) {
    if (this.controls.keyboardControl) {
      if (this.state.left) {
        this.paddle.obj.position.x -= this.controls.movementSpeed;
      }
      if (this.state.right) {
        this.paddle.obj.position.x += this.controls.movementSpeed;
      }
      this.constrainPaddlePosition();
    }
  }

  constrainPaddlePosition() {
    const arenaWidth = this.size.arena_width - this.size.border_width * 2;
    const paddleWidth = this.size.paddle_width;
    const halfArenaWidth = arenaWidth / 2;
    const halfPaddleWidth = paddleWidth / 2;

    this.paddle.obj.position.x = THREE.MathUtils.clamp(
      this.paddle.obj.position.x,
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
