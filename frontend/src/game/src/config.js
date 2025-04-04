import { deepMerge } from "./utils.js";

export const DEFAULT_CONFIG = {
  keymaps: {
    online: {
      left: {
        bottom: "ArrowDown",
        top: "ArrowUp",
      },
      right: {
        bottom: "ArrowDown",
        top: "ArrowUp",
      },
    },
    local: {
      left: {
        bottom: "d",
        top: "e",
      },
      right: {
        bottom: "ArrowDown",
        top: "ArrowUp",
      },
    },
  },
  camera: {
    fov: 75,
    aspect: 2,
    near: 0.1,
    far: 500,
    position: {
      x: -20,
      y: 20,
      z: 0,
    },
    target: {
      x: -5,
      y: 0,
      z: 0,
    },
  },

  lights: {
    color: 0xffffff,
    intensity: 3,
  },

  ball: {
    speed: {
      deltaFactor: 30,
      initialMin: 0.5,
      initialMax: 0.6,
      max: 1.5,
      incrementFactor: 1.03,
    },
    color: 0x938a8f,
    color_specular: 0xae4242,
  },

  size: {
    unit: 1,
    arena_width: 26,
    arena_height: 1,
    arena_depth: 40,
    border_width: 2,
    border_height: 1,
    paddle_width: 5,
    paddle_height: 1,
    paddle_depth: 1,
    ball_ratio: 0.03,
    terrain_width: 500,
    terrain_depth: 500,
  },

  generation: {
    sea: {
      name: "sea",
      generation: {
        terrain_layers: 3,
        noise_scale: 0.015,
        height_multiplier: 2,
        octaves: 2,
        persistence: 1,
        lacunarity: 3.0,
      },
      size: {
        terrain_depth: 50,
        terrain_width: 50,
        terrain_height: 100,
      },
    },
    corrals: {
      name: "corrals",
      generation: {
        terrain_layers: 1,
        noise_scale: 0.03,
        height_multiplier: 1,
        octaves: 1,
        persistence: 0.5,
        lacunarity: 0.5,
      },
      size: {
        terrain_depth: 180,
        terrain_width: 180,
        terrain_height: 50,
      },
    },
  },
};

export class GameConfig {
  constructor(customConfig = {}) {
    this.config = deepMerge(DEFAULT_CONFIG, customConfig);
    this.calculateRelativeSizes();
  }
  calculateRelativeSizes() {
    this.config.size.ball_radius_left =
      this.config.size.ball_ratio * this.config.size.arena_width;
    this.config.size.ball_radius_right =
      this.config.size.ball_ratio * this.config.size.arena_width * 1.25;
    this.config.size.ball_height =
      this.config.size.ball_ratio * this.config.size.arena_width * 0.7;
  }

  getPlayerKeymaps(side, gameMode) {
    const mode =
      gameMode == "OnlineLeft" || gameMode == "OnlineRight"
        ? "online"
        : "local";
    return this.config.keymaps[mode][side];
  }
  getCameraConfig() {
    return this.config.camera;
  }
  getLightsConfig() {
    return this.config.lights;
  }
  getBallConfig() {
    return this.config.ball;
  }
  getGenerationConfig(gen) {
    return this.config.generation[gen];
  }
  getSize() {
    return this.config.size;
  }
}
