// codigos/cartelInstrucciones.js
// Crear cartel de instrucciones en la esquina superior derecha
let spanModoC = null;

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
    <div id="lineaC" style="margin-bottom: 5px;">
      <span style="background: #333; padding: 2px 6px; border-radius: 3px; margin-right: 8px; font-weight: bold;">C</span>
      = <span id="modoC">Efecto ON/OFF</span>
    </div>
    <div>
      <span style="background: #333; padding: 2px 6px; border-radius: 3px; margin-right: 8px; font-weight: bold;">P</span>
      = Parcial
    </div>
  `;

  document.body.appendChild(cartelInstrucciones);
  spanModoC = cartelInstrucciones.querySelector('#modoC');
}

// Cambia el texto de la línea “C = …”
function setEtiquetaC(texto) {
  if (spanModoC) spanModoC.textContent = texto;
}

// Helper: setea automáticamente el texto según la experiencia/personaje
function setCartelPorEnfermedad(enfermedad) {
  const map = {
    dislexia: 'Dislexia ON/OFF',
    esquizofrenia: 'Susurros ON/OFF',
    ansiedad: 'Ansiedad ON/OFF',
  };
  setEtiquetaC(map[enfermedad] || 'Efecto ON/OFF');
}

export { crearCartelInstrucciones, setEtiquetaC, setCartelPorEnfermedad };
