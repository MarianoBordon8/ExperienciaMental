// main.js
// (Ya no importamos canvas.js aquí; lo cargamos on-demand)
let CrearCanvas = null;

/* =============== Helpers =============== */
const $  = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => scope.querySelectorAll(sel);

/* =============== Hero: typewriter (loop, suave) =============== */
(() => {
  const el = $(".demo");
  if (!el) return;

  const TEXT =
    "Diseñar un entorno virtual de aula, en primera persona, que permita comprender distintas maneras de percibir y procesar una clase y abrir conversación sobre accesibilidad e inclusión.\nPropuesta educativa, no clínica.";

  let i = 0;
  let adding = true;
  let timer;
  const SPEED = { type: 28, punct: 340, line: 380, endPause: 1600, erase: 14, restartPause: 700 };

  function step() {
    if (!el) return;
    if (adding) {
      i = Math.min(i + 1, TEXT.length);
      el.textContent = TEXT.slice(0, i);
      const prev = TEXT[i - 1] || "";
      let delay = SPEED.type;
      if (prev === "\n") delay += SPEED.line;
      else if (/[.,;:!?]/.test(prev)) delay += SPEED.punct;
      if (i === TEXT.length) { adding = false; delay = SPEED.endPause; }
      timer = setTimeout(step, delay);
    } else {
      i = Math.max(i - 1, 0);
      el.textContent = TEXT.slice(0, i);
      let delay = SPEED.erase;
      if (i === 0) { adding = true; delay = SPEED.restartPause; }
      timer = setTimeout(step, delay);
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTimeout(timer);
    else { clearTimeout(timer); timer = setTimeout(step, 60); }
  });

  setTimeout(step, 320);
})();

/* =============== Parallax hero (ahora sí, tras existir el DOM) =============== */
(() => {
  const bg = document.querySelector('.hero__bg');
  if (!bg) return;
  let raf = 0;
  window.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const y = Math.min(window.scrollY, 400);
      bg.style.transform = `translate3d(${y * 0.02}px, ${-y * 0.04}px, 0)`;
      raf = 0;
    });
  }, { passive: true });
})();

/* =============== Nav móvil =============== */
(() => {
  const btn  = $("#navToggle");
  const menu = $("#navMenu");
  if (!btn || !menu) return;
  const updateExpanded = () => {
    const isOpen = menu.classList.contains("open");
    btn.setAttribute("aria-expanded", String(isOpen));
  };
  btn.addEventListener("click", () => { menu.classList.toggle("open"); updateExpanded(); });
  menu.addEventListener("click", (e) => { if (e.target.tagName === "A") { menu.classList.remove("open"); updateExpanded(); } });
})();

/* =============== Estado UI =============== */
const landing       = $(".landing");
const game          = $(".threejsCanvas");
const pantallaCarga = $("#pantalla-carga");

let currentCanvas = null; // objeto con destroy()
let exitBtn       = null; // botón "Salir al menú"

// ✔️ Reset total al salir
const HARD_RESET = true;

/* =============== Audio: apaga TODO al salir =============== */
function killAllAudio() {
  document.querySelectorAll("audio").forEach(a => {
    try { a.pause(); } catch {}
    try { a.currentTime = 0; } catch {}
    try { a.src = a.src; } catch {}
  });
  try {
    const ctx = window?.THREE?.AudioContext?.getContext?.();
    if (ctx) { ctx.suspend?.().catch(()=>{}); ctx.close?.().catch(()=>{}); }
    window?.THREE?.AudioContext?.setContext?.(null);
  } catch {}
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    Object.keys(window).forEach(k => {
      const v = window[k];
      if (v && typeof v.resume === "function" && typeof v.close === "function" && v.destination) {
        try { v.suspend?.(); } catch {}
        try { v.close?.(); }   catch {}
      }
    });
  }
}

/* =============== Botón "Salir al menú" =============== */
function ensureExitButton() {
  if (exitBtn) return exitBtn;
  const btn = document.createElement("button");
  btn.id = "btnExitSim";
  btn.type = "button";
  btn.className = "btn btn--primary btn-exit";
  btn.textContent = "Salir al menú";
  btn.title = "Volver al menú";
  btn.style.position = "fixed";
  btn.style.top = "14px";
  btn.style.left = "14px";
  btn.style.zIndex = "10050";
  btn.addEventListener("click", exitToMenu);
  document.body.appendChild(btn);
  exitBtn = btn;
  return btn;
}

/* =============== Arrancar simulador (lazy import real) =============== */
async function startSim(personajeId) {
  window.scrollTo(0, 0);
  if (landing) landing.style.display = "none";
  if (game) { game.style.display = "block"; game.style.visibility = "visible"; }
  document.body.classList.add("no-scroll");

  ensureExitButton();
  pantallaCarga?.classList.add("visible");

  try {
    if (!CrearCanvas) {
      // carga el módulo sólo cuando se necesita (ya viene calentado por <link rel="modulepreload">)
      ({ CrearCanvas } = await import("./codigos/canvas.js"));
    }
    currentCanvas = CrearCanvas(personajeId);
  } catch (err) {
    console.error("[main] Error al crear canvas:", err);
  }
}

/* =============== Salir al menú (botón o Esc) =============== */
async function exitToMenu() {
  if (game) { game.style.visibility = "hidden"; game.style.display = "none"; }
  try { currentCanvas?.destroy?.(); } catch (e) { console.warn(e); }
  currentCanvas = null;
  killAllAudio();
  pantallaCarga?.classList.remove("visible", "fade-out");
  document.getElementById("cartelInstrucciones")?.remove();
  exitBtn?.remove(); exitBtn = null;

  // Resetear la bandera de la campana al volver al menú
  try {
    const { resetearCampana } = await import("./codigos/objetos.js");
    resetearCampana();
  } catch (e) {
    console.warn("[main] Error al resetear campana:", e);
  }

  if (HARD_RESET) {
    document.body.classList.remove("no-scroll");
    setTimeout(() => location.reload(), 40);
  } else {
    if (landing) landing.style.display = "block";
    document.body.classList.remove("no-scroll");
  }
}

/* =============== Bind de botones “Elegir {personaje}” =============== */
(function bindStartButtons() {
  const buttons = $$(".start-sim");
  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id || e.currentTarget.id;
      if (!id) return;
      startSim(id);
    });
  });
})();

import { mostrarEncuesta, isEncuestaAbierta } from './codigos/encuestas.js';

/* =============== Atajo global: Esc = salir / abrir encuesta =============== */
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && game && getComputedStyle(game).display !== "none") {
    // Si la encuesta NO está abierta: abrirla (y NO salir)
    if (!isEncuestaAbierta()) {
      // evitar que se ejecute el handler anterior que hacía exitToMenu
      e.preventDefault();
      // mostrar encuesta según la enfermedad actual expuesta por el canvas
      const enf = window.enfermedadActual || 'dislexia';
      mostrarEncuesta(enf);
      return;
    }
    // Si la encuesta está abierta, dejar que su propio handler la cierre.
    // No llamamos exitToMenu hasta que la encuesta esté cerrada y el usuario vuelva a presionar ESC o use el botón Salir.
  }
});
