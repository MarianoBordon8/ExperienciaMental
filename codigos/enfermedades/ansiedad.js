// Ansiedad: viñeta + pulso de FOV + latidos + respiración + tinnitus + susurros
// + low-pass dinámico + ducking por latido + micro-sacádicos + haptics + aberración cromática
// Init al entrar (sin reproducir). El audio se desbloquea con el primer gesto.
// Toggle real con tecla C (toggleAnsiedad). Tecla R = “rescate” (recovery gradual).

import { animations } from "../objetos.js";

// --------- Parámetros “fáciles” para tunear look/feel ---------
const BPM = 92;             // latidos por minuto (↑ = más ansiedad)
const BREATH_HZ = 1.8;      // frecuencia del “breath” (Hz)
const FOV_PULSE_AMPL = 8;   // amplitud del fov en grados
const BASE_R1 = 52;         // radio base del anillo (% ancho)
const REDUCED = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
const MOTION_K = REDUCED ? 0.35 : 1; // reduce movimientos si el usuario lo prefiere

// —— Salidas más rápidas ——
const OFF_RECOVERY_SECS = 3.0; // ← salida al togglear OFF (antes ~6–8s)
const KEY_RECOVERY_SECS = 5.0; // ← tecla R (rescate) sigue siendo más suave
const UI_FADE_MS = 220;        // ← fades visuales más ágiles

let activa = false;
let rafId = null;
let fovBase = 75;
let t0 = 0;

let overlay = null;
let overlayPulse = null;
let blurOverlay = null;

let anxietyLevel = 0; // 0..1
let screenShake = { x: 0, y: 0 };
let lastCamara = null;

// micro-sacádicos (no acumulativos)
let prevMicro = { x: 0, y: 0 };

// Haptics
let lastHaptic = 0;

// Audio
let audioCtx = null;
let mixGain = null;
let masterFilter = null;
let ambienceBus = null; // bus para respiración + susurros (se hace ducking con el latido)

let beatEl = null,  breathEl = null;
let beatNode = null, breathNode = null;
let beatGain = null, breathGain = null;

let tinnitus = null;   // { oscillator, gain }
let whispers = [];     // [{ element, gain }]

let isAudioInitialized = false;
let audioUnlocked = false;

// Listener de recovery (R)
let recoveryKeyHandler = null;

// ------- Efectos visuales -------
function px(ms){ return (ms/1000).toFixed(2)+'s'; }

function crearEfectosVisuales() {
  if (blurOverlay) return;
  blurOverlay = document.createElement("div");
  blurOverlay.id = "blurOverlay";
  Object.assign(blurOverlay.style, {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    opacity: "0",
    backdropFilter: "blur(0px)",
    transition: `opacity ${px(UI_FADE_MS)} ease, backdrop-filter ${px(UI_FADE_MS)} ease`,
    zIndex: 997,
    willChange: "opacity, backdrop-filter",
  });
  document.body.appendChild(blurOverlay);
}

function actualizarEfectosVisuales() {
  if (!blurOverlay) return;

  // desenfoque y leve shake según ansiedad
  const blurAmount = anxietyLevel * 3; // px
  blurOverlay.style.backdropFilter = `blur(${blurAmount}px)`;
  blurOverlay.style.opacity = (anxietyLevel * 0.4).toFixed(3);

  const shake = anxietyLevel * 5 * MOTION_K; // px
  screenShake.x = (Math.random() - 0.5) * shake;
  screenShake.y = (Math.random() - 0.5) * shake;
  document.body.style.transform = `translate(${screenShake.x}px, ${screenShake.y}px)`;

  // aberración cromática barata (overlay variables)
  if (overlay) {
    const rgbO = (anxietyLevel * 0.6).toFixed(3);
    const off = (anxietyLevel * 3).toFixed(2);
    overlay.style.setProperty("--rgbO", rgbO);
    overlay.style.setProperty("--rgbX", `${off}px`);
    overlay.style.setProperty("--rgbY", `${-off}px`);
  }
}

