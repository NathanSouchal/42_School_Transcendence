import * as THREE from "three";
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.0";
import BasicTerrain from "./basic_terrain";
import SeaShader from "../shaders/sea_shader.js";

class Sea extends BasicTerrain {
  constructor(size, world) {
    super(size, world, false);
    const geometry = new THREE.PlaneGeometry(
      this.width * 3,
      this.depth * 3,
      this.width,
    );

    this.material = new THREE.ShaderMaterial({
      uniforms: { ...SeaShader.uniforms, time: { value: 0 } },
      vertexShader: SeaShader.vertexShader,
      fragmentShader: SeaShader.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    this.material.timeScale = 0.5;
    this.material.elapsedTime = 0;
    const sea = new THREE.Mesh(geometry, this.material);
    sea.rotateX(-Math.PI / 2);
    this.obj.add(sea);
    this.obj.position.set(0, 0, 0);
  }

  update(deltaTime) {
    this.material.elapsedTime += deltaTime * this.material.timeScale;
    this.material.uniforms.time.value = this.material.elapsedTime;
  }
}

export default Sea;
