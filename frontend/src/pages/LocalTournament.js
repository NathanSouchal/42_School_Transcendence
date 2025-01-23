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
    this.idMatchToPlay = 0;
    this.cssLink;
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

  handleStateChange(newState) {
    console.log("GameHasLoaded : " + newState.gameHasLoaded);
    // if (newState.gameHasLoaded) {
    //   console.log("GameHasLoaded state changed, rendering Account page");
    //   const content = this.render();
    //   const container = document.getElementById("app");
    //   if (container) {
    //     container.innerHTML = content;
    //     this.removeEventListeners();
    //     this.attachEventListeners();
    //   }
    // }
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
      this.idMatchToPlay = res.data.FirstMatch.id;
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
				${this.currentRound.map((element) =>
          this.idMatchToPlay === element.id
        ? `<div class="next-match-main-div">
            <h1 class="me-3">${element.player1}</h1> 
            <h2>vs</h2>
            <h1>${element.player2}</h1>
            <h1>NEXT</h1>
          </div>`
        : !element.winner
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
              <h1>${element.score_player1} - ${element.score_player2}</h1>
            </div>`).join('')}
			</div>`;
  }

  render() {
    return `${
      !this.nbPlayers
        ? `${this.renderSelectNbPlayers()}`
        : this.nbPlayers == this.inputCount
          ? `${this.renderTournament()}`
          : `${this.renderInputPlayerName()}`
    }`;
  }
}
