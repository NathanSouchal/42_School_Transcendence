import { GameScene } from "./gameScene.js";
import state from "../../app.js";
import { GameManager } from "./events/gameManager.js";

const gameScene = new GameScene();
await gameScene.init();

let gameManager = new GameManager(
  {
    paddleLeft: gameScene.paddleLeft,
    paddleRight: gameScene.paddleRight,
    ball: gameScene.ball,
  },
  gameScene
);

state.gameManager = gameManager;
state.setGameStarted("default");

while (!state.gameManager.isConnected) {
  await new Promise((resolve) => setTimeout(resolve, 300));
}

window.addEventListener("resize", () => {
  gameScene?.handleResize();
  gameScene?.rendererInstance?.resizeRendererToDisplaySize();
});

gameScene.rendererInstance.gameManager = gameManager;
gameScene.rendererInstance.animate();
