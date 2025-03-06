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
    this.isFalling = false;
    this.pos = new position();
    this.lastCollision = {
      side: null,
      time: 0,
    };
    this.collisionCooldown = 0.1;
  }

  async init() {
    this.velocity = new THREE.Vector3();
    // this.obj.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.make_sparks();

    await this.loadModel(
      "/game/assets/duck.glb",
      new THREE.Vector3(0.007, 0.007, 0.007),
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

  updateRotation(deltaTime) {
    this.obj.rotateY(3.0 * deltaTime * this.velocity.length());
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
