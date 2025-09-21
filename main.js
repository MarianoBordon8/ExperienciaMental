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

  // Asegura que el video esté siempre en reproducción
  if (video.paused) {
    video.play();
  }
});




// Variable para controlar si la hoja está visible
let hojaVisible = false;
let hojaCuaderno = null;

// Crear la hoja de cuaderno (inicialmente invisible)
function crearHojaCuaderno() {
  const geometriaHoja = new THREE.PlaneGeometry(3, 4); // Tamaño de hoja
  const materialHoja = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  });

  hojaCuaderno = new THREE.Mesh(geometriaHoja, materialHoja);
  hojaCuaderno.position.set(0, 1, -1.5); // Frente a la cámara
  hojaCuaderno.visible = false; // Inicialmente invisible
  escena.add(hojaCuaderno);
}

// Función para dividir texto aleatoriamente
function dividirTextoAleatorio(texto) {
  const palabras = texto.split(' ');
  let resultado = '';
  
  palabras.forEach((palabra, indexPalabra) => {
    let i = 0;
    let spanIndex = 0;
    
    while (i < palabra.length) {
      // Decidir aleatoriamente el tamaño del fragmento (1, 2 o 3 caracteres)
      const tipoFragmento = Math.random();
      let tamano;
      
      if (tipoFragmento < 0.4) {
        tamano = 1; // 40% una letra
      } else if (tipoFragmento < 0.7) {
        tamano = 2; // 30% dos letras
      } else {
        tamano = 3; // 30% tres letras (sílaba)
      }
      
      // Asegurar que no excedamos la longitud de la palabra
      tamano = Math.min(tamano, palabra.length - i);
      
      const fragmento = palabra.substring(i, i + tamano);
      // Cambiar las clases a dislexia1, dislexia2, dislexia3, dislexia4, dislexia5
      resultado += `<span class="dislexia${(spanIndex % 5) + 1}">${fragmento}</span>`;
      
      i += tamano;
      spanIndex++;
    }
    
    // Agregar espacio entre palabras (excepto la última)
    if (indexPalabra < palabras.length - 1) {
      resultado += ' ';
    }
  });
  
  return resultado;
}

// Crear el elemento HTML para el texto (solo el contenedor vacío)
function crearTextoHTML() {
  const contenedorTexto = document.createElement('div');
  contenedorTexto.id = 'textoHoja';
  contenedorTexto.style.position = 'absolute';
  contenedorTexto.style.top = '50%';
  contenedorTexto.style.left = '50%';
  contenedorTexto.style.transform = 'translate(-50%, -50%)';
  contenedorTexto.style.width = '500px';
  contenedorTexto.style.height = '600px';
  contenedorTexto.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
  contenedorTexto.style.border = '2px solid #ccc';
  contenedorTexto.style.borderRadius = '10px';
  contenedorTexto.style.padding = '20px';
  contenedorTexto.style.fontFamily = 'Arial, sans-serif';
  contenedorTexto.style.fontSize = '14px';
  contenedorTexto.style.lineHeight = '1.6';
  contenedorTexto.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
  contenedorTexto.style.display = 'none'; // Inicialmente oculto
  contenedorTexto.style.zIndex = '1000';
  contenedorTexto.style.overflowY = 'auto';

  // Contenedor vacío inicialmente
  contenedorTexto.innerHTML = '';

  document.body.appendChild(contenedorTexto);
}

// Función para llenar el contenido del examen cuando se presiona P
function llenarContenidoExamen() {
  const contenedorTexto = document.getElementById('textoHoja');
  if (!contenedorTexto) return;

  // Llenar con el contenido del examen
  contenedorTexto.innerHTML = `
    <h3 style="margin-top: 0; text-align: center; color: #333; margin-bottom: 25px;">Examen de Matemáticas</h3>

    <!-- Pregunta 1 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">1. ¿Cuánto es 2 + 2?</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta1" value="3" style="margin-right: 8px;">
        3
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta1" value="4" style="margin-right: 8px;">
        4
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta1" value="5" style="margin-right: 8px;">
        5
      </label>
    </div>

    <!-- Pregunta 2 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">2. ¿Cuál es la raíz cuadrada de 9?</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta2" value="2" style="margin-right: 8px;">
        2
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta2" value="3" style="margin-right: 8px;">
        3
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta2" value="6" style="margin-right: 8px;">
        6
      </label>
    </div>

    <!-- Pregunta 3 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">3. Si 5x = 20, ¿cuánto vale x?</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta3" value="2" style="margin-right: 8px;">
        2
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta3" value="4" style="margin-right: 8px;">
        4
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta3" value="10" style="margin-right: 8px;">
        10
      </label>
    </div>

    <!-- Pregunta 4 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">4. ¿Cuál es el área de un rectángulo de 3 × 7?</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta4" value="21" style="margin-right: 8px;">
        21
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta4" value="10" style="margin-right: 8px;">
        10
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta4" value="30" style="margin-right: 8px;">
        30
      </label>
    </div>

    <!-- Pregunta 5 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">5. ¿Cuál es el valor de 2⁵?</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta5" value="16" style="margin-right: 8px;">
        16
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta5" value="64" style="margin-right: 8px;">
        64
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta5" value="32" style="margin-right: 8px;">
        32
      </label>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <button onclick="evaluarExamen()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin-right: 10px; transition: background-color 0.3s;" onmouseover="this.style.backgroundColor='#218838'" onmouseout="this.style.backgroundColor='#28a745'">Evaluar</button>
      <button onclick="cerrarHoja()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; transition: background-color 0.3s;" onmouseover="this.style.backgroundColor='#0056b3'" onmouseout="this.style.backgroundColor='#007bff'">Cerrar</button>
    </div>
  `;
}

