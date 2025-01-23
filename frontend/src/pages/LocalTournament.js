import axios from "axios";
import { updateView } from "../utils";
import API from "../services/api";
import {addCSS, removeCSS} from "../utils";

export default class LocalTournament {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.updateView = updateView.bind(this, this);
    this.isSubscribed = false; // Eviter plusieurs abonnements
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
  }

  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.cssLink = addCSS("src/style/local-tournament.css");
    if (!this.isSubscribed) {
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
      console.log("LocalTournament page subscribed to state");
    }

    const userId = Number(localStorage.getItem("id"));

    this.updateView();
  }

  attachEventListeners() {
    const selectNbPlayers = document.getElementById("select-nb-players");
    if (selectNbPlayers) {
      const handleNbPlayersChange = this.handleNbPlayersChange.bind(this);
      if (!this.eventListeners.some((e) => e.name === "selectNbPlayersEvent")) {
        selectNbPlayers.addEventListener("change", (e) =>
          handleNbPlayersChange(e.target.value)
        );
      }
      this.eventListeners.push({
        name: "selectNbPlayersEvent",
        type: "change",
        element: selectNbPlayers,
        listener: handleNbPlayersChange,
      });
    }

    const inputPlayerButton = document.getElementById("input-player-button");
    if (inputPlayerButton) {
      const handlePlayersName = this.handlePlayersName.bind(this);
      if (!this.eventListeners.some((e) => e.name === "inputPlayerButton")) {
        inputPlayerButton.addEventListener("click", async () => {
          const playerName = document.getElementById("input-player-name").value;
          if (playerName) await handlePlayersName(playerName);
        });
      }
      this.eventListeners.push({
        name: "inputPlayerButton",
        type: "click",
        element: inputPlayerButton,
        listener: handlePlayersName,
      });
    }

    const btnToStartMatch = document.getElementById("btn-start-match");
    if (btnToStartMatch) {
      const handleStartButton = this.handleStartButton.bind(this);
      if (!this.eventListeners.some((e) => e.name === "btnToStartMatch")) {
        btnToStartMatch.addEventListener("click", (e) =>
          handleStartButton(e.target.value)
        );
      }
      this.eventListeners.push({
        name: "btnToStartMatch",
        type: "click",
        element: btnToStartMatch,
        listener: handleStartButton,
      });
    }
  }

  handleNbPlayersChange(selectedValue) {
    this.nbPlayers = parseInt(selectedValue, 10);
    console.log(this.nbPlayers);
    this.updateView();
  }

  async handlePlayersName(playerName) {
    this.playerList.push(playerName);
    this.inputCount++;
    console.log(this.inputCount);
    console.log(this.playerList.map((el) => el));
    if (this.inputCount == this.nbPlayers) await this.createLocalTournament();
    this.updateView();
  }

  async handleStateChange(newState) {
    console.log("gameHasBeenWon : " + newState.gameHasBeenWon);
    if (newState.gameStarted) {
      console.log("Game has started");
      
      const container = document.getElementById("app");
      if (container) {
        container.className = "";
        const content = this.render();
        container.innerHTML = content;
        
        this.removeEventListeners();
        this.attachEventListeners();
      }
    }
    if (newState.gameHasBeenWon) {
      await this.matchFinished();
      const content = this.render();
      const container = document.getElementById("app");
      if (container) {
        container.className = "menu";
        container.innerHTML = content;
        
        this.removeEventListeners();
        this.attachEventListeners();
      }
    }
  }

  handleStartButton(){
    this.state.setGameStarted("PVP");
  }

  async matchFinished() {
    let winner = "";
    if (this.state.score.left > this.state.score.right)
        winner = this.MatchToPlay.player1;
    else
        winner = this.MatchToPlay.player2;
    try {
      const res = await API.put(
        `/match/${this.MatchToPlay.id}/`,
        {
          "score_player1": this.state.score.left,
          "score_player2": this.state.score.right,
          "winner": winner
        }
      )
      console.log(res);
      if (res.status === 200) {
        this.MatchToPlay = res.data.nextMatchToPlay;
        this.currentRound = res.data.tournament.rounds_tree[this.MatchToPlay.round_number - 1];
      }
      else {
        this.tournamentFinished = true;
        this.tournamentWinner = winner;
      }
    }
    catch (error) {
      console.error(`Error while trying to update match data : ${error}`);
    }
  }

  async createLocalTournament() {
    console.log(typeof this.nbPlayers, this.nbPlayers);
    try {
      const res = await API.post(
        `/tournament/list/`,
      {"participants": this.playerList,
        "number_of_players": this.nbPlayers}
      );
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
      removeCSS(this.cssLink);
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
					<input id="input-player-name" type="text" name="" value="" placeholder="Enter player n°${this.inputCount + 1} name" required/>
					<button id="input-player-button" type="button" class="btn btn-primary">
						Ok
					</button>
				</div>`;
  }

  renderTournament() {
    return `<div class="matches-main-div">
        ${this.tournamentFinished
          ? `<h1>Winner: ${this.tournamentWinner} !</h1>`
          : `<h1>Round n°${this.MatchToPlay.round_number}</h1>`
        }
				${this.currentRound.map((element) =>
          ((this.MatchToPlay.id === element.id) && !this.tournamentWinner)
        ? `<div class="next-match-main-div">
            <h1 class="me-3">${element.player1}</h1> 
            <h2>vs</h2>
            <h1>${element.player2}</h1>
            <button id="btn-start-match">PLAY</button>
          </div>`
        : !element.winner && !this.tournamentWinner
          ?`<div class="upcoming-match-main-div">
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
            </div>`).join('')}
			</div>`;
  }

  getGameHUDTemplate() {
    const { left, right } = this.state.score;
    const { gameIsPaused } = this.state.state;

    return `
          <div class="game-hud">
            <div class="game-score">
              <h1 class="display-4 mb-0">${left} - ${right}</h1>
            </div>
            <button id="toggle-pause" class="pause-play-btn">
              <div id="toggle-pause-styling" class="${gameIsPaused ? "play-icon" : "pause-icon"}" ></div>
            </button>
          </div>
          `;
  }

  render() {
    console.log(this.state.state.gameStarted);
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
