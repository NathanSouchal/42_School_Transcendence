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
    this.timeSinceLastView = 0;
    this.lastBallPosition = {x: 0 ,z: 0};
    this.lastBallVelocity = {x: 0 ,z: 0};
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

  extrapolateBallPositionWithRebounds(lastBallPosition, lastBallVelocity, extrapolatedTime) {
    // Dimensions de l'arène
    const arenaHeight = this.size.arena_width - this.size.border_width * 2;
    const halfArenaHeight = arenaHeight / 2;
    const arenaWidth = this.size.arena_height - this.size.border_height * 2;
    const halfArenaWidth = arenaWidth / 2;
    
  
    let posX = lastBallPosition.x; // Position en X (horizontal)
    let posZ = lastBallPosition.z; // Position en Z (profondeur)
    let velX = lastBallVelocity.x; // Vitesse en X
    let velZ = lastBallVelocity.z; // Vitesse en Z (profondeur)
  
    let timeRemaining = extrapolatedTime;
    const dtStep = 0.01; // Petit pas de simulation
  
    while (timeRemaining > 0) {
      const step = Math.min(dtStep, timeRemaining);
      
      // Mise à jour des positions
      posX += velX * step;
      posZ += velZ * step;
      
      timeRemaining -= step;
  
      // Vérifier si la balle touche un mur en haut ou en bas (rebond en Z uniquement)
      if (posZ < -halfArenaHeight) {
        posZ = -halfArenaHeight + (-halfArenaHeight - posZ);
        velZ = -velZ; // Inversion de la vitesse verticale uniquement
      } else if (posZ > halfArenaHeight) {
        posZ = halfArenaHeight - (posZ - halfArenaHeight);
        velZ = -velZ; // Inversion de la vitesse verticale uniquement
      }
  
      // Vérifier si la balle atteint la zone du paddle adverse (rebond sur le paddle)
      if (posZ < -halfArenaWidth) {
        velX = -velX * 1.1; // Légère augmentation pour simuler un effet de rebond naturel
        velZ = -velZ;
      } else if (posZ > halfArenaWidth) {
        velX = -velX * 1.1; // Légère augmentation pour simuler un effet de rebond naturel
        velZ = -velZ;
      }
    }
    return posZ; // Retourne la position Z de la balle après extrapolation
  }
  


  update(deltaTime, position, velocity) {
    // Accumuler le deltaTime pour simuler une mise à jour complète une fois par seconde
    this.timeSinceLastView += deltaTime;
    if (this.timeSinceLastView >= 1) {
      // Rafraîchir la vue complète : recalcul de la prédiction
      this.target_x = this.predictBallPosition(position, velocity);
      // Stocker la dernière prédiction et les données associées pour l'extrapolation
      this.lastTarget_x = this.target_x;
      this.lastBallPosition = { x: position.x, z: position.z };
      this.lastBallVelocity = { x: velocity.x, z: velocity.z };
      this.timeSinceLastView = 0;
    } else if ((this.timeSinceLastView <= 0.3 || this.timeSinceLastView >= 0.6) && this.timeSinceLastView < 1){
      this.target_x = this.extrapolateBallPositionWithRebounds(
        this.lastBallPosition,
        this.lastBallVelocity,
        this.timeSinceLastView
      );
    }
    this.moveTowardsTarget(deltaTime);
    this.updatePaddlePosition(deltaTime);
    this.constrainPaddlePosition();
  }
  
}

export default Robot;
