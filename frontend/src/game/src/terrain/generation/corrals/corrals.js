import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import Cell from "./cell";
import MarchingCubes from "./marchingCubes";
import BasicTerrain from "../basic_terrain";
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.0";

import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from "three-mesh-bvh";

import { measureFnTime } from "../../../performance_utils";

class Corrals extends BasicTerrain {
  constructor(size, world) {
    super(size, world, false);
    this.height = world.size?.terrain_height || 0;
    this.createCorrals();
  }

  async createCorrals() {
    this.simplex = new SimplexNoise();
    this.marching_cubes = new MarchingCubes(
      this.depth,
      this.width,
      this.height,
    );
    //await measureFnTime("Terrain", "Make Cells", async () => {
    this.makeCells();
    //});

    THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
    THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
    THREE.Mesh.prototype.raycast = acceleratedRaycast;

    //await measureFnTime("Terrain", "Marching Cubes", async () => {
    this.geometry = this.marching_cubes.march(this.cells);
    //});

    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.geometry.computeBoundsTree();

    this.obj.add(this.mesh);

    let y = -50;
    this.obj.position.set(0, y, 0);
    return this.obj;
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

    //const surfaceFactor = Math.max(0, surfaceDistance / this.height);
    //const floorFactor = Math.max(0, 1 - floorDistance / this.height);
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
      Math.min(x, mapWidth - x) / (mapWidth / 2),
      0.5,
    );
    const borderFactorZ = Math.pow(
      Math.min(z, mapDepth - z) / (mapDepth / 2),
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

  cellularAutomaton() {
    const nextState = Array.from({ length: this.depth }, () =>
      Array.from({ length: this.height }, () =>
        Array.from({ length: this.width }, () => new Cell()),
      ),
    );

    for (let z = 0; z < this.depth; z++) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          let res = { count: 0, checkBorders: true };
          this.countNeighbors(z, y, x, res);
          if (res.count < 13) {
            nextState[z][y][x].w = Math.min(1, this.cells[z][y][x].w + 0.05);
          } else if (res.count == 13) {
            nextState[z][y][x].w = this.cells[z][y][x].w;
          } else if (res.count > 13) {
            nextState[z][y][x].w = Math.max(0, this.cells[z][y][x].w - 0.05);
          }
        }
      }
    }
    this.cells = nextState;
  }

  countNeighbors(cellZ, cellY, cellX, res) {
    let count = 0;
    for (let z = cellZ - 1; z <= cellZ + 1; z++) {
      for (let y = cellY - 1; y <= cellY + 1; y++) {
        for (let x = cellX - 1; x <= cellX + 1; x++) {
          if (z !== cellZ || x !== cellX || y !== cellY) {
            if (
              z >= 0 &&
              z < this.depth &&
              y >= 0 &&
              y < this.height &&
              x >= 0 &&
              x < this.width
            ) {
              count++;
            }
          }
        }
      }
    }
    res.count = count;
  }

  makeGUI() {
    const gui = new GUI();
    const Cellular = gui.addFolder("Cellular Automata");
    const cellularConfig = {
      step: () => {
        this.cellularAutomaton();
        this.marching_cubes.march(this.cells);
      },
    };
    Cellular.add(cellularConfig, "step").name("Step");
    Cellular.open();
  }
}

export default Corrals;
