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

  moveTowardsTarget() {
    const currentX = this.paddle.obj.position.x;

    if (this.target_x !== this.last_target_x) {
      this.offset =
        this.inverseDifficulty >= 1
          ? Math.random() * this.inverseDifficulty * 3
          : 0;
      this.last_target_x = this.target_x;
      
      // console.log("this.inverseDifficulty: ", this.inverseDifficulty);
      // console.log("this.difficulty: ", this.difficulty);
      // console.log("state.botDifficulty: ", state.botDifficulty);
    }
    if (currentX + this.half_width < this.target_x - this.offset) {
      console.log("this.offset: ", this.offset);
      this.action = "up";
    } else if (currentX - this.half_width > this.target_x + this.offset) {
      console.log("this.offset: ", this.offset);
      this.action = "down";
    } else {
      this.action = "stop";
    }
  }

  sendAction(deltaTime, gameManager) {
    if (this.action !== this.last_action) {
      gameManager.sendPaddleMove(this.action, this.paddle.side, deltaTime);
      this.last_action = this.action;
    }
  }

  update(deltaTime, gameManager, position, velocity) {
    this.timeSinceLastView += deltaTime;

    if (this.timeSinceLastView >= 1) {
      this.target_x = this.predictBallPosition(position, velocity);
      this.timeSinceLastView = 0;
    }
    this.moveTowardsTarget();
    this.sendAction(deltaTime, gameManager);
  }
}

export default Robot;
