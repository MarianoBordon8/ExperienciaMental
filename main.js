// main.js
import { CrearCanvas } from "./codigos/canvas.js";

/* =============== Helpers =============== */
const $  = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => scope.querySelectorAll(sel);

/* =============== Hero: typewriter (loop, suave, sin glitches) =============== */
(() => {
  const el = $(".demo");
  if (!el) return;

  // Texto (actualizado: "accesibilidad e inclusión")
  const TEXT =
    "Diseñar un entorno virtual de aula, en primera persona, que permita comprender distintas maneras de percibir una clase y abrir conversación sobre accesibilidad e inclusión.\nPropuesta educativa, no clínica.";

  let i = 0;
  let adding = true;           // escribe / borra
  let timer;

  const SPEED = {
    type: 38,                  // velocidad base de tipeo
    punct: 340,                // pausa extra tras . , ; : ! ?
    line: 380,                 // pausa extra tras salto de línea
    endPause: 1600,            // pausa cuando termina de escribir todo
    erase: 10,                 // velocidad al borrar
    restartPause: 800          // pausa antes de volver a empezar
  };

  function step() {
    if (!el) return;

    if (adding) {
      i = Math.min(i + 1, TEXT.length);
      el.textContent = TEXT.slice(0, i);

      const prev = TEXT[i - 1] || "";
      let delay = SPEED.type;
      if (prev === "\n") delay += SPEED.line;
      else if (/[.,;:!?]/.test(prev)) delay += SPEED.punct;

      if (i === TEXT.length) {
        adding = false;
        delay = SPEED.endPause;
      }
      timer = setTimeout(step, delay);
    } else {
      i = Math.max(i - 1, 0);
      el.textContent = TEXT.slice(0, i);

      let delay = SPEED.erase;
      if (i === 0) {
        adding = true;
        delay = SPEED.restartPause;
      }
      timer = setTimeout(step, delay);
    }
  }

  // Resiliencia al cambiar de pestaña
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTimeout(timer);
    else {
      clearTimeout(timer);
      timer = setTimeout(step, 60);
    }
  });

  setTimeout(step, 320);
})();

/* =============== Nav móvil (header nuevo) =============== */
(() => {
  const btn  = $("#navToggle");
  const menu = $("#navMenu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => menu.classList.toggle("open"));
  menu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") menu.classList.remove("open");
  });
})();

/* =============== Estado UI =============== */
const landing       = $(".landing");
const game          = $(".threejsCanvas");
const pantallaCarga = $("#pantalla-carga");

let currentCanvas = null; // objeto con destroy()
let exitBtn       = null; // botón "Salir al menú"

// ✔️ Modo de salida: HARD_RESET fuerza reload (estado 0 garantizado)
const HARD_RESET = true;

/* =============== Audio: apaga TODO al salir =============== */
function killAllAudio() {
  // 1) Pausar y resetear <audio> del DOM
  document.querySelectorAll("audio").forEach(a => {
    try { a.pause(); } catch {}
    try { a.currentTime = 0; } catch {}
    try { a.src = a.src; } catch {} // rompe buffers antiguos si alguno queda colgado
  });

  // 2) Cerrar/suspender AudioContext de Three.js (singleton)
  try {
    const ctx = window?.THREE?.AudioContext?.getContext?.();
    if (ctx) {
      if (typeof ctx.suspend === "function") { ctx.suspend().catch(()=>{}); }
      if (typeof ctx.close   === "function") { ctx.close().catch(()=>{}); }
    }
    window?.THREE?.AudioContext?.setContext?.(null);
  } catch {}

  // 3) Heurística: si algún módulo creó AudioContext global, intentamos cerrarlo
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    Object.keys(window).forEach(k => {
      const v = window[k];
      if (v && typeof v === "object" && typeof v.resume === "function" && typeof v.close === "function" && v.destination) {
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
  // Fallback por si el CSS no cargó
  btn.style.position = "fixed";
  btn.style.top = "14px";
  btn.style.left = "14px";
  btn.style.zIndex = "10050";
  btn.addEventListener("click", exitToMenu);
  // 👉 Al <body>, no dentro del contenedor ThreeJS
  document.body.appendChild(btn);
  exitBtn = btn;
  return btn;
}

/* =============== Arrancar simulador =============== */
function startSim(personajeId) {
  window.scrollTo(0, 0);
  if (landing) landing.style.display = "none";
  if (game) {
    game.style.display   = "block";
    game.style.visibility = "visible";
  }
  document.body.classList.add("no-scroll");

  ensureExitButton();                    // crear botón primero
  pantallaCarga?.classList.add("visible"); // luego mostrar overlay

  try {
    currentCanvas = CrearCanvas(personajeId);
  } catch (err) {
    console.error("[main] Error al crear canvas:", err);
  }
}

/* =============== Salir al menú (botón o Esc) =============== */
function exitToMenu() {
  if (game) { game.style.visibility = "hidden"; game.style.display = "none"; }

  try { currentCanvas?.destroy?.(); } catch (e) { console.warn(e); }
  currentCanvas = null;

  killAllAudio();

  pantallaCarga?.classList.remove("visible", "fade-out");
  document.getElementById("cartelInstrucciones")?.remove();
  exitBtn?.remove(); exitBtn = null;

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

/* =============== Atajo global: Esc = salir =============== */
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && game && getComputedStyle(game).display !== "none") {
    exitToMenu();
  }
});
