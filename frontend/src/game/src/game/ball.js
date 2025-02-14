import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { position } from "../events/gameManager.js";
import state from "../../../app";

class Ball {
  constructor(size, conf) {
    this.obj = new THREE.Object3D();
    this.conf = conf;
    this.size = size;
    this.elapsedTime = 0;
    this.maxAngle = Math.PI / 4;
    this.reflectionNormals = {
      bottom: new THREE.Vector3(1, 0, 0),
      top: new THREE.Vector3(-1, 0, 0),
      right: new THREE.Vector3(0, 0, 1),
      left: new THREE.Vector3(0, 0, -1),
    };
    this.rotationSpeed = 3.0;
    this.isFalling = false;
    //this.boxHelper = new THREE.Box3Helper(new THREE.Box3(), 0xff0000);
    this.pos = new position();
    this.lastCollision = {
      side: null,
      time: 0,
    };
    this.collisionCooldown = 0.1;
  }

  computeBoundingBoxes() {
    this.box = new THREE.Box3().setFromObject(this.obj, true);
    this.velocity = this.random_initial_velocity();
    this.pos.set(0, 2.7, 0);
    this.obj.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.make_sparks();
    //this.boxHelper.box.copy(this.box);
  }

  async init() {
    await this.loadModel(
      "src/game/assets/duck.glb",
      new THREE.Vector3(0.007, 0.007, 0.007),
    );
    this.obj.add(this.asset);
    //this.box = new THREE.Box3().setFromObject(this.obj, true);
    //this.boxHelper.box.copy(this.box);
  }

