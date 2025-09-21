import { CrearCanvas } from "./codigos/canvas.js";

// utilities
var get = function (selector, scope) {
  scope = scope ? scope : document;
  return scope.querySelector(selector);
};

var getAll = function (selector, scope) {
  scope = scope ? scope : document;
  return scope.querySelectorAll(selector);
};

// Funcion para escribir las letras como si fuera una terminal
if (document.getElementsByClassName("demo").length > 0) {
  var i = 0;
  var txt = `
                        Diseñar un entorno virtual de aula, en primera persona, que permita comprender distintas maneras de percibir y procesar una clase y abrir conversación sobre ajustes razonables e inclusión.
                        Propuesta educativa, no clínica.`;
  var speed = 60;

  function typeItOut() {
    if (i < txt.length) {
      document.getElementsByClassName("demo")[0].innerHTML += txt.charAt(i);
      i++;
      setTimeout(typeItOut, speed);
    }
  }

  setTimeout(typeItOut, 100);
}

// Seleccion del personaje
window.addEventListener("load", function () {
  // get all tab_containers in the document
  var tabContainers = getAll(".tab__container");

  // bind click event to each tab container
  for (var i = 0; i < tabContainers.length; i++) {
    get(".tab__menu", tabContainers[i]).addEventListener("click", tabClick);
  }

  // each click event is scoped to the tab_container
  function tabClick(event) {
    var scope = event.currentTarget.parentNode;
    var clickedTab = event.target.closest(".tab");

    // Check if the click was on a valid tab.
    if (!clickedTab) {
      return; // Exit the function if it wasn't a tab.
    }
    var tabs = getAll(".tab", scope);
    var panes = getAll(".tab__pane", scope);
    var activePane = get(`.${clickedTab.getAttribute("data-tab")}`, scope);

    // remove all active tab classes
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove("active");
    }

    // remove all active pane classes
    for (var i = 0; i < panes.length; i++) {
      panes[i].classList.remove("active");
    }

    // apply active classes on desired tab and pane
    clickedTab.classList.add("active");
    activePane.classList.add("active");
  }
});

// responsive navigation
var topNav = get(".menu");
var icon = get(".toggle");

window.addEventListener("load", function () {
  function showNav() {
    if (topNav.className === "menu") {
      topNav.className += " responsive";
      icon.className += " open";
    } else {
      topNav.className = "menu";
      icon.classList.remove("open");
    }
  }
  icon.addEventListener("click", showNav);
});
// Get all the "Elegir" buttons
const startGameButtons = document.querySelectorAll(
  ".tab__pane .button--secondary"
);
// Get the wrappers
const landingPageWrapper = document.querySelector(".pagina-elejir-opcion");
const gameWrapper = document.querySelector(".threejsCanvas");

// Aca comienza Threejs
function initializeThreeJSGame(event) {
  // Esconder la pagina principal y mostrar el canvas
  landingPageWrapper.style.display = "none";
  gameWrapper.style.display = "block";
  document.body.classList.add("no-scroll");

  // Enviar la ID del boton para que despues se pueda elejir el canvas deseado
  CrearCanvas(event.target.id);
}

// Attach a click listener to all "Elegir" buttons
startGameButtons.forEach((button) => {
  button.addEventListener("click", initializeThreeJSGame); //aca puedo enviar la id del boton por si en el futuro hace falta
});
