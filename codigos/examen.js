// codigos/examen.js

// Variables para controlar si la hoja está visible
let hojaVisible = false;
let hojaCuaderno = null;

// --------- Estilos dedicados (alto contraste + efecto dislexia avanzado) ----------
let stylesInjected = false;
function injectExamStylesOnce() {
  if (stylesInjected) return;
  const css = `
  /* Contenedor del examen */
  #textoHoja{
    --fg:#172036; --fg-strong:#0b1020; --bg:#ffffff; --border:#dfe6ff;
    position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
    max-width: 680px; width:min(94vw,680px);
    max-height:min(84vh,780px);
    padding:22px 22px 18px;
    background:var(--bg); color:var(--fg);
    border:1px solid var(--border); border-radius:14px;
    box-shadow:0 20px 55px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.04) inset;
    z-index:10000; overflow-y:auto; overflow-x:hidden;
    font-family:"Nunito Sans",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
    font-size:16px; line-height:1.65;
  }
  #textoHoja h3{margin:0 0 18px; color:var(--fg-strong); letter-spacing:.2px; text-align:center}
  #textoHoja .q{ margin-bottom:18px; padding:14px; border:1px solid #e9efff; border-radius:10px; background:#fafbff; }
  #textoHoja p{ margin:0 0 10px }
  #textoHoja label{ cursor:pointer; display:block; margin-bottom:8px }
  #textoHoja input[type="radio"]{ transform:translateY(1px); margin-right:8px; accent-color:#386bff }
  #textoHoja .actions{ text-align:center; margin-top:22px }
  #textoHoja .btn{ display:inline-block; padding:10px 16px; border-radius:10px; border:0; font-weight:800; cursor:pointer; }
  #textoHoja .btn-primary{ background:#28a745; color:#fff }  #textoHoja .btn-primary:hover{ filter:brightness(.92) }
  #textoHoja .btn-secondary{ background:#007bff; color:#fff; margin-left:10px }  #textoHoja .btn-secondary:hover{ filter:brightness(.92) }

  /* Overlay sutil de bandas cuando está activo */
  #textoHoja.dyslexia-on::after{
    content:""; position: absolute; inset: 0; pointer-events:none; border-radius:14px;
    background: repeating-linear-gradient(transparent 0 26px, rgba(0,0,0,.045) 26px 27px);
    mix-blend-mode: multiply; opacity:.55; animation: dysBands 6.2s linear infinite;
  }
  @keyframes dysBands{ to { background-position: 0 54px; } }

  /* Efectos por palabra */
  #textoHoja .dysw{
    display:inline-block;
    letter-spacing: calc(var(--ls, 0em) * var(--k, 1));
    animation: dysWave var(--wdur,1800ms) ease-in-out infinite;
    will-change: transform, letter-spacing;
  }
  @keyframes dysWave{
    0%,100%{ transform: translateY(calc(var(--wy,0px) * -0.35)); }
    50%    { transform: translateY(calc(var(--wy,0px) *  1)); }
  }

  /* Efectos por fragmento (letra/sílaba) */
  #textoHoja [class^="dislexia"]{
    display:inline-block;
    transform:
      translate(calc(var(--tx,0px) * var(--k,1)), calc(var(--ty,0px) * var(--k,1)))
      rotate(calc(var(--rot,0deg) * var(--k,1)))
      skewX(var(--sk,0deg))
      scaleX(var(--fx,1));
    filter: blur(var(--blur,0px));
    animation: dysJitter var(--dur,2100ms) ease-in-out infinite;
    text-shadow: var(--shadow, 0 0 0 transparent);
    will-change: transform, filter, text-shadow;
  }
  #textoHoja .dislexia2{ animation-delay:.04s }
  #textoHoja .dislexia3{ animation-delay:.08s }
  #textoHoja .dislexia4{ animation-delay:.12s }
  #textoHoja .dislexia5{ animation-delay:.16s }
  @keyframes dysJitter{
    0%,100%{
      transform:
        translate(calc(var(--tx,0px) * -0.3), calc(var(--ty,0px) * -0.3))
        rotate(calc(var(--rot,0deg) * -0.3))
        skewX(calc(var(--sk,0deg) * -0.3))
        scaleX( calc(1 - (1 - var(--fx,1)) * .3) );
      filter: blur(calc(var(--blur,0px) * .35));
    }
    50%{
      transform:
        translate(calc(var(--tx,0px) * var(--k,1)), calc(var(--ty,0px) * var(--k,1)))
        rotate(calc(var(--rot,0deg) * var(--k,1)))
        skewX(var(--sk,0deg))
        scaleX(var(--fx,1));
      text-shadow: 0 .7px 0 rgba(0,0,0,.22);
      filter: blur(var(--blur,0px));
    }
  }
  `;
  const style = document.createElement("style");
  style.id = "examenStyles";
  style.textContent = css;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ---------------- Hoja 3D (opcional visual) ----------------
function crearHojaCuaderno() {
  const geometriaHoja = new THREE.PlaneGeometry(3, 4);
  const materialHoja = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.9,
  });
  const mesh = new THREE.Mesh(geometriaHoja, materialHoja);
  mesh.position.set(0, 1, -1.5);
  mesh.visible = false;
  return mesh;
}

