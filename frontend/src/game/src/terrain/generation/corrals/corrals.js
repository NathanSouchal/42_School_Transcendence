import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import Cell from "./cell";
import MarchingCubes from "./marchingCubes";
import BasicTerrain from "../basic_terrain";
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.0";
import { updateLoadingTime } from "../../../performance_utils";

import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from "three-mesh-bvh";

class Corrals extends BasicTerrain {
  constructor(size, world) {
    super(size, world, false);
    this.height = world.size?.terrain_height || 0;
    this.initialized = this.createCorrals();
  }

  async createCorrals() {
    this.simplex = new SimplexNoise();
    this.marching_cubes = new MarchingCubes(
      this.depth,
      this.width,
      this.height,
    );
    await updateLoadingTime(
      "Terrain",
      "Make Cells",
      async () => this.makeCells(),
      30,
    );

    THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
    THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
    THREE.Mesh.prototype.raycast = acceleratedRaycast;

    await updateLoadingTime(
      "Terrain",
      "Marching Cubes",
      async () => {
        this.geometry = this.marching_cubes.march(this.cells);
      },
      30,
    );

    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.geometry.computeBoundsTree();

    this.obj.add(this.mesh);

    let y = -50;
    this.obj.position.set(0, y, 0);
  }

  makeCells() {
    this.cells = new Array(this.depth);
    for (let z = 0; z < this.depth; z++) {
      this.cells[z] = new Array(this.height);
      for (let y = 0; y < this.height; y++) {
        this.cells[z][y] = new Array(this.width);
        for (let x = 0; x < this.width; x++) {
          this.cells[z][y][x] = new Cell();
          this.cells[z][y][x].w = this.getWeight3D(
            false,
            this.smoothing_radius,
            x,
            z,
            y,
          );
        }
      }
    }
  }

  getWeight3D(smooth_area, smoothing_radius, x, z, y) {
    let weight = 0;
    for (let o = 0; o < this.world.generation.octaves; o++) {
      const frequency = Math.pow(this.world.generation.lacunarity, o);
      const amplitude = Math.pow(this.world.generation.persistence, o);
      const noiseValue =
        (this.simplex.noise3D(
          x * this.world.generation.noise_scale * frequency,
          z * this.world.generation.noise_scale * frequency,
          y * this.world.generation.noise_scale * frequency,
        ) +
          1) /
        2;
      weight += noiseValue * amplitude;
    }
    const surfaceDistance = this.height - y;
    const floorDistance = y;

    const surfaceFactor = Math.max(
      0,
      Math.pow(surfaceDistance / this.height, 3),
    );
    const floorFactor = Math.max(
      0,
      1 - Math.pow(floorDistance / this.height, 3),
    );
    const mapWidth = this.width;
    const mapDepth = this.depth;
    const borderFactorX = Math.pow(
      Math.min(x, mapWidth - x) / (mapWidth * 0.5),
      0.5,
    );
    const borderFactorZ = Math.pow(
      Math.min(z, mapDepth - z) / (mapDepth * 0.5),
      0.5,
    );
    const borderFactor = Math.min(borderFactorX, borderFactorZ);
    const verticalFactor = Math.max(surfaceFactor, floorFactor);

    weight *= verticalFactor * (1 + Math.pow(1 - borderFactor, 3) * 5);
    weight *= this.world.generation.height_multiplier;
    if (y == 0) weight = 1;
    if (y == -this.height - 100) weight = 1;
    return weight;
  }
}

export default Corrals;
