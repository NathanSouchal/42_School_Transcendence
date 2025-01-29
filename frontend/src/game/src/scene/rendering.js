import * as THREE from "three";
import state from "../../../app.js";

import { ws } from "../events/sockets_communication.js";

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
    this.ws = new ws(game.paddleLeft.obj, game.paddleRight.obj, game.ball.obj);
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

  markPoints() {
    if (state.players.left === "robot" && state.players.right === "robot")
      return;
    if (this.game.ball.obj.position.z < -(this.zMax / 2) + this.depth / 2 - 3) {
      state.updateScore("right", 1);
    } else if (
      this.game.ball.obj.position.z >
      this.zMax / 2 - this.depth / 2 + 3
    ) {
      state.updateScore("left", 1);
    }
  }

  animate() {
    const render = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.previousTime) / 1000;
      this.previousTime = currentTime;

      if (state.state.gameIsPaused === false && !state.state.gameHasBeenWon) {
        this.gameElementsUpdate(deltaTime);
        this.pivotUpdate(deltaTime);
        this.collisionsUpdate(deltaTime);
      }

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

  pivotUpdate(deltaTime) {
    this.elapsedTime += deltaTime;
    const rockingAngle = Math.sin(this.elapsedTime) * 0.05;
    this.game.pivot.rotation.z = rockingAngle;
  }

  gameElementsUpdate(deltaTime) {
    this.game.ball.update(deltaTime, this.scene, this);
    this.game.paddleRight.update(
      deltaTime,
      this.game.ball.obj.position,
      this.game.ball.velocity,
      this.ws,
    ),
      this.game.paddleLeft.update(
        deltaTime,
        this.game.ball.obj.position,
        this.game.ball.velocity,
        this.ws,
      );
  }

  terrainElementsUpdate(deltaTime) {
    this.game.sea.update(deltaTime);
    for (let creature of this.game.fishFactory.creatures) {
      creature.update(deltaTime);
    }
  }

  collisionsUpdate(deltaTime) {
    for (const bbox of this.game.arena.BBoxes) {
      if (this.game.ball.box.intersectsBox(bbox.box)) {
        this.game.ball.bounce(bbox);
        this.game.ball.update(deltaTime, this.scene, this);
        if (bbox.side === "right") {
          this.game.paddleLeft.controls.other_has_hit = true;
          this.game.paddleRight.controls.other_has_hit = false;
          this.game.paddleRight.tap_animation(deltaTime);
        } else if (bbox.side === "left") {
          this.game.paddleLeft.controls.other_has_hit = false;
          this.game.paddleRight.controls.other_has_hit = true;
          this.game.paddleLeft.tap_animation(deltaTime);
        }
        const collisionPoint = new THREE.Vector3(
          this.game.ball.obj.position.x,
          this.game.ball.obj.position.y,
          this.game.ball.obj.position.z,
        );
        this.game.ball.spawn_sparks(collisionPoint);
        break;
      }
    }
  }
}

export default Renderer;
