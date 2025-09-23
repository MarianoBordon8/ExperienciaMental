import { alternarModoDislexia, sincronizarExamenConDislexia } from "./enfermedades/dislexia.js";
import { toggleEsquizofrenia } from "./enfermedades/esquizofrenia.js";
import { toggleAnsiedad } from "./enfermedades/ansiedad.js";

function manejarEventosTeclado(camara, televisor, examen, movimiento, enfermedad) {
  const CUADERNO = new THREE.Vector3(-2.5, 1.10, -1.15);

  const syncExamToDislexia = () => {
    if (!examen.getHojaVisible()) return;
    sincronizarExamenConDislexia();
  };

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;

    if (e.code === 'KeyC') {
      console.log("[Teclado] C presionada → toggle experiencia:", enfermedad);
      switch (enfermedad) {
        case 'dislexia':
          alternarModoDislexia();
          requestAnimationFrame(syncExamToDislexia);
          break;
        case 'esquizofrenia':
          toggleEsquizofrenia();
          break;
        case 'ansiedad':
          toggleAnsiedad(camara);
          break;
        default:
          console.log('[Teclado] Sin experiencia seleccionada');
      }
    }

    if (e.code === 'KeyP') {
      movimiento.smoothLookAt(CUADERNO, 1000, () => {
        examen.mostrarExamen();
        if (enfermedad === 'dislexia') syncExamToDislexia();
      });
    }
  });
}

export { manejarEventosTeclado };