// ------- UI (overlay/vignette) -------
function crearOverlay() {
  if (overlay) return;

  overlay = document.createElement("div");
  overlay.id = "ansiedadOverlay";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    opacity: "0",
    transition: `opacity ${px(UI_FADE_MS)} ease`,
    zIndex: 998,
    willChange: "opacity",
  });

  // Capa base (viñeta)
  const base = document.createElement("div");
  Object.assign(base.style, {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(ellipse at center," +
      " rgba(0,0,0,0) 40%," +
      " rgba(0,0,0,0.70) 70%," +
      " rgba(0,0,0,0.94) 100%)",
    willChange: "opacity",
  });

  // Capa de pulso (anillo)
  overlayPulse = document.createElement("div");
  Object.assign(overlayPulse.style, {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(ellipse at center," +
      " rgba(0,0,0,0) var(--r1, 52%)," +
      " rgba(0,0,0,var(--aPulse,0.16)) var(--r2, 56%)," +
      " rgba(0,0,0,0) calc(var(--r2, 56%) + 4%))",
    opacity: "var(--oPulse, 0.6)",
    mixBlendMode: "multiply",
    willChange: "background, opacity",
  });

  // Capa de aberración cromática (ligera)
  const rgb = document.createElement("div");
  Object.assign(rgb.style, {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    mixBlendMode: "screen",
    opacity: "var(--rgbO,0)",
    background:
      "radial-gradient(ellipse at center, rgba(255,0,0,.06) 55%, transparent 70%)," +
      "radial-gradient(ellipse at center, rgba(0,180,255,.06) 60%, transparent 75%)",
    transform: "translate(var(--rgbX,0px), var(--rgbY,0px))",
    willChange: "opacity, transform"
  });

  overlay.appendChild(base);
  overlay.appendChild(overlayPulse);
  overlay.appendChild(rgb);
  document.body.appendChild(overlay);

  console.log("[Ansiedad] overlay + pulso creados");
}

// ------- Loop visual+audio -------
function loop(camara) {
  const nowMs = performance.now();
  const t = (nowMs - t0) / 1000;

  // ansiedad sube suave hasta 1 en ~30s
  const targetAnxiety = Math.min(1, t / 30);
  anxietyLevel = anxietyLevel * 0.95 + targetAnxiety * 0.05;

  // 1) “Respiración” del FOV
  const s = Math.sin(t * BREATH_HZ);
  const ease = 0.5 + 0.5 * (s * (0.8 + 0.2 * Math.abs(s)));
  const fovAmpl = FOV_PULSE_AMPL * MOTION_K;
  camara.fov = fovBase + ease * fovAmpl;
  camara.updateProjectionMatrix();

  // 2) Pulso “lub–dub” (y medida de beat para ducking/haptics)
  const period = 60 / BPM;
  const tt = t % period;
  const w = period * 0.06;
  const g = (mu) => Math.exp(-((tt - mu) * (tt - mu)) / (2 * w * w));
  const beat = Math.max(g(0), g(period * 0.28)); // ~0..1 pico doble

  if (overlayPulse) {
    const r1 = BASE_R1 - beat * 6;
    const r2 = r1 + 5 + beat * 1.5;
    const aPulse = 0.14 + beat * 0.22;
    const oPulse = 0.45 + beat * 0.45;

    overlayPulse.style.setProperty("--r1", `${r1.toFixed(2)}%`);
    overlayPulse.style.setProperty("--r2", `${r2.toFixed(2)}%`);
    overlayPulse.style.setProperty("--aPulse", aPulse.toFixed(3));
    overlayPulse.style.setProperty("--oPulse", oPulse.toFixed(3));
  }

  // 3) Efectos visuales (blur + shake + micro-sacádicos)
  actualizarEfectosVisuales();

  if (!REDUCED && camara) {
    const microAmp = 0.002 * (0.5 + anxietyLevel) * MOTION_K; // rad
    const jx = (Math.random() - 0.5) * microAmp;
    const jy = (Math.random() - 0.5) * microAmp * 0.6;
    // aplicar delta para no acumular
    camara.rotation.y += jx - prevMicro.x;
    camara.rotation.x += jy - prevMicro.y;
    prevMicro.x = jx;
    prevMicro.y = jy;
  }

  // 4) Mezcla de audio que escala con la ansiedad (suave)
  if (audioCtx && beatGain && breathGain) {
    const now = audioCtx.currentTime;
    const beatVol   = 0.45 + 0.45 * anxietyLevel; // 0.45..0.90
    const breathVol = 0.35 + 0.35 * anxietyLevel; // 0.35..0.70
    beatGain.gain.setTargetAtTime(beatVol,   now, 0.06);
    breathGain.gain.setTargetAtTime(breathVol, now, 0.08);

    // low-pass se cierra con la ansiedad (20 kHz → ~5 kHz)
    if (masterFilter) {
      const cutoff = 20000 - anxietyLevel * 15000;
      masterFilter.frequency.setTargetAtTime(cutoff, now, 0.12);
    }

    // tinnitus sube levemente con ansiedad
    if (tinnitus?.gain) {
      const tVol = 0.02 + 0.18 * anxietyLevel;   // 0.02..0.20
      tinnitus.gain.gain.setTargetAtTime(tVol, now, 0.18);
    }

    // aceleración de pistas (se percibe “apuro”)
    const rateK = 1 * MOTION_K + (1 - MOTION_K); // si reduce motion, suaviza
    if (beatEl)   beatEl.playbackRate   = 1 + anxietyLevel * 0.25 * rateK; // 1.00 → 1.25
    if (breathEl) breathEl.playbackRate = 1 + anxietyLevel * 0.20 * rateK; // 1.00 → 1.20

    // 4a) Ducking del ambiente (respiración+susurros) con cada latido
    if (ambienceBus) {
      const duck = 1 - 0.35 * beat * (0.6 + 0.4 * anxietyLevel); // 1→~0.65
      ambienceBus.gain.setTargetAtTime(duck, now, 0.05);
    }
  }

  // 5) Haptics móvil sincronizados
  if (navigator.vibrate && beat > 0.85) {
    if (nowMs - lastHaptic > 320) {
      navigator.vibrate(20);
      lastHaptic = nowMs;
    }
  }

  rafId = requestAnimationFrame(() => loop(camara));
}

// ------- Init de audio (sin reproducir) -------
function inicializarAudioAnsiedad() {
  if (isAudioInitialized) {
    console.log("[Ansiedad] init: ya estaba inicializado.");
    return;
  }
  try {
    console.log("[Ansiedad] init: creando AudioContext y nodos…");
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Master (filter → gain → destino)
    mixGain = audioCtx.createGain();
    mixGain.gain.value = 1.0;

    masterFilter = audioCtx.createBiquadFilter();
    masterFilter.type = "lowpass";
    masterFilter.frequency.value = 20000;
    masterFilter.Q.value = 0.0001;

    masterFilter.connect(mixGain);
    mixGain.connect(audioCtx.destination);

    // Bus ambiente (respiración + susurros), para ducking
    ambienceBus = audioCtx.createGain();
    ambienceBus.gain.value = 1.0;
    ambienceBus.connect(masterFilter);

    // Latidos
    beatEl = document.createElement("audio");
    beatEl.src = "assets/sounds/latidos.mp3";
    beatEl.preload = "auto";
    beatEl.loop = true;

    // Respiración
    breathEl = document.createElement("audio");
    breathEl.src = "assets/sounds/respiracion.mp3";
    breathEl.preload = "auto";
    breathEl.loop = true;

    // Gains por pista
    beatGain = audioCtx.createGain();
    beatGain.gain.value = 0.95;
    breathGain = audioCtx.createGain();
    breathGain.gain.value = 0.75;

    // Tinnitus
    const tinnitusOsc = audioCtx.createOscillator();
    const tinnitusGain = audioCtx.createGain();
    tinnitusOsc.type = "sine";
    tinnitusOsc.frequency.value = 8000;
    tinnitusGain.gain.value = 0;
    tinnitusOsc.connect(tinnitusGain).connect(masterFilter);
    tinnitusOsc.start();
    tinnitus = { oscillator: tinnitusOsc, gain: tinnitusGain };

    // Susurros ambiente
    const whispersUrls = [
      "assets/sounds/whisper1.mp3",
      "assets/sounds/whisper2.mp3",
    ];
    whispersUrls.forEach((url) => {
      const el = document.createElement("audio");
      el.src = url;
      el.preload = "auto";
      const g = audioCtx.createGain();
      g.gain.value = 0;
      const node = audioCtx.createMediaElementSource(el);
      node.connect(g).connect(ambienceBus); // ← al ambiente (ducking)
      whispers.push({ element: el, gain: g });
    });

    // Nodes
    beatNode = audioCtx.createMediaElementSource(beatEl);
    breathNode = audioCtx.createMediaElementSource(breathEl);
    // beat directo al master (no ducked)
    beatNode.connect(beatGain).connect(masterFilter);
    // respiración al bus ambiente
    breathNode.connect(breathGain).connect(ambienceBus);

    isAudioInitialized = true;
    console.log("[Ansiedad] Sistema de audio inicializado.");
  } catch (err) {
    console.error("[Ansiedad] Error al inicializar:", err);
    isAudioInitialized = false;
  }
}

// ------- Gate de desbloqueo (una sola vez) -------
function armarAudioUnlockGate() {
  if (audioUnlocked) return;

  const unlock = () => {
    if (!isAudioInitialized) inicializarAudioAnsiedad();

    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume()
        .then(() => {
          audioUnlocked = true;
          console.log("[Ansiedad] AudioContext desbloqueado.");
        })
        .catch((err) => console.warn("[Ansiedad] resume() bloqueado:", err));
    } else {
      audioUnlocked = true;
      console.log("[Ansiedad] AudioContext ya activo.");
    }

    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown",   unlock);
  };

  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown",     unlock, { once: true });
  console.log("[Ansiedad] Gate armado: esperando primer gesto…");
}

