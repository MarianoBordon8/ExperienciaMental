// codigos/televisor.js
let pantalla = null;      // plano donde mapeamos imagen o video
let imgTex   = null;      // textura de pizarra.png
let videoEl  = null;      // <video>
let vTex     = null;      // VideoTexture
let videoOK  = false;     // canplay listo
let dislexia = false;     // false = imagen (OFF), true = video (ON)

function crearTelevisor(escena) {
  // --- Plano "pantalla" pegado a tu pizarra existente ---
  // (Tu pizarra glTF está en (0,2,9.9) mirando hacia -Z; ponemos el plano apenas delante)
  const POS  = new THREE.Vector3(0, 2.0, 9.84); // acercalo/lejos si hace falta
  const ROTY = Math.PI;                         // mirando al aula
  const SIZE_W = 5.6;                           // ajustá al tamaño visible de tu pizarra
  const SIZE_H = 2.2;

  const geo = new THREE.PlaneGeometry(SIZE_W, SIZE_H);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: false });
  pantalla = new THREE.Mesh(geo, mat);
  pantalla.position.copy(POS);
  pantalla.rotation.y = ROTY;
  escena.add(pantalla);

  // --- Imagen por defecto (OFF) ---
  new THREE.TextureLoader().load('./assets/images/pizarra.png', (tex) => {
    // si tu versión de THREE soporta colorSpace:
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    imgTex = tex;
    if (!dislexia) {
      pantalla.material.map = imgTex;
      pantalla.material.needsUpdate = true;
    }
  });

  // --- Video (ON) ---
  videoEl = document.createElement('video');
  videoEl.src = 'assets/videos/bienvenidos.mp4';
  videoEl.loop = true;
  videoEl.muted = true;       // necesario para autoplay
  videoEl.autoplay = true;
  videoEl.preload = 'auto';
  videoEl.playsInline = true;
  videoEl.style.display = 'none';
  document.body.appendChild(videoEl);

  videoEl.addEventListener('canplay', () => {
    vTex = new THREE.VideoTexture(videoEl);
    vTex.minFilter = THREE.LinearFilter;
    vTex.magFilter = THREE.LinearFilter;
    if ('colorSpace' in vTex) vTex.colorSpace = THREE.SRGBColorSpace;

    videoOK = true;
    // si el modo estaba en ON cuando cargó, aplicá video
    if (dislexia) {
      try { videoEl.play(); } catch {}
      pantalla.material.map = vTex;
      pantalla.material.needsUpdate = true;
    }
  });

  return {
    // alterna imagen <-> video. NO pausa ni resetea nada.
    alternarTelevisor: () => {
      dislexia = !dislexia;
      if (dislexia && videoOK) {
        // mostrar video
        try { videoEl.play(); } catch {}
        pantalla.material.map = vTex;
      } else {
        // mostrar imagen (si todavía no cargó, queda sin map hasta que cargue)
        pantalla.material.map = imgTex || null;
      }
      pantalla.material.needsUpdate = true;
      return true;
    },
    // por compatibilidad con tu código existente
    actualizarVisibilidad: () => { /* ya no hace falta; el swap es por textura */ },
    getUsandoVideo: () => dislexia
  };
}

export { crearTelevisor };
