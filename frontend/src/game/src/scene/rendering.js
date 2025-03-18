import * as THREE from "three";
import state from "../../../app.js";

class Renderer {
  constructor(renderer, scene, camera, game, stat) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.game = game;
    this.stat = stat;
    this.previousTime = performance.now();
    this.zMax = game.paddleLeft.size.arena_depth;
    this.depth = game.paddleLeft.size.paddle_depth;
    this.elapsedTime = 0;
  }

  resizeRendererToDisplaySize() {
    const canvas = this.renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width = Math.floor(canvas.clientWidth * pixelRatio);
    const height = Math.floor(canvas.clientHeight * pixelRatio);
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      this.renderer.setSize(width, height, false);
    }
    return needResize;
  }

  animate() {
    const render = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.previousTime) / 1000;
      this.previousTime = currentTime;

      if (state.state.gameIsPaused === false && !state.state.gameHasBeenWon) {
        this.paddlesInputUpdates(deltaTime);
        this.game.ball.updateRotation(deltaTime);
        if (state.collision.ballCollided) {
          this.game.ball.spawn_sparks(state.collision.point);
          if (state.collision.touchedPaddle) {
            if (state.collision.touchedPaddle === "left")
              this.game.paddleLeft.tap_animation(deltaTime);
            else if (state.collision.touchedPaddle === "right")
              this.game.paddleRight.tap_animation(deltaTime);
            state.collision = {};
          }
          state.collision.ballCollided = false;
        }
        this.game.ball.animate_sparks(deltaTime);
      }

      this.updateElementsPositions(deltaTime);

      this.game.paddleRight.animation_update(deltaTime);
      this.game.paddleLeft.animation_update(deltaTime);
      this.sceneRotationUpdate(deltaTime);
      this.terrainElementsUpdate(deltaTime);
      if (this.resizeRendererToDisplaySize()) {
        const canvas = this.renderer.domElement;
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
      }
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  updateElementsPositions() {
    const positions = this.gameManager.positions;

    // Get current client time and server timestamp
    const currentClientTime = Date.now() / 1000; // Convert to seconds to match Python's time.time()
    const serverTimestamp = positions.timestamp;
    // Calculate how old the server data is
    const dataAge = currentClientTime - serverTimestamp;
    // Set a threshold for when to use prediction (e.g., 100ms)
    const predictionThreshold = 0.01; // seconds

    if (dataAge > predictionThreshold && positions.ball.vel) {
      // Server data is old, use velocity to predict current position
      // console.error("Using predictions");
      const predictedX = positions.ball.pos.x + positions.ball.vel.x * dataAge;
      const predictedY = positions.ball.pos.y + positions.ball.vel.y * dataAge;
      const predictedZ = positions.ball.pos.z + positions.ball.vel.z * dataAge;
      this.game.ball.obj.position.set(predictedX, predictedY, predictedZ);
    } else {
      // console.log("Using server data");
      this.game.ball.obj.position.set(
        positions.ball.pos.x,
        positions.ball.pos.y,
        positions.ball.pos.z,
      );
    }

    this.game.paddleLeft.obj.position.x = positions.paddles.left.pos;
    this.game.paddleRight.obj.position.x = positions.paddles.right.pos;
    this.game.ball.velocity.set(
      positions.ball.vel.x,
      positions.ball.vel.y,
      positions.ball.vel.z,
    );
  }

  sceneRotationUpdate(deltaTime) {
    this.elapsedTime += deltaTime;
    // Rocking
    const rockingAngle = Math.sin(this.elapsedTime) * 0.05;
    this.game.sceneToRotateWithCamera.rotation.z = rockingAngle;

    // Rotation
    const rotationAngle = 0.02;
    this.game.sceneToRotateWithCamera.rotation.y =
      rotationAngle * this.elapsedTime;
  }

  paddlesInputUpdates(deltaTime) {
    if (state.gameMode != "OnlineLeft") {
      this.game.paddleRight.player.update(
        deltaTime,
        state.gameManager,
        this.game.ball.obj.position,
        this.game.ball.velocity,
      );
    }
    if (state.gameMode != "OnlineRight") {
      this.game.paddleLeft.player.update(
        deltaTime,
        state.gameManager,
        this.game.ball.obj.position,
        this.game.ball.velocity,
      );
    }
  }

  terrainElementsUpdate(deltaTime) {
    this.game.sea.update(deltaTime);
    for (let creature of this.game.fishFactory.creatures) {
      creature.update(deltaTime);
    }
  }
}

export default Renderer;
