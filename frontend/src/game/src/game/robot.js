import * as THREE from "three";
import state from "../../../app";

class Robot {
  constructor(paddle, size) {
    this.paddle = paddle;
    this.size = size;
    this.difficulty = state.botDifficulty;
    this.inverseDifficulty = 6 - this.difficulty;
    this.deltaFactor = 30;
    this.half_width = 3.42;
    this.target_x = 0;
    this.last_target_x = 0;
    this.timeSinceLastView = 0;
    this.action = "null";
    this.last_action = "null";
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

  moveTowardsTarget(deltaTime, gameManager) {
    const currentX = this.paddle.pos.x;

    if (this.target_x !== this.last_target_x) {
      this.offset =
        this.inverseDifficulty >= 1
          ? Math.random() * this.inverseDifficulty - 0.5
          : 0;
      this.last_target_x = this.target_x;
    }
    if (currentX + this.half_width < this.target_x - this.offset) {
      gameManager.sendPaddleMove("up", this.paddle.side, deltaTime);
    } else if (currentX - this.half_width > this.target_x + this.offset) {
      gameManager.sendPaddleMove("down", this.paddle.side, deltaTime);
    } else {
      gameManager.sendPaddleMove("stop", this.paddle.side, deltaTime);
    }
  }

  sendAction() {
    if (this.action != this.last_action) {
      switch (this.action) {
        case "up":
          gameManager.sendPaddleMove("up", this.paddle.side, deltaTime);
          this.last_action = "up";
        case "down":
          gameManager.sendPaddleMove("down", this.paddle.side, deltaTime);
          this.last_action = "down";
        case "stop":
          gameManager.sendPaddleMove("stop", this.paddle.side, deltaTime);
          this.last_action = "stop";
      }
    }
  }

  update(deltaTime, gameManager, position, velocity) {
    this.timeSinceLastView += deltaTime;

    if (this.timeSinceLastView >= 1) {
      this.target_x = this.predictBallPosition(position, velocity);
      this.timeSinceLastView = 0;
    }
    this.moveTowardsTarget(deltaTime, gameManager);
    this.sendAction();
  }
}

export default Robot;
