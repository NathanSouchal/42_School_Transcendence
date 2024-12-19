import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export function init_light(scene) {
  const gui = new GUI();

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
  const lightFolder = gui.addFolder("Directional Light");
  lightFolder.addColor(lightConfig, "color").onChange((value) => {
    light1.color.setHex(value);
  });

  lightFolder.add(lightConfig, "intensity", 0, 100).onChange((value) => {
    light1.intensity = value;
  });

  const positionFolder = lightFolder.addFolder("Position");
  positionFolder.add(lightConfig, "x", -100, 100).onChange((value) => {
    light1.position.x = value;
  });
  positionFolder.add(lightConfig, "y", -100, 100).onChange((value) => {
    light1.position.y = value;
  });
  positionFolder.add(lightConfig, "z", -100, 100).onChange((value) => {
    light1.position.z = value;
  });

  lightFolder.add(lightConfig, "enabled").onChange((value) => {
    light1.visible = value;
  });
  const light2 = new THREE.HemisphereLight(
    lightConfig.color,
    lightConfig.intensity,
  );
  light2.position.set(lightConfig.x, lightConfig.y, lightConfig.z);
  scene.add(light2);

  return { light1, gui };
}
