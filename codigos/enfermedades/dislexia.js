// codigos/dislexia.js
// Maneja toda la lógica relacionada con el modo dislexia (alternancia imagen/video del televisor y efectos en el examen)

let estadoDislexia = false; // false = modo normal, true = modo dislexia
let televisorActual = null;
let examenActual = null;
let personajeSeleccionado = null;

// Configurar el sistema de dislexia con los objetos televisor y examen
function inicializarSistemaDislexia(televisor, examen, idPersonaje) {
  televisorActual = televisor;
  examenActual = examen;
  personajeSeleccionado = idPersonaje;
  
  console.log(`Sistema de dislexia inicializado para personaje: ${idPersonaje}`);
}

// Alternar entre modo normal y modo dislexia
function alternarModoDislexia() {
  // Solo permitir alternancia si el personaje es "Juan"
  if (personajeSeleccionado !== "Juan") {
    console.log("La alternancia de modo dislexia solo está disponible para Juan");
    return false;
  }

  // Cambiar el estado
  estadoDislexia = !estadoDislexia;
  
  console.log(`Modo dislexia: ${estadoDislexia ? 'ACTIVADO' : 'DESACTIVADO'}`);

  // Alternar el televisor
  if (televisorActual) {
    televisorActual.cambiarModo(estadoDislexia);
  }

  // Sincronizar el examen
  sincronizarExamenConDislexia();

  return true;
}

// Sincronizar el contenido del examen según el estado actual de dislexia
function sincronizarExamenConDislexia() {
  if (!examenActual || !examenActual.getHojaVisible()) {
    return; // No hacer nada si el examen no está visible
  }

  if (estadoDislexia) {
    examenActual.llenarContenidoExamenDislexia();
  } else {
    examenActual.llenarContenidoExamen();
  }
}

// Obtener el estado actual del modo dislexia
function getEstadoDislexia() {
  return estadoDislexia;
}

// Obtener si el personaje actual puede usar el modo dislexia
function puedeUsarDislexia() {
  return personajeSeleccionado === "Juan";
}

// Forzar un estado específico de dislexia (útil para debugging o casos especiales)
function forzarEstadoDislexia(nuevoEstado) {
  if (personajeSeleccionado !== "Juan") {
    console.warn("No se puede forzar estado de dislexia para personajes que no sean Juan");
    return false;
  }

  if (estadoDislexia !== nuevoEstado) {
    estadoDislexia = nuevoEstado;
    
    if (televisorActual) {
      televisorActual.cambiarModo(estadoDislexia);
    }
    
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
  forzarEstadoDislexia
};