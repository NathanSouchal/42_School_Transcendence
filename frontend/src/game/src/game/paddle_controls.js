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

  update(deltaTime, ballX, sendPositionToServer) {
    if (this.controls.keyboardControl) {
      if (this.state.bottom) {
        this.paddle.obj.position.x -= deltaTime * this.controls.deltaFactor;
      }
      if (this.state.top) {
        this.paddle.obj.position.x += deltaTime * this.controls.deltaFactor;
      }
      this.constrainPaddlePosition();
      if (sendPositionToServer && typeof sendPositionToServer === "function") {
        const paddlePosition = {
          paddle: {
            x: this.paddle.obj.position.x,
          },
        };
        sendPositionToServer(paddlePosition);
      }
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
