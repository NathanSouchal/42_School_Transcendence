import { GameScene } from "./gameScene.js";
import { GameManager } from "./events/gameManager.js";

const gameScene = new GameScene();
await gameScene.init();

let gameManager = new GameManager({
  paddleLeft: gameScene.paddleLeft,
  paddleRight: gameScene.paddleRight,
  ball: gameScene.ball,
});

while (!gameManager.isConnected) {
  await new Promise((resolve) => setTimeout(resolve, 300));
}

gameScene.rendererInstance.animate(gameManager);
