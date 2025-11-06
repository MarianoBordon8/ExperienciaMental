// codigos/canvas.js
import {
  crearObjetos,
  animations,
  mixer,
  actualizarAnimaciones,
} from "./objetos.js";
import {
  crearCartelInstrucciones,
  setEtiquetaC,
} from "./cartelInstrucciones.js";
import { crearHabitacion } from "./habitacion.js";
import { crearTelevisor } from "./televisor.js";
import { crearExamen } from "./examen.js";
import { manejarEventosTeclado } from "./eventosTeclado.js";
import { crearMovimientoCamara } from "./movimientoCamara.js";

// Experiencias: TODAS se cargan dinámicamente según el personaje seleccionado
// import { inicializarSistemaDislexia } from "./enfermedades/dislexia.js"; // ← Ahora se carga dinámicamente
// import { activarSistemaEsquizofrenia} from "./enfermedades/esquizofrenia.js"; // ← Ahora se carga dinámicamente
// import { activarSistemaAnsiedad } from "./enfermedades/ansiedad.js"; // ← Ahora se carga dinámicamente

/* ================== Utils ================== */
function etiquetaPorEnfermedad(enf) {
  switch (enf) {
    case "dislexia":
      return "Dislexia";
    case "esquizofrenia":
      return "Esquizofrenia";
    case "ansiedad":
      return "Ansiedad";
    default:
      return "ON/OFF";
  }
}

// Limpieza profunda de geometrías/materiales/texturas
function disposeObject(obj) {
  obj.traverse?.((n) => {
    if (n.geometry) n.geometry.dispose?.();
    if (n.material) {
      const mats = Array.isArray(n.material) ? n.material : [n.material];
      mats.forEach((m) => {
        for (const k in m) {
          const v = m[k];
          if (v && v.isTexture) v.dispose?.();
        }
        m.dispose?.();
      });
    }
  });
}

// Crea un renderer con parámetros de rendimiento
function createOptimizedRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false, // mejor perf. (activar si lo necesitás)
    powerPreference: "high-performance",
    alpha: false,
    stencil: false,
    depth: true,
    precision: "mediump",
  });

  const capDPR = Math.min(2, window.devicePixelRatio || 1);
  renderer.setPixelRatio(capDPR);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  if (renderer.outputColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  // sombras desactivadas (actívalas si las usás)
  renderer.shadowMap.enabled = false;

  // guardamos el cap de DPR para el auto-scaler
  renderer.__capDPR = capDPR;
  return renderer;
}

