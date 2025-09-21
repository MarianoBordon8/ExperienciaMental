// codigos/movimientoCamara.js
function crearMovimientoCamara(camara, renderizador) {
  // -------- Rotación con mouse (sin movimiento de posición) --------
  let isMouseDown = false;
  let lastX = 0, lastY = 0;
  let yaw = 0;   // giro horizontal
  let pitch = 0; // giro vertical

  // tween actual (si existe) para poder cancelarlo
  let tweenState = null;

  function actualizarCamara() {
    camara.rotation.order = "YXZ";
    camara.rotation.y = yaw;
    camara.rotation.x = pitch;
  }

  // Eventos del mouse para mirar
  renderizador.domElement.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener('mouseup', () => { isMouseDown = false; });
  window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    yaw   -= dx * 0.005;
    pitch -= dy * 0.005;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    actualizarCamara();
  });

  // Helper: orientar la cámara inmediatamente a un punto del mundo
  function lookAt(targetVec3) {
    const dir = new THREE.Vector3().subVectors(targetVec3, camara.position).normalize();
    yaw   = Math.atan2(dir.x, dir.z);
    pitch = Math.atan2(-dir.y, Math.hypot(dir.x, dir.z));
    actualizarCamara();
  }

  // Helper: tween suave hacia un punto del mundo
  function smoothLookAt(targetVec3, durMs = 900, onDone) {
    // cancelar tween anterior si existiera
    if (tweenState) tweenState.cancelled = true;

    // objetivo
    const dir = new THREE.Vector3().subVectors(targetVec3, camara.position).normalize();
    const targetYaw   = Math.atan2(dir.x, dir.z);
    const targetPitch = Math.atan2(-dir.y, Math.hypot(dir.x, dir.z));

    const startYaw = yaw;
    const startPitch = pitch;

    // ajustar delta de yaw para ir por el camino más corto
    const wrap = (a) => {
      while (a >  Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      return a;
    };
    const deltaYaw = wrap(targetYaw - startYaw);
    const deltaPitch = targetPitch - startPitch;

    const state = { cancelled: false };
    tweenState = state;

    const t0 = performance.now();
    const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    function step(now) {
      if (state.cancelled) return;
      const t = Math.min(1, (now - t0) / durMs);
      const e = easeInOut(t);

      yaw   = startYaw   + deltaYaw   * e;
      pitch = startPitch + deltaPitch * e;
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
      actualizarCamara();

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        tweenState = null;
        if (onDone) onDone();
      }
    }
    requestAnimationFrame(step);
  }

  return {
    actualizarCamara,
    getYaw:   () => yaw,
    getPitch: () => pitch,
    setYaw:   (v) => { yaw = v; actualizarCamara(); },
    setPitch: (v) => { pitch = v; actualizarCamara(); },
    lookAt,
    smoothLookAt
  };
}

export { crearMovimientoCamara };
