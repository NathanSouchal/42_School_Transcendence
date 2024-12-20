import Creature from "./creature.js";

class Boid {
  constructor(terrain_geometry, terrain_obj) {
    this.creatures = [];
    for (let i = 0; i < 20; i++) {
      let fish = new Fish(terrain_geometry, terrain_obj);
      this.creatures.push(fish);
    }
    for (let i = 0; i < 10; i++) {
      let jellyfish = new JellyFish(terrain_geometry, terrain_obj);
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
    this.makeSomeCreatures();
  }
}
