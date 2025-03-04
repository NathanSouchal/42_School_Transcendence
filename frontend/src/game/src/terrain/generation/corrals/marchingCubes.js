import * as THREE from "three";
import {
  triangulation,
  cornerIndexAFromEdge,
  cornerIndexBFromEdge,
} from "./marchingCubesTables.js";

class MarchingCubes {
  constructor(depth, width, height) {
    this.depth = depth;
    this.height = height;
    this.width = width;
  }

  static triangulation = triangulation;
  static cornerIndexAFromEdge = cornerIndexAFromEdge;
  static cornerIndexBFromEdge = cornerIndexBFromEdge;

  march(cells) {
    const points = [];
    const isoLevel = 0.5;

    for (let z = 0; z < this.depth; z++) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const density = cells[z][y][x].w;
          points.push({
            z: z - (this.depth - 1) / 2,
            y: y - (this.height - 1) / 2,
            x: x - (this.width - 1) / 2,
            w: density,
          });
        }
      }
    }
    const vertices = [];
    for (let z = 0; z < this.depth - 1; z++) {
      for (let y = 0; y < this.height - 1; y++) {
        for (let x = 0; x < this.width - 1; x++) {
          const cubeCorners = [
            this.getPointIndex(x, y, z),
            this.getPointIndex(x + 1, y, z),
            this.getPointIndex(x + 1, y, z + 1),
            this.getPointIndex(x, y, z + 1),
            this.getPointIndex(x, y + 1, z),
            this.getPointIndex(x + 1, y + 1, z),
            this.getPointIndex(x + 1, y + 1, z + 1),
            this.getPointIndex(x, y + 1, z + 1),
          ];

          let cubeIndex = 0;
          if (points[cubeCorners[0]].w > isoLevel) cubeIndex |= 1;
          if (points[cubeCorners[1]].w > isoLevel) cubeIndex |= 2;
          if (points[cubeCorners[2]].w > isoLevel) cubeIndex |= 4;
          if (points[cubeCorners[3]].w > isoLevel) cubeIndex |= 8;
          if (points[cubeCorners[4]].w > isoLevel) cubeIndex |= 16;
          if (points[cubeCorners[5]].w > isoLevel) cubeIndex |= 32;
          if (points[cubeCorners[6]].w > isoLevel) cubeIndex |= 64;
          if (points[cubeCorners[7]].w > isoLevel) cubeIndex |= 128;

          for (let i = 0; triangulation[cubeIndex][i] !== -1; i += 3) {
            const a0 = cornerIndexAFromEdge[triangulation[cubeIndex][i]];
            const b0 = cornerIndexBFromEdge[triangulation[cubeIndex][i]];
            const a1 = cornerIndexAFromEdge[triangulation[cubeIndex][i + 1]];
            const b1 = cornerIndexBFromEdge[triangulation[cubeIndex][i + 1]];
            const a2 = cornerIndexAFromEdge[triangulation[cubeIndex][i + 2]];
            const b2 = cornerIndexBFromEdge[triangulation[cubeIndex][i + 2]];

            const vertexA = this.interpolateVerts(
              points[cubeCorners[a0]],
              points[cubeCorners[b0]],
              isoLevel,
            );
            const vertexB = this.interpolateVerts(
              points[cubeCorners[a1]],
              points[cubeCorners[b1]],
              isoLevel,
            );
            const vertexC = this.interpolateVerts(
              points[cubeCorners[a2]],
              points[cubeCorners[b2]],
              isoLevel,
            );
            if (
              this.isValidVertex(vertexA) &&
              this.isValidVertex(vertexB) &&
              this.isValidVertex(vertexC)
            ) {
              vertices.push(
                vertexA.x,
                vertexA.y,
                vertexA.z,
                vertexB.x,
                vertexB.y,
                vertexB.z,
                vertexC.x,
                vertexC.y,
                vertexC.z,
              );
            }
          }
        }
      }
    }
    const colors = new Float32Array(vertices.length);
    const colorOrange = new THREE.Color(0xe6a640);
    const colorBlueGreen = new THREE.Color(0x497a64);
    const colorPurple = new THREE.Color(0x8a2be2);

    for (let i = 0; i < vertices.length; i += 3) {
      const height = vertices[i + 1];
      let color;

      if (height > 100) {
        const t = Math.min(height / 150, 1);
        color = colorOrange.clone().lerp(new THREE.Color(0xd69758), t);
      } else if (height > 0) {
        const t = (height + 0) / 50;
        color = colorOrange.clone().lerp(colorBlueGreen, 1 - t);
      } else {
        const t = Math.min(Math.abs(height + 100) / 50, 1);
        color = colorPurple.clone().lerp(colorBlueGreen, t);
      }

      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  getPointIndex(x, y, z) {
    return z * (this.width * this.height) + y * this.width + x;
  }

  interpolateVerts(v1, v2, isoLevel) {
    if (Math.abs(isoLevel - v1.w) < 0.00001) return v1;
    if (Math.abs(isoLevel - v2.w) < 0.00001) return v2;
    if (Math.abs(v1.w - v2.w) < 0.00001) return v1;
    const t = (isoLevel - v1.w) / (v2.w - v1.w);
    return {
      x: v1.x + t * (v2.x - v1.x),
      y: v1.y + t * (v2.y - v1.y),
      z: v1.z + t * (v2.z - v1.z),
    };
  }

  sanitize(cells) {
    return cells.map((z) =>
      z.map((y) =>
        y.map((cell) => {
          const w = Number(cell.w);
          return {
            w: !isNaN(w) && w >= 0 && w <= 1 ? w : 0,
          };
        }),
      ),
    );
  }

  isValidVertex(vertex) {
    if (
      !isNaN(vertex.x) &&
      !isNaN(vertex.y) &&
      !isNaN(vertex.z) &&
      isFinite(vertex.x) &&
      isFinite(vertex.y) &&
      isFinite(vertex.z)
    )
      return true;
  }
}

export default MarchingCubes;
