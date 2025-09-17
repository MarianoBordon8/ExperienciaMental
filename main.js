// Crear la escena
const escena = new THREE.Scene();
escena.background = new THREE.Color("#48bfeb"); // Azul

// Importar GLTFLoader
import { GLTFLoader } from './libs/GLTFLoader.js';

// Cámara de perspectiva
const fov = 75;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 1000;
const camara = new THREE.PerspectiveCamera(fov, aspect, near, far);
// Ubica la cámara en el centro y un poco hacia atrás para ver los cubos
camara.position.set(0, 0, 5);

// Renderizador
const renderizador = new THREE.WebGLRenderer({
  canvas: document.querySelector("#miCanvas"),
  antialias: true
});
renderizador.setSize(window.innerWidth, window.innerHeight);


// Crear una caja más grande que simule una habitación con paredes de distintos colores
const habitacionGeometry = new THREE.BoxGeometry(20, 10, 20);
const loaderTextura = new THREE.TextureLoader();
const texturaSuelo = loaderTextura.load('./assets/textures/suelo/Planks021_1K-JPG_Color.jpg');
const texturaParedes = loaderTextura.load('./assets/textures/paredes/Plaster003_1K-JPG_Color.jpg');
const texturaTecho = loaderTextura.load('./assets/textures/techo/OfficeCeiling001_1K-JPG_AmbientOcclusion.jpg');

// Colores para cada cara: [derecha, izquierda, arriba, abajo, frente, atrás]
const materialesHabitacion = [
  new THREE.MeshStandardMaterial({ map: texturaParedes, side: THREE.BackSide }), // derecha
  new THREE.MeshStandardMaterial({ map: texturaParedes, side: THREE.BackSide }), // izquierda
  new THREE.MeshStandardMaterial({ map: texturaTecho, side: THREE.BackSide }), // arriba (techo)
  new THREE.MeshStandardMaterial({ map: texturaSuelo, side: THREE.BackSide }), // abajo (suelo)
  new THREE.MeshStandardMaterial({ map: texturaParedes, side: THREE.BackSide }), // frente
  new THREE.MeshStandardMaterial({ map: texturaParedes, side: THREE.BackSide })  // atrás
];


// Mueve la habitación para que el suelo esté en y = 0
const habitacion = new THREE.Mesh(habitacionGeometry, materialesHabitacion);
habitacion.position.set(0, 5 / 2, 0); // La base (suelo) queda en y = 0
escena.add(habitacion);

// Definir límites de la habitación (paredes internas)
const margen = 0.5; // grosor de la "cámara"
const limites = {
  xMin: -10 + margen,
  xMax: 10 - margen,
  yMin: 0 + margen,
  yMax: 10 - margen,
  zMin: -10 + margen,
  zMax: 10 - margen
};


// Ubica la cámara dentro de la habitación, sobre el suelo
camara.position.set(-2.5, 1, -1); // Altura de "ojos" sobre el suelo
camara.rotation.y = Math.PI; // 180 grados


// Arreglo para guardar las cajas de colisión de cada banco
const colisionesBancos = [];

// Cargar bancos en 3 filas de 2 con pasillo
const loader = new GLTFLoader();
const posicionesBancos = [
  [-2, 0.25, -4], [2, 0.25, -4],   // Fila trasera
  [-2, 0.25, 0],  [2, 0.25, 0],    // Fila del medio
  [-2, 0.25, 4],  [2, 0.25, 4]     // Fila delantera
];

posicionesBancos.forEach(pos => {
  loader.load(
    './assets/models/banco/banco/banco.gltf',
    function(gltf) {
      const banco = gltf.scene;
      banco.position.set(pos[0], pos[1], pos[2]);
      banco.scale.set(1.5, 1.5, 1.5);
      escena.add(banco);

      // Crear caja de colisión
      const caja = new THREE.Box3().setFromObject(banco);
      colisionesBancos.push(caja);
    },
    undefined,
    function(error) {
      console.error('Error cargando el banco:', error);
    }
  );
});

const posicionesLibros = [
  [-2.2, 0.19, -2.5], [-0.2, 0.19, -2.5],   // Fila trasera
  [-2.2, 0.19, -0.5],  [-0.2, 0.19, -0.5],    // Fila del medio
];