// ------- Recovery (descenso guiado) -------
function iniciarRecovery(camara, seconds = KEY_RECOVERY_SECS) {
  if (!audioCtx) return;
  const tStart = audioCtx.currentTime;
  const tEnd = tStart + seconds;

  // aseguramos que suenen bajito durante la recuperación
  try { beatEl?.play?.(); breathEl?.play?.(); } catch {}

  const step = () => {
    const now = audioCtx.currentTime;
    const k = Math.max(0, 1 - (now - tStart) / (seconds)); // 1→0
    anxietyLevel = k;

    // rampas más cortas para salida ágil
    if (masterFilter) masterFilter.frequency.setTargetAtTime(20000 - k * 15000, now, 0.10);
    if (beatGain)   beatGain.gain.setTargetAtTime(0.22 + 0.18 * k, now, 0.08);
    if (breathGain) breathGain.gain.setTargetAtTime(0.22 + 0.18 * k, now, 0.08);
    if (tinnitus?.gain) tinnitus.gain.gain.setTargetAtTime(0.0, now, 0.22);

    if (beatEl)   beatEl.playbackRate   = 1 + 0.10 * k;
    if (breathEl) breathEl.playbackRate = 1 + 0.10 * k;

    if (now < tEnd) requestAnimationFrame(step);
    else stopAnsiedad(camara);
  };
  requestAnimationFrame(step);
}

