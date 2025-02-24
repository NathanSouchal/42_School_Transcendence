import * as THREE from "three";
import state from "../../../app";

class Robot {
  constructor(paddle, size) {
    this.paddle = paddle;
    this.size = size;
    this.difficulty = state.botDifficulty;
    this.inverseDifficulty = 6 - this.difficulty;
    this.deltaFactor = 30;
    this.half_width = this.paddle.paddle_half_width;
    this.state = {
      top: false,
      bottom: false,
    };
    this.target_x = 0;
    this.last_target_x = 0;
    // this.half_width = 3.42; // BAD
    this.timeSinceLastView = 0;
  }

  predictBallPosition(position, velocity) {
    const arenaWidth = this.size.arena_width - this.size.border_width * 2;
    const halfArenaWidth = arenaWidth / 2;
    const paddleZ = this.paddle.obj.position.z;
    const timeToReach = (paddleZ - position.z) / velocity.z;
    let predictedX = position.x + velocity.x * timeToReach;

    while (predictedX < -halfArenaWidth || predictedX > halfArenaWidth) {
      if (predictedX < -halfArenaWidth) {
        predictedX = -halfArenaWidth + (-predictedX - halfArenaWidth);
      }
      if (predictedX > halfArenaWidth) {
        predictedX = halfArenaWidth - (predictedX - halfArenaWidth);
      }
    }
    return predictedX;
  }

  moveTowardsTarget(deltaTime) {
    const currentX = this.paddle.obj.position.x;

    if (this.target_x !== this.last_target_x) {
      this.offset =
        this.inverseDifficulty > 1 ? Math.random() * this.inverseDifficulty : 0;
      this.last_target_x = this.target_x;
    }
    if (currentX + this.half_width < this.target_x - this.offset) {
      this.state.top = true;
      this.state.bottom = false;
    } else if (currentX - this.half_width > this.target_x + this.offset) {
      this.state.top = false;
      this.state.bottom = true;
    } else {
      this.state.top = false;
      this.state.bottom = false;
    }
  }

  updatePaddlePosition(deltaTime) {
    if (this.state.bottom) {
      this.paddle.obj.position.x -= deltaTime * this.deltaFactor;
    }
    if (this.state.top) {
      this.paddle.obj.position.x += deltaTime * this.deltaFactor;
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

  update(deltaTime, position, velocity) {
    this.timeSinceLastView += deltaTime;

    if (this.timeSinceLastView >= 1) {
      this.target_x = this.predictBallPosition(position, velocity);
      this.timeSinceLastView = 0;
    }
    this.moveTowardsTarget(deltaTime);
    this.updatePaddlePosition(deltaTime);
    this.constrainPaddlePosition();
  }
}

export default Robot;
