export class Lang {
  constructor(state) {
    this.state = state;
    this.attachEventListeners();
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
      if (selectedLangImg) {
        if (this.state.state.lang === "EN") selectedLangImg.src = "english.jpg";
        else if (this.state.state.lang === "FR")
          selectedLangImg.src = "french.jpg";
      }

      // Sélection d'une langue
      document.querySelectorAll(".lang-menu li").forEach((item) => {
        item.addEventListener("click", (e) => {
          const newLang = e.currentTarget.getAttribute("data-lang");
          const langText =
            e.currentTarget.querySelector(".lang-name").textContent;
          this.state.updateLang(langText);
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
