import { GLTFLoader } from "../libs/GLTFLoader.js";

// --- Declarar el mixer fuera de la función de carga ---
let mixer;
const animations = {};

function crearObjetos(escena) {
  console.log("Creando objetos...");
  const loadingManager = new THREE.LoadingManager();
  const loader = new GLTFLoader(loadingManager);

  const progressBar = document.getElementById("progress-bar");
  loadingManager.onProgress = function (url, loaded, total) {
    progressBar.value = (loaded / total) * 100;
  };

  const progressBarConteiner = document.querySelector(
    ".progress-bar-container"
  );
  loadingManager.onLoad = function () {
    console.log("termino");

    progressBarConteiner.style.display = "none";

    // Reproducir sonido de campana escolar cuando terminan de cargar todos los objetos
    const schoolBell = document.getElementById("school-bell");
    const pantallaCarga = document.getElementById("pantalla-carga");

    if (schoolBell && pantallaCarga) {
      // Cambiar mensaje en la pantalla negra
      const mensaje = pantallaCarga.querySelector("div > div:first-child");
      if (mensaje) {
        mensaje.textContent = "¡Listo! Bienvenido al aula";
      }

      // Reproducir sonido de campana
      schoolBell
        .play()
        .then(() => {
          console.log("Reproduciendo campana escolar");
        })
        .catch((error) => {
          console.log("Error al reproducir audio:", error);
          // Si falla el audio, ocultar pantalla inmediatamente
          ocultarPantallaCarga();
        });

      // Esperar a que termine el audio (3 segundos) para ocultar la pantalla
      schoolBell.addEventListener("ended", ocultarPantallaCarga);

      // Fallback: si por alguna razón el evento 'ended' no se dispara
      setTimeout(ocultarPantallaCarga, 3500);
    } else {
      // Si no se encuentra el audio o la pantalla, ocultar inmediatamente
      ocultarPantallaCarga();
    }

    function ocultarPantallaCarga() {
      if (pantallaCarga && pantallaCarga.classList.contains("visible")) {
        pantallaCarga.classList.add("fade-out");
        setTimeout(() => {
          pantallaCarga.classList.remove("visible");
          pantallaCarga.classList.remove("fade-out");
          pantallaCarga.style.display = "none";
          // 👉 avisamos que la pantalla de carga ya no está
          window.dispatchEvent(new Event("ui:pantalla-carga-oculta"));
        }, 1000);
      } else {
        // Por si no estaba visible, igual avisamos
        window.dispatchEvent(new Event("ui:pantalla-carga-oculta"));
      }
    }
  };
  //   const loader = new GLTFLoader();

  /****** Cargar bancos ******/

  const colisionesBancos = [];

  const posicionesBancos = [
    [-2, 0.25, -4],
    [2, 0.25, -4], // Fila trasera
    [-2, 0.25, 0],
    [2, 0.25, 0], // Fila del medio
    [-2, 0.25, 4],
    [2, 0.25, 4], // Fila delantera
  ];

  posicionesBancos.forEach((pos) => {
    loader.load(
      "./assets/models/banco/banco/banco.gltf",
      function (gltf) {
        const banco = gltf.scene;
        banco.position.set(pos[0], pos[1], pos[2]);
        banco.scale.set(1.5, 1.5, 1.5);
        escena.add(banco);

        // Crear caja de colisión
        const caja = new THREE.Box3().setFromObject(banco);
        colisionesBancos.push(caja);
      },
      undefined,
      function (error) {
        console.error("Error cargando el banco:", error);
      }
    );
  });

  /****** Cargar Libros ******/

  const posicionesLibros = [
    [-2.2, 0.19, -2.5],
    [-0.2, 0.19, -2.5], // Fila trasera
    [-2.2, 0.19, -0.5],
    [-0.2, 0.19, -0.5], // Fila del medio
  ];

  // Cargar libros sobre cada banco
  posicionesLibros.forEach((pos) => {
    loader.load(
      "./assets/models/libro/libro.gltf", // <-- ruta a tu modelo de libro
      function (gltf) {
        const libro = gltf.scene;

        // Posición: encima del banco
        const alturaBanco = 0.25 * 1.5; // altura del banco * escala usada
        libro.position.set(
          pos[0], // X del banco
          pos[1] + alturaBanco, // Y (un poquito por encima del banco)
          pos[2] // Z del banco
        );

        // Escalar según necesites
        libro.scale.set(0.005, 0.005, 0.005);

        // Agregar a la escena
        escena.add(libro);
      },
      undefined,
      function (error) {
        console.error("Error cargando el libro:", error);
      }
    );
  });

  /****** Cargar Sillas ******/

  const posicionesSillas = [
    [-2, 0.25, -5],
    [2, 0.25, -5], // Fila trasera
    [-2, 0.25, -1],
    [2, 0.25, -1], // Fila del medio
    [-2, 0.25, 3],
    [2, 0.25, 3], // Fila delantera
  ];
  const colisionesSillas = [];

  posicionesSillas.forEach((pos) => {
    loader.load(
      "./assets/models/banco/silla/silla.gltf",
      function (gltf) {
        const silla = gltf.scene;
        silla.position.set(pos[0], pos[1], pos[2]);
        silla.scale.set(1.5, 1.5, 1.5);
        escena.add(silla);

        // Crear caja de colisión
        const caja = new THREE.Box3().setFromObject(silla);
        colisionesSillas.push(caja);
      },
      undefined,
      function (error) {
        console.error("Error cargando la silla:", error);
      }
    );
  });

  // Cargar personajes en todas las sillas
  posicionesSillas.forEach((sillaPos, index) => {
    if (index === 2) return; // salta esta silla
    loader.load(
      "assets/models/personajes/personaje1/personaje1glb.gltf",
      function (gltf) {
        // Clonar el modelo para que cada personaje sea independiente
        const personaje = gltf.scene.clone();
        // Ajustar la posición sobre la silla
        const alturaAsiento = -0.8; // ajustá según tu modelo de silla
        personaje.position.set(
          sillaPos[0] - 0.5, // X de la silla
          sillaPos[1] + alturaAsiento, // Y (altura del asiento)
          sillaPos[2] // Z de la silla
        );

        // Escala del personaje
        personaje.scale.set(3, 3, 3);

        // Rotación para mirar hacia la pizarra (180°)
        personaje.rotation.y = Math.PI + 3.1;

        // Agregar a la escena
        escena.add(personaje);
      },
      undefined,
      function (error) {
        console.error("Error cargando el personaje en la silla", index, error);
      }
    );
  });

  /****** Cargar Pizarra ******/

  // Cargar pizarra en la pared
  loader.load(
    "./assets/models/pizarra/pizarra.gltf", // <-- ruta a tu modelo descargado
    function (gltf) {
      const pizarra = gltf.scene;

      // Posición: centrada en la pared opuesta
      pizarra.position.set(0.5, 2, 9.9); // Z positivo para la pared opuesta

      // Escalar según necesites
      pizarra.scale.set(2.5, 2, 0.1); // ancho x alto x profundidad

      // Rotar 180 grados para que mire hacia el aula
      pizarra.rotation.y = Math.PI;

      escena.add(pizarra);
    },
    undefined,
    function (error) {
      console.error("Error cargando la pizarra:", error);
    }
  );

  /****** Cargar Ventana ******/

  // Cargar ventana en la pared izquierda
  loader.load(
    "./assets/models/ventana/ventana.gltf", // <-- ruta a tu modelo de ventana
    function (gltf) {
      const ventana = gltf.scene;

      // Posición: pegada a la pared izquierda
      ventana.position.set(9.9, 0, -2); // x = 9.9 (pared izquierda), y = 3 (altura), z = 0 (centro)

      // Escala (ajustá según el tamaño real de tu modelo)
      ventana.scale.set(0.02, 0.02, 0.02);

      // Rotación: girar para que "mire" hacia adentro del aula
      ventana.rotation.y = -Math.PI / 2;

      escena.add(ventana);
    },
    undefined,
    function (error) {
      console.error("Error cargando la ventana:", error);
    }
  );

  /****** Cargar Puerta ******/

  // Cargar puerta en la pared derecha
  loader.load(
    "./assets/models/puerta/puerta1.gltf", // <-- ruta a tu modelo de ventana
    function (gltf) {
      const puerta = gltf.scene;

      // Posición: pegada a la pared derecha
      puerta.position.set(-5.9, -0.6, 2); // x = 9.9 (pared derecha), y = 3 (altura), z = 0 (centro)

      // Escala (ajustá según el tamaño real de tu modelo)
      puerta.scale.set(1, 1.5, 1.5);

      escena.add(puerta);
    },
    undefined,
    function (error) {
      console.error("Error cargando la puerta:", error);
    }
  );

  // --- Modificar la función de carga ---
  loader.load(
    "assets/models/personajes/Profesor.glb",
    function (gltf) {
      const profesor = gltf.scene;

      // Posición, escala y rotación...
      profesor.position.set(-5, -2.2, 8);
      profesor.scale.set(3, 3, 3);
      profesor.rotation.y = Math.PI;

      // AÑADIR ESTE CÓDIGO 👇
      if (gltf.animations && gltf.animations.length) {
        // 1. Crear el AnimationMixer para el profesor
        mixer = new THREE.AnimationMixer(profesor);

        // 2. Iterar sobre las animaciones y guardarlas
        gltf.animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          animations[clip.name] = action;
        });
        console.log(animations);

        animations["hablando"].play();
        // animations["gritando"].stop();
        // animations["t-pose"].stop();
      }

      escena.add(profesor);
    },
    undefined,
    function (error) {
      console.error("Error cargando el profesor:", error);
    }
  );
}

export { crearObjetos, animations, mixer };
