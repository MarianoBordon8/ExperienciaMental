// Variables globales para el televisor
let televisorImagen = null;
let televisorVideo = null;
let usandoVideo = false;
let video = null;

function crearTelevisor(escena) {
  // Crear televisor con imagen (por defecto visible)
  const loaderImg = new THREE.TextureLoader();
  loaderImg.load('./assets/images/pizarra.png', function(textura) {
    const ancho = 6;
    const alto = 2.5;
    const geometry = new THREE.BoxGeometry(ancho, alto, 0.1);
    const materiales = [
      new THREE.MeshStandardMaterial({ color: 0x222222 }), // derecha
      new THREE.MeshStandardMaterial({ color: 0x222222 }), // izquierda
      new THREE.MeshStandardMaterial({ color: 0x222222 }), // arriba
      new THREE.MeshStandardMaterial({ color: 0x222222 }), // abajo
      new THREE.MeshStandardMaterial({ map: textura }),     // frente (pantalla)
      new THREE.MeshStandardMaterial({ color: 0x111111 })  // atrás
    ];
    televisorImagen = new THREE.Mesh(geometry, materiales);
    televisorImagen.position.set(0, 1.8, 7.5);
    televisorImagen.rotation.y = Math.PI;
    escena.add(televisorImagen);
  });

  // Crear televisor con video (inicialmente invisible)
  video = document.createElement('video');
  video.src = 'assets/videos/bienvenidos.mp4';
  video.loop = true;
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.style.display = 'none';
  document.body.appendChild(video);

  video.addEventListener('canplay', function() {
    const videoTextura = new THREE.VideoTexture(video);
    videoTextura.minFilter = THREE.LinearFilter;
    videoTextura.magFilter = THREE.LinearFilter;
    videoTextura.format = THREE.RGBFormat;

    const ancho = 6;
    const alto = 2.5;
    const geometry = new THREE.BoxGeometry(ancho, alto, 0.1);
    const materiales = [
      new THREE.MeshStandardMaterial({ color: 0x222222 }), // derecha
      new THREE.MeshStandardMaterial({ color: 0x222222 }), // izquierda
      new THREE.MeshStandardMaterial({ color: 0x222222 }), // arriba
      new THREE.MeshStandardMaterial({ color: 0x222222 }), // abajo
      new THREE.MeshStandardMaterial({ map: videoTextura }), // frente (pantalla)
      new THREE.MeshStandardMaterial({ color: 0x111111 })  // atrás
    ];
    televisorVideo = new THREE.Mesh(geometry, materiales);
    televisorVideo.position.set(0, 1.8, 7.5);
    televisorVideo.rotation.y = Math.PI;
    televisorVideo.visible = false; // Oculto al inicio
    escena.add(televisorVideo);

    // Asegura que el video esté siempre en reproducción
    if (video.paused) {
      video.play();
    }
  });

  return {
    televisorImagen,
    televisorVideo,
    usandoVideo,
    video,
    alternarTelevisor: () => {
      usandoVideo = !usandoVideo;
      if (usandoVideo && video.paused) {
        video.play();
      }
    },
    actualizarVisibilidad: () => {
      if (televisorImagen && televisorVideo) {
        televisorImagen.visible = !usandoVideo;
        televisorVideo.visible = usandoVideo;
      }
    },
    getUsandoVideo: () => usandoVideo
  };
}

export { crearTelevisor };