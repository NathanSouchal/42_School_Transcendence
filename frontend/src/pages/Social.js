import axios from "axios";

export default class Social {
    constructor(state) {
        this.state = state;
        this.handleStateChange = this.handleStateChange.bind(this);
        this.isSubscribed = false; // Eviter plusieurs abonnements
        this.isInitialized = false;
        // this.matchHistory = {};
    }

    async initialize() {
        if (!this.isSubscribed) {
          this.state.subscribe(this.handleStateChange);
          this.isSubscribed = true;
          console.log("Social page subscribed to state");
        }
        if (this.isInitialized) return;
        this.isInitialized = true;
    
        const userId = Number(localStorage.getItem("id"));
        if (userId) {
            await this.getMatchHistory(userId);
        }
        // Appeler render pour obtenir le contenu HTML
        const content = this.render();
        // Insérer le contenu dans le conteneur dédié
        const container = document.getElementById("app");
        if (container) {
          container.innerHTML = content;
        }
        // Ajouter les écouteurs d'événements après avoir rendu le contenu
        this.attachEventListeners();
      }
    
      attachEventListeners() {}

      handleStateChange() {}
    
      async getMatchHistory(id) {
        try {
          const res = await axios.get(`https://localhost:8000/match-history/${id}/`);
          const data = res.data.match_history;
          this.matchHistory = data;
          console.log(
            "MatchHistory: " +
              Object.entries(this.matchHistory).map(([key, value]) => `${key}: ${Object.entries(value).map(([ky, val]) => `${ky}: ${val}`)}`)
          );
        } catch (error) {
          console.error(error);
        }
      }
    
      destroy() {}
    
      render() {
        if (this.matchHistory && Object.keys(this.matchHistory).length > 0) {
          return `${Object.values(this.matchHistory).map((value) => 
            `<div class="d-flex flex-column m-3"><h3>Game n°${value.id}</h3>
                <div class="d-flex gap-3 align-items-center">
                    <h5>${value.created_at.split('T')[0]}</h5>
                    <h4>${value.player1}</h4>
                    <h5>${value.score_player1}</h5>
                    <span>-</span>
                    <h5>${value.score_player2}</h5>
                    <h4>${value.player2}</h4>
                </div>

            </div>`).join("")}`;
        } else {
          return `<h1>No data</h1>`;
        }
      }
}