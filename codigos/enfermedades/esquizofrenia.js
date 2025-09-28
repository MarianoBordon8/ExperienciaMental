// Sistema de audio estéreo para efectos auditivos de esquizofrenia
// Unificado: NO auto-arranca. Todo se controla con la tecla C (toggleEsquizofrenia).

let audioContext = null;
let susurroAudios = [];   // <audio> por pista
let susurroSources = [];  // MediaElementSource por pista
let gainNodes = [];       // Ganancias por pista
let pannerNodes = [];     // Panner 3D por pista
let isAudioInitialized = false;

// Autoplay aleatorio
let intervalId = null;
let isAutoPlayActive = false;
const MIN_INTERVAL = 8000;
const MAX_INTERVAL = 15000;

// Pistas
const rutasAudios = [
  'assets/sounds/susurro1.mp3',
  'assets/sounds/susurro2.mp3',
  'assets/sounds/susurro3.mp3',
  'assets/sounds/susurro4.mp3',
  'assets/sounds/risaMujer.mp3'
];

// Ganancias por pista (2 y 4 más fuertes, risa alta)
const volumenes = [0.7, 2.0, 0.7, 2.0, 1.5];

// Posiciones 3D
const posicionesEspaciales = [
  { x: -2, y: 0, z: 0,  descripcion: "Auricular izquierdo" },
  { x:  0, y: 0, z: 0,  descripcion: "Ambos (centro)" },
  { x:  2, y: 0, z: 0,  descripcion: "Auricular derecho" },
  { x:  0, y: 0, z: -3, descripcion: "Detrás" }
];

// ---------- Init base (sin arrancar) ----------
function inicializarAudioEsquizofrenia() {
  if (isAudioInitialized) {
    console.log("[Esquizofrenia] init: ya estaba inicializado.");
    return;
  }

  try {
    console.log("[Esquizofrenia] init: creando AudioContext y grafo…");
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Listener del usuario (sentado mirando al frente)
    const L = audioContext.listener;
    if (L.positionX) {
      L.positionX.setValueAtTime(0, audioContext.currentTime);
      L.positionY.setValueAtTime(0, audioContext.currentTime);
      L.positionZ.setValueAtTime(0, audioContext.currentTime);

      L.forwardX.setValueAtTime(0, audioContext.currentTime);
      L.forwardY.setValueAtTime(0, audioContext.currentTime);
      L.forwardZ.setValueAtTime(-1, audioContext.currentTime);

      L.upX.setValueAtTime(0, audioContext.currentTime);
      L.upY.setValueAtTime(1, audioContext.currentTime);
      L.upZ.setValueAtTime(0, audioContext.currentTime);
    } else {
      // fallback APIs viejas
      L.setPosition(0, 0, 0);
      L.setOrientation(0, 0, -1, 0, 1, 0);
    }

    // Crear nodos por pista
    rutasAudios.forEach((ruta, i) => {
      const el = document.createElement('audio');
      el.src = ruta;
      el.preload = 'auto';
      el.loop = false;

      const src   = audioContext.createMediaElementSource(el);
      const gain  = audioContext.createGain();
      const pan3d = audioContext.createPanner();

      pan3d.panningModel = 'HRTF';
      pan3d.distanceModel = 'inverse';
      pan3d.refDistance = 1;
      pan3d.maxDistance = 10000;
      pan3d.rolloffFactor = 1;
      pan3d.coneInnerAngle = 360;
      pan3d.coneOuterAngle = 0;
      pan3d.coneOuterGain = 0;

      gain.gain.value = volumenes[i];

      src.connect(gain);
      gain.connect(pan3d);
      pan3d.connect(audioContext.destination);

      susurroAudios.push(el);
      susurroSources.push(src);
      gainNodes.push(gain);
      pannerNodes.push(pan3d);

      console.log(`[Esquizofrenia] pista #${i+1} lista (${ruta}), gain=${volumenes[i]}`);
    });

    isAudioInitialized = true;
    console.log(
      `[Esquizofrenia] Sistema inicializado con ${rutasAudios.length} pistas y ${posicionesEspaciales.length} posiciones espaciales.`
    );
  } catch (err) {
    console.error("[Esquizofrenia] Error al inicializar:", err);
    isAudioInitialized = false;
  }
}

// ---------- Core playback ----------
function reproducirAudio(audioElement, indice) {
  // Parar otras pistas
  susurroAudios.forEach((a, j) => {
    if (j !== indice && !a.paused) { a.pause(); a.currentTime = 0; }
  });

  // Si ya sonaba, reiniciar
  if (!audioElement.paused) audioElement.currentTime = 0;

  console.log(`[Esquizofrenia] play pista #${indice+1}`);
  audioElement.play().catch(e => {
    console.warn("[Esquizofrenia] play() bloqueado por el navegador:", e);
  });
}

