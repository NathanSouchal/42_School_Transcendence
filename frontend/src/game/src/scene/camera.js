import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export function init_camera(renderer, arena, CameraConfig) {
  const camera = new THREE.PerspectiveCamera(
    CameraConfig.fov,
    CameraConfig.aspect,
    CameraConfig.near,
    CameraConfig.far,
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableRotate = false; // Disable rotation
  controls.enableZoom = false; // Disable zoom
  controls.enablePan = false; // Disable panning
  controls.enabled = false; // Fully disable controls

  const centerOfScene = new THREE.Vector3();
  const box = new THREE.Box3().setFromObject(arena, true);
  box.getCenter(centerOfScene);

  camera.position.set(
    centerOfScene.x + CameraConfig.position.x,
    centerOfScene.y + CameraConfig.position.y,
    centerOfScene.z + CameraConfig.position.z,
  );

  camera.lookAt(
    centerOfScene.x + CameraConfig.target.x,
    centerOfScene.y + CameraConfig.target.y,
    centerOfScene.z + CameraConfig.target.z,
  );

  return camera;
}