// Cargar libros sobre cada banco
posicionesLibros.forEach(pos => {
  loader.load(
    './assets/models/libro/libro.gltf', // <-- ruta a tu modelo de libro
    function(gltf) {
      const libro = gltf.scene;

      // Posición: encima del banco
      const alturaBanco = 0.25 * 1.5; // altura del banco * escala usada
      libro.position.set(
        pos[0],             // X del banco
        pos[1] + alturaBanco , // Y (un poquito por encima del banco)
        pos[2]          // Z del banco
      );

      // Escalar según necesites
      libro.scale.set(0.005, 0.005, 0.005);

      // Agregar a la escena
      escena.add(libro);
    },
    undefined,
    function(error) {
      console.error('Error cargando el libro:', error);
    }
  );
});


const posicionesSillas = [
  [-2, 0.25, -5], [2, 0.25, -5],   // Fila trasera
  [-2, 0.25, -1],  [2, 0.25, -1],    // Fila del medio
  [-2, 0.25, 3],  [2, 0.25, 3]     // Fila delantera
];

posicionesSillas.forEach(pos => {
  loader.load(
    './assets/models/banco/silla/silla.gltf',
    function(gltf) {
      const silla = gltf.scene;
      silla.position.set(pos[0], pos[1], pos[2]);
      silla.scale.set(1.5, 1.5, 1.5);
      escena.add(silla);

      // Crear caja de colisión
      const caja = new THREE.Box3().setFromObject(silla);
      colisionesBancos.push(caja);
    },
    undefined,
    function(error) {
      console.error('Error cargando el banco:', error);
    }
  );
});

// Cargar personajes en todas las sillas
posicionesSillas.forEach((sillaPos, index) => {
  if (index === 2) return; // salta esta silla
  loader.load(
    'assets/models/personajes/personaje1/personaje1glb.gltf',
    function(gltf) {
      // Clonar el modelo para que cada personaje sea independiente
      const personaje = gltf.scene.clone();

      // Ajustar la posición sobre la silla
      const alturaAsiento = -0.8; // ajustá según tu modelo de silla
      personaje.position.set(
        sillaPos[0] - 0.5,             // X de la silla
        sillaPos[1] + alturaAsiento, // Y (altura del asiento)
        sillaPos[2]              // Z de la silla
      );

      // Escala del personaje
      personaje.scale.set(3, 3, 3);

      // Rotación para mirar hacia la pizarra (180°)
      personaje.rotation.y = Math.PI + 3.1;

      // Agregar a la escena
      escena.add(personaje);
    },
    undefined,
    function(error) {
      console.error('Error cargando el personaje en la silla', index, error);
    }
  );
});

// Cargar pizarra en la pared
loader.load(
  './assets/models/pizarra/pizarra.gltf',  // <-- ruta a tu modelo descargado
  function(gltf) {
    const pizarra = gltf.scene;

    // Posición: centrada en la pared opuesta
    pizarra.position.set(0, 2, 9.9); // Z positivo para la pared opuesta

    // Escalar según necesites
    pizarra.scale.set(3, 2, 0.1); // ancho x alto x profundidad

    // Rotar 180 grados para que mire hacia el aula
    pizarra.rotation.y = Math.PI;

    escena.add(pizarra);
  },
  undefined,
  function(error) {
    console.error('Error cargando la pizarra:', error);
  }
);

/*
// Agregar un "televisor" (plano con textura) frente a la pizarra
const loaderImg = new THREE.TextureLoader();
loaderImg.load('./assets/images/pizarra.png', function(textura) {
  // Crea un plano con la textura de la imagen
  const ancho = 6;
  const alto = 2.5;
  const geometry = new THREE.BoxGeometry(ancho, alto, 0.1); // Cubo plano
  const materiales = [
    new THREE.MeshStandardMaterial({ color: 0x222222 }), // derecha
    new THREE.MeshStandardMaterial({ color: 0x222222 }), // izquierda
    new THREE.MeshStandardMaterial({ color: 0x222222 }), // arriba
    new THREE.MeshStandardMaterial({ color: 0x222222 }), // abajo
    new THREE.MeshStandardMaterial({ map: textura }),     // frente (pantalla)
    new THREE.MeshStandardMaterial({ color: 0x111111 })  // atrás
  ];
  const televisor = new THREE.Mesh(geometry, materiales);

  // Posiciona el televisor frente a la pizarra
  televisor.position.set(0, 1.8, 7.5); // Ajusta Z para que quede frente a la pizarra
  televisor.rotation.y = Math.PI; // Que mire hacia el aula

  escena.add(televisor);
});
*/