function reproducirSusurroAleatorio() {
  if (!isAudioInitialized) {
    console.warn("[Esquizofrenia] reproducirSusurroAleatorio(): no inicializado");
    return;
  }

  const i = Math.floor(Math.random() * susurroAudios.length);
  const el = susurroAudios[i];
  const pan = pannerNodes[i];

  const p = posicionesEspaciales[Math.floor(Math.random() * posicionesEspaciales.length)];
  console.log(`[Esquizofrenia] susurro rand -> pista #${i+1}, pos=${p.descripcion} (${p.x},${p.y},${p.z})`);

  if (pan.positionX) {
    pan.positionX.setValueAtTime(p.x, audioContext.currentTime);
    pan.positionY.setValueAtTime(p.y, audioContext.currentTime);
    pan.positionZ.setValueAtTime(p.z, audioContext.currentTime);
  } else {
    pan.setPosition(p.x, p.y, p.z);
  }

  if (audioContext.state === 'suspended') {
    console.log("[Esquizofrenia] AudioContext suspendido → resume()");
    audioContext.resume().then(() => reproducirAudio(el, i));
  } else {
    reproducirAudio(el, i);
  }
}

function programarSiguienteSusurro() {
  if (!isAutoPlayActive) return;
  const intervalo = Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL;
  console.log(`[Esquizofrenia] próximo susurro en ${Math.round(intervalo/1000)}s`);
  intervalId = setTimeout(() => {
    if (!isAutoPlayActive) return;
    reproducirSusurroAleatorio();
    programarSiguienteSusurro();
  }, intervalo);
}

// ---------- API pública (unificada por tecla C) ----------
function activarSistemaEsquizofrenia() {
  console.log("[Esquizofrenia] activarSistemaEsquizofrenia()");
  inicializarAudioEsquizofrenia(); // Solo init, no arranca
}

function iniciarReproduccionAutomatica() {
  if (!isAudioInitialized) inicializarAudioEsquizofrenia();
  if (isAutoPlayActive) { console.log("[Esquizofrenia] iniciar: ya estaba ON"); return; }
  isAutoPlayActive = true;
  console.log("[Esquizofrenia] AUTOPLAY ON");
  if (audioContext && audioContext.state === 'suspended') {
    console.log("[Esquizofrenia] resume() AudioContext");
    audioContext.resume().catch(()=>{});
  }
  programarSiguienteSusurro();
}

function detenerReproduccionAutomatica() {
  if (!isAutoPlayActive) { console.log("[Esquizofrenia] detener: ya estaba OFF"); return; }
  isAutoPlayActive = false;
  if (intervalId) { clearTimeout(intervalId); intervalId = null; }
  console.log("[Esquizofrenia] AUTOPLAY OFF (stop & reset)");

  // Parar cualquier reproducción en curso
  susurroAudios.forEach((a, idx) => {
    if (a && !a.paused) {
      a.pause(); a.currentTime = 0;
      console.log(`[Esquizofrenia] stop pista #${idx+1}`);
    }
  });

  if (audioContext && audioContext.state === 'running') {
    console.log("[Esquizofrenia] suspend() AudioContext para ahorrar CPU");
    audioContext.suspend().catch(()=>{});
  }
}

function toggleEsquizofrenia() {
  if (!isAudioInitialized) inicializarAudioEsquizofrenia();
  const on = !isAutoPlayActive;
  console.log(`[Esquizofrenia] toggle → ${on ? "ON" : "OFF"}`);
  on ? iniciarReproduccionAutomatica() : detenerReproduccionAutomatica();
  return on;
}

function reproducirSusurroDerecho() {
  console.log("[Esquizofrenia] reproducirSusurroDerecho() (manual único)");
  if (!isAudioInitialized) inicializarAudioEsquizofrenia();
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().then(reproducirSusurroAleatorio);
  } else {
    reproducirSusurroAleatorio();
  }
}

function desactivarSistemaEsquizofrenia() {
  console.log("[Esquizofrenia] desactivarSistemaEsquizofrenia()");
  detenerReproduccionAutomatica();
  susurroAudios.forEach((a, idx) => {
    if (!a.paused) { a.pause(); a.currentTime = 0; }
    console.log(`[Esquizofrenia] liberar pista #${idx+1}`);
  });
  try { if (audioContext) audioContext.close(); } catch {}
  audioContext = null;

  susurroAudios = [];
  susurroSources = [];
  gainNodes = [];
  pannerNodes = [];
  isAudioInitialized = false;
  console.log("[Esquizofrenia] contexto cerrado y arrays limpiados.");
}

function isAutoOn() { return isAutoPlayActive; }

// Exports
export {
  activarSistemaEsquizofrenia,
  desactivarSistemaEsquizofrenia,
  reproducirSusurroDerecho,
  iniciarReproduccionAutomatica,
  detenerReproduccionAutomatica,
  toggleEsquizofrenia,
  isAutoOn
};
