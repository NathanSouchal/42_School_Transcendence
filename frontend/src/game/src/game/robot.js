import * as THREE from "three";

class Robot {
  constructor(paddle, size, difficulty = 4) {
    this.paddle = paddle;
    this.size = size;
    this.difficulty = difficulty;
    this.inverseDifficulty = 6 - this.difficulty;
    this.deltaFactor = 30;
    this.half_width = this.paddle.paddle_half_width;
    this.state = {
      top: false,
      bottom: false,
    };
    this.target_x = 0;
    this.last_target_x = 0;
    this.half_width = 3.42; // BAD
  }

  predictBallPosition(position, velocity) {
    const arenaWidth = this.size.arena_width - this.size.border_width * 2;
    const halfArenaWidth = arenaWidth / 2;
    const paddleZ = this.paddle.pos.z;
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
    const currentX = this.paddle.pos.x;

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

  updatePaddlePosition(deltaTime, gameManager) {
    if (this.state.bottom) {
      gameManager.sendPaddleMove("down", this.paddle.side, deltaTime);
    }
    if (this.state.top) {
      gameManager.sendPaddleMove("up", this.paddle.side, deltaTime);
    }
  }

  update(deltaTime, gameManager, position, velocity) {
    this.target_x = this.predictBallPosition(position, velocity);
    this.moveTowardsTarget(deltaTime);
    this.updatePaddlePosition(deltaTime, gameManager);
  }
}

export default Robot;
