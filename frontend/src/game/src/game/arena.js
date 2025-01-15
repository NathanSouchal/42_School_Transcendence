import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

class Arena {
  constructor(size) {
    this.size = size;
    this.obj = new THREE.Object3D();
    this.raft = new THREE.Object3D();
    this.borderBottom = new THREE.Object3D();
    this.borderTop = new THREE.Object3D();
    this.BBoxes = [];
    this.elapsedTime = 0;
    this.init();
    this.obj.add(this.raft, this.borderTop, this.borderBottom);
    this.obj.position.set(0, 2, 0);
    this.lerpFactor = 0.1;
    this.prevSpeedRatio = 1;
  }

  async init() {
    const raftModel = await this.loadModels(
      "src/game/assets/raft/scene.gltf",
      new THREE.Vector3(11, 10, 10),
    );
    this.raft.add(raftModel);
    const barrel = await this.loadModels(
      "src/game/assets/barril/scene.gltf",
      new THREE.Vector3(3, 3, 3),
    );
    this.addBarrelsToBorder(this.borderBottom, barrel, "bottom");
    this.addBarrelsToBorder(this.borderTop, barrel, "top");
  }

  computeBoundingBoxes() {
    const bottomBBox = new THREE.Box3().setFromObject(this.borderBottom);
    this.BBoxes.push({
      box: bottomBBox,
      side: "bottom",
    });
    const topBBox = new THREE.Box3().setFromObject(this.borderTop);
    this.BBoxes.push({
      box: topBBox,
      side: "top",
    });
  }

  addBarrelsToBorder(border, barrel, side) {
    for (let i = 0; i < 5; i++) {
      const barrelClone = barrel.clone();
      let y = i % 2 == 0 ? 0 : 0.8;
      if (side === "bottom")
        barrelClone.position.set(-this.size.arena_width / 2 - 1, y, 14 - i * 7);
      else {
        barrelClone.position.set(this.size.arena_width / 2 + 1, y, 14 - i * 7);
      }
      barrelClone.rotateX(Math.PI / 2);
      border.add(barrelClone);
    }
  }

  async loadModels(path, scale) {
    const scene = await this.loadModel(path, scale);
    return scene;
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

  update(deltaTime, speedRatio) {
    this.elapsedTime += deltaTime;
    this.prevSpeedRatio += (speedRatio - this.prevSpeedRatio) * this.lerpFactor;

    const rockingAngle = Math.sin(this.elapsedTime) * 0.05;
    this.obj.rotation.z = rockingAngle;
    //const ballPosition = new THREE.Vector3(
    //  this.ball.position.x,
    //  this.ball.position.y,
    //  this.ball.position.z,
    //);
    //ballPosition.applyAxisAngle(
    //  new THREE.Vector3(0, 0, 1),
    //  rockingAngle - this.ball.rotation.z,
    //);
    //this.ball.position.set(ballPosition.x, ballPosition.y, ballPosition.z);
    //this.ball.rotation.z = rockingAngle;
  }
}

export default Arena;
