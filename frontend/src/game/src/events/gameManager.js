import state from "../../../app";

export class GameManager {
  constructor(game = {}, gameScene) {
    this.game = game;
    this.gameScene = gameScene;
    this.side = null;
    this.isConnected = false;
    this.socket = null;
  }

  async connect() {
    console.log("connect()");

    // Close any existing connection first
    await this.closeExistingConnection();

    // Create a new connection
    this.createNewConnection();

    // Set up all event handlers
    this.setupSocketEventHandlers();
  }

  async closeExistingConnection() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.warn("⚠️ Une connexion WebSocket est déjà ouverte, fermeture...");

      await new Promise((resolve) => {
        const closeHandler = () => {
          this.socket.removeEventListener("close", closeHandler);
          resolve();
        };
        this.socket.addEventListener("close", closeHandler);
        this.socket.close();
      });

      this.socket = null;
    }
  }

  createNewConnection() {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const baseUrl = `${protocol}://${window.location.hostname}:8443/ws/`;

    let endpoint = "game/?type=";

    switch (state.gameMode) {
      case "PVP":
      case "PVR":
        endpoint += "local";
        break;
      case "Online":
        endpoint += "online";
        break;
      default:
        endpoint += "bg";
        break;
    }

    this.socket = new WebSocket(`${baseUrl}${endpoint}`);
    console.log(`Socket is : ${this.socket.url}`);
  }

  setupSocketEventHandlers() {
    if (!this.socket) return;

    this.socket.onclose = this.handleClose.bind(this);
    this.socket.onopen = this.handleOpen.bind(this);
    this.socket.onmessage = this.handleMessage.bind(this);
    this.socket.onerror = this.handleError.bind(this);
  }

  handleClose(event) {
    console.error(
      `❌ WebSocket Closed: code=${event.code}, reason=${event.reason}`
    );
    this.isConnected = false;
    // this.socket = null;
  }

  handleOpen() {
    console.log("✅ WebSocket ouvert !");
    this.isConnected = true;
  }

  handleMessage(event) {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case "positions":
        this.updatePositions(data.positions);
        break;
      case "hasFoundOpponent":
        this.handleOpponentFound(data);
        break;
      case "collision":
        this.handleCollision(data);
        break;
      case "scored_side":
        this.handleScored(data);
        break;
    }
  }

  handleOpponentFound(data) {
    this.side = data.side;
    if (data.opponent_id) {
      console.log(
        `🎯 Opposant trouvé: ID=${data.opponent_id}, Nom=${data.opponent_username}`
      );
    } else {
      console.warn("⚠️ Aucun opponent_id reçu !");
    }
    state.gameMode = data.side === "left" ? "OnlineLeft" : "OnlineRight";
    state.isSourceOfTruth = data.isSourceOfTruth;
    state.setIsSearching(false);

    state.state.opponentId = data.opponent_id;
    state.state.opponentUsername = data.opponent_username;
    state.state.userSide = data.side;
  }

  handleCollision(data) {
    state.ballCollided = true;
    state.collisionPoint = data.collision;
  }

  handleScored(data) {
    state.updateScore(data.scored_side, 1);
  }

  handleError(error) {
    console.error("❌ WebSocket Error:", error);
    this.isConnected = false;
  }

  updatePositions(state) {
    if (state.paddle_left !== undefined) {
      this.game.paddleLeft.obj.position.x = state.paddle_left;
    }
    if (state.paddle_right !== undefined) {
      this.game.paddleRight.obj.position.x = state.paddle_right;
    }
    if (state.ball) {
      this.game.ball.obj.position.set(state.ball.x, state.ball.y, state.ball.z);
      this.game.ball.velocity.set(
        state.ball.vel_x,
        state.ball.vel_y,
        state.ball.vel_z
      );
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
    if (!this.isSocketReady()) {
      console.warn("WebSocket is not in OPEN state");
      this.reconnect();
      return;
    }
    this.socket.send(JSON.stringify(data));
  }

  isSocketReady() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
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