/* ================== CrearCanvas ================== */
async function CrearCanvas(idOpcionPersonaje) {

  // --- Escena ---
  const escena = new THREE.Scene();
  escena.background = new THREE.Color("#48bfeb");

  // --- Mundo base ---
  crearHabitacion(escena);
  crearObjetos(escena, idOpcionPersonaje); // 👻 Pasar personaje para control de monstruo
  crearCartelInstrucciones();

  // --- Interactivos comunes ---
  const televisor = crearTelevisor(escena, idOpcionPersonaje);
  const examen = crearExamen(escena);

  // --- Cámara fija (alumno) ---
  const fov = 75,
    aspect = window.innerWidth / window.innerHeight,
    near = 0.1,
    far = 1000;
  const camara = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camara.position.set(-2.5, 1, -1);
  camara.rotation.y = Math.PI;

  // --- Renderizador optimizado ---
  const canvasEl = document.querySelector("#miCanvas");
  const renderizador = createOptimizedRenderer(canvasEl);

  // --- Luz ---
  const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.1);
  escena.add(luzAmbiente);

  const luzTecho = new THREE.PointLight(0xffffff, 1, 90, 2); // Color Blanco, intensity 1, 100 units distance, decay 2
  luzTecho.position.set(0, 3, 0);
  escena.add(luzTecho);

  // --- Mirada (rotación) ---
  const movimiento = crearMovimientoCamara(camara, renderizador);

  // --- Selección de experiencia: CARGA DINÁMICA (init; ON/OFF con tecla C) ---
  let enfermedad = null;

  if (idOpcionPersonaje === "Juan") {
    enfermedad = "dislexia";

    // ✨ CARGA DINÁMICA: Solo se carga si es Juan
    const { inicializarSistemaDislexia } = await import(
      "./enfermedades/dislexia.js"
    );
    inicializarSistemaDislexia(televisor, examen, idOpcionPersonaje);
  } else if (idOpcionPersonaje === "Mario") {
    enfermedad = "esquizofrenia";

    // ✨ CARGA DINÁMICA: Solo se carga si es Mario
    const { activarSistemaEsquizofrenia } = await import(
      "./enfermedades/esquizofrenia.js"
    );
    activarSistemaEsquizofrenia(); // solo init
  } else if (idOpcionPersonaje === "Franco") {
    enfermedad = "ansiedad";

    // ✨ CARGA DINÁMICA: Solo se carga si es Franco
    const { activarSistemaAnsiedad } = await import(
      "./enfermedades/ansiedad.js"
    );
    activarSistemaAnsiedad(); // solo init (audio + nodos), play con C
  } else {
    console.warn("[Canvas] Personaje no reconocido. Solo escena básica.");
  }

  // Actualizar cartel “C = …”
  setEtiquetaC(etiquetaPorEnfermedad(enfermedad));

  // --- Teclado unificado (C = ON/OFF, P = examen) ---
  manejarEventosTeclado(camara, televisor, examen, movimiento, enfermedad);

  // --- Reloj para animaciones de mixer ---
  const clock = new THREE.Clock();

  // --- Loop con auto-escala de resolución (DPR) según FPS ---
  let lastT = 0,
    frames = 0,
    accum = 0;
  const PERF_WINDOW_MS = 1200; // cada ~1.2s ajusta DPR

  const loop = (t) => {
    // delta (para mixer)
    const dt = clock.getDelta();
    actualizarAnimaciones(dt);

    // actualizaciones de UI/objetos
    televisor.actualizarVisibilidad?.();

    // render
    renderizador.render(escena, camara);

    // medición de FPS
    if (lastT) {
      const dtms = t - lastT;
      accum += dtms;
      frames += 1;

      if (accum > PERF_WINDOW_MS) {
        const fps = (1000 * frames) / accum;
        const current = renderizador.getPixelRatio();
        let target = current;

        if (fps < 45 && current > 1) {
          target = Math.max(1, current - 0.25);
        } else if (fps > 70 && current < renderizador.__capDPR) {
          target = Math.min(renderizador.__capDPR, current + 0.25);
        }

        if (target !== current) {
          renderizador.setPixelRatio(target);
          // ajustar tamaño real manteniendo CSS pixel ratio
          renderizador.setSize(window.innerWidth, window.innerHeight, false);
        }
        frames = 0;
        accum = 0;
      }
    }
    lastT = t;
  };

  // --- Iniciar animación y pausar si la pestaña no está visible ---
  const onVis = () => {
    if (document.hidden) renderizador.setAnimationLoop(null);
    else renderizador.setAnimationLoop(loop);
  };
  document.addEventListener("visibilitychange", onVis);
  renderizador.setAnimationLoop(loop);

  // --- Responsive ---
  const onResize = () => {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight, false);
  };
  window.addEventListener("resize", onResize);

  // --- API pública ---
  return {
    destroy() {
      // parar animación
      renderizador.setAnimationLoop(null);

      // listeners
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);

      // cleanup de módulos auxiliares si exponen destroy()
      try {
        movimiento?.destroy?.();
      } catch {}

      // liberar recursos de la escena y renderer
      try {
        disposeObject(escena);
      } catch {}
      try {
        renderizador.dispose();
      } catch {}
      try {
        renderizador.forceContextLoss?.();
      } catch {}

      console.log("[Canvas] destroy()");
    },
  };
}

export { CrearCanvas };
