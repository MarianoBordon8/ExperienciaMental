// codigos/enfermedades/esquizofrenia.js
// Sistema de audio estéreo para efectos auditivos de esquizofrenia

let audioContext = null;
let susurroAudios = []; // Array de elementos de audio
let susurroSources = []; // Array de sources para cada audio
let gainNodes = []; // Array de nodos de ganancia individuales para cada audio
let pannerNodes = []; // Array de nodos panner 3D individuales para cada audio
let isAudioInitialized = false;

// Variables para reproducción automática aleatoria
let intervalId = null;
let isAutoPlayActive = false;
const MIN_INTERVAL = 8000; // Mínimo 8 segundos
const MAX_INTERVAL = 15000; // Máximo 15 segundos

// Array de rutas de los audios de susurro
const rutasAudios = [
    'assets/sounds/susurro1.mp3',
    'assets/sounds/susurro2.mp3',
    'assets/sounds/susurro3.mp3',
    'assets/sounds/susurro4.mp3',
    'assets/sounds/risaMujer.mp3'
];

// Volúmenes específicos para cada audio (índices 1 y 3 corresponden a audios 2 y 4, índice 4 para risaMujer)
const volumenes = [0.7, 2.0, 0.7, 2.0, 1.5]; // Audio 2 y 4 con volumen máximo, risaMujer con volumen alto

// Posiciones espaciales 3D aleatorias
const posicionesEspaciales = [
    { x: -2, y: 0, z: 0, descripcion: "Auricular izquierdo" },
    { x: 0, y: 0, z: 0, descripcion: "Ambos auriculares (centro)" },
    { x: 2, y: 0, z: 0, descripcion: "Auricular derecho" },
    { x: 0, y: 0, z: -3, descripcion: "Detrás del personaje" }
];

// Inicializar el sistema de audio espacial 3D
function inicializarAudioEsquizofrenia() {
    try {
        // Crear contexto de audio
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Configurar el listener (oyente) en la posición del personaje
    const listener = audioContext.listener;

    // Posición del oyente (personaje sentado en el banco)
    if (listener.positionX) {
      // Navegadores modernos con parámetros AudioParam
        listener.positionX.setValueAtTime(0, audioContext.currentTime);
        listener.positionY.setValueAtTime(0, audioContext.currentTime);
        listener.positionZ.setValueAtTime(0, audioContext.currentTime);

        // Orientación del oyente (mirando hacia el frente)
        listener.forwardX.setValueAtTime(0, audioContext.currentTime);
        listener.forwardY.setValueAtTime(0, audioContext.currentTime);
        listener.forwardZ.setValueAtTime(-1, audioContext.currentTime);

        listener.upX.setValueAtTime(0, audioContext.currentTime);
        listener.upY.setValueAtTime(1, audioContext.currentTime);
        listener.upZ.setValueAtTime(0, audioContext.currentTime);
    } else {
      // Navegadores antiguos con métodos deprecated
      listener.setPosition(0, 0, 0);
      listener.setOrientation(0, 0, -1, 0, 1, 0);
    }
    
    // Crear elementos de audio para cada susurro
    rutasAudios.forEach((ruta, index) => {
      const audio = document.createElement('audio');
      audio.src = ruta;
      audio.preload = 'auto';
      audio.loop = false;
      
      // Crear source, nodo de ganancia y panner 3D individual para este audio
      const source = audioContext.createMediaElementSource(audio);
      const gainNode = audioContext.createGain();
      const pannerNode = audioContext.createPanner();
      
      // Configurar el panner 3D
      pannerNode.panningModel = 'HRTF'; // Modelo de audio espacial más realista
      pannerNode.distanceModel = 'inverse';
      pannerNode.refDistance = 1;
      pannerNode.maxDistance = 10000;
      pannerNode.rolloffFactor = 1;
      pannerNode.coneInnerAngle = 360;
      pannerNode.coneOuterAngle = 0;
      pannerNode.coneOuterGain = 0;
      
      // Configurar volumen específico para este audio
      gainNode.gain.value = volumenes[index];
      
      // Conectar la cadena: source -> gain individual -> panner 3D -> destino
      source.connect(gainNode);
      gainNode.connect(pannerNode);
      pannerNode.connect(audioContext.destination);
      
      susurroAudios.push(audio);
      susurroSources.push(source);
      gainNodes.push(gainNode);
      pannerNodes.push(pannerNode);
      
      console.log(`Audio ${index + 1} inicializado con volumen: ${volumenes[index]}`);
    });
    
    isAudioInitialized = true;
    console.log("Sistema de audio espacial 3D inicializado correctamente con", rutasAudios.length, "susurros y", posicionesEspaciales.length, "posiciones espaciales");
    
  } catch (error) {
    console.error("Error al inicializar el sistema de audio:", error);
    isAudioInitialized = false;
  }
}

