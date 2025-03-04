import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky";

class SkyGenerator {
  constructor(conf) {
    this.conf = conf;
    this.sky = new Sky();
    this.sky.scale.setScalar(this.conf.scalar);
    this.sky.material.uniforms.turbidity.value = this.conf.turbidity;
    this.sky.material.uniforms.rayleigh.value = this.conf.rayleigh;

    const phi = this.degToRad(this.conf.phi_deg);
    const theta = this.degToRad(this.conf.theta_deg);
    const sunPosition = new THREE.Vector3().setFromSphericalCoords(
      1,
      phi,
      theta,
    );
    this.sky.material.uniforms.sunPosition.value = sunPosition;
    this.sky.rotateZ(45);
  }
  degToRad(degrees) {
    let pi = Math.PI;
    return degrees * (pi / 180);
  }
}
export default SkyGenerator;
