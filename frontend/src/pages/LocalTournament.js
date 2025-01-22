import axios from "axios";
import { updateView } from "../utils";

export default class LocalTournament {
  constructor(state) {
    this.state = state;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.updateView = updateView.bind(this, this);
    this.isSubscribed = false; // Eviter plusieurs abonnements
    this.isInitialized = false;
    this.possibleNbPlayers = ["2", "4", "8", "16", "32"];
    this.playerNames = [];
    this.nbPlayers = 0;
    this.inputCount = 0;
    this.eventListeners = [];
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
        inputPlayerButton.addEventListener("click", () => {
          const playerName = document.getElementById("input-player-name").value;
          if (playerName) handlePlayersName(playerName);
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
    this.nbPlayers = selectedValue;
    console.log(this.nbPlayers);
    this.updateView();
  }

  handlePlayersName(playerName) {
    this.playerNames.push(playerName);
    this.inputCount++;
    console.log(this.inputCount);
    console.log(this.playerNames.map((el) => el));
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
					<input id="input-player-name" type="text" name="" value="" placeholder="Enter player n°${this.inputCount + 1} name" required/>
					<button id="input-player-button" type="button" class="btn btn-primary">
						Ok
					</button>
				</div>`;
  }

  renderTournament() {
    return `<div class="d-flex justify-content-center align-items-center m-5">
				Tournament ready
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
