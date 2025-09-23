import { crearObjetos } from "./objetos.js";
import { crearCartelInstrucciones, setEtiquetaC } from "./cartelInstrucciones.js";
import { crearHabitacion } from "./habitacion.js";
import { crearTelevisor } from "./televisor.js";
import { crearExamen } from "./examen.js";
import { manejarEventosTeclado } from "./eventosTeclado.js";
import { crearMovimientoCamara } from "./movimientoCamara.js";

// Experiencias
import { inicializarSistemaDislexia } from "./enfermedades/dislexia.js";
import { activarSistemaEsquizofrenia } from "./enfermedades/esquizofrenia.js";
import { activarSistemaAnsiedad } from "./enfermedades/ansiedad.js";

function etiquetaPorEnfermedad(enf) {
  switch (enf) {
    case "dislexia":      return "Dislexia ON/OFF";
    case "esquizofrenia": return "Esquizofrenia ON/OFF";
    case "ansiedad":      return "Ansiedad ON/OFF";
    default:              return "ON/OFF";
  }
}

function CrearCanvas(idOpcionPersonaje) {
  console.log("[Canvas] Personaje:", idOpcionPersonaje);

  // --- Escena ---
  const escena = new THREE.Scene();
  escena.background = new THREE.Color("#48bfeb");

  // --- Mundo base ---
  crearHabitacion(escena);
  crearObjetos(escena);
  crearCartelInstrucciones();

  // --- Interactivos comunes ---
  const televisor = crearTelevisor(escena, idOpcionPersonaje);
  const examen    = crearExamen(escena);

  // --- Cámara fija (alumno) ---
  const fov = 75, aspect = window.innerWidth / window.innerHeight, near = 0.1, far = 1000;
  const camara = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camara.position.set(-2.5, 1, -1);
  camara.rotation.y = Math.PI;

  // --- Renderizador ---
  const renderizador = new THREE.WebGLRenderer({
    canvas: document.querySelector("#miCanvas"),
    antialias: true,
    powerPreference: "high-performance"
  });
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderizador.setSize(window.innerWidth, window.innerHeight);
  if (renderizador.outputColorSpace) {
    renderizador.outputColorSpace = THREE.SRGBColorSpace;
  }

  // --- Luz ---
  const luzAmbiente = new THREE.AmbientLight(0xffffff, 1.1);
  escena.add(luzAmbiente);

  // --- Mirada (rotación) ---
  const movimiento = crearMovimientoCamara(camara, renderizador);

  // --- Selección de experiencia (init; ON/OFF con tecla C) ---
  let enfermedad = null;
  if (idOpcionPersonaje === "Juan") {
    enfermedad = "dislexia";
    inicializarSistemaDislexia(televisor, examen, idOpcionPersonaje);
  } else if (idOpcionPersonaje === "Mario") {
    enfermedad = "esquizofrenia";
    activarSistemaEsquizofrenia(); // solo init
  } else if (idOpcionPersonaje === "Franco") {
    enfermedad = "ansiedad";
    activarSistemaAnsiedad(); // solo init (audio + nodos), play con C
  } else {
    console.warn("[Canvas] Personaje no reconocido.");
  }

  // Actualizar cartel “C = …”
  setEtiquetaC(etiquetaPorEnfermedad(enfermedad));

  // --- Teclado unificado (C = ON/OFF, P = examen) ---
  manejarEventosTeclado(camara, televisor, examen, movimiento, enfermedad);

  // --- Animación ---
  let stopped = false;
  function frame() {
    if (stopped) return;
    if (televisor.actualizarVisibilidad) televisor.actualizarVisibilidad();
    renderizador.render(escena, camara);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // --- Responsive ---
  const onResize = () => {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener("resize", onResize);

  return {
    destroy() {
      stopped = true;
      window.removeEventListener("resize", onResize);
      renderizador.dispose();
      console.log("[Canvas] destroy()");
    }
  };
}

export { CrearCanvas };
