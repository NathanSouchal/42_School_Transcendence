import axios from "axios";

export default class Social {
    constructor(state) {
        this.state = state;
        this.handleStateChange = this.handleStateChange.bind(this);
        this.isSubscribed = false; // Eviter plusieurs abonnements
        this.isInitialized = false;
        this.friends = {};
        this.invitations = {};
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
            await this.getFriends(userId);
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
    
      async getFriends(id) {
        try {
          const res = await axios.get(`https://localhost:8000/friends/${id}/`);
          const data = res.data.friends;
          this.friends = data;
          console.log(
            "Friends: " +
              Object.entries(this.matchHistory).map(([key, value]) => `${key}: ${Object.entries(value).map(([ky, val]) => `${ky}: ${val}`)}`)
          );
        } catch (error) {
          console.error(error);
        }
      }
    
      destroy() {}
    
      render() {
        if (this.friends && Object.keys(this.friends).length > 0) {
            return `<div class="d-flex flex-column m-3">
                      <h3>FRIENDS</h3>
                      ${Object.values(this.friends)
                         .map((value) => 
                            `<div class="d-flex gap-3 align-items-center">
                                <h3>${value.username}</h3>
                                <h4>Id: ${value.id}</h4>
                             </div>`)
                         .join("")}
                    </div>`;
        } else {
            return `<h1>No data</h1>`;
        }
    }
  }  