import Creature from "./creature.js";

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
  constructor(terrain_geometry, terrain_obj) {
    super(terrain_geometry, terrain_obj);
    this.looks_target = false;
    this.max_speed = 0.2;
    this.min_speed = -0.2;
    this.spawn_y = -10;
    this.max_y = -5;
    this.path = "src/game/assets/jellyfish/scene.gltf";
    this.scale = { x: 4, y: 4, z: 4 };
    this.loadObjects();
    this.makeSomeCreatures();
  }
}

class Fish extends Creature {
  constructor(terrain_geometry, terrain_obj) {
    super(terrain_geometry, terrain_obj);
    this.looks_target = true;
    this.max_speed = 0.3;
    this.min_speed = -0.3;
    this.spawn_y = -5;
    this.max_y = -1;
    this.path = "src/game/assets/guppy_fish/scene.gltf";
    this.scale = { x: 0.5, y: 0.5, z: 0.5 };
    this.loadObjects();
    this.makeSomeCreatures();
  }
}

async function loadObjects(path, scale) {
  return await this.loadModel(path, scale);
}

function loadModel(path, scale) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        let scene = {};
        scene.model = gltf.scene;
        scene.animations = gltf.animations;
        scene.mixer = new THREE.AnimationMixer(scene.model);

        if (animations.length > 0) {
          scene.animationAction = mixer.clipAction(animations[0]);
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
