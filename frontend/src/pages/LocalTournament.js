import {
  updateView,
  checkUserStatus,
  setDisable,
  handleLangDiv,
  handleHeader,
} from "../utils";
import API from "../services/api";
import { router } from "../app.js";
import { trad } from "../trad.js";
import {
  connectWallet,
  storeTournament,
} from "../../blockchain/ContractInteraction.js";
import { ethers } from "ethers";

export default class LocalTournament {
  constructor(state) {
    this.pageName = "LocalTournament";
    this.state = state;
    this.previousState = { ...state.state };
    this.oldscore = state.score;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.isSubscribed = false;
    this.isInitialized = false;
    this.possibleNbPlayers = ["2", "4", "8", "16", "32"];
    this.playerList = [];
    this.tournamentId = "";
    this.allTournamentScores = [];
    this.nbPlayers = 0;
    this.inputCount = 0;
    this.eventListeners = [];
    this.currentRound = [];
    this.MatchToPlay = {};
    this.formState = {};
    this.tournamentFinished = false;
    this.tournamentWinner = null;
    this.userAlias = "";
    this.lang = null;
    this.isProcessing = false;
    this.tournamentStoredOnBlockchain = false;
    this.buttonBlockchainState = "store";
  }

  async initialize(routeParams = {}) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    await updateView(this, {});
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

    const nbPlayers = [
      { id: "crab4", value: 4 },
      { id: "crab8", value: 8 },
      { id: "crab16", value: 16 },
      { id: "crab32", value: 32 },
    ];

    nbPlayers.forEach(({ id, value }) => {
      const crab = document.getElementById(id);
      if (crab) {
        const handleNbPlayersChange = this.handleNbPlayersChange.bind(
          this,
          value
        );
        if (!this.eventListeners.some((e) => e.name === id)) {
          crab.addEventListener("click", handleNbPlayersChange);
          this.eventListeners.push({
            name: id,
            type: "click",
            element: crab,
            listener: handleNbPlayersChange,
          });
        }
      }
    });

    const buttons = [
      { id: "pause-game" },
      { id: "resume-game" },
      { id: "exit-tournament" },
      { id: "game-menu-button" },
      { id: "btn-start-match" },
    ];

    buttons.forEach(({ id }) => {
      const button = document.getElementById(id);
      if (button) {
        const handleBtn = this.handleBtn.bind(this, id);
        if (!this.eventListeners.some((e) => e.name === id)) {
          button.addEventListener("click", handleBtn);
          this.eventListeners.push({
            name: id,
            type: "click",
            element: button,
            listener: handleBtn,
          });
        }
      }
    });

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

    const playerBtn = document.getElementById("player-name-button");
    if (playerBtn) {
      const handlePlayersName = this.handlePlayersName.bind(this);
      if (!this.eventListeners.some((e) => e.name === "playerBtn")) {
        playerBtn.addEventListener("click", handlePlayersName);
      }
      this.eventListeners.push({
        name: "playerBtn",
        type: "click",
        element: playerBtn,
        listener: handlePlayersName,
      });
    }