// ------- Arranque/parada -------
function startAnsiedad(camara) {
  if (activa) return;
  activa = true;
  lastCamara = camara;
  console.log("[Ansiedad] START");

  // El profesor grita
  animations?.["gritando"]?.play?.();
  animations?.["hablando"]?.stop?.();

  crearEfectosVisuales();
  crearOverlay();
  overlay.style.opacity = "1";

  anxietyLevel = 0;

  if (!isAudioInitialized) inicializarAudioAnsiedad();

  const resume = audioCtx && audioCtx.state === "suspended"
    ? audioCtx.resume()
    : Promise.resolve();

  resume.then(() => {
    try { beatEl.currentTime = 0; } catch {}
    try { breathEl.currentTime = 0; } catch {}
    beatEl.play().catch(e => console.warn("[Ansiedad] play latidos bloqueado:", e));
    breathEl.play().catch(e => console.warn("[Ansiedad] play respiración bloqueado:", e));
  });

  // Susurros aleatorios (ARRANCAN YA)
  if (whispers.length > 0) {
    const playRandom = () => {
      if (!activa) return;
      const it = whispers[Math.floor(Math.random() * whispers.length)];
      it.element.currentTime = 0;
      const now = audioCtx.currentTime;
      it.gain.gain.setValueAtTime(0, now);
      it.gain.gain.linearRampToValueAtTime(0.3, now + 0.5);
      it.element.play()
        .then(() => {
          setTimeout(() => {
            if (!activa) return;
            it.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.35);
            setTimeout(playRandom, Math.random() * 5000 + 3000);
          }, it.element.duration * 1000);
        })
        .catch(() => {});
    };
    playRandom(); // ← sin delay inicial
  }

  // Listener de recovery (R)
  if (!recoveryKeyHandler) {
    recoveryKeyHandler = (e) => {
      if ((e.key === "r" || e.key === "R") && activa) {
        iniciarRecovery(lastCamara, KEY_RECOVERY_SECS);
      }
    };
    window.addEventListener("keydown", recoveryKeyHandler);
  }

  t0 = performance.now();
  loop(camara);
}

