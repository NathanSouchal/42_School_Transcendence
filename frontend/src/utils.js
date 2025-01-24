export function resetZIndex() {
  const canvas = document.querySelector("#c");
  const app = document.querySelector("#app");
  if (canvas && app) {
    canvas.style.zIndex = "-1"; // Canvas en arrière-plan
    //app.style.zIndex = "0"; // App en avant-plan
    app.classList.remove("view2");
    app.classList.add("view1");
  }
}

export function updateView(context) {
  const container = document.getElementById("app");
  if (container) {
    container.innerHTML = context.render();
    context.removeEventListeners();
    context.attachEventListeners();
  }
}


export function addCSS(path) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = path;
  document.head.appendChild(link);

  console.log("CSS ajouté");
  return link;
}

export function removeCSS(link) {
  document.head.removeChild(link);
  console.log("CSS supprimé");
}
