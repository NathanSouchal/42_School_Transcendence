import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import PaddleControls from "./paddle_controls";
import Robot from "./robot";
import { position } from "../events/sockets_communication.js";

class Paddle {
  constructor(arena, side, player_type, config) {
    this.arena = arena;
    this.side = side;
    this.size = config.getSize();
    this.player_type = player_type;
    this.needsRemoving = false;
    this.controls = config.getPaddleConfig(side);
    this.obj = new THREE.Object3D();
    this.pos = new position();
    this.choosePlayer(player_type);
  }

  choosePlayer(player_type) {
    if (player_type === "player") {
      this.player_type = player_type;
      this.player = new PaddleControls(this, this.controls, this.size);
    } else {
      if (this.needsRemoving === true) {
        this.player.dispose();
        this.needsRemoving = false;
      }
      this.player = new Robot(this, this.size);
    }
  }

  setInitialPos() {
    const zMax = this.size.arena_depth;
    const z =
      this.side === "left"
        ? -(zMax / 2) + this.size.paddle_depth / 2
        : zMax / 2 - this.size.paddle_depth / 2;
    this.pos.set(0, 2.5, z);
    this.obj.position.set(this.pos.x, this.pos.y, this.pos.z);
  }

  computeBoundingBoxes() {
    this.setInitialPos();
    if (this.side === "right") {
      this.obj.rotateY(Math.PI);
    }
    this.box = new THREE.Box3().setFromObject(this.obj, true);
    this.arena.BBoxes.push({
      box: this.box,
      side: this.side,
    });
    let boxsize = new THREE.Vector3();
    this.box.getSize(boxsize);
    this.paddle_half_width = boxsize.x * 0.5;
  }

  async init() {
    await this.loadModel(
      "src/game/assets/crab.glb",
      new THREE.Vector3(1.5, 1.3, 1.5),
    );
    this.obj.add(this.asset);
  }

  loadModel(path, scale) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        path,
        (gltf) => {
          this.asset = gltf.scene;
          this.animations = gltf.animations;
          this.mixer = new THREE.AnimationMixer(this.asset);

          this.droite = this.mixer.clipAction(this.animations[0]);
          this.gauche = this.mixer.clipAction(this.animations[1]);
          this.coup_de_pince = this.mixer.clipAction(this.animations[2]);
          this.coup_de_pince.setEffectiveTimeScale(1.5);
          gltf.scene.scale.set(scale.x, scale.y, scale.z);
          resolve(gltf.scene);
        },
        undefined,
        (error) => {
          console.error(error);
          reject(error);
        },
      );
    });
  }

  tap_animation(deltaTime) {
    this.mixer.update(deltaTime);
    if (this.coup_de_pince && !this.coup_de_pince.isRunning()) {
      this.coup_de_pince.play();
      this.coupElapsedTime = 0;
    }
  }

  update(deltaTime, ballPosition, ballVelocity, ws) {
    this.player.update(deltaTime, ballPosition, ballVelocity);

    const message = {
      type: `paddle_${this.side}`,
      pos: {
        x: Number(this.pos.x).toFixed(4),
      },
    };
    ws.sendMessage(message);

    const newBox = new THREE.Box3().setFromObject(this.obj, true);
    const paddleBoxIndex = this.arena.BBoxes.findIndex(
      (bbox) => bbox.side === this.side,
    );
    if (paddleBoxIndex !== -1) {
      this.arena.BBoxes[paddleBoxIndex] = {
        box: newBox,
        side: this.side,
      };
    }
    this.mixer.update(deltaTime);

    if (this.player.state.bottom) {
      if (!this.gauche.isRunning()) {
        this.gauche.play();
      }
    } else if (!this.player.state.bottom) {
      if (this.gauche.isRunning()) this.gauche.setEffectiveTimeScale(0.5);
    }

    if (this.player.state.top) {
      if (!this.droite.isRunning()) {
        this.droite.play();
      }
    } else if (!this.player.state.top) {
      if (this.droite.isRunning()) this.droite.setEffectiveTimeScale(0.5);
    }

    this.coupElapsedTime += deltaTime;
    if (this.coupElapsedTime >= 1) {
      this.coup_de_pince.stop();
    }
  }
}

export default Paddle;