// --- TELEVISOR: imagen y video intercambiables ---

// Variables globales para el televisor
let televisorImagen = null;
let televisorVideo = null;
let usandoVideo = false;

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
const video = document.createElement('video');
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

  // Iniciar el video si no se reproduce automáticamente
  if (video.paused) {
    video.play();
  }
});

// Función para alternar entre imagen y video
function alternarTelevisor() {
  usandoVideo = !usandoVideo;
  if (televisorImagen && televisorVideo) {
    televisorImagen.visible = !usandoVideo;
    televisorVideo.visible = usandoVideo;
    if (usandoVideo) {
      video.play();
    } else {
      video.pause();
    }
  }
}

// Evento para alternar con la tecla "C"
window.addEventListener('keydown', function(e) {
  if (e.code === 'KeyC') {
    alternarTelevisor();
  }
});

// Cargar ventana en la pared izquierda
loader.load(
  './assets/models/ventana/ventana.gltf',  // <-- ruta a tu modelo de ventana
  function(gltf) {
    const ventana = gltf.scene;

    // Posición: pegada a la pared izquierda
    ventana.position.set(9.9, 0, -2); // x = 9.9 (pared izquierda), y = 3 (altura), z = 0 (centro)

    // Escala (ajustá según el tamaño real de tu modelo)
    ventana.scale.set(0.02, 0.02, 0.02);

    // Rotación: girar para que "mire" hacia adentro del aula
    ventana.rotation.y = -Math.PI / 2;

    escena.add(ventana);
  },
  undefined,
  function(error) {
    console.error('Error cargando la ventana:', error);
  }
);

// Cargar puerta en la pared derecha
loader.load(
  './assets/models/puerta/puerta1.gltf',  // <-- ruta a tu modelo de ventana
  function(gltf) {
    const puerta = gltf.scene;

    // Posición: pegada a la pared derecha
    puerta.position.set(-5.9, -0.6, 2); // x = 9.9 (pared derecha), y = 3 (altura), z = 0 (centro)

    // Escala (ajustá según el tamaño real de tu modelo)
    puerta.scale.set(1, 1.5, 1.5);

    // Rotación: girar para que "mire" hacia adentro del aula
    //puerta.rotation.y = -Math.PI / 2;

    escena.add(puerta);
  },
  undefined,
  function(error) {
    console.error('Error cargando la puerta:', error);
  }
);


// Cargar profesor
loader.load(
  'assets/models/personajes/personaje2/scene.gltf',  // <-- ruta a tu modelo descargado
  function(gltf) {
    const profesor = gltf.scene;

    // Posición: centrada en la pared opuesta
    profesor.position.set(-5, -2.2 ,9); // Z positivo para la pared opuesta

    // Escalar según necesites
    profesor.scale.set(3, 3, 3); // ancho x alto x profundidad

    // Rotar 180 grados para que mire hacia el aula
    profesor.rotation.y = Math.PI;

    escena.add(profesor);
  },
  undefined,
  function(error) {
    console.error('Error cargando la pizarra:', error);
  }
);


// Agregar una luz espacial (luz ambiental)
const luzAmbiente = new THREE.AmbientLight(0xffffff, 1.1); // Luz suave general
escena.add(luzAmbiente);


// Controles básicos de primera persona con el mouse
let isMouseDown = false;
let lastX = 0;
let lastY = 0;
let yaw = 0;   // giro horizontal
let pitch = 0; // giro vertical

function actualizarCamara() {
  camara.rotation.order = "YXZ";
  camara.rotation.y = yaw;
  camara.rotation.x = pitch;
}

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

// Variables para movimiento tipo WebVR Showroom
let velocidad = 0.1;
let direccion = new THREE.Vector3();
let teclas = {};

// Detectar teclas presionadas
window.addEventListener('keydown', function(e) {
  teclas[e.code] = true;
});
window.addEventListener('keyup', function(e) {
  teclas[e.code] = false;
});

// Animación
let clock = new THREE.Clock();
function animar() {
  requestAnimationFrame(animar);


  // Llamado al renderizador
  renderizador.render(escena, camara);
}
animar();

