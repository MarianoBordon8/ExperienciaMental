import { crearObjetos } from "./objetos.js";
import { crearCartelInstrucciones } from "./cartelInstrucciones.js";
import { crearHabitacion } from "./habitacion.js";
import { crearTelevisor } from "./televisor.js";
import { crearExamen } from "./examen.js";
import { manejarEventosTeclado } from "./eventosTeclado.js";
import { crearMovimientoCamara } from "./movimientoCamara.js";
import { inicializarSistemaDislexia } from "./enfermedades/dislexia.js";
import { activarSistemaEsquizofrenia } from "./enfermedades/esquizofrenia.js"; // Sistema de audio estéreo

// main.js
function CrearCanvas(idOpcionPersonaje) {
  console.log(idOpcionPersonaje);

  // Crear la escena
  const escena = new THREE.Scene();
  escena.background = new THREE.Color("#48bfeb"); // Azul

  let enfermedad;

  // ----- Entorno base -----
  crearHabitacion(escena);
  crearObjetos(escena);
  crearCartelInstrucciones();
  const televisor = crearTelevisor(escena, idOpcionPersonaje);
  const examen = crearExamen(escena);

  if (idOpcionPersonaje === "Juan") {
    // Inicializar el sistema de dislexia con los objetos creados
    enfermedad = "dislexia";
    inicializarSistemaDislexia(televisor, examen, idOpcionPersonaje);
  }else if (idOpcionPersonaje === "Mario") {
    // Activar sistema de esquizofrenia (susurro por auricular derecho con tecla Y)
    enfermedad = "esquizofrenia";
    activarSistemaEsquizofrenia();
    console.log("Sistema de esquizofrenia activado para", idOpcionPersonaje);
  }else if (idOpcionPersonaje === "Franco") {
    console.log(idOpcionPersonaje);
  }else {
    console.log("No se seleccionó un personaje válido.");
  }

  // Cámara (alumno fijo en su banco)
  const fov = 75,
    aspect = window.innerWidth / window.innerHeight,
    near = 0.1,
    far = 1000;
  const camara = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camara.position.set(-2.5, 1, -1);
  camara.rotation.y = Math.PI; // hacia el frente del aula

  // Renderizador
  const renderizador = new THREE.WebGLRenderer({
    canvas: document.querySelector("#miCanvas"),
    antialias: true,
  });
  renderizador.setSize(window.innerWidth, window.innerHeight);

  // Luz ambiental
  const luzAmbiente = new THREE.AmbientLight(0xffffff, 1.1);
  escena.add(luzAmbiente);

  // Mirada (sólo rotación, sin desplazamiento)
  const movimiento = crearMovimientoCamara(camara, renderizador);

  // Teclado (C = pizarrón, P = examen)
  manejarEventosTeclado(camara, televisor, examen, movimiento, enfermedad);

  // Animación
  function animar() {
    requestAnimationFrame(animar);
    televisor.actualizarVisibilidad();
    renderizador.render(escena, camara);
  }
  animar();
  // Responsive
  window.addEventListener("resize", () => {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
  });
}

export { CrearCanvas };
