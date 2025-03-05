import state from "../../../app";

export class GameManager {
  constructor(game = {}, gameScene) {
    this.game = game;
    this.gameScene = gameScene;
    this.side = null;
    this.isConnected = false;
    this.socket = null;
  }

  connect() {
    // if (this.socket) this.socket.close();
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.warn("⚠️ Une connexion WebSocket est déjà ouverte, fermeture...");
      this.socket.close(); // 🔥 Ferme la connexion précédente avant d'en créer une nouvelle
    }
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    // const baseUrl = `${protocol}://${window.location.hostname}:8000/ws/`;
    const baseUrl = "ws://localhost:8000/ws/";

    switch (state.gameMode) {
      case "PVP":
      case "PVR":
        this.socket = new WebSocket(`${baseUrl}game/?type=local`);
        break;
      case "Online":
        this.socket = new WebSocket(`${baseUrl}game/?type=online`);
        break;
      case "default":
        this.socket = new WebSocket(`${baseUrl}game/?type=bg`);
        break;
    }
    console.log(`Socket is : ${this.socket.url}`);

    this.socket.onopen = () => {
      console.log("✅ WebSocket ouvert !");
      this.isConnected = true;
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Message Websocket recu du backend :", data);
      switch (data.type) {
        case "positions":
          console.log("Mise a jour recue :", data.positions);
          this.updatePositions(data.positions);
          break;
        case "hasFoundOpponent":
          console.log(
            "gameManager caught 'hasFoundOpponent', assigned side is ",
            data.side
          );
          this.side = data.side;
          state.gameMode = data.side === "left" ? "OnlineLeft" : "OnlineRight";
          state.isSourceOfTruth = data.isSourceOfTruth;
          state.setIsSearching(false);
          break;
        case "collision":
          state.ballCollided = true;
          state.collisionPoint = data.collision;
          break;
        case "scored_side":
          state.updateScore(data.scored_side, 1);
          break;
      }
    };

    this.socket.onerror = (error) => {
      console.error("❌ WebSocket Error:", error);
      this.isConnected = false;
    };

    this.socket.onclose = (event) => {
      console.warn(
        `❌ WebSocket Closed: code=${event.code}, reason=${event.reason}`
      );
      this.isConnected = false;
      this.socket = null;
      if (event.code !== 1000) {
        // ✅ Ne pas reconnecter si la fermeture est normale
        console.log("🔄 Tentative de reconnexion WebSocket...");
        setTimeout(() => this.reconnect(), 2000);
      } else {
        console.log("✅ WebSocket fermé proprement, pas de reconnexion.");
      }
    };
  }

  updatePositions(state) {
    console.log("🎯 Mise à jour des paddles:", state);
    if (state.paddle_left !== undefined) {
      console.log(`🎾 Paddle gauche mis à jour: ${state.paddle_left}`);
      this.game.paddleLeft.obj.position.x = state.paddle_left;
    }
    if (state.paddle_right !== undefined) {
      console.log(`🏓 Paddle droit mis à jour: ${state.paddle_right}`);
      this.game.paddleRight.obj.position.x = state.paddle_right;
    }
    if (state.ball) {
      console.log(
        `⚽ Ball mise à jour: ${state.ball.x}, ${state.ball.y}, ${state.ball.z}`
      );
      this.game.ball.obj.position.set(state.ball.x, state.ball.y, state.ball.z);
      this.game.ball.velocity.set(
        state.ball.vel_x,
        state.ball.vel_y,
        state.ball.vel_z
      );
      //console.log(
      //  `ball is now at: ${state.ball.x}, ${state.ball.y}, ${state.ball.z}`,
      //);
    } else {
      console.warn("⚠️ Aucun état de balle reçu !");
    }
  }

  reconnect() {
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      console.log("Tentative de reconnexion WebSocket...");
      this.connect();
    }
  }

  sendMessage(data) {
    if (this.socket && !this.socket.readyState) return;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not in OPEN state");
      this.reconnect();
    }
  }

  sendPaddleMove(direction, side, deltaTime) {
    this.sendMessage({
      type: "paddle_move",
      side: side,
      direction: direction,
      deltaTime: deltaTime,
    });
  }

  sendPause(bool) {
    // const strBool = bool == true ? "true" : "false";
    // console.log(`sent pause: ${bool}`);
    this.sendMessage({
      type: "pausedOrUnpaused",
      bool: bool,
    });
  }
}

export class position {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
    this.z += vector.z;
  }
  clone() {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
    };
  }
  copy(pos) {
    this.x = pos.x;
    this.y = pos.y;
    this.z = pos.z;
  }
}
