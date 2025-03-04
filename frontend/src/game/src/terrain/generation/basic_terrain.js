import * as THREE from "three";
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.0";

class BasicTerrain {
  constructor(size, world = {}, autoCreate = true) {
    this.size = size;
    this.world = world;
    this.width = world.size.terrain_width;
    this.depth = world.size.terrain_depth;
    this.height = world.size.terrain_height;
    this.obj = new THREE.Object3D();
    if (autoCreate) {
      this.createTerrain();
    }
  }
  createTerrain() {
    this.simplex = new SimplexNoise();
    let material = new THREE.MeshStandardMaterial({
      color: this.world.colors.terrain,
      roughness: 0.8,
      metalness: 0.1,
    });
    material.castShadow = true;
    material.receiveShadow = true;
    let geometry = new THREE.PlaneGeometry(
      this.width,
      this.depth,
      Math.floor(this.width / 7),
      Math.floor(this.depth / 7),
    );
    geometry.rotateX(-Math.PI / 2);
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      let height = this.getWeight(x, z);
      vertices[i + 1] = height;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    const terrain = new THREE.Mesh(geometry, material);
    terrain.receiveShadow = true;
    terrain.castShadow = true;
    this.obj.add(terrain);
    this.obj.position.set(-10, 0, -15);
  }

  getWeight(x, z) {
    let height = 0;

    for (let o = 0; o < this.world.generation.octaves; o++) {
      const frequency = Math.pow(this.world.generation.lacunarity, o);
      const amplitude = Math.pow(this.world.generation.persistence, o);
      const noiseValue = this.simplex.noise2D(
        x * this.world.generation.noise_scale * frequency,
        z * this.world.generation.noise_scale * frequency,
      );
      const erosion_factor = 1 - Math.min(1, height / 14);
      height += noiseValue * amplitude * erosion_factor;
    }

    height *= this.world.generation.height_multiplier;
    return height;
  }
}

export default BasicTerrain;
