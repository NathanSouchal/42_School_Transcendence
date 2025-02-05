import state from "../../../app";

export class GameManager {
  constructor(game = {}, gameScene) {
    this.game = game;
    this.gameScene = gameScene;
    this.roomId = null;
    this.side = null;
    this.isConnected = false;
    this.createRoom();
  }

  async createRoom() {
    this.roomId = this.generateRoomId();
    this.connect();
  }

  generateRoomId() {
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  connect() {
    if (!this.roomId) {
      throw new Error("No room ID specified. Create or join a room first.");
    }
    switch (state.gameMode) {
      case "PVP":
      case "PVR":
        this.socket = new WebSocket(
          `ws://${window.location.hostname}:8000/ws/local/?local=true`,
        );
        break;
      case "OnlinePVP":
        this.socket = new WebSocket(
          `ws://${window.location.hostname}:8000/ws/online/?local=false`,
        );
        break;
      case "default":
        this.socket = new WebSocket(
          `ws://${window.location.hostname}:8000/ws/bg/?local=true`,
        );
        break;
    }
    console.log(`Socket is : ${this.socket.url}`);

    this.socket.onopen = () => {
      this.isConnected = true;
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "positions":
          this.updatePositions(data.data);
          break;
        case "startOnlineGame":
          console.log("startOnlineGame (frontend)");
          this.startOnlineGame(data.data);
          break;
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
      this.isConnected = false;
    };

    this.socket.onclose = () => {
      console.log("WebSocket Closed");
      this.isConnected = false;
      setTimeout(() => this.reconnect(), 2000);
    };
  }

  startOnlineGame(status) {
    this.side = status.side;
    const gameMode = status.game_mode;

    if (gameMode === "OnlinePVP") {
      if (this.side === "right") {
        console.log("side is right");
        state.players = state.player_types.OnlineRight;
        state.side = this.side;
      } else if (this.side === "left") {
        console.log("side is left");
        state.players = state.player_types.OnlineLeft;
        state.side = this.side;
      }
    }
    state.setGameStarted(gameMode);
  }

  updatePositions(state) {
    if (state.paddle_left) {
      this.game.paddleLeft.obj.position.x = state.paddle_left.x;
    }
    if (state.paddle_right) {
      this.game.paddleRight.obj.position.x = state.paddle_right.x;
    }
    if (state.ball) {
      this.game.ball.obj.position.set(state.ball.x, state.ball.y, state.ball.z);
      this.game.ball.velocity.set(
        state.ball.vel_x,
        state.ball.vel_y,
        state.ball.vel_z,
      );
    }
  }

  reconnect() {
    if (this.socket.readyState === WebSocket.CLOSED) {
      this.connect();
    }
  }

  sendMessage(data) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not in OPEN state");
      this.reconnect();
    }
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
