import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export function init_light(scene) {
  const lightConfig = {
    color: 0xffffff,
    intensity: 3,
    x: -10,
    y: 11,
    z: -20,
    enabled: true,
  };

  const light1 = new THREE.DirectionalLight(
    lightConfig.color,
    lightConfig.intensity,
  );

  light1.castShadow = true;
  light1.shadow.bias = 0.0000001;
  light1.shadow.camera.right = 100;
  light1.shadow.camera.top = 40;
  light1.shadow.camera.left = -100;
  light1.shadow.camera.bottom = -40;

  light1.shadow.mapSize.width = 4024;
  light1.shadow.mapSize.height = 4024;
  light1.position.set(lightConfig.x, lightConfig.y, lightConfig.z);
  light1.target.position.set(0, 0, 0);
  scene.add(light1);
  scene.add(light1.target);
  const light2 = new THREE.HemisphereLight(
    lightConfig.color,
    lightConfig.intensity,
  );
  light2.position.set(lightConfig.x, lightConfig.y, lightConfig.z);
  scene.add(light2);

  return { light1 };
}
