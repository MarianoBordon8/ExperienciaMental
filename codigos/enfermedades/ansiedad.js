// Ansiedad: viñeta + pulso de FOV + latidos + respiración.
// Se inicializa al entrar (sin reproducir).
// Se “desbloquea” el audio con el PRIMER gesto del usuario después de la pantalla de carga.
// ON/OFF real con la tecla C (toggleAnsiedad).

import { animations } from "../objetos.js";

let activa = false;
let rafId = null;
let fovBase = 75;
let t0 = 0;
let overlay = null;
let overlayPulse = null; // <- capa de pulso (anillo)

// Audio
let audioCtx = null;
let mixGain = null;
let beatEl = null,
  breathEl = null;
let beatNode = null,
  breathNode = null;
let isAudioInitialized = false;
let audioUnlocked = false; // <- importante

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
    transition: "opacity .35s ease",
    zIndex: 998,
    willChange: "opacity",
  });

  // Capa base (viñeta más profunda)
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

  // Capa de pulso (anillo que “late”)
  overlayPulse = document.createElement("div");
  Object.assign(overlayPulse.style, {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    // variables CSS para animar radios y opacidad
    // --r1: radio interior del anillo
    // --r2: radio exterior del anillo
    // --aPulse: alpha del anillo
    // --oPulse: opacidad total de la capa de pulso
    background:
      "radial-gradient(ellipse at center," +
      " rgba(0,0,0,0) var(--r1, 52%)," +
      " rgba(0,0,0,var(--aPulse,0.16)) var(--r2, 56%)," +
      " rgba(0,0,0,0) calc(var(--r2, 56%) + 4%))",
    opacity: "var(--oPulse, 0.6)",
    mixBlendMode: "multiply", // le da “peso” sin tapar todo
    willChange: "background, opacity",
  });

  overlay.appendChild(base);
  overlay.appendChild(overlayPulse);
  document.body.appendChild(overlay);

  console.log("[Ansiedad] overlay + pulso creados");
}

// ------- Loop visual -------
function loop(camara) {
  const now = performance.now();
  const t = (now - t0) / 1000;

  // --- 1) “Respiración” (zoom) del FOV ---
  const s = Math.sin(t * BREATH_HZ);
  const ease = 0.5 + 0.5 * (s * (0.8 + 0.2 * Math.abs(s))); // seno suavizado
  camara.fov = fovBase + ease * FOV_PULSE_AMPL;
  camara.updateProjectionMatrix();

  // --- 2) Pulso “latido” (lub-dub) sobre el overlay ---
  if (overlayPulse) {
    // patrón de latido: dos picos por periodo
    const period = 60 / BPM; // seg/latido
    const tt = t % period; // tiempo dentro del ciclo [0,period)
    const w = period * 0.06; // ancho de pico
    const g = (mu) => Math.exp(-((tt - mu) * (tt - mu)) / (2 * w * w)); // gaussian
    // lub en 0, dub en ~30% del ciclo
    const beat = Math.max(g(0), g(period * 0.28));

    // radios (en %) y opacidades en función del beat
    const r1 = BASE_R1 - beat * 6; // se cierra un poco en el pico
    const r2 = r1 + 5 + beat * 1.5; // grosor del anillo
    const aPulse = 0.14 + beat * 0.22; // alpha dentro del gradiente
    const oPulse = 0.45 + beat * 0.45; // opacidad de la capa de pulso

    overlayPulse.style.setProperty("--r1", `${r1.toFixed(2)}%`);
    overlayPulse.style.setProperty("--r2", `${r2.toFixed(2)}%`);
    overlayPulse.style.setProperty("--aPulse", aPulse.toFixed(3));
    overlayPulse.style.setProperty("--oPulse", oPulse.toFixed(3));
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

    // Master
    mixGain = audioCtx.createGain();
    mixGain.gain.value = 1.0;
    mixGain.connect(audioCtx.destination);

    // Latidos
    beatEl = document.createElement("audio");
    beatEl.src = "assets/sounds/latidos.mp3";
    beatEl.preload = "auto";
    beatEl.loop = true;
    beatEl.addEventListener("canplaythrough", () =>
      console.log("[Ansiedad] latidos listo")
    );
    beatEl.addEventListener("play", () =>
      console.log("[Ansiedad] latidos PLAY")
    );
    beatEl.addEventListener("pause", () =>
      console.log("[Ansiedad] latidos PAUSE")
    );
    beatEl.addEventListener("error", (e) =>
      console.warn("[Ansiedad] latidos error", e)
    );

    // Respiración
    breathEl = document.createElement("audio");
    breathEl.src = "assets/sounds/respiracion.mp3";
    breathEl.preload = "auto";
    breathEl.loop = true;
    breathEl.addEventListener("canplaythrough", () =>
      console.log("[Ansiedad] respiración lista")
    );
    breathEl.addEventListener("play", () =>
      console.log("[Ansiedad] respiración PLAY")
    );
    breathEl.addEventListener("pause", () =>
      console.log("[Ansiedad] respiración PAUSE")
    );
    breathEl.addEventListener("error", (e) =>
      console.warn("[Ansiedad] respiración error", e)
    );

    // Gains por pista (balance fino)
    const beatGain = audioCtx.createGain();
    beatGain.gain.value = 0.95;
    const breathGain = audioCtx.createGain();
    breathGain.gain.value = 0.75;

    beatNode = audioCtx.createMediaElementSource(beatEl);
    breathNode = audioCtx.createMediaElementSource(breathEl);

    beatNode.connect(beatGain).connect(mixGain);
    breathNode.connect(breathGain).connect(mixGain);

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
      audioCtx
        .resume()
        .then(() => {
          audioUnlocked = true;
          console.log(
            "[Ansiedad] AudioContext desbloqueado tras gesto del usuario."
          );
        })
        .catch((err) => console.warn("[Ansiedad] resume() bloqueado:", err));
    } else {
      audioUnlocked = true;
      console.log("[Ansiedad] AudioContext ya estaba activo.");
    }

    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
  console.log("[Ansiedad] Gate armado: esperando primer gesto del usuario…");
}

