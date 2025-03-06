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
    this.initialized = this.init();
    this.obj.add(this.raft, this.borderTop, this.borderBottom);
    this.obj.position.set(0, 2, 0);
    this.lerpFactor = 0.1;
    this.prevSpeedRatio = 1;
  }

  async init() {
    try {
      const raftModel = await this.loadModel(
        "/game/assets/raft.glb",
        new THREE.Vector3(11, 10, 10),
      );
      this.raft.add(raftModel);

      const barrel = await this.loadModel(
        "/game/assets/barril.glb",
        new THREE.Vector3(3, 3, 3),
      );

      await Promise.all([
        this.addBarrelsToBorder(this.borderBottom, barrel, "bottom"),
        this.addBarrelsToBorder(this.borderTop, barrel, "top"),
      ]);
      this.obj.updateMatrixWorld(true);
      return true;
    } catch (error) {
      console.error("Error loading objects: ", error);
      throw error;
    }
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
}

export default Arena;
