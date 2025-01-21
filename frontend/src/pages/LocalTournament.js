import axios from "axios";

export default class LocalTournament {
    constructor(state) {
        this.state = state;
        this.handleStateChange = this.handleStateChange.bind(this);
        this.isSubscribed = false; // Eviter plusieurs abonnements
        this.isInitialized = false;
        this.possibleNbPlayers = ["2", "4", "8", "16", "32"];
        this.nbPlayers = 0;
        this.eventListeners = [];
    }

    async initialize() {
        if (!this.isSubscribed) {
          this.state.subscribe(this.handleStateChange);
          this.isSubscribed = true;
          console.log("LocalTournament page subscribed to state");
        }
        if (this.isInitialized) return;
        this.isInitialized = true;
    
        const userId = Number(localStorage.getItem("id"));
        if (userId) {
           
        }
        // Appeler render pour obtenir le contenu HTML
        const content = this.render(userId);
        // Insérer le contenu dans le conteneur dédié
        const container = document.getElementById("app");
        if (container) {
          container.innerHTML = content;
        }
        // Ajouter les écouteurs d'événements après avoir rendu le contenu
        this.attachEventListeners();
      }
    
    
      attachEventListeners(){
        const selectNbPlayers = document.getElementById("select-nb-players");
        if (selectNbPlayers) {
          const handleNbPlayersChange = this.handleNbPlayersChange.bind(this);
          if (!this.eventListeners.some((e) => e.name === "selectNbPlayersEvent")) {
            selectNbPlayers.addEventListener("change", e => handleNbPlayersChange(e.target.value))
          }
          this.eventListeners.push({
            name: "selectNbPlayersEvent",
            type: "change",
            element: selectNbPlayers,
            listener: handleNbPlayersChange,
          })
        }
      }

      handleNbPlayersChange(selectedValue){
        this.nbPlayers = selectedValue;
        console.log(this.nbPlayers);
        const content = this.render();
        // Insérer le contenu dans le conteneur dédié
        const container = document.getElementById("app");
        if (container) {
          container.innerHTML = content;
        }
      }

      renderSelectNbPlayers() {
        return `<div class="d-flex justify-content-center align-items-center m-5">
                      <select id="select-nb-players" class="form-control">
                        <option value="" disabled selected>Select number of players</option>
                        ${this.possibleNbPlayers
                          .map((element) => `<option value="${element}">${element}</option>`)
                          .join('')}
                      </select>
                    </div>
                `;
      }

      renderInputPlayerName() {
        return `<div>COUCOU</div>`;
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

      render() {
            return `${this.nbPlayers === 0
                    ?
                    `${this.renderSelectNbPlayers()}`
                    :
                    `${this.renderInputPlayerName()}`
            }

            `;
    }
  }  