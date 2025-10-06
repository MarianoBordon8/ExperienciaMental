import {
  alternarModoDislexia,
  sincronizarExamenConDislexia,
} from "./enfermedades/dislexia.js";
import { toggleEsquizofrenia } from "./enfermedades/esquizofrenia.js";
import { toggleAnsiedad } from "./enfermedades/ansiedad.js";

function manejarEventosTeclado(
  camara,
  televisor,
  examen,
  movimiento,
  enfermedad
) {
  const CUADERNO = new THREE.Vector3(-2.5, 1.1, -1.15);

  const syncExamToDislexia = () => {
    if (!examen.getHojaVisible()) return;
    sincronizarExamenConDislexia();
  };

  // Función para reproducir audio y mostrar examen
  const reproducirAudioYMostrarExamen = () => {
    const audioExamen = new Audio('./assets/sounds/examen.mp3');
    audioExamen.volume = 0.7; // Volumen al 70%
    
    console.log('[Audio] Reproduciendo audio del examen...');
    
    audioExamen.play().then(() => {
      console.log('[Audio] Audio del examen iniciado');
      
      // Esperar a que termine el audio para mostrar el examen
      audioExamen.addEventListener('ended', () => {
        console.log('[Audio] Audio terminado, mostrando examen');
        mostrarExamenCompleto();
      });
      
    }).catch(error => {
      console.log('[Audio] Error al reproducir audio del examen:', error);
      // Si falla el audio, mostrar el examen directamente
      mostrarExamenCompleto();
    });
  };

  // Función para mostrar el examen completo
  const mostrarExamenCompleto = () => {
    movimiento.smoothLookAt(CUADERNO, 1000, () => {
      examen.mostrarExamen();
      if (enfermedad === "dislexia") syncExamToDislexia();
    });
  };

  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;

    if (e.code === "KeyC") {
      console.log("[Teclado] C presionada → toggle experiencia:", enfermedad);
      switch (enfermedad) {
        case "dislexia":
          alternarModoDislexia();
          requestAnimationFrame(syncExamToDislexia);
          break;
        case "esquizofrenia":
          toggleEsquizofrenia();
          break;
        case "ansiedad":
          toggleAnsiedad(camara);
          break;
        default:
          console.log("[Teclado] Sin experiencia seleccionada");
      }
    }

    if (e.code === "KeyP") {
      console.log('[Teclado] P presionada → iniciando secuencia de examen');
      // Ahora primero reproduce el audio, luego muestra el examen
      reproducirAudioYMostrarExamen();
    }
  });
}

export { manejarEventosTeclado };