    const storeBlockchainButton = document.getElementById(
      "store-blockchain-button"
    );
    if (storeBlockchainButton) {
      const handleBlockchainStorage = this.handleBlockchainStorage.bind(this);
      if (
        !this.eventListeners.some((e) => e.name === "storeBlockchainButton")
      ) {
        storeBlockchainButton.addEventListener(
          "click",
          handleBlockchainStorage
        );
      }
      this.eventListeners.push({
        name: "storeBlockchainButton",
        type: "click",
        element: storeBlockchainButton,
        listener: handleBlockchainStorage,
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

  async handleNbPlayersChange(value) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.nbPlayers = value;
    console.log(this.nbPlayers);
    await updateView(this, {});
    this.isProcessing = false;
  }

  async handlePlayersName(e) {
    const enterKey = e.key;
    if (
      (enterKey && enterKey === "Enter") ||
      e.target.name === "player-name-button"
    ) {
      const input = document.getElementById("input-player-name");
      if (input) {
        const playerName = input.value;
        const regex = /^\w+$/;
        if (input.value) {
          if (!regex.test(input.value)) {
            return this.displayTournamentErrorMessage(
              trad[this.lang].errors.playerName
            );
          }
          if (input.value.length < 4)
            return this.displayTournamentErrorMessage(
              trad[this.lang].errors.playerMinlength
            );
          if (input.value.length > 10)
            return this.displayTournamentErrorMessage(
              trad[this.lang].errors.playerMaxlength
            );
          if (this.playerList.includes(playerName))
            return this.displayTournamentErrorMessage(
              trad[this.lang].errors.playerNameUnavailable
            );
        }
        if (playerName) {
          this.playerList.push(playerName);
          this.inputCount++;
          console.log(this.inputCount);
          console.log(this.playerList.map((el) => el));
          if (this.inputCount == this.nbPlayers)
            await this.createLocalTournament();
          else await updateView(this, {});
        }
      }
    }
  }

  async handleStateChange(newState) {
    let container = document.getElementById("app");
    if (
      (newState.gameHasLoaded && !this.previousState.gameHasLoaded) ||
      newState.lang !== this.previousState.lang
    ) {
      this.previousState = { ...newState };
      await updateView(this, {});
    } else if (newState.gameHasBeenWon && !this.previousState.gameHasBeenWon) {
      if (
        this.state.isUserLoggedIn &&
        (this.MatchToPlay.player1 === this.state.state.userAlias ||
          this.MatchToPlay.player2 === this.state.state.userAlias)
      )
        await this.saveGame();
      else await this.matchFinished();
      if (container) {
        container.innerHTML = "";
        container.className = "app";
        this.previousState = { ...newState };
        this.oldscore = { ...this.state.score };
        await updateView(this, {});
      }
    } else if (newState.gameStarted && !this.previousState.gameStarted) {
      console.log("new game started in handlestatechange");
      if (container) {
        container.innerHTML = "";
        container.className = "";
        this.previousState = { ...newState };
        await updateView(this, {});
      }
    } else if (
      (!newState.gameIsPaused && this.previousState.gameIsPaused) ||
      this.state.score["left"] !== this.oldscore["left"] ||
      this.state.score["right"] !== this.oldscore["right"]
    ) {
      if (container) {
        container.className = "";
        this.previousState = { ...newState };
        this.oldscore = { ...this.state.score };
        await updateView(this, {});
      }
    } else if (newState.gameIsPaused && !this.previousState.gameIsPaused) {
      if (container) {
        container.innerHTML = "";
        container.className = "app";
        this.previousState = { ...newState };
        await updateView(this, {});
      }
    } else this.previousState = { ...newState };
    this.oldscore = { ...this.state.score };
    this.display_store_button(this.buttonBlockchainState);
  }

  handleBtn(key) {
    setDisable(true, key);
    if (key === "pause-game") this.state.togglePause(true);
    else if (key === "resume-game") this.state.togglePause(false);
    else if (key === "exit-tournament" || key === "game-menu-button") {
      this.destroy();
      router.navigate("/game");
    } else if (key === "btn-start-match") this.state.setGameStarted("PVP");
    setDisable(false, key);
  }

  async handleBlockchainStorage() {
    setDisable(true, "store-blockchain-button");
    if (!this.tournamentFinished) {
      alert("Tournament is not finished !");
      return;
    }

    if (this.tournamentStoredOnBlockchain) {
      alert("Tournament has already been stored !");
      return;
    }
    // Vérifier si Metamask est connecté
    const userAddress = await connectWallet();
    if (!userAddress) {
      alert("Metamask connexion is required !");
      return;
    }

    // Récupérer les données du tournoi à envoyer
    if (this.tournamentId.length == 0) {
      alert("Tournament is not yet created !");
      return;
    }
    const tournamentId = this.uuidToBytes32(this.tournamentId);
    const rounds = this.formatTournamentData();
    // console.log("Données envoyées à storeFullTournament:", JSON.stringify(rounds, null, 2), "ID du tournoi:", tournamentId);
    // console.log("Envoi du tournoi sur la blockchain...", rounds);

    this.buttonBlockchainState = "storing";
    this.display_store_button(this.buttonBlockchainState);

    try {
      const success = await storeTournament(rounds, tournamentId);
      if (success) {
        // alert("Tournoi enregistré avec succès sur la blockchain !");
        this.buttonBlockchainState = "stored";
        this.display_store_button(this.buttonBlockchainState);
        this.tournamentStoredOnBlockchain = true;
      } else {
        this.buttonBlockchainState = "store";
        this.display_store_button(this.buttonBlockchainState);
      }
    } catch (error) {
      console.error("Blockchain error :", error);
      alert("Error has occured, check the console.");
    }
    setDisable(false, "store-blockchain-button");
  }

  display_store_button(button_version) {
    const storeButton = document.getElementById("store-blockchain-button");
    const storingButton = document.getElementById("storing-blockchain-button");
    const storedButton = document.getElementById("stored-blockchain-button");
    if (storeButton && storingButton && storedButton) {
      switch (button_version) {
        case "store":
          storeButton.style.display = "block";
          storingButton.style.display = "none";
          storedButton.style.display = "none";
          break;
        case "storing":
          storeButton.style.display = "none";
          storingButton.style.display = "block";
          storedButton.style.display = "none";
          break;
        case "stored":
          storeButton.style.display = "none";
          storingButton.style.display = "none";
          storedButton.style.display = "block";
          break;
      }
    }
  }

  formatTournamentData() {
    const formatedTournament = this.allTournamentScores.map((round, index) => ({
      roundID: index + 1,
      matches: round.map((match) => ({
        player1: match.player1,
        player2: match.player2,
        scorePlayer1: match.score_player1 || 0,
        scorePlayer2: match.score_player2 || 0,
      })),
    }));
    return formatedTournament;
  }

  uuidToBytes32(uuid) {
    return ethers.keccak256(ethers.toUtf8Bytes(uuid));
  }

  async saveGame() {
    if (!this.state.isUserLoggedIn || this.isProcessing) return;
    this.isProcessing = true;
    const { left, right } = this.state.score;
    this.formState.player1 = this.state.state.userId;
    this.formState.player2 = null;
    if (this.MatchToPlay.player1 === this.state.state.userAlias) {
      this.formState.score_player1 = parseInt(left);
      this.formState.score_player2 = parseInt(right);
      this.formState.opponentName = this.MatchToPlay.player2;
    } else {
      this.formState.score_player1 = parseInt(right);
      this.formState.score_player2 = parseInt(left);
      this.formState.opponentName = this.MatchToPlay.player1;
    }
    console.warn("posting data for tournament");
    console.log(this.formState.player1, this.formState.player2);
    try {
      await API.post(`/game/list/`, this.formState);
    } catch (error) {
      console.error(error);
    } finally {
      this.formState = {};
      await this.matchFinished();
      this.isProcessing = false;
    }
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
      if (res.status === 200 && !res.data.tournamentIsFinished) {
        this.MatchToPlay = res.data.nextMatchToPlay;
        this.currentRound =
          res.data.tournament.rounds_tree[this.MatchToPlay.round_number - 1];
        this.currentRound.sort((a, b) => a.id - b.id);
      } else if (res.status === 200 && res.data.tournamentIsFinished) {
        this.allTournamentScores = res.data.tournament.rounds_tree;
        this.tournamentFinished = true;
        this.tournamentWinner = winner;
      }
    } catch (error) {
      console.error(`Error while trying to update match data : ${error}`);
    } finally {
      this.state.state.gameHasBeenWon = false;
      if (!this.tournamentFinished) this.state.resetScore();
      this.oldscore = {};
    }
  }

  async createLocalTournament() {
    console.log(typeof this.nbPlayers, this.nbPlayers);
    try {
      const res = await API.post(`/tournament/list/`, {
        participants: this.playerList,
        number_of_players: this.nbPlayers,
      });
      this.currentRound = res.data.tournament.rounds_tree[0];
      this.currentRound.sort((a, b) => a.id - b.id);
      this.MatchToPlay = res.data.FirstMatch;
      this.tournamentId = res.data.tournament.id;
      await updateView(this, {});
    } catch (error) {
      console.error(`Error while trying to update user data : ${error}`);
      if (error.response && error.response.status === 400) {
        this.resetAttributes();
        if (error.response.data) {
          await updateView(this, {});
          if (error.response.data.error)
            this.displayTournamentErrorMessage(error.response.data.error);
          if (error.response.data.errors)
            this.displayTournamentErrorMessage(
              Object.values(error.response.data.errors)[0]
            );
        }
      }
    }
  }

  displayTournamentErrorMessage(errorMsg) {
    const errorTitle = document.getElementById("tournament-error-message");
    if (errorTitle) errorTitle.textContent = errorMsg;
  }

  resetAttributes() {
    this.playerList = [];
    this.nbPlayers = 0;
    this.inputCount = 0;
    this.currentRound = [];
    this.MatchToPlay = {};
    this.tournamentFinished = false;
    this.tournamentWinner = null;
    this.userAlias = "";
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ element, listener, type }) => {
      if (element) {
        element.removeEventListener(type, listener);
      }
    });
    this.eventListeners = [];
  }

  destroy() {
    this.removeEventListeners();
    if (this.isSubscribed) {
      this.state.unsubscribe(this.handleStateChange);
      this.isSubscribed = false;
    }
    this.resetAttributes();
    this.state.setGameEnded();
    this.state.resetScore();
    this.state.state.gameHasBeenWon = false;
  }

  renderSelectNbPlayers() {
    handleLangDiv(false);
    this.buttonBlockchainState = "store";
    return `<div class="select-container">
                <h2>${trad[this.lang].localTournament.playersNum}</h2>
				<div class="crab-playernb-div">
                    <img src="/crab4.png" alt="crab4img" class="crab-playernb-select" id="crab4">
                    <img src="/crab8.png" alt="crab8img" class="crab-playernb-select" id="crab8">
                    <img src="/crab16.png" alt="crab16img" class="crab-playernb-select" id="crab16">
                    <img src="/crab32.png" alt="crab32img" class="crab-playernb-select" id="crab32">
                 </div>
              </div>`;
  }

  renderInputPlayerName() {
    handleLangDiv(false);
    return `<div class="input-player-name">
					    <label>${trad[this.lang].localTournament.player}${this.inputCount + 1}</label>
              <input id="input-player-name" type="text" name="" minLength="4" maxLength="10" value="${this.inputCount + 1 === 1 ? this.userAlias : ""}"
              placeholder="${trad[this.lang].localTournament.namePlayer}${this.inputCount + 1}" required/>
			  <button class="btn btn-success m-3 account-button" id="player-name-button" name="player-name-button">
			  	OK
			  </button>
				    </div>`;
  }

  renderPauseMenu() {
    handleLangDiv(false);
    return `
				<div class="position-relative d-flex justify-content-center align-items-center min-vh-100">
					<div class="global-nav-section">
						<div class="game-paused-title">
							<h1>${trad[this.lang].localTournament.paused}</h1>
						</div>
						<div class="global-nav-items">
							<button id="resume-game">${trad[this.lang].localTournament.resume}</button>
						</div>
						<div class="global-nav-items">
							<button id="exit-tournament">${trad[this.lang].localTournament.stop}</button>
						</div>
					</div>
				</div>
  `;
  }

  renderTournament() {
    handleLangDiv(false);
    return `
        ${
          this.tournamentFinished
            ? `<h2 class="winner-announce">${trad[this.lang].localTournament.winner}${this.tournamentWinner} !</h2>`
            : !this.MatchToPlay.next_match
              ? `<h2 class="round-title">${trad[this.lang].localTournament.final}</h2>`
              : `<h2 class="round-title">${trad[this.lang].localTournament.round}${this.MatchToPlay.round_number}</h2>`
        }

        <div class="matches-list">
          ${this.currentRound
            .map((element) =>
              this.MatchToPlay.id === element.id && !this.tournamentWinner
                ? `<div class="next-match-main-div">
                    <div class="players-name-div">
                      <p>${element.player1}</p>
                      <p>vs</p>
                      <p>${element.player2}</p>
                    </div>
                    <button id="btn-start-match">${trad[this.lang].localTournament.play}</button>
                  </div>`
                : !element.winner && !this.tournamentWinner
                  ? `<div class="upcoming-match-main-div">
                      <div class="players-name-div">
                        <p>${element.player1}</p>
                        <p>vs</p>
                        <p>${element.player2}</p>
                      </div>
                      <p>⏳</p>
                    </div>`
                  : `<div class="passed-match-main-div">
                      <div class="players-name-div">
                        <p>${element.player1}</p>
                        <p>vs</p>
                        <p>${element.player2}</p>
                      </div>
                      <p>${
                        this.tournamentWinner
                          ? this.state.score.left
                          : element.score_player1
                      } -
                        ${
                          this.tournamentWinner
                            ? this.state.score.right
                            : element.score_player2
                        }</p>
                    </div>`
            )
            .join("")}
        </div>
        ${
          !this.tournamentFinished
            ? `<div class="stop-button-div">
              <button id="game-menu-button">
                ${`${trad[this.lang].localTournament.stop}`}
              </button>
            </div>`
            : `<div class="tournament-finished-button-div">
              <button id="game-menu-button">
              ${`${trad[this.lang].localTournament.gameMenu}`}
              </button>
              <button style="display: block" id="store-blockchain-button">
                 ${`${trad[this.lang].localTournament.storeBlockchain}`}
              </button>
              <div class="storing-blockchain-button" style="display: none" id="storing-blockchain-button">
                <button>${`${trad[this.lang].localTournament.storingBlockchain}`}</button>
              </div>
              <div class="stored-blockchain-button" style="display: none" id="stored-blockchain-button">
                <button>${`${trad[this.lang].localTournament.storedBlockchain}`}</button>
              </div>
            </div>`
        }
    `;
  }

  getGameHUDTemplate() {
    const { left, right } = this.state.score;
    const { gameIsPaused } = this.state.state;
    const leftPlayerName = this.MatchToPlay.player1;
    const rightPlayerName = this.MatchToPlay.player2;
    handleLangDiv(true);

    return this.state.state.gameIsPaused
      ? this.renderPauseMenu()
      : `
          <div class="tournament-game-hud">
            <div class="tournament-game-score">
              <h1>${leftPlayerName}</h1>
              <h1>${left} - ${right}</h1>
              <h1>${rightPlayerName}</h1>
            </div>
            <button id="pause-game" class="pause-play-btn">
              <div id="toggle-pause-styling" class="${gameIsPaused ? "play-icon" : "pause-icon"}" ></div>
            </button>
          </div>
          `;
  }

  async render(routeParams = {}) {
    this.tournamentStoredOnBlockchain = false;
    await checkUserStatus();

    if (!this.isSubscribed) {
      this.previousState = { ...this.state.state };
      this.state.subscribe(this.handleStateChange);
      this.isSubscribed = true;
    }
    if (this.state.isUserLoggedIn) this.getUserAlias(this.state.state.userId);
    else this.userAlias = "";
    if (this.state.state.gameStarted)
      handleHeader(this.state.isUserLoggedIn, true, false);
    else handleHeader(this.state.isUserLoggedIn, false, false);
    this.lang = this.state.state.lang;
    return this.state.state.gameStarted
      ? this.getGameHUDTemplate()
      : `
          <div class="main-div-tournament">
              <h1 class="global-page-title">${trad[this.lang].localTournament.pageTitle}</h1>
              <div class="content-page-tournament">
                ${
                  !this.nbPlayers
                    ? this.renderSelectNbPlayers()
                    : this.nbPlayers == this.inputCount
                      ? this.renderTournament()
                      : this.renderInputPlayerName()
                }
				<h2 class="tournament-error-message" id="tournament-error-message"></h2>
              </div>
          </div>
        `;
  }
}
