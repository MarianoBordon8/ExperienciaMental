// codigos/eventosTeclado.js
import { alternarModoDislexia, sincronizarExamenConDislexia } from "./enfermedades/dislexia.js";
import { reproducirSusurroDerecho } from "./enfermedades/esquizofrenia.js";

function manejarEventosTeclado(camara, televisor, examen, movimiento, enfermedad) {
  console.log("enfermedad: ", enfermedad);
  // punto del cuaderno (ajustalo fino si querés)
  const CUADERNO = new THREE.Vector3(-2.5, 1.10, -1.15);

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return; // evita dobles toggles si dejan la tecla apretada

    // C: alterna imagen<->video del pizarrón (dislexia OFF/ON) - Solo para Juan
    if (e.code === 'KeyC') {
      if (enfermedad === "dislexia") {
        alternarModoDislexia();
        console.log("Dislexia activada/desactivada para Juan");
      } else {
        console.log("La tecla C solo funciona para Juan");
      }
    }

    // P: girar SUAVEMENTE hacia el cuaderno y mostrar examen - Para todos los personajes
    if (e.code === 'KeyP') {
      movimiento.smoothLookAt(CUADERNO, 1000, () => {
        examen.mostrarExamen();
        
        // Solo sincronizar con dislexia si Juan está seleccionado
        if (enfermedad === "dislexia") {
          sincronizarExamenConDislexia();
        }
      });
    }

    // Nota: Los susurros de esquizofrenia ahora se reproducen automáticamente
    // cuando Mario es seleccionado, no requieren tecla Y
  });
}

export { manejarEventosTeclado };
