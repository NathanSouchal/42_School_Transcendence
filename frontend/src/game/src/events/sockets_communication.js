export class ws {
  constructor(paddleLeft, paddleRight, ball) {
    this.connect();
    this.game = { paddleLeft, paddleRight, ball };
  }

  connect() {
    this.socket = new WebSocket(
      "ws://" + window.location.hostname + ":8000" + "/ws/pong/room1/",
    );

    this.socket.onopen = () => {
      console.log("WebSocket Connected");
    };

    this.socket.onmessage = (event) => {
      try {
        const state = JSON.parse(event.data);
        //console.log(state);
        this.updateState(state);
        // console.log("WebSocket Message:", event.data);
      } catch (error) {
        // console.error("Error parsing state: ", error);
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    this.socket.onclose = () => {
      setTimeout(() => this.reconnect(), 1000);
    };
  }

  updateState(state) {
    if (state.paddle_left) {
      this.game.paddleLeft.obj.position.x = state.paddle_left.x;
    }
    if (state.paddle_right) {
      this.game.paddleRight.obj.position.x = state.paddle_right.x;
    }
    if (state.ball) {
      this.game.ball.obj.position.x = state.ball.x;
      this.game.ball.obj.position.y = state.ball.y;
      this.game.ball.obj.position.z = state.ball.z;
      this.game.ball.velocity.x = state.ball.vel_x;
      this.game.ball.velocity.y = state.ball.vel_y;
      this.game.ball.velocity.z = state.ball.vel_z;
    }
  }

  reconnect() {
    if (this.socket.readyState === WebSocket.CLOSED) {
      this.connect();
    }
  }

  sendMessage(data) {
    if (this.socket.readyState === 1) {
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