// ---------------- Helpers de aleatoriedad escalada por intensidad ----------------
function getIntensity() {
  const el = document.getElementById("textoHoja");
  if (!el) return 1;
  const raw = getComputedStyle(el).getPropertyValue("--k").trim();
  const k = parseFloat(raw);
  return Number.isFinite(k) ? k : 1;
}
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function rnd(min, max) { return (Math.random() * (max - min) + min); }
function rndInt(min, max){ return Math.floor(rnd(min, max + 1)); }
function rndSigned(minAbs, maxAbs){ const v = rnd(minAbs, maxAbs); return Math.random() < 0.5 ? -v : v; }
function pick(p) { return Math.random() < p; }

// ---------------- Sustituciones letra→número/homógrafo ----------------
const NUM_HOMOGLYPHS = {
  "a":"4", "á":"4", "A":"4",
  "e":"3", "é":"3", "E":"3",
  "i":"1", "í":"1", "I":"1", "l":"1", "L":"1",
  "o":"0", "ó":"0", "O":"0",
  "s":"5", "S":"5",
  "t":"7", "T":"7",
  "z":"2", "Z":"2",
  "b":"8", "B":"8",
  "g":"9", "G":"9"
};

// Aplica sustituciones por números según probabilidad dependiente de K
function substituteHomoglyphs(chars, K){
  const pNum = clamp(0.12*K, 0.12, 0.45); // prob. por carácter
  for (let i = 0; i < chars.length; i++){
    const ch = chars[i];
    if (NUM_HOMOGLYPHS[ch] && pick(pNum)){
      chars[i] = NUM_HOMOGLYPHS[ch];
    }
  }
  return chars;
}

// Reordenados: swap adyacente o shuffle del interior (manteniendo extremos)
function reorderChars(chars, K){
  const len = chars.length;
  if (len < 3) return chars;

  const pSwap    = clamp(0.18*K, 0.18, 0.55); // swap simple
  const pShuffle = clamp(0.12*K, 0.12, 0.40); // shuffle del interior

  if (len >= 4 && pick(pShuffle)){
    const first = chars[0], last = chars[len-1];
    const mid = chars.slice(1, len-1);
    // shuffle simple
    for (let i = mid.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [mid[i], mid[j]] = [mid[j], mid[i]];
    }
    return [first, ...mid, last];
  }

  if (pick(pSwap)){
    const idx = rndInt(0, len - 2);
    [chars[idx], chars[idx+1]] = [chars[idx+1], chars[idx]];
  }
  return chars;
}

