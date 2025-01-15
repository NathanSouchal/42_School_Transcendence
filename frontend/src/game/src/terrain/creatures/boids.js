import Creature from "./creature.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";
import { SkeletonUtils } from "three/examples/jsm/utils/SkeletonUtils";

class Boid {
  constructor(terrain_geometry, terrain_obj) {
    this.creatures = [];

    const fishScene = loadObjects("src/game/assets/guppy_fish/scene.gltf", {
      x: 0.5,
      y: 0.5,
      z: 0.5,
    });
    for (let i = 0; i < 2; i++) {
      let fish = new Fish(terrain_geometry, terrain_obj, fishScene);
      this.creatures.push(fish);
    }

    const jellyfishScene = loadObjects("src/game/assets/jellyfish/scene.gltf", {
      x: 4,
      y: 4,
      z: 4,
    });
    for (let i = 0; i < 1; i++) {
      let jellyfish = new JellyFish(
        terrain_geometry,
        terrain_obj,
        jellyfishScene,
      );
      this.creatures.push(jellyfish);
    }
  }
}

export default Boid;

class JellyFish extends Creature {
  constructor(terrain_geometry, terrain_obj, scene) {
    super(terrain_geometry, terrain_obj, scene);
    this.looks_target = false;
    this.max_speed = 0.2;
    this.min_speed = -0.2;
    this.spawn_y = -10;
    this.max_y = -5;
    this.makeSomeCreatures();
  }
}

class Fish extends Creature {
  constructor(terrain_geometry, terrain_obj, scene) {
    super(terrain_geometry, terrain_obj, scene);
    this.looks_target = true;
    this.max_speed = 0.3;
    this.min_speed = -0.3;
    this.spawn_y = -5;
    this.max_y = -1;
    this.makeSomeCreatures();
  }
}

async function loadObjects(path, scale) {
  return await loadModel(path, scale);
}

function loadModel(path, scale) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        let scene = {};
        scene.model = gltf.scene;
        scene.mixer = new THREE.AnimationMixer(scene.model);

        if (animations.length > 0) {
          scene.animationAction = mixer.clipAction(gltf.animations[0]);
        }
        scene.model.scale.set(scale.x, scale.y, scale.z);
        resolve(scene);
      },
      undefined,
      (error) => {
        console.error(error);
        reject(error);
      },
    );
  });
}
