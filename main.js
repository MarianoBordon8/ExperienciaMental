import { GLTFLoader } from './libs/GLTFLoader.js';
// utilities
var get = function (selector, scope) {
  scope = scope ? scope : document;
  return scope.querySelector(selector);
};

var getAll = function (selector, scope) {
  scope = scope ? scope : document;
  return scope.querySelectorAll(selector);
};

// setup typewriter effect in the terminal demo
if (document.getElementsByClassName('demo').length > 0) {
  var i = 0;
  var txt = `
                        ESTO ES LO QUE REALMENTE PUEDO MODIFICAR, SERVIRA PARA ALGO? NOSE, PERO ESTA BASTANTE BUENO
                        Y PUEDO SEGUIR ESCRIBIENDO .............
                        ......................
                        ................`;
  var speed = 60;

  function typeItOut () {
    if (i < txt.length) {
      document.getElementsByClassName('demo')[0].innerHTML += txt.charAt(i);
      i++;
      setTimeout(typeItOut, speed);
    }
  }

  setTimeout(typeItOut, 1800);
}

// toggle tabs on codeblock
window.addEventListener("load", function() {
  // get all tab_containers in the document
  var tabContainers = getAll(".tab__container");

  // bind click event to each tab container
  for (var i = 0; i < tabContainers.length; i++) {
    get('.tab__menu', tabContainers[i]).addEventListener("click", tabClick);
  }

  // each click event is scoped to the tab_container
  function tabClick (event) {
    var scope = event.currentTarget.parentNode;
    // var clickedTab = event.target;
    // --- THIS IS THE CRUCIAL LINE I'VE ADDED ---
    var clickedTab = event.target.closest('.tab');
    
    // Check if the click was on a valid tab.
    if (!clickedTab) {
        return; // Exit the function if it wasn't a tab.
    }
    var tabs = getAll('.tab', scope);
    var panes = getAll('.tab__pane', scope);
    var activePane = get(`.${clickedTab.getAttribute('data-tab')}`, scope);

    // remove all active tab classes
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('active');
    }

    // remove all active pane classes
    for (var i = 0; i < panes.length; i++) {
      panes[i].classList.remove('active');
    }

    // apply active classes on desired tab and pane
    clickedTab.classList.add('active');
    activePane.classList.add('active');
  }
});


// responsive navigation
var topNav = get('.menu');
var icon = get('.toggle');

window.addEventListener('load', function(){
  function showNav() {
    if (topNav.className === 'menu') {
      topNav.className += ' responsive';
      icon.className += ' open';
    } else {
      topNav.className = 'menu';
      icon.classList.remove('open');
    }
  }
  icon.addEventListener('click', showNav);
});
// Get all the "Elegir" buttons
const startGameButtons = document.querySelectorAll('.tab__pane .button--secondary');
// Get the wrappers
const landingPageWrapper = document.querySelector('.pagina-elejir-opcion');
const gameWrapper = document.querySelector('.threejsCanvas');