function llenarContenidoExamenDislexia() {
  const contenedorTexto = document.getElementById('textoHoja');
  if (!contenedorTexto) return;

  // Llenar con el contenido del examen
  contenedorTexto.innerHTML = `
    <h3 style="margin-top: 0; text-align: center; color: #333; margin-bottom: 25px;">${dividirTextoAleatorio('Examen de Matemáticas')}</h3>
    
    <!-- Pregunta 1 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">${dividirTextoAleatorio('1. ¿Cuánto es 2 + 2?')}</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta1" value="3" style="margin-right: 8px;">
        ${dividirTextoAleatorio('3')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta1" value="4" style="margin-right: 8px;">
        ${dividirTextoAleatorio('4')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta1" value="5" style="margin-right: 8px;">
        ${dividirTextoAleatorio('5')}
      </label>
    </div>

    <!-- Pregunta 2 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">${dividirTextoAleatorio('2. ¿Cuál es la raíz cuadrada de 9?')}</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta2" value="2" style="margin-right: 8px;">
        ${dividirTextoAleatorio('2')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta2" value="3" style="margin-right: 8px;">
        ${dividirTextoAleatorio('3')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta2" value="6" style="margin-right: 8px;">
        ${dividirTextoAleatorio('6')}
      </label>
    </div>

    <!-- Pregunta 3 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">${dividirTextoAleatorio('3. Si 5x = 20, ¿cuánto vale x?')}</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta3" value="2" style="margin-right: 8px;">
        ${dividirTextoAleatorio('2')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta3" value="4" style="margin-right: 8px;">
        ${dividirTextoAleatorio('4')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta3" value="10" style="margin-right: 8px;">
        ${dividirTextoAleatorio('10')}
      </label>
    </div>

    <!-- Pregunta 4 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">${dividirTextoAleatorio('4. ¿Cuál es el área de un rectángulo de 3 × 7?')}</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta4" value="21" style="margin-right: 8px;">
        ${dividirTextoAleatorio('21')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta4" value="10" style="margin-right: 8px;">
        ${dividirTextoAleatorio('10')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta4" value="30" style="margin-right: 8px;">
        ${dividirTextoAleatorio('30')}
      </label>
    </div>

    <!-- Pregunta 5 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">${dividirTextoAleatorio('5. ¿Cuál es el valor de 2⁵?')}</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta5" value="16" style="margin-right: 8px;">
        ${dividirTextoAleatorio('16')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta5" value="64" style="margin-right: 8px;">
        ${dividirTextoAleatorio('64')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta5" value="32" style="margin-right: 8px;">
        ${dividirTextoAleatorio('32')}
      </label>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <button onclick="evaluarExamen()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin-right: 10px; transition: background-color 0.3s;" onmouseover="this.style.backgroundColor='#218838'" onmouseout="this.style.backgroundColor='#28a745'">${dividirTextoAleatorio('Evaluar')}</button>
      <button onclick="cerrarHoja()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; transition: background-color 0.3s;" onmouseover="this.style.backgroundColor='#0056b3'" onmouseout="this.style.backgroundColor='#007bff'">${dividirTextoAleatorio('Cerrar')}</button>
    </div>
  `;
}

// Función para cerrar la hoja y vaciar el contenido
function cerrarHoja() {
  hojaVisible = false;
  if (hojaCuaderno) hojaCuaderno.visible = false;

  // Vaciar el contenido del div
  const contenedorTexto = document.getElementById('textoHoja');
  if (contenedorTexto) {
    contenedorTexto.innerHTML = '';
    contenedorTexto.style.display = 'none';
  }
}

