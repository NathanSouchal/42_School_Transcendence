import * as THREE from "three";
import { State } from "/src/services/state.js";
import { init_light } from "./scene/lights.js";
import { init_camera } from "./scene/camera.js";
import Ball from "./game/ball.js";
import Arena from "./game/arena.js";
import Paddle from "./game/paddle.js";
import { GameConfig } from "./config.js";
import TerrainFactory from "./terrain/generation/terrain_factory.js";
import Stats from "three/addons/libs/stats.module.js";
import SkyGenerator from "./terrain/sky.js";
import Boid from "./terrain/creatures/boids.js";
import Renderer from "./scene/rendering.js";
import state from "../../app.js";
import EventHandler from "./events/event_handler.js";

class Game {
  constructor() {
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

    this.stat = new Stats();
    document.body.appendChild(this.stat.dom);

    // Abonnement aux changements de l'état global
    state.subscribe((newState) => {
      // if (newState.isGamePage && !this.isGameInitialized) {
      //   this.init(); // Initialise le jeu si on est sur la page du jeu
      //   this.isGameInitialized = true;
      // } else if (!newState.isGamePage && this.isGameInitialized) {
      //   console.log("Quitter la page du jeu"); // Logique éventuelle pour quitter le jeu
      //   this.cleanup(); // Nettoie les ressources si nécessaire
      //   this.isGameInitialized = false;
      // }
      const isGamePage = state.getState().isGamePage; // Récupère l'état actuel
      console.log("Game status: ", isGamePage);
    });
    this.player_types = {
      top: "robot",
      bottom: "robot",
    };
    //this.stat = new Stats();
    //document.body.appendChild(this.stat.dom);
    this.event_handler = new EventHandler(this);
  }

  async makeArena() {
    this.arena = new Arena(this.config.getSize());
    this.paddleTop = new Paddle(
      this.arena,
      "top",
      this.player_types.top,
      this.config
    );
    this.paddleBottom = new Paddle(
      this.arena,
      "bottom",
      this.player_types.bottom,
      this.config
    );
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
      this.config.getGenerationConfig("corrals")
    );
    this.sea = this.terrainFactory.create(
      this.config.getSize(),
      this.config.getGenerationConfig("sea")
    );
    this.sky = new SkyGenerator(this.config.getSkyConfig());
    this.boid = new Boid(this.terrain.geometry, this.terrain.obj);
    for (let creature of this.boid.creatures) {
      this.scene.add(creature.obj);
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
      this.config.getCameraConfig()
    );

    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

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
    this.event_handler.setupControls();

    this.rendererInstance = new Renderer(
      this.renderer,
      this.scene,
      this.camera,
      game
      //this.stat,
    );
    this.rendererInstance.animate();
  }
}

const game = new Game();
await game.init();
