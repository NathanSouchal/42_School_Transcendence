export class Lang {
  constructor() {
    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.attachEventListeners()
      );
    } else {
      this.attachEventListeners();
    }
  }

  attachEventListeners() {
    const dropdownBtn = document.getElementById("dropdown-btn");
    const langMenu = document.getElementById("lang-menu");
    const selectedLang = document.getElementById("selected-lang");

    if (!dropdownBtn || !langMenu || !selectedLang) {
      console.error(
        "Les éléments de la langue ne sont pas trouvés dans le DOM !"
      );
      return;
    }

    console.log("AAAAAAH");

    dropdownBtn.addEventListener("click", function (event) {
      langMenu.style.display =
        langMenu.style.display === "block" ? "none" : "block";
      event.stopPropagation(); // Empêcher de fermer immédiatement après l'ouverture
    });

    // Sélection d'une langue
    document.querySelectorAll(".lang-menu li").forEach((item) => {
      item.addEventListener("click", function () {
        const newLang = this.getAttribute("data-lang");
        selectedLang.src = newLang;
        langMenu.style.display = "none"; // Ferme le menu après la sélection
      });
    });

    // Fermer le menu quand on clique ailleurs
    document.addEventListener("click", function (event) {
      if (
        !dropdownBtn.contains(event.target) &&
        !langMenu.contains(event.target)
      ) {
        langMenu.style.display = "none";
      }
    });
  }
}
