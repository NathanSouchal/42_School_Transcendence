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
    this.firstPageLoad = true;
    this.frameCount = 0;
    this.lastTime = Date.now(); // Initial time
    this.fpsDisplayTime = this.lastTime;
  }

  resizeRendererToDisplaySize() {
    const canvas = this.renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width = Math.floor(canvas.clientWidth * pixelRatio);
    const height = Math.floor(canvas.clientHeight * pixelRatio);
    const needResize =
      canvas.width !== width || canvas.height !== height || this.firstPageLoad;
    if (needResize) {
      this.renderer.setSize(width, height, false);
      if (this.firstPageLoad) this.firstPageLoad = false;
    }
    return needResize;
  }

  animate() {
    const render = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.previousTime) / 1000;
      this.previousTime = currentTime;

      if (!state.state.gameIsPaused) {
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
        this.updateElementsPositions(deltaTime);
      }

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
    const currentClientTime = Date.now() / 1000;
    const serverTimestamp = positions.timestamp;
    const dataAge = currentClientTime - serverTimestamp;
    const predictionThreshold = 0.1;

    const lerpFactor = 0.3;

    if (dataAge > predictionThreshold) {
      const predictedLeftPaddleX =
        positions.paddles.left.pos + positions.paddles.left.vel * dataAge;
      const predictedRightPaddleX =
        positions.paddles.right.pos + positions.paddles.right.vel * dataAge;

      this.game.paddleLeft.obj.position.x +=
        (predictedLeftPaddleX - this.game.paddleLeft.obj.position.x) *
        lerpFactor;
      this.game.paddleRight.obj.position.x +=
        (predictedRightPaddleX - this.game.paddleRight.obj.position.x) *
        lerpFactor;

      const predictedBallX =
        positions.ball.pos.x + positions.ball.vel.x * dataAge;
      const predictedBallY =
        positions.ball.pos.y + positions.ball.vel.y * dataAge;
      const predictedBallZ =
        positions.ball.pos.z + positions.ball.vel.z * dataAge;

      this.game.ball.obj.position.x +=
        (predictedBallX - this.game.ball.obj.position.x) * lerpFactor;
      this.game.ball.obj.position.y +=
        (predictedBallY - this.game.ball.obj.position.y) * lerpFactor;
      this.game.ball.obj.position.z +=
        (predictedBallZ - this.game.ball.obj.position.z) * lerpFactor;
    } else {
      const newLeftPaddleX =
        positions.paddles.left.pos + positions.paddles.left.vel * (1 / 50);
      const newRightPaddleX =
        positions.paddles.right.pos + positions.paddles.right.vel * (1 / 50);

      this.game.paddleLeft.obj.position.x +=
        (newLeftPaddleX - this.game.paddleLeft.obj.position.x) * lerpFactor;
      this.game.paddleRight.obj.position.x +=
        (newRightPaddleX - this.game.paddleRight.obj.position.x) * lerpFactor;

      this.game.ball.obj.position.set(
        positions.ball.pos.x,
        positions.ball.pos.y,
        positions.ball.pos.z
      );
    }
    this.game.ball.velocity.set(
      positions.ball.vel.x,
      positions.ball.vel.y,
      positions.ball.vel.z
    );

    //const currentTime = Date.now();
    //this.frameCount++;
    //if (currentTime - this.fpsDisplayTime >= 1000) {
    //  const fps = this.frameCount;
    //  console.log(`FPS: ${fps}`);
    //  this.frameCount = 0;
    //  this.fpsDisplayTime = currentTime;
    //}
  }

  sceneRotationUpdate(deltaTime) {
    this.elapsedTime += deltaTime;
    // Rocking
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
        this.game.ball.velocity
      );
    }
    if (state.gameMode != "OnlineRight") {
      this.game.paddleLeft.player.update(
        deltaTime,
        state.gameManager,
        this.game.ball.obj.position,
        this.game.ball.velocity
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
