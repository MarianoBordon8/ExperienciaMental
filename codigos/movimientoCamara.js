function crearMovimientoCamara(camara, renderizador) {
  // Variables para controles de cámara
  let isMouseDown = false;
  let lastX = 0;
  let lastY = 0;
  let yaw = 0;   // giro horizontal
  let pitch = 0; // giro vertical

  // Variables para movimiento con teclado
  let velocidad = 0.1;
  let direccion = new THREE.Vector3();
  let teclas = {};

  function actualizarCamara() {
    camara.rotation.order = "YXZ";
    camara.rotation.y = yaw;
    camara.rotation.x = pitch;
  }

  // Eventos del mouse para rotar la cámara
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
    // Limita el pitch para evitar que la cámara se voltee
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    actualizarCamara();
  });

  // Detectar teclas presionadas para movimiento
  window.addEventListener('keydown', function(e) {
    teclas[e.code] = true;
  });

  window.addEventListener('keyup', function(e) {
    teclas[e.code] = false;
  });

  // Retornar las variables y funciones que necesita el main
  return {
    actualizarCamara,
    yaw,
    pitch,
    velocidad,
    direccion,
    teclas,
    // Getters para acceder a las variables desde fuera
    getYaw: () => yaw,
    getPitch: () => pitch,
    setYaw: (valor) => { yaw = valor; },
    setPitch: (valor) => { pitch = valor; }
  };
}

export { crearMovimientoCamara };