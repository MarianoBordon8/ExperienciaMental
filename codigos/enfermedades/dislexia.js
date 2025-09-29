// codigos/enfermedades/dislexia.js
// Maneja la lógica del modo dislexia (televisor + examen)

let estadoDislexia = false; // false = normal, true = dislexia
let televisorActual = null;
let examenActual = null;
let personajeSeleccionado = null;

// Intensidad del efecto (1 = normal, 0.5 = leve, 1.5/2 = fuerte). Hasta 3 para "muy fuerte".
let intensidadDislexia = 1.25;

function inicializarSistemaDislexia(televisor, examen, idPersonaje) {
  televisorActual = televisor;
  examenActual = examen;
  personajeSeleccionado = idPersonaje;
  console.log(`Sistema de dislexia inicializado para personaje: ${idPersonaje}`);
}

function alternarModoDislexia() {
  if (personajeSeleccionado !== "Juan") {
    console.log("La alternancia de modo dislexia solo está disponible para Juan");
    return false;
  }
  estadoDislexia = !estadoDislexia;
  console.log(`Modo dislexia: ${estadoDislexia ? "ACTIVADO" : "DESACTIVADO"}`);

  if (televisorActual) televisorActual.cambiarModo(estadoDislexia);
  sincronizarExamenConDislexia();
  return true;
}

function sincronizarExamenConDislexia() {
  if (!examenActual || !examenActual.getHojaVisible()) return;

  const el = document.getElementById("textoHoja");
  if (!el) return;

  if (estadoDislexia) {
    // 1) setear intensidad y clase
    el.style.setProperty("--k", String(intensidadDislexia));
    el.classList.add("dyslexia-on");
    // 2) generar contenido con reglas aplicadas
    examenActual.llenarContenidoExamenDislexia();
  } else {
    examenActual.llenarContenidoExamen();
    el.style.removeProperty("--k");
    el.classList.remove("dyslexia-on");
  }
}

function getEstadoDislexia() { return estadoDislexia; }
function puedeUsarDislexia() { return personajeSeleccionado === "Juan"; }

// Ajusta intensidad global del efecto (se aplica en caliente si está activo)
function setIntensidadDislexia(n) {
  const v = Number(n);
  if (Number.isFinite(v)) {
    intensidadDislexia = Math.min(3, Math.max(0.5, v));
    const el = document.getElementById("textoHoja");
    if (el && estadoDislexia) {
      el.style.setProperty("--k", String(intensidadDislexia));
      examenActual?.llenarContenidoExamenDislexia?.(); // re-render para aplicar nuevas probabilidades
    }
  }
  return intensidadDislexia;
}

// Forzar estado (debug)
function forzarEstadoDislexia(nuevoEstado) {
  if (personajeSeleccionado !== "Juan") {
    console.warn("No se puede forzar estado de dislexia para personajes que no sean Juan");
    return false;
  }
  if (estadoDislexia !== nuevoEstado) {
    estadoDislexia = nuevoEstado;
    if (televisorActual) televisorActual.cambiarModo(estadoDislexia);
    sincronizarExamenConDislexia();
  }
  return true;
}

export {
  inicializarSistemaDislexia,
  alternarModoDislexia,
  sincronizarExamenConDislexia,
  getEstadoDislexia,
  puedeUsarDislexia,
  forzarEstadoDislexia,
  setIntensidadDislexia,
  intensidadDislexia
};
