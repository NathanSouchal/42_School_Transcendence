import * as THREE from "three";

class Renderer {
  constructor(renderer, scene, camera, game, stat) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.game = game;
    this.stat = stat;
    this.previousTime = performance.now();
    this.zMax = game.paddleTop.size.arena_depth;
    this.depth = game.paddleTop.size.paddle_depth;
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

      this.gameElementsUpdate(deltaTime);
      this.collisionsUpdate(deltaTime);

      if (
        this.game.ball.obj.position.z < -(this.zMax / 2) + this.depth / 2 - 3 ||
        this.game.ball.obj.position.z > this.zMax / 2 - this.depth / 2 + 3
      ) {
        this.game.ball.reset();
      }

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

  gameElementsUpdate(deltaTime) {
    this.game.ball.update(deltaTime);
    this.game.paddleBottom.update(
      deltaTime,
      this.game.ball.obj.position,
      this.game.ball.velocity,
    ),
      this.game.paddleTop.update(
        deltaTime,
        this.game.ball.obj.position,
        this.game.ball.velocity,
      );
    this.stat.update();
    this.game.sea.update(deltaTime);
    this.game.arena.update(deltaTime, this.game.ball.speedRatio);

    for (let fish of this.game.boid.fishs) {
      fish.update(deltaTime);
    }
  }

  collisionsUpdate(deltaTime) {
    for (const bbox of this.game.arena.BBoxes) {
      if (this.game.ball.box.intersectsBox(bbox.box)) {
        this.game.ball.bounce(bbox);
        this.game.ball.update(deltaTime);
        if (bbox.side === "bottom") {
          this.game.paddleTop.controls.other_has_hit = true;
          this.game.paddleBottom.controls.other_has_hit = false;
          this.game.paddleBottom.tap_animation(deltaTime);
        } else if (bbox.side === "top") {
          this.game.paddleTop.controls.other_has_hit = false;
          this.game.paddleBottom.controls.other_has_hit = true;
          this.game.paddleTop.tap_animation(deltaTime);
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