// ---------------- Generación de fragmentos ----------------
function buildFragmentsForWord(palabra, K) {
  const parts = [];
  for (let i = 0; i < palabra.length; ) {
    // tamaño de fragmento (1/2/3)
    const r = Math.random();
    let tam = r < 0.45 ? 1 : r < 0.75 ? 2 : 3;
    tam = Math.min(tam, palabra.length - i);
    const frag = palabra.substring(i, i + tam);

    // parámetros de jitter (crecen con K)
    const tx  = rndSigned(0.45*K, 1.40*K).toFixed(2);
    const ty  = rndSigned(0.40*K, 1.10*K).toFixed(2);
    const rot = rndSigned(0.80*K, 2.00*K).toFixed(2);
    const sk  = rndSigned(0.50*K, 1.60*K).toFixed(2);
    const fx  = pick( clamp(0.04*K, 0.04, 0.15) ) ? -1 : 1;
    const blurProb = clamp(0.18*K, 0.18, 0.60);
    const blur = pick(blurProb) ? rnd(0.12*K, 0.70*K).toFixed(2) : 0;
    const dur  = Math.round(rnd(1300, 2200) / clamp(K, 1, 2.4));

    // ghosting leve
    const ghostProb = clamp(0.30*K, 0.30, 0.65);
    const gx = rndSigned(0.25*K, 0.80*K).toFixed(2);
    const gy = rndSigned(0.10*K, 0.45*K).toFixed(2);
    const sh = pick(ghostProb) ? `text-shadow:${gx}px ${gy}px 0 rgba(0,0,0,.20);` : "";

    parts.push(
      `<span class="dislexia${(parts.length % 5) + 1}" style="--tx:${tx}px;--ty:${ty}px;--rot:${rot}deg;--sk:${sk}deg;--fx:${fx};--blur:${blur}px;--dur:${dur}ms;${sh}">${frag}</span>`
    );

    i += tam;
  }

  // pequeña transposición extra (además del reorder a nivel palabra)
  if (parts.length > 1 && pick(clamp(0.18*K, 0.18, 0.45))) {
    const idx = Math.floor(Math.random() * (parts.length - 1));
    const tmp = parts[idx];
    parts[idx] = parts[idx + 1];
    parts[idx + 1] = tmp;
  }
  return parts.join("");
}

