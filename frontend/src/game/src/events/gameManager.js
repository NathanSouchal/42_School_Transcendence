import state from "../../../app";

export class GameManager {
  constructor(game = {}, gameScene) {
    this.game = game;
    this.gameScene = gameScene;
    this.side = null;
    this.isConnected = false;
  }

  connect() {
    const baseUrl = `ws://${window.location.hostname}:8000/ws/`;

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
      this.isConnected = true;
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "positions":
          this.updatePositions(data);
          break;
        case "hasFoundOpponent":
          console.log("gameManager caught 'hasFoundOpponent'");
          state.gameMode = data.side === "left" ? "OnlineLeft" : "OnlineRight";
          state.isSourceOfTruth = data.isSourceOfTruth;
          console.log(`isSourceOfTruth: ${state.isSourceOfTruth}`);
          state.setIsSearching(false);
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
    if (!this.socket.readyState) return;
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