  loadModel(path, scale) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        path,
        (gltf) => {
          this.asset = gltf.scene;
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

  bounce(bbox) {
    const currentTime = performance.now() / 1000;
    if (
      bbox.side === this.lastCollision.side &&
      currentTime - this.lastCollision.time < this.collisionCooldown
    ) {
      return;
    }

    this.lastCollision.side = bbox.side;
    this.lastCollision.time = currentTime;

    const normal = this.reflectionNormals[bbox.side];
    if (bbox.side === "right" || bbox.side === "left") {
      const ballCenter = this.pos.clone();
      const paddleCenter = bbox.box.getCenter(new THREE.Vector3());
      const relativePosition = ballCenter.x - paddleCenter.x;
      const normalizedRelativePosition =
        relativePosition / this.size.paddle_width;

      const currentSpeed = this.velocity.length();
      const newAngle = normalizedRelativePosition * this.maxAngle;
      const yDirection = bbox.side === "left" ? 1 : -1;
      this.velocity.x = currentSpeed * Math.sin(newAngle);
      this.velocity.z =
        yDirection * Math.abs(currentSpeed * Math.cos(newAngle));
      this.velocity.z *= -1;
      this.bounces++;
      if (this.bounces < this.bouncesNeeded) {
        this.velocity.multiplyScalar(this.conf.speed.incrementFactor);
      }
      this.speedRatio = this.bounces / this.bouncesNeeded;
    }

    const reflection = this.velocity.clone().reflect(normal);
    this.velocity.copy(reflection);
    this.rotationSpeed *= -1;
  }

  update(deltaTime, scene, renderer, gameManager) {
    if (this.isFalling) {
      if (this.pos.y <= -1) {
        this.velocity.y *= 0.7;
        this.velocity.x *= 0.85;
        this.velocity.z *= 0.85;
      }
      const scaledVelocity = this.velocity
        .clone()
        .multiplyScalar(deltaTime * this.conf.speed.deltaFactor);
      this.pos.add(scaledVelocity);
      this.obj.rotateY(0.5 * deltaTime);

      this.elapsedTime += deltaTime;
      if (this.elapsedTime >= 1.5) {
        renderer.markPoints();
        this.reset();
      }
    } else {
      const scaledVelocity = this.velocity
        .clone()
        .multiplyScalar(deltaTime * this.conf.speed.deltaFactor);
      this.pos.add(scaledVelocity);
      this.box = new THREE.Box3().setFromObject(this.obj, true);
      this.obj.rotateY(this.rotationSpeed * deltaTime * this.velocity.length());
      this.animate_sparks();
      if (this.isOutOfArena(renderer)) {
        this.startFalling();
      }
    }

    gameManager.sendMessage({
      type: "positions",
      element: "ball",
      side: gameManager.side,
      pos: {
        x: Number(this.pos.x).toFixed(4),
        y: Number(this.pos.y).toFixed(4),
        z: Number(this.pos.z).toFixed(4),
        vel_x: Number(this.velocity.x).toFixed(4),
        vel_y: Number(this.velocity.y).toFixed(4),
        vel_z: Number(this.velocity.z).toFixed(4),
      },
    });
  }

  isOutOfArena(renderer) {
    return (
      this.pos.z < -(renderer.zMax / 2) + renderer.depth / 2 - 3 ||
      this.pos.z > renderer.zMax / 2 - renderer.depth / 2 + 3
    );
  }

  startFalling() {
    if (!this.isFalling) {
      this.elapsedTime = 0;
      this.isFalling = true;
      this.velocity.multiplyScalar(0.7);
      this.velocity.y = -0.2;
    }
  }

  random_initial_velocity() {
    let x =
      Math.random() *
        (this.conf.speed.initialMax - this.conf.speed.initialMin) +
      this.conf.speed.initialMin;
    x *= Math.random() < 0.5 ? 1 : -1;
    let y =
      Math.random() *
        (this.conf.speed.initialMax - this.conf.speed.initialMin) +
      this.conf.speed.initialMin;
    y *= Math.random() < 0.5 ? 1 : -1;
    if (x < 0.01 && x > -0.01 && y < 0.01 && y > -0.01) {
      return this.random_initial_velocity();
    }
    const z = 0;
    const initialSpeed = Math.sqrt(x * x + y * y);
    this.bounces = 0;
    this.bouncesNeeded =
      Math.log(this.conf.speed.max / initialSpeed) /
      Math.log(this.conf.speed.incrementFactor);
    return new THREE.Vector3(x, z, y); // DO NOT CHANGE
  }

  reset() {
    this.elapsedTime = 0;
    this.isFalling = false;
    this.pos.set(0, 2.7, 0);
    this.velocity = this.random_initial_velocity();
  }

  make_sparks() {
    this.sparks = {};
    this.sparks.group = new THREE.Group();
    this.sparks.geometry = new THREE.BufferGeometry();
    this.sparks.count = 15;
    this.sparks.positions = new Float32Array(this.sparks.count * 3);

    this.sparks.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.sparks.positions, 3),
    );

    this.sparks.material = new THREE.PointsMaterial({
      color: 0xf56342,
      size: 0.15,
      transparent: true,
      opacity: 1.0,
    });

    this.sparks.system = new THREE.Points(
      this.sparks.geometry,
      this.sparks.material,
    );
    this.sparks.group.add(this.sparks.system);
  }

  spawn_sparks(collisionPoint) {
    this.sparks.group.position.copy(collisionPoint);
    this.sparks.material.opacity = 1.0;

    for (let i = 0; i < this.sparks.count; i++) {
      let spark = this.sparks.geometry.attributes.position;
      spark.array[i * 3] = (Math.random() - 0.5) * 2;
      spark.array[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      spark.array[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
  }

  animate_sparks() {
    if (this.sparks.material.opacity > 0) {
      this.sparks.material.opacity -= 0.03;
    }

    let positions = this.sparks.geometry.attributes.position.array;
    for (let i = 0; i < this.sparks.count; i++) {
      positions[i * 3] *= 1.2;
      positions[i * 3 + 1] *= 1.2;
      positions[i * 3 + 2] *= 1.2;
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
  }
}

export default Ball;