// Función para evaluar el examen
function evaluarExamen() {
  const respuestasCorrectas = {
    pregunta1: "4",
    pregunta2: "3",
    pregunta3: "4",
    pregunta4: "21",
    pregunta5: "32"
  };

  let puntaje = 0;
  let total = 5;

  for (let i = 1; i <= 5; i++) {
    const respuestaSeleccionada = document.querySelector(`input[name="pregunta${i}"]:checked`);
    if (respuestaSeleccionada && respuestaSeleccionada.value === respuestasCorrectas[`pregunta${i}`]) {
      puntaje++;
    }
  }

  alert(`Tu puntaje: ${puntaje}/${total} (${Math.round((puntaje/total)*100)}%)`);
}


// Hacer las funciones globales
window.cerrarHoja = cerrarHoja;
window.evaluarExamen = evaluarExamen;

// Inicializar solo el contenedor vacío
crearHojaCuaderno();
crearTextoHTML(); // Ahora solo crea el div vacío

// Función para manejar eventos de teclado
function manejarEventosTeclado() {
  window.addEventListener('keydown', function(e) {
    // Tecla C: Cambiar entre video e imagen del televisor
    if (e.code === 'KeyC') {
      usandoVideo = !usandoVideo;
      // El video nunca se pausa, solo se oculta o muestra
      if (usandoVideo && video.paused) {
        video.play();
      }
    }

    // Agregar evento para tecla "P"
    if (e.code === 'KeyP') {
      // Posición del banco específico
      const posicionBanco = new THREE.Vector3(2, 0.75, -1);

      // Calcular la dirección desde la cámara al banco (solo en plano horizontal)
      const direccionAlBanco = new THREE.Vector3(
        posicionBanco.x - camara.position.x,
        0,
        posicionBanco.z - camara.position.z
      ).normalize();

      // Actualizar solo el yaw (rotación horizontal), agregar pitch hacia abajo
      yaw = Math.atan2(direccionAlBanco.x, direccionAlBanco.z);
      pitch = -0.6;

      // Aplicar la rotación actualizada
      actualizarCamara();

      // Mostrar la hoja de cuaderno
      hojaVisible = true;
      if (hojaCuaderno) hojaCuaderno.visible = true;

      // Llenar el contenido del examen SOLO cuando se presiona P
      if (usandoVideo) {
        llenarContenidoExamenDislexia();
      }else {
      llenarContenidoExamen();
      }
      document.getElementById('textoHoja').style.display = 'block';
    }
  });
}

// Llamar la función una sola vez para configurar los eventos
manejarEventosTeclado();

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
// Crear cartel de instrucciones en la esquina superior derecha
function crearCartelInstrucciones() {
  const cartelInstrucciones = document.createElement('div');
  cartelInstrucciones.id = 'cartelInstrucciones';
  cartelInstrucciones.style.position = 'fixed';
  cartelInstrucciones.style.top = '20px';
  cartelInstrucciones.style.right = '20px';
  cartelInstrucciones.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  cartelInstrucciones.style.color = 'white';
  cartelInstrucciones.style.padding = '15px 20px';
  cartelInstrucciones.style.borderRadius = '8px';
  cartelInstrucciones.style.fontFamily = 'Arial, sans-serif';
  cartelInstrucciones.style.fontSize = '14px';
  cartelInstrucciones.style.lineHeight = '1.5';
  cartelInstrucciones.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
  cartelInstrucciones.style.zIndex = '999';
  cartelInstrucciones.style.border = '2px solid #333';

  cartelInstrucciones.innerHTML = `
    <div style="text-align: center; margin-bottom: 10px; font-weight: bold; color: #ffcc00;">
      CONTROLES
    </div>
    <div style="margin-bottom: 5px;">
      <span style="background: #333; padding: 2px 6px; border-radius: 3px; margin-right: 8px; font-weight: bold;">C</span>
      = Dislexia ON/OFF
    </div>
    <div>
      <span style="background: #333; padding: 2px 6px; border-radius: 3px; margin-right: 8px; font-weight: bold;">P</span>
      = Parcial
    </div>
  `;

  document.body.appendChild(cartelInstrucciones);
}

// Llamar la función para crear el cartel
crearCartelInstrucciones();


// Animación
let clock = new THREE.Clock();
function animar() {
  requestAnimationFrame(animar);

  // Actualiza la visibilidad del televisor en cada frame
  if (televisorImagen && televisorVideo) {
    televisorImagen.visible = !usandoVideo;
    televisorVideo.visible = usandoVideo;
  }

  renderizador.render(escena, camara);
}
animar();

