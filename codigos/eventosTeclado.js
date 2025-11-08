import {
  alternarModoDislexia,
  sincronizarExamenConDislexia,
  getEstadoDislexia,
  intensidadDislexia,
} from "./enfermedades/dislexia.js";
import { toggleEsquizofrenia } from "./enfermedades/esquizofrenia.js";
import { toggleAnsiedad } from "./enfermedades/ansiedad.js";

function manejarEventosTeclado(
  camara,
  televisor,
  examen,
  movimiento,
  enfermedad
) {
  const CUADERNO = new THREE.Vector3(-2.5, 1.1, -1.15);

  const syncExamToDislexia = () => {
    if (!examen.getHojaVisible()) return;
    sincronizarExamenConDislexia();
  };

  // -- Contenido informativo (El ciclo del agua) --
  const TEXTO_ID = "textoInformativo";
  const contenidoCicloAgua = `
    <h3 style="margin-top:0; text-align:center;">El ciclo del agua</h3>
    <p style="white-space:pre-wrap; text-align:justify; margin:0;">
El ciclo del agua es el proceso natural mediante el cual el agua circula constantemente entre la superficie terrestre y la atmósfera. Este ciclo es fundamental para mantener el equilibrio de los ecosistemas y la vida en el planeta. Todo comienza con la evaporación, cuando el calor del sol transforma el agua de los océanos, ríos y lagos en vapor que asciende al cielo.

Luego, ese vapor se enfría al llegar a las capas altas de la atmósfera y se condensa, formando nubes. Cuando las gotas en las nubes se vuelven lo suficientemente grandes, caen nuevamente a la superficie en forma de precipitación, ya sea lluvia, nieve o granizo.

Finalmente, el agua que cae puede infiltrarse en el suelo alimentando los acuíferos, o escurrir hacia ríos y mares, completando así el ciclo. Este proceso es continuo y esencial para distribuir el agua dulce y regular el clima de la Tierra.
    </p>
  `;

  function crearContenedorTextoSiNoExiste() {
    let cont = document.getElementById(TEXTO_ID);
    if (cont) return cont;

    cont = document.createElement("div");
    cont.id = TEXTO_ID;
    cont.style.position = "absolute";
    cont.style.top = "50%";
    cont.style.left = "50%";
    cont.style.transform = "translate(-50%, -50%)";
    cont.style.width = "520px";
    cont.style.maxHeight = "70vh";
    cont.style.overflowY = "auto";
    cont.style.background = "rgba(255,255,255,0.97)";
    cont.style.border = "2px solid #333";
    cont.style.borderRadius = "10px";
    cont.style.padding = "18px";
    cont.style.zIndex = "2000";
    cont.style.fontFamily = "Arial, sans-serif";
    cont.style.display = "none";
    cont.style.boxShadow = "0 8px 24px rgba(0,0,0,0.35)";
    cont.style.color = "#111";
    cont.style.fontSize = "15px";
    cont.style.lineHeight = "1.5";

    document.body.appendChild(cont);
    return cont;
  }

  // Genera spans con clases dislexiaN a partir de un texto plano
  function aplicarDislexiaATextoPlano(texto) {
    const palabras = texto.split(/\s+/);
    let resultado = "";
    palabras.forEach((palabra, idxPal) => {
      if (!palabra) return;
      let i = 0;
      let spanIndex = 0;
      while (i < palabra.length) {
        const tipoFragmento = Math.random();
        let tamano;
        if (tipoFragmento < 0.4) tamano = 1;
        else if (tipoFragmento < 0.7) tamano = 2;
        else tamano = 3;
        tamano = Math.min(tamano, palabra.length - i);
        const fragmento = palabra.substring(i, i + tamano);
        resultado += `<span class="dislexia${(spanIndex % 5) + 1}">${fragmento}</span>`;
        i += tamano;
        spanIndex++;
      }
      if (idxPal < palabras.length - 1) resultado += " ";
    });
    return resultado;
  }

  // Transforma un fragmento HTML reemplazando nodos de texto por HTML con efecto dislexia
  function transformarHTMLconDislexia(html) {
    const cont = document.createElement("div");
    cont.innerHTML = html;
    const walker = document.createTreeWalker(cont, NodeFilter.SHOW_TEXT, null, false);
    const textos = [];
    let node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim()) continue;
      textos.push(node);
    }
    textos.forEach((textNode) => {
      const parent = textNode.parentNode;
      const text = textNode.nodeValue;
      const frag = document.createElement("span");
      frag.innerHTML = aplicarDislexiaATextoPlano(text);
      parent.replaceChild(frag, textNode);
    });
    return cont.innerHTML;
  }

  function mostrarTextoInformativo(html) {
    const cont = crearContenedorTextoSiNoExiste();

    // Si el modo dislexia está activo, transformar el HTML y aplicar clase/propiedad CSS
    if (typeof getEstadoDislexia === "function" && getEstadoDislexia()) {
      cont.classList.add("dyslexia-on");
      cont.style.setProperty("--k", String(intensidadDislexia));
      html = transformarHTMLconDislexia(html);
    } else {
      cont.classList.remove("dyslexia-on");
      cont.style.removeProperty("--k");
    }

    cont.innerHTML = `
      ${html}
      <div style="text-align:center; margin-top:14px;">
        <button id="cerrarTextoBtn" style="padding:8px 14px; background:#007bff; color:white; border:none; border-radius:6px; cursor:pointer;">
          Cerrar
        </button>
      </div>
    `;
    const btn = cont.querySelector("#cerrarTextoBtn");
    btn.addEventListener("click", cerrarTextoInformativo);
    cont.style.display = "block";
    // Exponer la función por si otro módulo la necesita
    window.cerrarTextoInformativo = cerrarTextoInformativo;
  }

  function cerrarTextoInformativo() {
    const cont = document.getElementById(TEXTO_ID);
    if (!cont) return;
    cont.innerHTML = "";
    cont.style.display = "none";
  }

  // -- Función para reproducir audio y mostrar examen --
  const reproducirAudioYMostrarExamen = () => {
    const rutaAudio = "./assets/sounds/examen.mp3";
    const audioExamen = new Audio(rutaAudio);
    audioExamen.volume = 0.7; // Volumen al 70%

    console.log("[Audio] Reproduciendo audio del examen:", rutaAudio);

    audioExamen
      .play()
      .then(() => {
        // Cuando termine, mostrar examen
        audioExamen.addEventListener("ended", () => {
          console.log("[Audio] Audio terminado, mostrando examen");
          mostrarExamenCompleto();
        });
        // Por si el archivo tiene duración 0 o 'ended' no se dispara, fallback
        setTimeout(() => {
          if (!examen.getHojaVisible()) {
            mostrarExamenCompleto();
          }
        }, 15000); // 15s fallback máximo
      })
      .catch((error) => {
        console.log("[Audio] Error al reproducir audio del examen:", error);
        // Si falla el audio (autoplay bloqueado), intentar mostrar examen inmediatamente
        mostrarExamenCompleto();
      });
  };

  const mostrarExamenCompleto = () => {
    // Mover la cámara mirando al cuaderno. si movimiento tiene smoothLookAt, usarlo
    if (movimiento && typeof movimiento.smoothLookAt === "function") {
      movimiento.smoothLookAt(CUADERNO, 1000, () => {
        examen.mostrarExamen();
        if (enfermedad === "dislexia") syncExamToDislexia();
        // llenar contenido dependiendo del televisor
        if (televisor && typeof televisor.getUsandoVideo === "function" && televisor.getUsandoVideo()) {
          examen.llenarContenidoExamenDislexia();
        } else {
          examen.llenarContenidoExamen();
        }
      });
      return;
    }

    // Fallback: calcular yaw/pitch y aplicar setters del movimiento si existen
    const direccionAlBanco = new THREE.Vector3(
      CUADERNO.x - camara.position.x,
      0,
      CUADERNO.z - camara.position.z
    ).normalize();
    const yawNuevo = Math.atan2(direccionAlBanco.x, direccionAlBanco.z);
    const pitchNuevo = -0.6;
    if (movimiento && typeof movimiento.setYaw === "function") movimiento.setYaw(yawNuevo);
    if (movimiento && typeof movimiento.setPitch === "function") movimiento.setPitch(pitchNuevo);
    if (movimiento && typeof movimiento.actualizarCamara === "function") movimiento.actualizarCamara();

    examen.mostrarExamen();
    if (enfermedad === "dislexia") syncExamToDislexia();
    if (televisor && typeof televisor.getUsandoVideo === "function" && televisor.getUsandoVideo()) {
      examen.llenarContenidoExamenDislexia();
    } else {
      examen.llenarContenidoExamen();
    }
  };

  // -- Función para mirar y mostrar texto informativo al presionar O --
  const reproducirLookYMostrarTexto = () => {
    console.log("[Teclado] O presionada → mostrar texto informativo");
    if (movimiento && typeof movimiento.smoothLookAt === "function") {
      movimiento.smoothLookAt(CUADERNO, 1000, () => {
        mostrarTextoInformativo(contenidoCicloAgua);
      });
      return;
    }

    // Fallback: aplicar rotación directamente
    const direccionAlBanco = new THREE.Vector3(
      CUADERNO.x - camara.position.x,
      0,
      CUADERNO.z - camara.position.z
    ).normalize();
    const yawNuevo = Math.atan2(direccionAlBanco.x, direccionAlBanco.z);
    const pitchNuevo = -0.6;
    if (movimiento && typeof movimiento.setYaw === "function") movimiento.setYaw(yawNuevo);
    if (movimiento && typeof movimiento.setPitch === "function") movimiento.setPitch(pitchNuevo);
    if (movimiento && typeof movimiento.actualizarCamara === "function") movimiento.actualizarCamara();
    mostrarTextoInformativo(contenidoCicloAgua);
  };

  // --- Listener principal de teclado ---
  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;

    if (e.code === "KeyC") {
      console.log("[Teclado] C presionada → toggle experiencia:", enfermedad);
      switch (enfermedad) {
        case "dislexia":
          alternarModoDislexia();
          requestAnimationFrame(syncExamToDislexia);
          // Si el texto informativo está abierto, re-renderizarlo con el nuevo estado de dislexia
          const contTexto = document.getElementById(TEXTO_ID);
          if (contTexto && contTexto.style.display !== "none") {
            // volver a mostrar (mostrarTextoInformativo aplica dislexia según getEstadoDislexia)
            mostrarTextoInformativo(contenidoCicloAgua);
          }
          break;
        case "esquizofrenia":
          toggleEsquizofrenia();
          break;
        case "ansiedad":
          toggleAnsiedad(camara);
          break;
        default:
          console.log("[Teclado] Sin experiencia seleccionada");
      }
    }

    if (e.code === "KeyP") {
      console.log("[Teclado] P presionada → iniciando secuencia de examen");
      reproducirAudioYMostrarExamen();
    }

    if (e.code === "KeyO") {
      // Presionar O: mirar y mostrar texto informativo (ciclo del agua)
      reproducirLookYMostrarTexto();
    }
  });
}

export { manejarEventosTeclado };
