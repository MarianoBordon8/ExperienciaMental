function manejarEventosTeclado(camara, televisor, examen, yaw, pitch, actualizarCamara) {
  window.addEventListener('keydown', function(e) {
    // Tecla C: Cambiar entre video e imagen del televisor
    if (e.code === 'KeyC') {
      televisor.alternarTelevisor();
    }

    // Tecla P: Mostrar examen
    if (e.code === 'KeyP') {
      // Posición del banco específico
      const posicionBanco = new THREE.Vector3(2, 0.75, -1);

      // Calcular la dirección desde la cámara al banco
      const direccionAlBanco = new THREE.Vector3(
        posicionBanco.x - camara.position.x,
        0,
        posicionBanco.z - camara.position.z - Math.PI * 100
      ).normalize();

      // Actualizar rotación de cámara
      yaw = Math.atan2(direccionAlBanco.x, direccionAlBanco.z);
      pitch = -0.6;
      actualizarCamara();

      // Mostrar examen
      examen.mostrarExamen();

      // AQUÍ LA LÓGICA QUE CONECTA TELEVISOR CON EXAMEN
      if (televisor.getUsandoVideo()) {
        examen.llenarContenidoExamenDislexia();
      } else {
        examen.llenarContenidoExamen();
      }
    }
  });
}

export { manejarEventosTeclado };