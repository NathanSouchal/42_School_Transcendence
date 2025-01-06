import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from "three-mesh-bvh";

export default class Creature {
  constructor(terrain_geometry, terrain_obj) {
    THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
    THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
    THREE.Mesh.prototype.raycast = acceleratedRaycast;
    this.terrain_geometry = terrain_geometry;
    this.terrain_obj = terrain_obj;
    this.turnSpeed = 0.05;
    this.currentTurnTarget = null;
    this.isTurning = false;
    this.width = 180;
    this.height = 100;
    this.depth = 180;
    this.directions = [
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ];
    this.dir = null;
    this.center = this.getTerrainCenter();
  }

  getTerrainCenter() {
    var geometry = this.terrain_geometry;
    geometry.computeBoundingBox();
    var center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    this.terrain_obj.localToWorld(center);
    return center;
  }

  makeSomeCreatures() {
    this.obj = new THREE.Object3D();
    this.loadObjects();
    this.obj.position.set(0, this.spawn_y, 0);
    this.velocity = this.random_initial_velocity();
    this.obj.rotateY(Math.PI);
    this.updateOrientation();
  }

  async loadObjects() {
    await this.loadModel();
  }

  loadModel() {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        this.path,
        (gltf) => {
          this.asset = gltf.scene;
          this.animations = gltf.animations;
          this.mixer = new THREE.AnimationMixer(this.asset);

          if (this.animations.length > 0) {
            this.animationAction = this.mixer.clipAction(this.animations[0]);
          }
          gltf.scene.scale.set(this.scale.x, this.scale.y, this.scale.z);
          this.obj.add(gltf.scene);
          resolve();
        },
        undefined,
        (error) => {
          console.error(error);
          reject(error);
        },
      );
    });
  }

  updateOrientation() {
    if (!this.looks_target) return;
    const targetPosition = this.obj.position.clone().add(this.velocity);
    this.obj.lookAt(targetPosition);
    this.obj.rotateY(Math.PI);
  }

  random_initial_velocity() {
    return new THREE.Vector3(
      Math.random() * (this.max_speed - this.min_speed) + this.min_speed,
      Math.random() * (this.max_speed - this.min_speed) + this.min_speed,
      Math.random() * (this.max_speed - this.min_speed) + this.min_speed,
    );
  }

  update(deltaTime) {
    if (this.isTurning) {
      this.performSmoothTurn();
    } else {
      this.velocity.x *= 1.01;
      this.velocity.y *= 1.01;
      this.velocity.z *= 1.01;
      this.velocity.clampLength(this.min_speed, this.max_speed);

      const currentPosition = this.obj.position.clone();
      const currentDirection = this.velocity.clone().normalize();

      if (
        this.isWallInFront(currentPosition, currentDirection) ||
        this.isNearBorder()
      ) {
        this.directionChange();
      }
      this.obj.position.add(this.velocity);
    }
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    if (this.animationAction && !this.animationAction.isRunning()) {
      this.animationAction.play();
    }
  }

  directionChange() {
    const newDirectionIndex = Math.floor(
      Math.random() * this.directions.length,
    );
    const newDirection = this.directions[newDirectionIndex].clone();
    const rotationAngle = (Math.random() - 0.5) * Math.PI;

    newDirection.applyAxisAngle(
      new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
      ).normalize(),
      rotationAngle,
    );

    this.currentTurnTarget = newDirection.multiplyScalar(0.1);
    this.isTurning = true;
  }

  performSmoothTurn() {
    if (!this.currentTurnTarget) return;

    this.velocity.lerp(this.currentTurnTarget, this.turnSpeed);

    if (this.velocity.distanceTo(this.currentTurnTarget) < 0.01) {
      this.isTurning = false;
      this.currentTurnTarget = null;
    }

    this.updateOrientation();
  }

  isNearBorder() {
    let res = false;
    let futurePosition = {
      x: this.obj.position.x + this.velocity.x,
      y: this.obj.position.y + this.velocity.y,
      z: this.obj.position.z + this.velocity.z,
    };

    if (futurePosition.x < this.center.x - this.width / 2) {
      this.obj.position.x = this.center.x - this.width / 2;
      res = true;
    }
    if (futurePosition.x > this.center.x + this.width / 2) {
      this.obj.position.x = this.center.x + this.width / 2;
      res = true;
    }
    if (futurePosition.y < this.center.y - this.height / 2) {
      this.obj.position.y = this.center.y - this.height / 2;
      res = true;
    }
    if (futurePosition.y > this.max_y) {
      this.obj.position.y = this.max_y;
      res = true;
    }
    if (futurePosition.z < this.center.z - this.depth / 2) {
      this.obj.position.z = this.center.z - this.depth / 2;
      res = true;
    }
    if (futurePosition.z > this.center.z + this.depth / 2) {
      this.obj.position.z = this.center.z + this.depth / 2;
      res = true;
    }

    return res;
  }

  isWallInFront(position, direction) {
    if (!this.terrain_geometry.boundsTree) {
      this.terrain_geometry.computeBoundsTree();
    }
    const raycaster = new THREE.Raycaster(
      position,
      direction.normalize(),
      0,
      3,
    );
    raycaster.firstHitOnly = true;
    const intersects = raycaster.intersectObjects(this.terrain_obj.children);
    return intersects.length > 0;
  }
}
