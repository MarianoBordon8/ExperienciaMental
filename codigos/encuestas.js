/* Encuestras: muestra una encuesta según la "enfermedad" actual.
   No guarda archivos — solo muestra la encuesta, registra respuestas en consola
   y notifica al resto de la app (exitToMenu o evento 'encuesta:submitted').
*/

let _getEnfermedad = null;

function crearModalSiNoExiste() {
  let modal = document.getElementById("encuestaModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "encuestaModal";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.display = "none";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.background = "rgba(0,0,0,0.6)";
  modal.style.zIndex = "3000";
  modal.style.padding = "20px";

  const panel = document.createElement("div");
  panel.id = "encuestaPanel";
  panel.style.width = "min(720px, 96vw)";
  panel.style.maxHeight = "90vh";
  panel.style.overflowY = "auto";
  panel.style.background = "#fff";
  panel.style.borderRadius = "10px";
  panel.style.padding = "18px";
  panel.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
  panel.style.fontFamily = "Arial, sans-serif";
  panel.style.color = "#111";
  panel.style.fontSize = "15px";
  panel.style.lineHeight = "1.5";

  modal.appendChild(panel);
  document.body.appendChild(modal);

  // cerrar al hacer click fuera del panel
  modal.addEventListener("click", (ev) => {
    if (ev.target === modal) cerrarModal();
  });

  return modal;
}

function cerrarModal() {
  const modal = document.getElementById("encuestaModal");
  if (!modal) return;
  // remover listener de teclado adjuntado en mostrarEncuesta
  window.removeEventListener("keydown", _encuestaKeyHandler);
  modal.remove();
}

function plantillaPreguntas(enfermedad) {
  if (enfermedad === "esquizofrenia") {
    return `
      <h2>Encuesta — Esquizofrenia</h2>
      <form id="formEncuesta">
        <p>¿Sentiste que la simulación te ayudó a entender cómo puede sentirse una persona con esquizofrenia?</p>
        <label><input name="q1" type="radio" value="Sí, completamente"> Sí, completamente</label><br>
        <label><input name="q1" type="radio" value="Un poco"> Un poco</label><br>
        <label><input name="q1" type="radio" value="No mucho"> No mucho</label><br>
        <label><input name="q1" type="radio" value="No lo entendí"> No lo entendí</label><br><br>

        <p>¿Qué sensación te generó la experiencia?</p>
        <textarea name="q2" rows="3" style="width:100%"></textarea><br><br>

        <p>¿Percibiste confusión o dificultad para distinguir entre lo real y lo imaginario durante la simulación?</p>
        <label><input name="q3" type="radio" value="Sí"> Sí</label><br>
        <label><input name="q3" type="radio" value="No"> No</label><br><br>

        <p>¿Qué creés que podrías hacer para ayudar o comprender mejor a alguien con esquizofrenia después de esta experiencia?</p>
        <textarea name="q4" rows="3" style="width:100%"></textarea><br><br>

        <p>¿Hay algo que mejorarías o agregarías en esta simulación para representar mejor la enfermedad?</p>
        <textarea name="q5" rows="3" style="width:100%"></textarea><br><br>

        <div style="text-align:right; margin-top:8px;">
          <button type="button" id="cerrarEncuestaBtn" style="margin-right:8px; padding:8px 12px;">Cerrar</button>
          <button type="submit" style="padding:8px 12px; background:#007bff; color:white; border:none; border-radius:6px;">Enviar</button>
        </div>
      </form>
    `;
  }

  if (enfermedad === "ansiedad") {
    return `
      <h2>Encuesta — Ansiedad</h2>
      <form id="formEncuesta">
        <p>¿La simulación reflejó bien cómo una persona con ansiedad puede sentirse en una situación cotidiana?</p>
        <label><input name="q1" type="radio" value="Sí, muy bien"> Sí, muy bien</label><br>
        <label><input name="q1" type="radio" value="Parcialmente"> Parcialmente</label><br>
        <label><input name="q1" type="radio" value="No tanto"> No tanto</label><br><br>

        <p>¿Qué emociones sentiste mientras la experimentabas?</p>
        <textarea name="q2" rows="3" style="width:100%"></textarea><br><br>

        <p>¿Lograste identificar qué elementos de la simulación generaban esa sensación de ansiedad?</p>
        <label><input name="q3" type="radio" value="Sí"> Sí</label><br>
        <label><input name="q3" type="radio" value="No"> No</label><br>
        <label><input name="q3" type="radio" value="No estoy seguro"> No estoy seguro</label><br><br>

        <p>¿Creés que esta experiencia te hizo más empático con personas que sufren ansiedad?</p>
        <label><input name="q4" type="radio" value="Sí"> Sí</label><br>
        <label><input name="q4" type="radio" value="No"> No</label><br><br>

        <p>¿Tenés alguna sugerencia para mejorar la representación de la ansiedad?</p>
        <textarea name="q5" rows="3" style="width:100%"></textarea><br><br>

        <div style="text-align:right; margin-top:8px;">
          <button type="button" id="cerrarEncuestaBtn" style="margin-right:8px; padding:8px 12px;">Cerrar</button>
          <button type="submit" style="padding:8px 12px; background:#007bff; color:white; border:none; border-radius:6px;">Enviar</button>
        </div>
      </form>
    `;
  }

  return `
    <h2>Encuesta — Dislexia</h2>
    <form id="formEncuesta">
      <p>¿Pudiste percibir las dificultades que enfrenta una persona con dislexia al leer o procesar información?</p>
      <label><input name="q1" type="radio" value="Sí"> Sí</label><br>
      <label><input name="q1" type="radio" value="En parte"> En parte</label><br>
      <label><input name="q1" type="radio" value="No lo sentí"> No lo sentí</label><br><br>

      <p>¿Qué sensación te generó intentar leer o entender el contenido durante la simulación?</p>
      <textarea name="q2" rows="3" style="width:100%"></textarea><br><br>

      <p>¿Creés que la simulación logra representar de forma justa las dificultades cotidianas de la dislexia?</p>
      <label><input name="q3" type="radio" value="Sí"> Sí</label><br>
      <label><input name="q3" type="radio" value="En parte"> En parte</label><br>
      <label><input name="q3" type="radio" value="No"> No</label><br><br>

      <p>¿Pensás que esta experiencia te ayudó a comprender mejor a las personas con dislexia?</p>
      <label><input name="q4" type="radio" value="Sí"> Sí</label><br>
      <label><input name="q4" type="radio" value="No"> No</label><br><br>

      <p>¿Qué agregarías o cambiarías para hacer más clara o realista esta simulación?</p>
      <textarea name="q5" rows="3" style="width:100%"></textarea><br><br>

      <div style="text-align:right; margin-top:8px;">
        <button type="button" id="cerrarEncuestaBtn" style="margin-right:8px; padding:8px 12px;">Cerrar</button>
        <button type="submit" style="padding:8px 12px; background:#007bff; color:white; border:none; border-radius:6px;">Enviar</button>
      </div>
    </form>
  `;
}

function adjuntarHandlersFormulario(modal, enfermedad) {
  const panel = modal.querySelector("#encuestaPanel");
  const form = panel.querySelector("#formEncuesta");
  const cerrarBtn = panel.querySelector("#cerrarEncuestaBtn");

  if (cerrarBtn) cerrarBtn.addEventListener("click", () => cerrarModal());

  if (!form) return;

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const data = {};
    const elements = Array.from(form.elements).filter((el) => el.name);
    elements.forEach((el) => {
      if (el.type === "radio") {
        if (el.checked) data[el.name] = el.value;
        else if (!(el.name in data)) data[el.name] = "";
      } else if (el.tagName.toLowerCase() === "textarea" || el.type === "text") {
        data[el.name] = el.value;
      }
    });

    const payload = {
      enfermedad: enfermedad || "desconocido",
      fecha: new Date().toISOString(),
      ...data,
    };

    // solo registrar en consola
    console.log("[Encuesta] respuestas (console):", payload);

    // cerrar modal
    cerrarModal();

    // Notificar al resto de la app para que haga el regreso al menú
    setTimeout(() => {
      if (typeof window.exitToMenu === "function") {
        try { window.exitToMenu(); } catch (err) { console.error(err); }
        return;
      }
      const ev = new CustomEvent("encuesta:submitted", { detail: { enfermedad: payload.enfermedad } });
      window.dispatchEvent(ev);

      // fallback: recargar si nadie maneja el evento en 500ms
      setTimeout(() => {
        console.warn("[Encuestas] No se detectó handler para volver al menú. Recargando página como último recurso.");
        window.location.reload();
      }, 500);
    }, 80);
  });
}

let _encuestaKeyHandler = null;

function mostrarEncuesta(enfermedad) {
  const modal = crearModalSiNoExiste();
  const panel = modal.querySelector("#encuestaPanel");
  if (!panel) return;

  panel.innerHTML = plantillaPreguntas(enfermedad);
  adjuntarHandlersFormulario(modal, enfermedad);

  // Añadir handler de teclado para cerrar mientras la encuesta está abierta
  _encuestaKeyHandler = (ev) => {
    if (ev.key === "Escape") {
      // Solo cerrar la encuesta (no volver al menú)
      ev.stopPropagation();
      ev.preventDefault();
      cerrarModal();
    }
  };
  window.addEventListener("keydown", _encuestaKeyHandler);

  modal.style.display = "flex";
  const firstInput = panel.querySelector("input, textarea, button");
  if (firstInput) firstInput.focus();
}

function inicializarEncuestas(getEnfermedad) {
  _getEnfermedad = typeof getEnfermedad === "function" ? getEnfermedad : null;
  // main.js controla apertura y flujo
}

function isEncuestaAbierta() {
  return !!document.getElementById("encuestaModal");
}

export { inicializarEncuestas, mostrarEncuesta, isEncuestaAbierta };