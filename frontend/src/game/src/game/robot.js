import * as THREE from "three";

class Robot {
  constructor(paddle, size, difficulty = 5) {
    this.paddle = paddle;
    this.size = size;
    this.difficulty = difficulty;
    this.inverseDifficulty = 6 - this.difficulty;
    this.speed = 0.4;
    this.state = {
      right: false,
      left: false,
    };
    this.last_turn = 0;
    this.turn_cooldown = 100;
    this.aiming = false;
    this.last_ball_update = 0;
    this.ball_cooldown = 300;
    this.margin = 0.3;
    this.last_ball_x = 0;
    this.target_x = 0;
    this.last_target_x = 0;
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
    const currentTime = Date.now();
    const currentX = this.paddle.obj.position.x;

    if (this.target_x !== this.last_target_x) {
      this.offset =
        this.inverseDifficulty > 1 ? Math.random() * this.inverseDifficulty : 0;
      this.last_target_x = this.target_x;
    }

    if (
      currentX + this.half_width <
      this.target_x - this.margin - this.offset
    ) {
      this.state.right = true;
      this.state.left = false;
      this.last_turn = currentTime;
    } else if (
      currentX - this.half_width >
      this.target_x + this.margin + this.offset
    ) {
      this.state.right = false;
      this.state.left = true;
      this.last_turn = currentTime;
    } else {
      this.state.right = false;
      this.state.left = false;
    }
  }

  updatePaddlePosition() {
    if (this.state.left) {
      this.paddle.obj.position.x -= this.speed;
    }
    if (this.state.right) {
      this.paddle.obj.position.x += this.speed;
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
    this.target_x = this.predictBallPosition(position, velocity);
    this.moveTowardsTarget(deltaTime);
    this.updatePaddlePosition();
    this.constrainPaddlePosition();
  }
}

export default Robot;