// Reproducir susurro con audio y posición espacial 3D aleatorios (función interna)
function reproducirSusurroAleatorio() {
  if (!isAudioInitialized) {
    console.warn("Sistema de audio no inicializado");
    return;
  }
  
  // Seleccionar un índice aleatorio del array de audios
  const indiceAleatorio = Math.floor(Math.random() * susurroAudios.length);
  const audioSeleccionado = susurroAudios[indiceAleatorio];
  const volumenActual = volumenes[indiceAleatorio];
  const pannerSeleccionado = pannerNodes[indiceAleatorio];
  
  // Seleccionar una posición espacial aleatoria
  const indicePosicion = Math.floor(Math.random() * posicionesEspaciales.length);
  const posicionSeleccionada = posicionesEspaciales[indicePosicion];
  
  // Aplicar la posición espacial 3D al panner correspondiente
  if (pannerSeleccionado.positionX) {
    // Navegadores modernos con parámetros AudioParam
    pannerSeleccionado.positionX.setValueAtTime(posicionSeleccionada.x, audioContext.currentTime);
    pannerSeleccionado.positionY.setValueAtTime(posicionSeleccionada.y, audioContext.currentTime);
    pannerSeleccionado.positionZ.setValueAtTime(posicionSeleccionada.z, audioContext.currentTime);
  } else {
    // Navegadores antiguos con métodos deprecated
    pannerSeleccionado.setPosition(posicionSeleccionada.x, posicionSeleccionada.y, posicionSeleccionada.z);
  }

  console.log(`[Auto] Reproduciendo susurro ${indiceAleatorio + 1} (${rutasAudios[indiceAleatorio]}) - Volumen: ${volumenActual} - Posición: ${posicionSeleccionada.descripcion}`);

  try {
    // Verificar si el contexto de audio está suspendido (política de navegadores)
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        reproducirAudio(audioSeleccionado, indiceAleatorio);
      });
    } else {
      reproducirAudio(audioSeleccionado, indiceAleatorio);
    }
  } catch (error) {
    console.error("Error al reproducir susurro:", error);
  }
}

// Función pública para reproducción manual (compatibilidad con tecla Y)
function reproducirSusurroDerecho() {
  reproducirSusurroAleatorio();
}

// Función auxiliar para reproducir el audio seleccionado con posición estéreo configurada
function reproducirAudio(audioElement, indice) {
  // Detener todos los demás audios si están reproduciéndose
  susurroAudios.forEach((audio, index) => {
    if (index !== indice && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
  
  // Reiniciar el audio seleccionado si ya estaba reproduciéndose
  if (!audioElement.paused) {
    audioElement.currentTime = 0;
  }
  
  audioElement.play().then(() => {
    console.log(`Reproduciendo susurro ${indice + 1} con posición estéreo aplicada`);
  }).catch((error) => {
    console.error("Error en la reproducción:", error);
  });
}

// Función para programar el siguiente susurro automático
function programarSiguienteSusurro() {
  if (!isAutoPlayActive) return;
  
  // Generar intervalo aleatorio entre MIN_INTERVAL y MAX_INTERVAL
  const intervaloAleatorio = Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL;
  
  console.log(`Siguiente susurro automático en ${intervaloAleatorio / 1000} segundos`);
  
  intervalId = setTimeout(() => {
    if (isAutoPlayActive) {
      reproducirSusurroAleatorio();
      programarSiguienteSusurro(); // Programar el siguiente
    }
  }, intervaloAleatorio);
}

// Función para iniciar la reproducción automática
function iniciarReproduccionAutomatica() {
  if (isAutoPlayActive) {
    console.log("La reproducción automática ya está activa");
    return;
  }
  
  if (!isAudioInitialized) {
    console.warn("Sistema de audio no inicializado");
    return;
  }
  
  isAutoPlayActive = true;
  console.log("Iniciando reproducción automática de susurros...");
  
  // Programar el primer susurro
  programarSiguienteSusurro();
}

// Función para detener la reproducción automática
function detenerReproduccionAutomatica() {
  if (!isAutoPlayActive) {
    console.log("La reproducción automática ya está detenida");
    return;
  }
  
  isAutoPlayActive = false;
  
  if (intervalId) {
    clearTimeout(intervalId);
    intervalId = null;
  }
  
  // Detener cualquier audio que esté reproduciéndose
  susurroAudios.forEach(audio => {
    if (audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
  
  console.log("Reproducción automática detenida");
}

// Función para activar el sistema de esquizofrenia
function activarSistemaEsquizofrenia() {
  console.log("Activando sistema de audio estéreo para esquizofrenia...");
  
  // Inicializar audio
  inicializarAudioEsquizofrenia();
  
  // Activar contexto de audio con interacción del usuario (requerido por navegadores)
  const activarAudio = () => {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        // Iniciar reproducción automática cuando el audio esté listo
        iniciarReproduccionAutomatica();
      });
    } else {
      // Iniciar reproducción automática inmediatamente
      iniciarReproduccionAutomatica();
    }
    document.removeEventListener('click', activarAudio);
    document.removeEventListener('keydown', activarAudio);
  };
  
  document.addEventListener('click', activarAudio);
  document.addEventListener('keydown', activarAudio);
}

// Función para desactivar el sistema
function desactivarSistemaEsquizofrenia() {
  // Detener reproducción automática
  detenerReproduccionAutomatica();
  
  // Detener todos los audios
  susurroAudios.forEach(audio => {
    if (audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
  
  if (audioContext) {
    audioContext.close();
  }
  
  // Limpiar arrays
  susurroAudios = [];
  susurroSources = [];
  gainNodes = [];
  pannerNodes = [];
  
  isAudioInitialized = false;
  console.log("Sistema de esquizofrenia desactivado");
}

// Exportar funciones principales
export {
  activarSistemaEsquizofrenia,
  desactivarSistemaEsquizofrenia,
  reproducirSusurroDerecho,
  iniciarReproduccionAutomatica,
  detenerReproduccionAutomatica
};