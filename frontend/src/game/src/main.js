import * as THREE from "three";
import { init_light } from "./scene/lights.js";
import { init_camera } from "./scene/camera.js";
import Ball from "./game/ball.js";
import Arena from "./game/arena.js";
import Paddle from "./game/paddle.js";
import { GameConfig } from "./config.js";
import TerrainFactory from "./terrain/generation/terrain_factory.js";
import Stats from "three/addons/libs/stats.module.js";
import SkyGenerator from "./terrain/sky.js";
import Boid from "./terrain/boids.js";
import Renderer from "./scene/rendering.js";

class Game {
  constructor() {
    this.config = new GameConfig();
    this.canvas = document.querySelector("#c");
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.canvas,
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.scene = new THREE.Scene();
    init_light(this.scene);

    this.stat = new Stats();
    document.body.appendChild(this.stat.dom);
  }

  async makeArena() {
    this.arena = new Arena(this.config.getSize());
    this.paddleTop = new Paddle(this.arena, "top", "robot", this.config);
    this.paddleBottom = new Paddle(this.arena, "bottom", "robot", this.config);
    this.ball = new Ball(this.config.getSize(), this.config.getBallConfig());

    await this.arena.init();
    await this.paddleTop.init();
    await this.paddleBottom.init();
    this.arena.computeBoundingBoxes(this.scene);
    this.paddleTop.computeBoundingBoxes(this.scene);
    this.paddleBottom.computeBoundingBoxes(this.scene);
    this.arena.ball = this.ball.obj;
    this.arena.obj.add(this.ball.obj);
    this.scene.add(this.arena.obj);
    this.scene.add(this.paddleBottom.obj);
    this.scene.add(this.paddleTop.obj);
    this.scene.add(this.ball.obj);
    this.scene.add(this.ball.sparks.group);
  }

  makeTerrain() {
    this.terrainFactory = new TerrainFactory();

    this.terrain = this.terrainFactory.create(
      this.config.getSize(),
      this.config.getGenerationConfig("corrals"),
    );
    this.sea = this.terrainFactory.create(
      this.config.getSize(),
      this.config.getGenerationConfig("sea"),
    );
    this.sky = new SkyGenerator(this.config.getSkyConfig());
    this.boid = new Boid(this.terrain.geometry, this.terrain.obj);
    for (let fish of this.boid.fishs) {
      this.scene.add(fish.obj);
    }
    this.scene.add(this.sky.sky);
    this.scene.add(this.terrain.obj);
    this.scene.add(this.sea.obj);
  }

  async init() {
    await this.makeArena();
    this.makeTerrain();

    this.camera = init_camera(
      this.renderer,
      this.arena.obj,
      this.config.getCameraConfig(),
    );
    this.arena.arenaBox = new THREE.Box3().setFromObject(this.arena.obj);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.render(this.scene, this.camera);

    const game = {
      ball: this.ball,
      arena: this.arena,
      paddleTop: this.paddleTop,
      paddleBottom: this.paddleBottom,
      terrain: this.terrain,
      sea: this.sea,
      boid: this.boid,
    };

    this.rendererInstance = new Renderer(
      this.renderer,
      this.scene,
      this.camera,
      game,
      this.stat,
    );
    this.rendererInstance.animate();
  }
}

const game = new Game();
await game.init();