// ------- Arranque/parada -------
function startAnsiedad(camara) {
  if (activa) return;
  activa = true;
  console.log("[Ansiedad] START");

  //EL PROFESOR COMIENZA A GRITAR
  animations["gritando"].play();
  animations["hablando"].stop();

  crearOverlay();
  overlay.style.opacity = "1";

  if (!isAudioInitialized) inicializarAudioAnsiedad();

  const resume =
    audioCtx && audioCtx.state === "suspended"
      ? audioCtx.resume()
      : Promise.resolve();

  resume.then(() => {
    try {
      beatEl.currentTime = 0;
    } catch {}
    try {
      breathEl.currentTime = 0;
    } catch {}
    beatEl
      .play()
      .catch((e) => console.warn("[Ansiedad] play latidos bloqueado:", e));
    breathEl
      .play()
      .catch((e) => console.warn("[Ansiedad] play respiración bloqueado:", e));
  });

  t0 = performance.now();
  loop(camara);
}

function stopAnsiedad(camara) {
  if (!activa) return;
  activa = false;
  console.log("[Ansiedad] STOP");

  //EL PROFESOR PARA A GRITAR
  animations["hablando"].play();
  animations["gritando"].stop();

  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;

  camara.fov = fovBase;
  camara.updateProjectionMatrix();

  if (overlay) overlay.style.opacity = "0";

  try {
    if (beatEl) {
      beatEl.pause();
      beatEl.currentTime = 0;
    }
  } catch {}
  try {
    if (breathEl) {
      breathEl.pause();
      breathEl.currentTime = 0;
    }
  } catch {}
}

// ------- API público -------
function activarSistemaAnsiedad() {
  console.log("[Ansiedad] activarSistemaAnsiedad()");
  if (!isAudioInitialized) inicializarAudioAnsiedad();

  const pc = document.getElementById("pantalla-carga");
  const visible =
    pc && (pc.style.display !== "none" || pc.classList.contains("visible"));

  if (visible) {
    console.log(
      "[Ansiedad] esperando a que se oculte pantalla de carga para armar gate…"
    );
    const onHide = () => {
      window.removeEventListener("ui:pantalla-carga-oculta", onHide);
      armarAudioUnlockGate();
    };
    window.addEventListener("ui:pantalla-carga-oculta", onHide);
  } else {
    armarAudioUnlockGate();
  }
}

function desactivarSistemaAnsiedad(camara) {
  stopAnsiedad(camara);
}

function toggleAnsiedad(camara) {
  console.log(`[Ansiedad] toggle → ${activa ? "OFF" : "ON"}`);
  activa ? stopAnsiedad(camara) : startAnsiedad(camara);
}

function isAnsiedadActiva() {
  return activa;
}

export {
  activarSistemaAnsiedad,
  desactivarSistemaAnsiedad,
  toggleAnsiedad,
  isAnsiedadActiva,
};

// --------- Parámetros “fáciles” para tunear look/feel ---------
// BPM del latido (más alto = más ansiedad)
const BPM = 92;

// Frecuencia del “breath” del FOV (Hz) y amplitud (°)
const BREATH_HZ = 1.8;
const FOV_PULSE_AMPL = 8;

// Radio base del anillo (en % del ancho de pantalla aprox.)
const BASE_R1 = 52;
