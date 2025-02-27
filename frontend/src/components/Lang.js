import API from "../services/api";

export class Lang {
  constructor(state) {
    this.state = state;
    this.attachEventListeners();
  }

  async updateUserLang(langText) {
    try {
      const res = API.put(`/user/${this.state.state.userId}/`, {
        lang: langText,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  attachEventListeners() {
    const langDiv = document.querySelector(".lang-div");
    const dropdownBtn = document.getElementById("lang-dropdown-btn");
    const langMenu = document.getElementById("lang-menu");

    if (langDiv && dropdownBtn && langMenu) {
      dropdownBtn.addEventListener("click", (e) => {
        langDiv.classList.toggle("open");
        e.stopPropagation();
      });

      const selectedLangImg = document.getElementById("selected-lang-img");
      const loading = document.querySelector(".loading-h2");
      if (selectedLangImg && loading) {
        const loadingText = loading.childNodes[0];
        if (this.state.state.lang === "EN") {
          selectedLangImg.src = "english.jpg";
          loadingText.nodeValue = "Loading Game";
        } else if (this.state.state.lang === "ES") {
          selectedLangImg.src = "spanish.jpg";
          loadingText.nodeValue = "Cargando Juego";
        } else if (this.state.state.lang === "FR") {
          selectedLangImg.src = "french.jpg";
          loadingText.nodeValue = "Chargement du jeu";
        } else if (this.state.state.lang === "CR") {
          selectedLangImg.src = "crab.jpg";
          loadingText.nodeValue = "Crabing Crab";
        }
      }

      // Sélection d'une langue
      document.querySelectorAll(".lang-menu li").forEach((item) => {
        item.addEventListener("click", async (e) => {
          const newLang = e.currentTarget.getAttribute("data-lang");
          const langText =
            e.currentTarget.querySelector(".lang-name").textContent;
          this.state.updateLang(langText);
          if (this.state.isUserLoggedIn) await this.updateUserLang(langText);
          console.log("this.state.state.lang : " + this.state.state.lang);
          langDiv.classList.remove("open");

          selectedLangImg.classList.add("fade-out");

          setTimeout(() => {
            selectedLangImg.src = newLang;
            selectedLangImg.classList.remove("fade-out");
          }, 250);
        });
      });

      // Fermer le menu quand on clique ailleurs
      document.addEventListener("click", (e) => {
        if (!langDiv.contains(e.target)) {
          langDiv.classList.remove("open");
        }
      });
    }
  }
}
