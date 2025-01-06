import * as THREE from "three";

class Ball {
  constructor(size, conf) {
    this.obj = new THREE.Object3D();
    this.conf = conf;
    this.size = size;
    this.geometry = new THREE.CylinderGeometry(
      size.ball_radius_left,
      size.ball_radius_right,
      size.ball_height,
    );
    this.elapsedTime = 0;
    this.material = new THREE.MeshPhongMaterial({
      color: conf.color,
      specular: conf.color_specular,
      shininess: 100,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.obj.add(this.mesh);
    this.obj.castShadow = true;
    this.obj.receiveShadow = true;
    this.obj.position.copy(this.set_position());
    this.box = new THREE.Box3().setFromObject(this.obj);

    this.maxAngle = Math.PI / 4;
    this.reflectionNormals = {
      bottom: new THREE.Vector3(1, 0, 0),
      top: new THREE.Vector3(-1, 0, 0),
      right: new THREE.Vector3(0, 0, 1),
      left: new THREE.Vector3(0, 0, -1),
    };
    this.velocity = this.random_initial_velocity();
    this.make_sparks();
  }

  bounce(bbox) {
    const normal = this.reflectionNormals[bbox.side];

    if (bbox.side === "right" || bbox.side === "left") {
      const ballCenter = this.obj.position.clone();
      const paddleCenter = bbox.box.getCenter(new THREE.Vector3());
      const relativePosition = ballCenter.x - paddleCenter.x;
      const normalizedRelativePosition =
        relativePosition / this.size.paddle_width;

      const currentSpeed = this.velocity.length();
      const newAngle = normalizedRelativePosition * this.maxAngle;
      const yDirection = bbox.side === "left" ? 1 : -1;
      this.velocity.x = currentSpeed * Math.sin(newAngle);
      this.velocity.z =
        yDirection * Math.abs(currentSpeed * Math.cos(newAngle));
      this.velocity.z *= -1;
      this.bounces++;
      if (this.bounces < this.bouncesNeeded) {
        this.velocity.multiplyScalar(this.conf.speed.incrementFactor);
      }
      this.speedRatio = this.bounces / this.bouncesNeeded;
    }

    const reflection = this.velocity.clone().reflect(normal);
    this.velocity.copy(reflection);
  }

  update() {
    this.obj.position.add(this.velocity);
    this.box = new THREE.Box3().setFromObject(this.obj);
    this.animate_sparks();
  }

  random_initial_velocity() {
    let x =
      Math.random() *
        (this.conf.speed.initialMax - this.conf.speed.initialMin) +
      this.conf.speed.initialMin;
    x *= Math.random() < 0.5 ? 1 : -1;
    let y =
      Math.random() *
        (this.conf.speed.initialMax - this.conf.speed.initialMin) +
      this.conf.speed.initialMin;
    y *= Math.random() < 0.5 ? 1 : -1;
    if (x < 0.01 && x > -0.01 && y < 0.01 && y > -0.01) {
      return this.random_initial_velocity();
    }
    const z = 0;
    const initialSpeed = Math.sqrt(x * x + y * y);
    this.bounces = 0;
    this.bouncesNeeded =
      Math.log(this.conf.speed.max / initialSpeed) /
      Math.log(this.conf.speed.incrementFactor);
    return new THREE.Vector3(x, z, y); // DO NOT CHANGE
  }

  set_position() {
    const x = 0;
    const y = 3.0;
    const z = 0;
    return new THREE.Vector3(x, y, z);
  }

  reset() {
    this.obj.position.copy(this.set_position());
    this.velocity = this.random_initial_velocity();
  }

  make_sparks() {
    this.sparks = {};
    this.sparks.group = new THREE.Group();
    this.sparks.geometry = new THREE.BufferGeometry();
    this.sparks.count = 15;
    this.sparks.positions = new Float32Array(this.sparks.count * 3);

    this.sparks.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.sparks.positions, 3),
    );

    this.sparks.material = new THREE.PointsMaterial({
      color: 0xf56342,
      size: 0.15,
      transparent: true,
      opacity: 1.0,
    });

    this.sparks.system = new THREE.Points(
      this.sparks.geometry,
      this.sparks.material,
    );
    this.sparks.group.add(this.sparks.system);
  }

  spawn_sparks(collisionPoint) {
    this.sparks.group.position.copy(collisionPoint);
    this.sparks.material.opacity = 1.0;

    for (let i = 0; i < this.sparks.count; i++) {
      let spark = this.sparks.geometry.attributes.position;
      spark.array[i * 3] = (Math.random() - 0.5) * 2;
      spark.array[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      spark.array[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
  }

  animate_sparks() {
    if (this.sparks.material.opacity > 0) {
      this.sparks.material.opacity -= 0.03;
    }

    let positions = this.sparks.geometry.attributes.position.array;
    for (let i = 0; i < this.sparks.count; i++) {
      positions[i * 3] *= 1.2;
      positions[i * 3 + 1] *= 1.2;
      positions[i * 3 + 2] *= 1.2;
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
  }
}

export default Ball;
