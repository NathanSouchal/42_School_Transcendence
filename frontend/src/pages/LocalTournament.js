import { updateView } from "../utils";
import API from "../services/api";
import { handleHeader } from "../utils";
import { router } from "../app.js";

export default class LocalTournament {
  constructor(state) {
    this.state = state;
    this.previousState = { ...state.state };
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.possibleNbPlayers = ["2", "4", "8", "16", "32"];
    this.playerList = [];
    this.nbPlayers = 0;
    this.inputCount = 0;
    this.eventListeners = [];
    this.currentRound = [];
    this.MatchToPlay = {};
    this.cssLink;
    this.tournamentFinished = false;
    this.tournamentWinner = null;
    this.userAlias = "";
  }

  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("LocalTournament page subscribed to state");
    }

    const userId = Number(localStorage.getItem("id"));
    this.getUserAlias(userId);
    await updateView(this);
  }

  async getUserAlias(id) {
    try {
      const response = await API.get(`/user/${id}/`);
      this.userAlias = response.data.user.alias;
    } catch (error) {
      console.error(`Error while trying to get data : ${error}`);
    }
  }

  attachEventListeners() {
    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      if (!this.eventListeners.some((e) => e.element === link)) {
        const handleNavigation = this.handleNavigation.bind(this);
        link.addEventListener("click", handleNavigation);
        this.eventListeners.push({
          name: link.getAttribute("href") || "unknown-link",
          type: "click",
          element: link,
          listener: handleNavigation,
        });
      }
    });

    const selectNbPlayers = document.getElementById("select-nb-players");
    if (selectNbPlayers) {
      const handleNbPlayersChange = this.handleNbPlayersChange.bind(this);
      if (!this.eventListeners.some((e) => e.name === "selectNbPlayersEvent")) {
        selectNbPlayers.addEventListener("change", handleNbPlayersChange);
      }
      this.eventListeners.push({
        name: "selectNbPlayersEvent",
        type: "change",
        element: selectNbPlayers,
        listener: handleNbPlayersChange,
      });
    }

    const inputPlayerName = document.getElementById("input-player-name");
    if (inputPlayerName) {
      const handlePlayersName = this.handlePlayersName.bind(this);
      if (!this.eventListeners.some((e) => e.name === "inputPlayerName")) {
        inputPlayerName.addEventListener("keydown", handlePlayersName);
      }
      this.eventListeners.push({
        name: "inputPlayerName",
        type: "keydown",
        element: inputPlayerName,
        listener: handlePlayersName,
      });
    }

    const btnToStartMatch = document.getElementById("btn-start-match");
    if (btnToStartMatch) {
      const handleStartButton = this.handleStartButton.bind(this);
      if (!this.eventListeners.some((e) => e.name === "btnToStartMatch")) {
        btnToStartMatch.addEventListener("click", handleStartButton);
      }
      this.eventListeners.push({
        name: "btnToStartMatch",
        type: "click",
        element: btnToStartMatch,
        listener: handleStartButton,
      });
    }

    const gameMenueButton = document.getElementById("game-menu-button");
    if (gameMenueButton) {
      const handleGameMenuButton = this.handleGameMenuButton.bind(this);
      if (!this.eventListeners.some((e) => e.name === "gameMenueButton")) {
        gameMenueButton.addEventListener("click", handleGameMenuButton);
      }
      this.eventListeners.push({
        name: "gameMenueButton",
        type: "click",
        element: gameMenueButton,
        listener: handleGameMenuButton,
      });
    }
  }

  handleNavigation(e) {
    const target = e.target.closest("a");
    if (target && target.href.startsWith(window.location.origin)) {
      e.preventDefault();
      const path = target.getAttribute("href");
      router.navigate(path);
    }
  }

  async handleNbPlayersChange(e) {
    const selectedValue = e.target.value;
    if (selectedValue) {
      this.nbPlayers = parseInt(selectedValue, 10);
      console.log(this.nbPlayers);
      await updateView(this);
    }
  }

  async handlePlayersName(e) {
    const enterKey = e.key;
    if (enterKey && enterKey === "Enter") {
      const playerName = e.target.value;
      if (playerName) {
        this.playerList.push(playerName);
        this.inputCount++;
        console.log(this.inputCount);
        console.log(this.playerList.map((el) => el));
        if (this.inputCount == this.nbPlayers)
          await this.createLocalTournament();
        await updateView(this);
      }
    }
  }

  async handleStateChange(newState) {
    if (newState.gameHasLoaded && !this.previousState.gameHasLoaded) {
      console.log(
        "GameHasLoaded state changed, rendering LocalTournament page"
      );
      await updateView(this);
    } else if (newState.gameStarted && !this.previousState.gameStarted) {
      console.log("Game has started");

      const container = document.getElementById("app");
      if (container) {
        container.className = "";
        const content = await this.render();
        container.innerHTML = content;
        this.removeEventListeners();
        this.attachEventListeners();
      }
    } else if (newState.gameHasBeenWon && !this.previousState.gameHasBeenWon) {
      await this.matchFinished();
      const container = document.getElementById("app");
      if (container) {
        container.className = "menu";
        const content = await this.render();
        container.innerHTML = content;
        this.removeEventListeners();
        this.attachEventListeners();
      }
    }
    this.previousState = { ...newState };
  }

  handleStartButton() {
    this.state.setGameStarted("PVP");
  }

  handleGameMenuButton() {
    window.location.href = "https://localhost:3000/game";
  }

  async matchFinished() {
    let winner = "";
    if (this.state.score.left > this.state.score.right)
      winner = this.MatchToPlay.player1;
    else winner = this.MatchToPlay.player2;
    try {
      const res = await API.put(`/match/${this.MatchToPlay.id}/`, {
        score_player1: this.state.score.left,
        score_player2: this.state.score.right,
        winner: winner,
      });
      console.log(res);
      if (res.status === 200) {
        this.MatchToPlay = res.data.nextMatchToPlay;
        this.currentRound =
          res.data.tournament.rounds_tree[this.MatchToPlay.round_number - 1];
      } else {
        this.tournamentFinished = true;
        this.tournamentWinner = winner;
      }
    } catch (error) {
      console.error(`Error while trying to update match data : ${error}`);
    }
  }

  async createLocalTournament() {
    console.log(typeof this.nbPlayers, this.nbPlayers);
    try {
      const res = await API.post(`/tournament/list/`, {
        participants: this.playerList,
        number_of_players: this.nbPlayers,
      });
      console.log(res);
      this.currentRound = res.data.tournament.rounds_tree[0];
      this.MatchToPlay = res.data.FirstMatch;
    } catch (error) {
      console.error(`Error while trying to update user data : ${error}`);
    }
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ element, listener, type }) => {
      if (element) {
        element.removeEventListener(type, listener);
        console.log("Removed ${type} eventListener from input");
      }
    });
    this.eventListeners = [];
  }

  destroy() {
    this.removeEventListeners();
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
      console.log("Account page unsubscribed from state");
    }
  }

  renderSelectNbPlayers() {
    return `<div class="d-flex justify-content-center align-items-center m-5">
                      <select id="select-nb-players" class="form-control">
                        <option value="" disabled selected>Select number of players</option>
                        ${this.possibleNbPlayers
                          .map(
                            (element) =>
                              `<option value="${element}">${element}</option>`
                          )
                          .join("")}
                      </select>
                    </div>
                `;
  }

  renderInputPlayerName() {
    return `<div class="d-flex justify-content-center align-items-center m-5">
					    <label>Player n°${this.inputCount + 1}</label>
					      <input id="input-player-name" type="text" name="" value="${this.inputCount + 1 === 1 ? this.userAlias : ""}"
                placeholder="Enter player n°${this.inputCount + 1} name" required/>
				    </div>`;
  }

  renderTournament() {
    return `<div class="matches-main-div">
        ${
          this.tournamentFinished
            ? `<h1>Winner: ${this.tournamentWinner} !</h1>`
            : !this.MatchToPlay.next_match
              ? `<h1>FINAL</h1>`
              : `<h1>Round n°${this.MatchToPlay.round_number}</h1>`
        }
				${this.currentRound
          .map((element) =>
            this.MatchToPlay.id === element.id && !this.tournamentWinner
              ? `<div class="next-match-main-div">
            <h1 class="me-3">${element.player1}</h1>
            <h2>vs</h2>
            <h1>${element.player2}</h1>
            <button id="btn-start-match">PLAY</button>
          </div>`
              : !element.winner && !this.tournamentWinner
                ? `<div class="upcoming-match-main-div">
              <h1 class="me-3">${element.player1}</h1>
              <h2>vs</h2>
              <h1>${element.player2}</h1>
              <h1>⏳</h1>
            </div>`
                : `<div class="passed-match-main-div">
              <h1 class="me-3">${element.player1}</h1>
              <h2>vs</h2>
              <h1>${element.player2}</h1>
              <h1>${this.tournamentWinner ? `${this.state.score.left}` : `${element.score_player1}`} - ${this.tournamentWinner ? `${this.state.score.right}` : `${element.score_player2}`}</h1>
            </div>`
          )
          .join("")}
        <button id="game-menu-button">${!this.MatchToPlay.next_match ? `Game Menu` : `Stop Tournament`}</button>
			</div>`;
  }

  getGameHUDTemplate() {
    const { left, right } = this.state.score;
    const { gameIsPaused } = this.state.state;
    const leftPlayerName = this.MatchToPlay.player1;
    const rightPlayerName = this.MatchToPlay.player2;

    return `
          <div class="tournament-game-hud">
            <div class="tournament-game-score">
              <h1>${leftPlayerName}</h1>
              <h1>${left} - ${right}</h1>
              <h1>${rightPlayerName}</h1>
            </div>
            <button id="toggle-pause" class="pause-play-btn">
              <div id="toggle-pause-styling" class="${gameIsPaused ? "play-icon" : "pause-icon"}" ></div>
            </button>
          </div>
          `;
  }

  async render() {
    console.log(this.state.state.gameStarted);
    handleHeader(this.state.isUserLoggedIn, false);
    return `${
      this.state.state.gameStarted === true
        ? `${this.getGameHUDTemplate()}`
        : !this.nbPlayers
          ? `${this.renderSelectNbPlayers()}`
          : this.nbPlayers == this.inputCount
            ? `${this.renderTournament()}`
            : `${this.renderInputPlayerName()}`
    }`;
  }
}