// The main game function
function initializeThreeJSGame() {
  // 1. Hide the landing page and show the game wrapper
  landingPageWrapper.style.display = 'none';
  gameWrapper.style.display = 'block';

  // 2. THREE.js game initialization code
  // (Your original Three.js code goes here)
  // This part remains the same as what you provided.

  // Create the scene
  const escena = new THREE.Scene();
  escena.background = new THREE.Color("#48bfeb");

  // Import GLTFLoader
  const loader = new GLTFLoader();

  // Camera
  const fov = 75;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 0.1;
  const far = 1000;
  const camara = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camara.position.set(0, 0, 5);

  // Renderer
  const renderizador = new THREE.WebGLRenderer({
    canvas: document.querySelector("#miCanvas"),
    antialias: false
  });
  renderizador.toneMapping = THREE.LinearToneMapping;
  renderizador.toneMappingExposure = 1.0;
  renderizador.setSize(window.innerWidth, window.innerHeight);

  // Add ambient light
  const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.7);
  escena.add(luzAmbiente);

  // Load the 3D model
  loader.load(
    './assets/models/classroom.glb',
    function(gltf) {
      const classroom = gltf.scene;
      classroom.position.set(0, 0, 0);
      classroom.scale.set(1, 1, 1);
      escena.add(classroom);
    },
    undefined,
    function(error) {
      console.error('Error cargando la clase:', error);
    }
  );

  // Define room boundaries
  const margen = 0.5;
  const limites = {
    xMin: -10 + margen,
    xMax: 10 - margen,
    yMin: 0 + margen,
    yMax: 10 - margen,
    zMin: -10 + margen,
    zMax: 10 - margen
  };

  // Set initial camera position
  camara.position.set(0, 1, 5);

  // Array for collision boxes
  const colisionesBancos = [];

  // Basic first-person controls with the mouse
  let isMouseDown = false;
  let lastX = 0;
  let lastY = 0;
  let yaw = 0;
  let pitch = 0;

  function actualizarCamara() {
    camara.rotation.order = "YXZ";
    camara.rotation.y = yaw;
    camara.rotation.x = pitch;
  }

  renderizador.domElement.addEventListener('mousedown', function(e) {
    isMouseDown = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener('mouseup', function() {
    isMouseDown = false;
  });
  window.addEventListener('mousemove', function(e) {
    if (!isMouseDown) return;
    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    yaw -= deltaX * 0.005;
    pitch -= deltaY * 0.005;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    actualizarCamara();
  });

  // Variables for WASD movement
  let velocidad = 0.1;
  let direccion = new THREE.Vector3();
  let teclas = {};

  // Detect pressed keys
  window.addEventListener('keydown', function(e) {
    teclas[e.code] = true;
  });
  window.addEventListener('keyup', function(e) {
    teclas[e.code] = false;
  });

  // Update camera position based on keys
  function moverCamara() {
    direccion.set(0, 0, 0);

    if (teclas['KeyW']) direccion.z -= 1;
    if (teclas['KeyS']) direccion.z += 1;
    if (teclas['KeyA']) direccion.x -= 1;
    if (teclas['KeyD']) direccion.x += 1;
    if (teclas['KeyE']) direccion.y += 1;
    if (teclas['KeyQ']) direccion.y -= 1;

    if (direccion.length() > 0) {
      direccion.normalize();
      const matriz = new THREE.Matrix4();
      matriz.makeRotationY(camara.rotation.y);
      direccion.applyMatrix4(matriz);

      const nuevaPosicion = camara.position.clone().addScaledVector(direccion, velocidad);

      const dentroLimites = nuevaPosicion.x > limites.xMin && nuevaPosicion.x < limites.xMax &&
                            nuevaPosicion.y > limites.yMin && nuevaPosicion.y < limites.yMax &&
                            nuevaPosicion.z > limites.zMin && nuevaPosicion.z < limites.zMax;

      const cajaCamara = new THREE.Box3(
        new THREE.Vector3(nuevaPosicion.x - 0.2, nuevaPosicion.y - 0.5, nuevaPosicion.z - 0.2),
        new THREE.Vector3(nuevaPosicion.x + 0.2, nuevaPosicion.y + 0.5, nuevaPosicion.z + 0.2)
      );

      let colision = false;
      for (const cajaBanco of colisionesBancos) {
        if (cajaCamara.intersectsBox(cajaBanco)) {
          colision = true;
          break;
        }
      }

      if (dentroLimites && !colision) {
        camara.position.copy(nuevaPosicion);
      }
    }
  }

  const gridHelper = new THREE.GridHelper(20, 20);
  escena.add(gridHelper);

  // Animation loop
  let clock = new THREE.Clock();
  function animar() {
    requestAnimationFrame(animar);
    moverCamara();
    renderizador.render(escena, camara);
  }
  animar();
}

// Attach a click listener to all "Elegir" buttons
startGameButtons.forEach(button => {
  button.addEventListener('click', initializeThreeJSGame);//aca puedo enviar la id del boton por si en el futuro hace falta
});