function stopAnsiedad(camara) {
  if (!activa) return;
  activa = false;
  console.log("[Ansiedad] STOP");

  // El profesor deja de gritar
  animations?.["hablando"]?.play?.();
  animations?.["gritando"]?.stop?.();

  // visual
  anxietyLevel = 0;
  if (blurOverlay) {
    blurOverlay.style.opacity = "0";
    blurOverlay.style.backdropFilter = "blur(0px)";
  }
  document.body.style.transform = "none";
  prevMicro.x = 0; prevMicro.y = 0;

  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;

  camara.fov = fovBase;
  camara.updateProjectionMatrix();

  if (overlay) overlay.style.opacity = "0";

  // audio
  try { beatEl?.pause?.(); beatEl && (beatEl.currentTime = 0); } catch {}
  try { breathEl?.pause?.(); breathEl && (breathEl.currentTime = 0); } catch {}

  if (tinnitus?.gain && audioCtx) {
    tinnitus.gain.gain.setValueAtTime(tinnitus.gain.gain.value, audioCtx.currentTime);
    tinnitus.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
  }

  whispers.forEach(w => {
    try {
      const now = audioCtx.currentTime;
      w.gain.gain.setValueAtTime(w.gain.gain.value, now);
      w.gain.gain.linearRampToValueAtTime(0, now + 0.25);
      setTimeout(() => { w.element.pause(); w.element.currentTime = 0; }, 280);
    } catch {}
  });
}

// ------- Limpieza dura (para cuando se destruye el canvas) -------
function destruirSistemaAnsiedad() {
  try { stopAnsiedad({ fov: fovBase, updateProjectionMatrix(){ } }); } catch {}
  try { overlay?.remove?.(); overlay = null; overlayPulse = null; } catch {}
  try { blurOverlay?.remove?.(); blurOverlay = null; } catch {}
  try {
    if (recoveryKeyHandler) {
      window.removeEventListener("keydown", recoveryKeyHandler);
      recoveryKeyHandler = null;
    }
    beatEl?.pause?.(); breathEl?.pause?.();
    beatEl = breathEl = null;
    whispers.forEach(w => w.element?.pause?.());
    whispers = [];
    beatNode = breathNode = null;
    beatGain = breathGain = null;
    ambienceBus = null;
    masterFilter = null;
    mixGain = null;
    tinnitus?.oscillator?.stop?.();
    tinnitus = null;
    audioCtx?.close?.();
  } catch {}
  console.log("[Ansiedad] destruirSistemaAnsiedad()");
}

// ------- Hook de pánico (externo) -------
function triggerPanic(level = 0.85) {
  anxietyLevel = Math.max(anxietyLevel, Math.min(1, level));
}
window.addEventListener("ansiedad:panic", (e) => {
  triggerPanic(e.detail?.level ?? 0.85);
});

// ------- API público -------
function activarSistemaAnsiedad() {
  console.log("[Ansiedad] activarSistemaAnsiedad()");
  if (!isAudioInitialized) inicializarAudioAnsiedad();

  const pc = document.getElementById("pantalla-carga");
  const visible = pc && (pc.style.display !== "none" || pc.classList.contains("visible"));
  if (visible) {
    const onHide = () => {
      window.removeEventListener("ui:pantalla-carga-oculta", onHide);
      armarAudioUnlockGate();
    };
    window.addEventListener("ui:pantalla-carga-oculta", onHide);
  } else {
    armarAudioUnlockGate();
  }
}
function desactivarSistemaAnsiedad(camara) { stopAnsiedad(camara); }
function toggleAnsiedad(camara) { 
  // toggle con recovery rápido hacia OFF
  activa ? iniciarRecovery(camara, OFF_RECOVERY_SECS) : startAnsiedad(camara); 
}
function isAnsiedadActiva() { return activa; }

export {
  activarSistemaAnsiedad,
  desactivarSistemaAnsiedad,
  toggleAnsiedad,
  isAnsiedadActiva,
  destruirSistemaAnsiedad,
  triggerPanic,
  iniciarRecovery
};
