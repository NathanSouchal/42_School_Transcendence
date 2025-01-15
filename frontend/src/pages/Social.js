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
            await this.getInvitations(userId);
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

      async getInvitations(id) {
        try {
          const res = await axios.get(`https://localhost:8000/friendship/byuser/${id}/`);
          const data = res.data.pending_friendships;
          this.invitations = data;
          console.log(
            "Invitations: " +
              Object.entries(this.matchHistory).map(([key, value]) => `${key}: ${Object.entries(value).map(([ky, val]) => `${ky}: ${val}`)}`)
          );
        } catch (error) {
          console.error(error);
        }
      }
    
      destroy() {}
    
      render(userId) {
        if (this.friends && this.invitations) {
            return `<div class="d-flex flex-column m-5">
                      <div class="m-2">
                        <h3>FRIENDS</h3>
                        ${Object.keys(this.friends).length > 0
                          ? `
                          ${Object.values(this.friends)
                            .map((value) => 
                                `<div class="d-flex gap-3 align-items-center">
                                    <h3>${value.username}</h3>
                                    <h4>Id: ${value.id}</h4>
                                </div>`)
                            .join("")} `
                          : `
                          <h4>zero friend, sniff sniff</h4>`
                        }
                      </div>
                      <div class="m-2">
                        <h3>INVITATIONS</h3>
                        ${Object.keys(this.invitations).length > 0
                          ? `
                          ${Object.values(this.invitations)
                            .map((value) => 
                                `<div class="d-flex gap-3 align-items-center">
                                    ${value.from_user.id == userId
                                    ?`
                                    <h3>To ${value.to_user.username}, waiting for acceptation...</h3>
                                    `
                                    :`
                                    <h3>From ${value.from_user.username}</h3>
                                    <button class="btn border-0 bg-transparent text-danger">X</button>
                                    `}
                                    <button class="btn border-0 bg-transparent text-danger">X</button>
                                </div>`)
                            .join("")}`
                          : `
                          <h4>no pending invitations</h4>`
                        }
                      </div>
                    </div>`;
        } else {
            return `<h1>No data</h1>`;
        }
    }
  }  