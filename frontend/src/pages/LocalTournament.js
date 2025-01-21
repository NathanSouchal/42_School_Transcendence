import axios from "axios";

export default class LocalTournament {
    constructor(state) {
        this.state = state;
        this.handleStateChange = this.handleStateChange.bind(this);
        this.isSubscribed = false; // Eviter plusieurs abonnements
        this.isInitialized = false;
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
    
    
      attachEventListeners(){}

      handleStateChange(newState) {
        console.log("GameHasLoaded : " + newState.gameHasLoaded);
        if (newState.gameHasLoaded) {
          console.log("GameHasLoaded state changed, rendering Account page");
          const content = this.render();
          const container = document.getElementById("app");
          if (container) {
            container.innerHTML = content;
            this.removeEventListeners();
            this.attachEventListeners();
          }
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

      render(userId) {
        if (userId) {
            return ``
        } else {
            return `<h1>No data</h1>`;
        }
    }
  }  