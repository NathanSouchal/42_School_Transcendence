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
import FishFactory from "./terrain/creatures/FishFactory.js";
import Renderer from "./scene/rendering.js";
import state from "../../app.js";
import {
  updateLoadingTime,
  printPerformanceReport,
} from "./performance_utils.js";

class Game {
  constructor() {
    this.loadingTimes = {};
    this.stats = {};
    this.config = new GameConfig();
    this.canvas = document.querySelector("#c");
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.canvas,
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.scene = new THREE.Scene();
    init_light(this.scene);
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.players = state.players;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.pauseButton = "Escape";
    this.intializeEventListener();
  }

  handleStateChange(newState) {
    if (this.state.state.gameNeedsReset === true) {
      this.ball.reset();
      if (this.state.gameMode === "OnlinePVP") {
        console.log(`Starting game on the ${state.side} side`);
        if (state.side === "right") {
          this.paddleRight.choosePlayer("player");
        } else {
          this.paddleLeft.choosePlayer("player");
        }
      } else {
        this.paddleLeft.choosePlayer(state.players.left);
        this.paddleRight.choosePlayer(state.players.right);
      }

      this.paddleLeft.setInitialPos();
      this.paddleRight.setInitialPos();
      this.state.setGameNeedsReset(false);
    }
  }

  intializeEventListener() {
    window.addEventListener("keydown", this.handleKeyDown);
  }

  handleKeyDown(event) {
    if (!this.state.state.gameHasLoaded || !this.state.state.gameStarted)
      return;
    if (event.key === this.pauseButton) {
      this.state.togglePause();
    }
  }

  async makeArena() {
    this.state.subscribe(this.handleStateChange);

    this.arena = new Arena(this.config.getSize());

    this.paddleLeft = await updateLoadingTime(
      "Paddles",
      "Left Paddle Creation",
      async () =>
        new Paddle(this.arena, "left", this.players.left, this.config),
      10,
    );

    this.paddleRight = await updateLoadingTime(
      "Paddles",
      "Right Paddle Creation",
      async () =>
        new Paddle(this.arena, "right", this.players.right, this.config),
      10,
    );

    this.ball = await updateLoadingTime(
      "Ball",
      "Ball Creation",
      async () => new Ball(this.config.getSize(), this.config.getBallConfig()),
      5,
    );

    await this.arena.initialized;
    await this.paddleLeft.init();
    await this.paddleRight.init();
    await this.ball.init();

    this.arena.computeBoundingBoxes(this.scene);
    this.paddleLeft.computeBoundingBoxes(this.scene);
    this.paddleRight.computeBoundingBoxes(this.scene);
    this.ball.computeBoundingBoxes();

    this.pivot = new THREE.Group();
    this.pivot.add(
      this.arena.obj,
      this.ball.obj,
      this.paddleLeft.obj,
      this.paddleRight.obj,
      this.ball.sparks.group,
      //this.ball.boxHelper,
      //this.arena.boxHelperTop,
      //this.arena.boxHelperBottom,
    );

    this.pivot.position.set(0, 0, 0);
    this.scene.add(this.pivot);
  }

  async makeTerrain() {
    this.terrainFactory = new TerrainFactory();
    this.terrain = this.terrainFactory.create(
      this.config.getSize(),
      this.config.getGenerationConfig("corrals"),
    );
    await this.terrain.initialized;
    this.sea = this.terrainFactory.create(
      this.config.getSize(),
      this.config.getGenerationConfig("sea"),
    );
    this.sky = new SkyGenerator(this.config.getSkyConfig());
    this.fishFactory = new FishFactory(this.terrain.geometry, this.terrain.obj);
    await this.fishFactory.initialized;
    for (let creature of this.fishFactory.creatures) {
      this.scene.add(creature.obj);
    }
    this.scene.add(this.sky.sky);
    this.scene.add(this.terrain.obj);
    this.scene.add(this.sea.obj);
  }

  async init() {
    await this.makeArena();
    await this.makeTerrain();

    this.camera = init_camera(
      this.renderer,
      this.arena.obj,
      this.config.getCameraConfig(),
    );

    this.arena.arenaBox = new THREE.Box3().setFromObject(this.arena.obj, true);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.render(this.scene, this.camera);

    const game = {
      ball: this.ball,
      arena: this.arena,
      paddleLeft: this.paddleLeft,
      paddleRight: this.paddleRight,
      terrain: this.terrain,
      sea: this.sea,
      fishFactory: this.fishFactory,
      players: this.players,
      pivot: this.pivot,
    };

    this.rendererInstance = new Renderer(
      this.renderer,
      this.scene,
      this.camera,
      game,
    );
    this.rendererInstance.animate();
    this.state.setGameHasLoaded();
  }
}

const game = new Game();
await game.init();
