// Variables para controlar si la hoja está visible
let hojaVisible = false;
let hojaCuaderno = null;

// Crear la hoja de cuaderno (inicialmente invisible)
function crearHojaCuaderno() {
  const geometriaHoja = new THREE.PlaneGeometry(3, 4); // Tamaño de hoja
  const materialHoja = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  });

  hojaCuaderno = new THREE.Mesh(geometriaHoja, materialHoja);
  hojaCuaderno.position.set(0, 1, -1.5); // Frente a la cámara
  hojaCuaderno.visible = false; // Inicialmente invisible
  return hojaCuaderno;
}

// Función para dividir texto aleatoriamente
function dividirTextoAleatorio(texto) {
  const palabras = texto.split(' ');
  let resultado = '';

  palabras.forEach((palabra, indexPalabra) => {
    let i = 0;
    let spanIndex = 0;

    while (i < palabra.length) {
      // Decidir aleatoriamente el tamaño del fragmento (1, 2 o 3 caracteres)
      const tipoFragmento = Math.random();
      let tamano;

      if (tipoFragmento < 0.4) {
        tamano = 1; // 40% una letra
      } else if (tipoFragmento < 0.7) {
        tamano = 2; // 30% dos letras
      } else {
        tamano = 3; // 30% tres letras (sílaba)
      }

      // Asegurar que no excedamos la longitud de la palabra
      tamano = Math.min(tamano, palabra.length - i);

      const fragmento = palabra.substring(i, i + tamano);
      // Cambiar las clases a dislexia1, dislexia2, dislexia3, dislexia4, dislexia5
      resultado += `<span class="dislexia${(spanIndex % 5) + 1}">${fragmento}</span>`;

      i += tamano;
      spanIndex++;
    }

    // Agregar espacio entre palabras (excepto la última)
    if (indexPalabra < palabras.length - 1) {
      resultado += ' ';
    }
  });

  return resultado;
}

// Crear el elemento HTML para el texto (con contenido normal por defecto)
function crearTextoHTML() {
  const contenedorTexto = document.createElement('div');
  contenedorTexto.id = 'textoHoja';
  contenedorTexto.style.position = 'absolute';
  contenedorTexto.style.top = '50%';
  contenedorTexto.style.left = '50%';
  contenedorTexto.style.transform = 'translate(-50%, -50%)';
  contenedorTexto.style.width = '500px';
  contenedorTexto.style.height = '600px';
  contenedorTexto.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
  contenedorTexto.style.border = '2px solid #ccc';
  contenedorTexto.style.borderRadius = '10px';
  contenedorTexto.style.padding = '20px';
  contenedorTexto.style.fontFamily = 'Arial, sans-serif';
  contenedorTexto.style.fontSize = '14px';
  contenedorTexto.style.lineHeight = '1.6';
  contenedorTexto.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
  contenedorTexto.style.display = 'none'; // Inicialmente oculto
  contenedorTexto.style.zIndex = '1000';
  contenedorTexto.style.overflowY = 'auto';

  // Inicializar con contenido normal por defecto
  contenedorTexto.innerHTML = '';

  document.body.appendChild(contenedorTexto);
}

// Función para llenar el contenido del examen normal
function llenarContenidoExamen() {
  const contenedorTexto = document.getElementById('textoHoja');
  if (!contenedorTexto) return;

  // [TODO EL HTML DEL EXAMEN NORMAL - COPIADO EXACTAMENTE]
  contenedorTexto.innerHTML = `
    <h3 style="margin-top: 0; text-align: center; color: #333; margin-bottom: 25px;">Examen de Matemáticas</h3>

    <!-- Pregunta 1 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">1. ¿Cuánto es 2 + 2?</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta1" value="3" style="margin-right: 8px;">
        3
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta1" value="4" style="margin-right: 8px;">
        4
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta1" value="5" style="margin-right: 8px;">
        5
      </label>
    </div>

    <!-- Pregunta 2 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">2. ¿Cuál es la raíz cuadrada de 9?</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta2" value="2" style="margin-right: 8px;">
        2
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta2" value="3" style="margin-right: 8px;">
        3
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta2" value="6" style="margin-right: 8px;">
        6
      </label>
    </div>

    <!-- Pregunta 3 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">3. Si 5x = 20, ¿cuánto vale x?</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta3" value="2" style="margin-right: 8px;">
        2
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta3" value="4" style="margin-right: 8px;">
        4
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta3" value="10" style="margin-right: 8px;">
        10
      </label>
    </div>

    <!-- Pregunta 4 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">4. ¿Cuál es el área de un rectángulo de 3 × 7?</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta4" value="21" style="margin-right: 8px;">
        21
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta4" value="10" style="margin-right: 8px;">
        10
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta4" value="30" style="margin-right: 8px;">
        30
      </label>
    </div>

    <!-- Pregunta 5 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">5. ¿Cuál es el valor de 2⁵?</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta5" value="16" style="margin-right: 8px;">
        16
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta5" value="64" style="margin-right: 8px;">
        64
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta5" value="32" style="margin-right: 8px;">
        32
      </label>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <button onclick="evaluarExamen()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin-right: 10px; transition: background-color 0.3s;" onmouseover="this.style.backgroundColor='#218838'" onmouseout="this.style.backgroundColor='#28a745'">Evaluar</button>
      <button onclick="cerrarHoja()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; transition: background-color 0.3s;" onmouseover="this.style.backgroundColor='#0056b3'" onmouseout="this.style.backgroundColor='#007bff'">Cerrar</button>
    </div>
  `;
}

