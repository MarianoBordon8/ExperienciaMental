// Crear la escena
const escena = new THREE.Scene();
escena.background = new THREE.Color("#48bfeb"); // Azul

import { crearObjetos } from './codigos/objetos.js';
import { crearCartelInstrucciones } from './codigos/cartelInstrucciones.js';
import { crearHabitacion } from './codigos/habitacion.js';
import { crearTelevisor } from './codigos/televisor.js';
import { crearExamen } from './codigos/examen.js';
import { manejarEventosTeclado } from './codigos/eventosTeclado.js';
import { crearMovimientoCamara } from './codigos/movimientoCamara.js';

crearObjetos(escena);
crearCartelInstrucciones();
crearHabitacion(escena);
const televisor = crearTelevisor(escena);
const examen = crearExamen(escena);

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

// Ubica la cámara dentro de la habitación, sobre el suelo
camara.position.set(-2.5, 1, -1); // Altura de "ojos" sobre el suelo
camara.rotation.y = Math.PI; // 180 grados

// Agregar una luz espacial (luz ambiental)
const luzAmbiente = new THREE.AmbientLight(0xffffff, 1.1); // Luz suave general
escena.add(luzAmbiente);

// Inicializar movimiento de cámara
const movimiento = crearMovimientoCamara(camara, renderizador);

// INICIALIZAR EVENTOS DE TECLADO (después de crear movimiento)
manejarEventosTeclado(camara, televisor, examen, movimiento.getYaw(), movimiento.getPitch(), movimiento.actualizarCamara);

// Animación
let clock = new THREE.Clock();
function animar() {
  requestAnimationFrame(animar);

  // Actualizar visibilidad del televisor
  televisor.actualizarVisibilidad();

  renderizador.render(escena, camara);
}
animar();

