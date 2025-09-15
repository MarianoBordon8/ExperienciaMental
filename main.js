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

// Agregar una luz Direccional
const luz = new THREE.DirectionalLight(0xffffff, 2);
luz.position.set(5, 5, 5);
escena.add(luz);

// Crear una caja más grande que simule una habitación con paredes de distintos colores
const habitacionGeometry = new THREE.BoxGeometry(20, 10, 20);

// Colores para cada cara: [derecha, izquierda, arriba, abajo, frente, atrás]
const materialesHabitacion = [
  new THREE.MeshStandardMaterial({ color: 0xff4444, side: THREE.BackSide }), // derecha
  new THREE.MeshStandardMaterial({ color: 0x44ff44, side: THREE.BackSide }), // izquierda
  new THREE.MeshStandardMaterial({ color: 0x4444ff, side: THREE.BackSide }), // arriba (techo)
  new THREE.MeshStandardMaterial({ color: 0xffff44, side: THREE.BackSide }), // abajo (suelo)
  new THREE.MeshStandardMaterial({ color: 0xff44ff, side: THREE.BackSide }), // frente
  new THREE.MeshStandardMaterial({ color: 0x44ffff, side: THREE.BackSide })  // atrás
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
camara.position.set(0, 1, 5); // Altura de "ojos" sobre el suelo

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

const posicionesSillas = [
  [-2, 0.25, -6], [2, 0.25, -6],   // Fila trasera
  [-2, 0.25, -2],  [2, 0.25, -2],    // Fila del medio
  [-2, 0.25, 2],  [2, 0.25, 2]     // Fila delantera
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




// Agregar una luz espacial (luz ambiental y luz puntual)
const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.7); // Luz suave general
escena.add(luzAmbiente);

const luzPuntual = new THREE.PointLight(0xffffff, 1.5, 100); // Luz fuerte en el centro
luzPuntual.position.set(0, 2, 0);
escena.add(luzPuntual);

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

// Actualizar posición de la cámara según teclas (WASD)
function moverCamara() {
  direccion.set(0, 0, 0);

  if (teclas['KeyW']) direccion.z -= 1;
  if (teclas['KeyS']) direccion.z += 1;
  if (teclas['KeyA']) direccion.x -= 1;
  if (teclas['KeyD']) direccion.x += 1;
  if (teclas['KeyE']) direccion.y += 1;
  if (teclas['KeyQ']) direccion.y -= 1;

  if (direccion.length() > 0) {
    direccion.normalize();
    const matriz = new THREE.Matrix4();
    matriz.makeRotationY(camara.rotation.y);
    direccion.applyMatrix4(matriz);

    const nuevaPosicion = camara.position.clone().addScaledVector(direccion, velocidad);

    // Verificar límites de la habitación
    const dentroLimites = nuevaPosicion.x > limites.xMin && nuevaPosicion.x < limites.xMax &&
                          nuevaPosicion.y > limites.yMin && nuevaPosicion.y < limites.yMax &&
                          nuevaPosicion.z > limites.zMin && nuevaPosicion.z < limites.zMax;

    // Crear caja de la cámara (punto de colisión)
    const cajaCamara = new THREE.Box3(
      new THREE.Vector3(nuevaPosicion.x - 0.2, nuevaPosicion.y - 0.5, nuevaPosicion.z - 0.2),
      new THREE.Vector3(nuevaPosicion.x + 0.2, nuevaPosicion.y + 0.5, nuevaPosicion.z + 0.2)
    );

    // Verificar colisión con cada banco
    let colision = false;
    for (const cajaBanco of colisionesBancos) {
      if (cajaCamara.intersectsBox(cajaBanco)) {
        colision = true;
        break;
      }
    }

    if (dentroLimites && !colision) {
      camara.position.copy(nuevaPosicion);
    }
  }
}


// Animación
let clock = new THREE.Clock();
function animar() {
  requestAnimationFrame(animar);

  moverCamara(); // Agrega movimiento tipo showroom

  // Llamado al renderizador
  renderizador.render(escena, camara);
}
animar();