// Función para llenar el contenido del examen con dislexia
function llenarContenidoExamenDislexia() {
  const contenedorTexto = document.getElementById('textoHoja');
  if (!contenedorTexto) return;

  // [TODO EL HTML DEL EXAMEN CON DISLEXIA - COPIADO EXACTAMENTE]
  contenedorTexto.innerHTML = `
    <h3 style="margin-top: 0; text-align: center; color: #333; margin-bottom: 25px;">${dividirTextoAleatorio('Examen de Matemáticas')}</h3>

    <!-- Pregunta 1 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">${dividirTextoAleatorio('1. ¿Cuánto es 2 + 2?')}</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta1" value="3" style="margin-right: 8px;">
        ${dividirTextoAleatorio('3')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta1" value="4" style="margin-right: 8px;">
        ${dividirTextoAleatorio('4')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta1" value="5" style="margin-right: 8px;">
        ${dividirTextoAleatorio('5')}
      </label>
    </div>

    <!-- Pregunta 2 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">${dividirTextoAleatorio('2. ¿Cuál es la raíz cuadrada de 9?')}</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta2" value="2" style="margin-right: 8px;">
        ${dividirTextoAleatorio('2')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta2" value="3" style="margin-right: 8px;">
        ${dividirTextoAleatorio('3')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta2" value="6" style="margin-right: 8px;">
        ${dividirTextoAleatorio('6')}
      </label>
    </div>

    <!-- Pregunta 3 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">${dividirTextoAleatorio('3. Si 5x = 20, ¿cuánto vale x?')}</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta3" value="2" style="margin-right: 8px;">
        ${dividirTextoAleatorio('2')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta3" value="4" style="margin-right: 8px;">
        ${dividirTextoAleatorio('4')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta3" value="10" style="margin-right: 8px;">
        ${dividirTextoAleatorio('10')}
      </label>
    </div>

    <!-- Pregunta 4 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">${dividirTextoAleatorio('4. ¿Cuál es el área de un rectángulo de 3 × 7?')}</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta4" value="21" style="margin-right: 8px;">
        ${dividirTextoAleatorio('21')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta4" value="10" style="margin-right: 8px;">
        ${dividirTextoAleatorio('10')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta4" value="30" style="margin-right: 8px;">
        ${dividirTextoAleatorio('30')}
      </label>
    </div>

    <!-- Pregunta 5 -->
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p style="font-weight: bold; margin-bottom: 10px;">${dividirTextoAleatorio('5. ¿Cuál es el valor de 2⁵?')}</p>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta5" value="16" style="margin-right: 8px;">
        ${dividirTextoAleatorio('16')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta5" value="64" style="margin-right: 8px;">
        ${dividirTextoAleatorio('64')}
      </label>
      <label style="display: block; margin-bottom: 8px; cursor: pointer;">
        <input type="radio" name="pregunta5" value="32" style="margin-right: 8px;">
        ${dividirTextoAleatorio('32')}
      </label>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <button onclick="evaluarExamen()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin-right: 10px; transition: background-color 0.3s;" onmouseover="this.style.backgroundColor='#218838'" onmouseout="this.style.backgroundColor='#28a745'">${dividirTextoAleatorio('Evaluar')}</button>
      <button onclick="cerrarHoja()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; transition: background-color 0.3s;" onmouseover="this.style.backgroundColor='#0056b3'" onmouseout="this.style.backgroundColor='#007bff'">${dividirTextoAleatorio('Cerrar')}</button>
    </div>
  `;
}

// Función para cerrar la hoja y vaciar el contenido
function cerrarHoja() {
  hojaVisible = false;
  if (hojaCuaderno) hojaCuaderno.visible = false;

  // Vaciar el contenido del div
  const contenedorTexto = document.getElementById('textoHoja');
  if (contenedorTexto) {
    contenedorTexto.innerHTML = '';
    contenedorTexto.style.display = 'none';
  }
}

// Función para evaluar el examen
function evaluarExamen() {
  const respuestasCorrectas = {
    pregunta1: "4",
    pregunta2: "3",
    pregunta3: "4",
    pregunta4: "21",
    pregunta5: "32"
  };

  let puntaje = 0;
  let total = 5;

  for (let i = 1; i <= 5; i++) {
    const respuestaSeleccionada = document.querySelector(`input[name="pregunta${i}"]:checked`);
    if (respuestaSeleccionada && respuestaSeleccionada.value === respuestasCorrectas[`pregunta${i}`]) {
      puntaje++;
    }
  }

  alert(`Tu puntaje: ${puntaje}/${total} (${Math.round((puntaje/total)*100)}%)`);
}

function crearExamen(escena) {
  // Crear la hoja 3D y agregarla a la escena
  hojaCuaderno = crearHojaCuaderno();
  escena.add(hojaCuaderno);

  // Crear el contenedor HTML
  crearTextoHTML();

  // Hacer las funciones globales para los botones HTML
  window.cerrarHoja = cerrarHoja;
  window.evaluarExamen = evaluarExamen;

  return {
    hojaCuaderno,
    hojaVisible,
    llenarContenidoExamen,
    llenarContenidoExamenDislexia,
    cerrarHoja,
    mostrarExamen: () => {
      // Cargar contenido normal por defecto si el examen está vacío
      const contenedorTexto = document.getElementById('textoHoja');
      if (contenedorTexto && contenedorTexto.innerHTML.trim() === '') {
        llenarContenidoExamen();
      }
      
      hojaVisible = true;
      if (hojaCuaderno) hojaCuaderno.visible = true;
      document.getElementById('textoHoja').style.display = 'block';
    },
    getHojaVisible: () => hojaVisible
  };
}

export { crearExamen };