// Mutación “realista” de la palabra: reordenar + sustitución por números
function mutateWord(palabra, K){
  // separamos puntuación inicial y final para no romper signos
  const m = palabra.match(/^([(\["'¿¡]*)?(.+?)([)\].,;:!?"'…]*)?$/u);
  if (!m) return palabra;

  const prefix = m[1] || "";
  const core   = m[2] || "";
  const suffix = m[3] || "";

  // char array del core (maneja unicode con spread)
  let chars = [...core];

  // 1) sustituciones por números/homógrafos
  chars = substituteHomoglyphs(chars, K);

  // 2) reordenados (swap/shuffle)
  chars = reorderChars(chars, K);

  return prefix + chars.join("") + suffix;
}

function dividirTextoAleatorio(texto) {
  const K = getIntensity();
  const palabras = texto.split(" ");
  let resultado = "";

  palabras.forEach((palabra, indexPalabra) => {
    // mutamos primero la palabra (reordenado + números)
    const mutated = mutateWord(palabra, K);

    // Onda + crowding por palabra (pisos dependen de K)
    const wy   = rnd(1.10*K, 3.00*K).toFixed(2);
    const wdur = Math.round(rnd(1300, 2300) / clamp(K, 1, 2.2));
    const ls   = (rnd(-0.03*K, 0.12*K)).toFixed(3) + "em";

    const contenido = buildFragmentsForWord(mutated, K);
    resultado += `<span class="dysw" style="--wy:${wy}px;--wdur:${wdur}ms;--ls:${ls}">${contenido}</span>`;
    if (indexPalabra < palabras.length - 1) resultado += " ";
  });

  return resultado;
}

// ---------------- UI HTML (modal) ----------------
function crearTextoHTML() {
  injectExamStylesOnce();

  const contenedorTexto = document.createElement("div");
  contenedorTexto.id = "textoHoja";
  contenedorTexto.style.display = "none";
  contenedorTexto.setAttribute("role", "dialog");
  contenedorTexto.setAttribute("aria-modal", "true");
  contenedorTexto.style.zIndex = "10000";
  contenedorTexto.innerHTML = "";
  document.body.appendChild(contenedorTexto);
}

// ---------------- Contenido normal ----------------
function llenarContenidoExamen() {
  const c = document.getElementById("textoHoja");
  if (!c) return;

  c.innerHTML = `
    <h3>Examen de Matemáticas</h3>

    <div class="q">
      <p><strong>1. ¿Cuánto es 2 + 2?</strong></p>
      <label><input type="radio" name="pregunta1" value="3"> 3</label>
      <label><input type="radio" name="pregunta1" value="4"> 4</label>
      <label><input type="radio" name="pregunta1" value="5"> 5</label>
    </div>

    <div class="q">
      <p><strong>2. ¿Cuál es la raíz cuadrada de 9?</strong></p>
      <label><input type="radio" name="pregunta2" value="2"> 2</label>
      <label><input type="radio" name="pregunta2" value="3"> 3</label>
      <label><input type="radio" name="pregunta2" value="6"> 6</label>
    </div>

    <div class="q">
      <p><strong>3. Si 5x = 20, ¿cuánto vale x?</strong></p>
      <label><input type="radio" name="pregunta3" value="2"> 2</label>
      <label><input type="radio" name="pregunta3" value="4"> 4</label>
      <label><input type="radio" name="pregunta3" value="10"> 10</label>
    </div>

    <div class="q">
      <p><strong>4. ¿Cuál es el área de un rectángulo de 3 × 7?</strong></p>
      <label><input type="radio" name="pregunta4" value="21"> 21</label>
      <label><input type="radio" name="pregunta4" value="10"> 10</label>
      <label><input type="radio" name="pregunta4" value="30"> 30</label>
    </div>

    <div class="q">
      <p><strong>5. ¿Cuál es el valor de 2⁵?</strong></p>
      <label><input type="radio" name="pregunta5" value="16"> 16</label>
      <label><input type="radio" name="pregunta5" value="64"> 64</label>
      <label><input type="radio" name="pregunta5" value="32"> 32</label>
    </div>

    <div class="actions">
      <button class="btn btn-primary" onclick="evaluarExamen()">Evaluar</button>
      <button class="btn btn-secondary" onclick="cerrarHoja()">Cerrar</button>
    </div>
  `;
}

// ---------------- Contenido con dislexia ----------------
function llenarContenidoExamenDislexia() {
  const c = document.getElementById("textoHoja");
  if (!c) return;

  c.innerHTML = `
    <h3>${dividirTextoAleatorio("Examen de Matemáticas")}</h3>

    <div class="q">
      <p><strong>${dividirTextoAleatorio("1. ¿Cuánto es 2 + 2?")}</strong></p>
      <label><input type="radio" name="pregunta1" value="3"> ${dividirTextoAleatorio("3")}</label>
      <label><input type="radio" name="pregunta1" value="4"> ${dividirTextoAleatorio("4")}</label>
      <label><input type="radio" name="pregunta1" value="5"> ${dividirTextoAleatorio("5")}</label>
    </div>

    <div class="q">
      <p><strong>${dividirTextoAleatorio("2. ¿Cuál es la raíz cuadrada de 9?")}</strong></p>
      <label><input type="radio" name="pregunta2" value="2"> ${dividirTextoAleatorio("2")}</label>
      <label><input type="radio" name="pregunta2" value="3"> ${dividirTextoAleatorio("3")}</label>
      <label><input type="radio" name="pregunta2" value="6"> ${dividirTextoAleatorio("6")}</label>
    </div>

    <div class="q">
      <p><strong>${dividirTextoAleatorio("3. Si 5x = 20, ¿cuánto vale x?")}</strong></p>
      <label><input type="radio" name="pregunta3" value="2"> ${dividirTextoAleatorio("2")}</label>
      <label><input type="radio" name="pregunta3" value="4"> ${dividirTextoAleatorio("4")}</label>
      <label><input type="radio" name="pregunta3" value="10"> ${dividirTextoAleatorio("10")}</label>
    </div>

    <div class="q">
      <p><strong>${dividirTextoAleatorio("4. ¿Cuál es el área de un rectángulo de 3 × 7?")}</strong></p>
      <label><input type="radio" name="pregunta4" value="21"> ${dividirTextoAleatorio("21")}</label>
      <label><input type="radio" name="pregunta4" value="10"> ${dividirTextoAleatorio("10")}</label>
      <label><input type="radio" name="pregunta4" value="30"> ${dividirTextoAleatorio("30")}</label>
    </div>

    <div class="q">
      <p><strong>${dividirTextoAleatorio("5. ¿Cuál es el valor de 2⁵?")}</strong></p>
      <label><input type="radio" name="pregunta5" value="16"> ${dividirTextoAleatorio("16")}</label>
      <label><input type="radio" name="pregunta5" value="64"> ${dividirTextoAleatorio("64")}</label>
      <label><input type="radio" name="pregunta5" value="32"> ${dividirTextoAleatorio("32")}</label>
    </div>

    <div class="actions">
      <button class="btn btn-primary" onclick="evaluarExamen()">${dividirTextoAleatorio("Evaluar")}</button>
      <button class="btn btn-secondary" onclick="cerrarHoja()">${dividirTextoAleatorio("Cerrar")}</button>
    </div>
  `;
}

// ---------------- Cerrar / Evaluar ----------------
function cerrarHoja() {
  hojaVisible = false;
  if (hojaCuaderno) hojaCuaderno.visible = false;

  const c = document.getElementById("textoHoja");
  if (c) { c.innerHTML = ""; c.style.display = "none"; c.classList.remove("dyslexia-on"); }
}

function evaluarExamen() {
  const respuestasCorrectas = { pregunta1:"4", pregunta2:"3", pregunta3:"4", pregunta4:"21", pregunta5:"32" };
  let puntaje = 0, total = 5;

  for (let i = 1; i <= total; i++) {
    const sel = document.querySelector(`input[name="pregunta${i}"]:checked`);
    if (sel && sel.value === respuestasCorrectas[`pregunta${i}`]) puntaje++;
  }
  alert(`Tu puntaje: ${puntaje}/${total} (${Math.round((puntaje/total)*100)}%)`);
}

// ---------------- Setup / API ----------------
function crearExamen(escena) {
  // Hoja 3D
  hojaCuaderno = crearHojaCuaderno();
  escena.add(hojaCuaderno);

  // Contenedor HTML
  crearTextoHTML();

  // Exponer funciones para los botones HTML
  window.cerrarHoja = cerrarHoja;
  window.evaluarExamen = evaluarExamen;

  return {
    hojaCuaderno,
    hojaVisible,
    llenarContenidoExamen,
    llenarContenidoExamenDislexia,
    cerrarHoja,
    mostrarExamen: () => {
      const c = document.getElementById("textoHoja");
      if (c && c.innerHTML.trim() === "") {
        llenarContenidoExamen(); // por defecto
      }
      hojaVisible = true;
      if (hojaCuaderno) hojaCuaderno.visible = true;
      if (c) c.style.display = "block";
    },
    getHojaVisible: () => hojaVisible,
  };
}

export { crearExamen };
