// codigos/eventosTeclado.js
function manejarEventosTeclado(camara, televisor, examen, movimiento) {
  // punto del cuaderno (ajustalo fino si querés)
  const CUADERNO = new THREE.Vector3(-2.5, 1.10, -1.15);

  const syncExamToDislexia = () => {
    if (!examen.getHojaVisible()) return;
    if (televisor.getUsandoVideo()) examen.llenarContenidoExamenDislexia();
    else examen.llenarContenidoExamen();
  };

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return; // evita dobles toggles si dejan la tecla apretada

    // C: alterna imagen<->video del pizarrón (dislexia OFF/ON)
    if (e.code === 'KeyC') {
      televisor.alternarTelevisor();
      requestAnimationFrame(syncExamToDislexia);
    }

    // P: girar SUAVEMENTE hacia el cuaderno y mostrar examen
    if (e.code === 'KeyP') {
      movimiento.smoothLookAt(CUADERNO, 1000, () => {
        examen.mostrarExamen();
        syncExamToDislexia();
      });
    }
  });
}

export { manejarEventosTeclado };
