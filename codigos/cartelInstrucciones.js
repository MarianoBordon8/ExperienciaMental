// codigos/cartelInstrucciones.js
// Crear cartel de instrucciones en la esquina superior derecha
let spanModoCLabel = null; // texto descriptivo (ej: "Dislexia")
let switchOnElem = null;
let switchOffElem = null;
let switchContainer = null;
let modoCOn = false; // estado interno

// IMPORT: evitar toggles cuando la encuesta está abierta
import { isEncuestaAbierta } from "./encuestas.js";

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

  // Añadimos un interruptor visual simple con las etiquetas ON y OFF
  cartelInstrucciones.innerHTML = `
    <div style="text-align: center; margin-bottom: 10px; font-weight: bold; color: #ffcc00;">
      CONTROLES
    </div>
    <div id="lineaC" style="margin-bottom: 8px; display:flex; align-items:center; gap:8px;">
      <span style="background: #333; padding: 2px 6px; border-radius: 3px; font-weight: bold;">C</span>
      =
      <span id="modoCLabel" style="margin-right:6px;">Efecto</span>
      <div id="switchC" style="display:inline-flex; align-items:center; user-select:none; border-radius:12px; padding:2px; background:transparent;">
        <span id="switchOff" style="padding:4px 8px; border-radius:10px; font-weight:bold; color:#bbb;">OFF</span>
        <span id="switchOn" style="padding:4px 8px; border-radius:10px; font-weight:bold; color:#bbb;">ON</span>
      </div>
    </div>
    <div style="margin-bottom: 5px;">
      <span style="background: #333; padding: 2px 6px; border-radius: 3px; margin-right: 8px; font-weight: bold;">P</span>
      = Parcial
    </div>
    <div style="margin-bottom: 5px;">
      <span style="background: #333; padding: 2px 6px; border-radius: 3px; margin-right: 8px; font-weight: bold;">O</span>
      = Texto
    </div>
    <div>
      <span style="background: #333; padding: 2px 6px; border-radius: 3px; margin-right: 8px; font-weight: bold;">Esc</span>
      = Salir al menú
    </div>
  `;

  document.body.appendChild(cartelInstrucciones);

  // Referencias a los elementos que controlan el interruptor
  spanModoCLabel = cartelInstrucciones.querySelector('#modoCLabel');
  switchContainer = cartelInstrucciones.querySelector('#switchC');
  switchOnElem = cartelInstrucciones.querySelector('#switchOn');
  switchOffElem = cartelInstrucciones.querySelector('#switchOff');

  // Inicializa la visual según el estado por defecto (OFF)
  updateSwitchVisual();

  // Alternar al presionar la tecla 'C' (mayúscula o minúscula)
  document.addEventListener('keydown', (e) => {
    if (!e) return;

    // Ignorar si se está escribiendo en un input/textarea o contenido editable
    const target = e.target || e.srcElement;
    const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return;

    // Si la encuesta está abierta, no permitir toggle (pero respetamos escritura en campos)
    if (typeof isEncuestaAbierta === "function" && isEncuestaAbierta()) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    if (e.key === 'c' || e.key === 'C') {
      modoCOn = !modoCOn;
      updateSwitchVisual();
    }
  });
}

// Actualiza visual del interruptor y texto de estado
function updateSwitchVisual() {
  if (!switchOnElem || !switchOffElem) return;

  if (modoCOn) {
    // ON activo: lado ON verde, OFF neutro
    switchOnElem.style.background = '#2ecc71';
    switchOnElem.style.color = 'white';
    switchOffElem.style.background = 'transparent';
    switchOffElem.style.color = '#999';
  } else {
    // OFF activo: lado OFF gris, ON neutro
    switchOffElem.style.background = '#7f8c8d';
    switchOffElem.style.color = 'white';
    switchOnElem.style.background = 'transparent';
    switchOnElem.style.color = '#999';
  }
}

// Cambia el texto descriptivo de la línea “C = …” (no altera el estado ON/OFF)
function setEtiquetaC(texto) {
  if (spanModoCLabel) spanModoCLabel.textContent = texto;
}

// Helper: setea automáticamente el texto según la experiencia/personaje
function setCartelPorEnfermedad(enfermedad) {
  const map = {
    dislexia: 'Dislexia',
    esquizofrenia: 'Susurros',
    ansiedad: 'Ansiedad',
  };
  setEtiquetaC(map[enfermedad] || 'Efecto');
}

export { crearCartelInstrucciones, setEtiquetaC, setCartelPorEnfermedad };
