import { GLTFLoader } from "../libs/GLTFLoader.js";
// Importar comprobador de estado de esquizofrenia (no modifica creación de monstruos)
import { isAutoOn } from "./enfermedades/esquizofrenia.js";

// Estado local/visible de si la esquizofrenia está ON — actualizado periódicamente
let esquizofreniaOn = typeof isAutoOn === 'function' ? isAutoOn() : false;
window.esquizofreniaOn = esquizofreniaOn;

// --- Declarar el mixer fuera de la función de carga ---
let mixer;
const animations = {};

// Bandera para controlar si ya sonó la campana escolar
let campanaYaSono = false;

// Función reutilizable para cargar alumnos
function cargarAlumno(loader, escena, rutaModelo, sillaPos, opciones = {}) {
  const {
    escala = [1, 1, 1],
    rotacionY = -Math.PI - 3.1,
    offsetPosicion = { x: -0.5, y: -1.8, z: 0 },
    alturaAsiento = -0.8,
  } = opciones;

  loader.load(
    rutaModelo,
    function (gltf) {
      const personaje = gltf.scene;

      // Ajustar la posición sobre la silla
      personaje.position.set(
        sillaPos[0] + offsetPosicion.x,
        sillaPos[1] + alturaAsiento + offsetPosicion.y,
        sillaPos[2] + offsetPosicion.z
      );

      // Aplicar escala
      personaje.scale.set(...escala);

      // Aplicar rotación
      personaje.rotation.y = rotacionY;

      // Configurar animaciones del alumno
      if (gltf.animations && gltf.animations.length) {
        const alumnoMixer = new THREE.AnimationMixer(personaje);
        const alumnoAnimations = {};

        gltf.animations.forEach((clip) => {
          const action = alumnoMixer.clipAction(clip);
          alumnoAnimations[clip.name] = action;
        });

        if (alumnoAnimations["sitting"]) {
          alumnoAnimations["sitting"].play();
        }

        if (!window.alumnoMixers) window.alumnoMixers = [];
        window.alumnoMixers.push(alumnoMixer);
      }

      // Desactivar frustum culling para que el personaje siempre sea visible
      personaje.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false; // Desactivar culling - siempre visible
        }
      });

      escena.add(personaje);
    },
    undefined,
    function (error) {
      console.error("Error cargando el personaje:", error);
    }
  );
}

function crearObjetos(escena, personajeSeleccionado = null) {
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

      // Solo reproducir la campana si no ha sonado antes
      if (!campanaYaSono) {
        campanaYaSono = true; // Marcar que ya sonó

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
        // Si ya sonó, ocultar pantalla inmediatamente
        ocultarPantallaCarga();
      }
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

  posicionesSillas.forEach((pos) => {
    loader.load(
      "./assets/models/banco/silla/silla.gltf",
      function (gltf) {
        const silla = gltf.scene;
        silla.position.set(pos[0], pos[1], pos[2]);
        silla.scale.set(1.5, 1.5, 1.5);
        escena.add(silla);
      },
      undefined,
      function (error) {
        console.error("Error cargando la silla:", error);
      }
    );
  });

  /****** Cargar Alumnos ******/

  // Configuración de alumnos con sus posiciones y opciones específicas
  const alumnos = [
    {
      modelo: "assets/models/personajes/alumno0/alumno0.gltf",
      sillaIndex: 0,
      opciones: {
        escala: [1, 1, 1],
        offsetPosicion: { x: -0.5, y: -1, z: -0.3 },
      },
    },
    {
      modelo: "assets/models/personajes/alumno1/alumno1.gltf",
      sillaIndex: 1,
      opciones: {
        escala: [2, 2, 2],
        offsetPosicion: { x: -0.5, y: -1, z: 0 },
      },
    },
    {
      modelo: "assets/models/personajes/alumno3/alumno3.gltf",
      sillaIndex: 3,
      opciones: {
        escala: [2, 2, 2],
        offsetPosicion: { x: -0.5, y: -1, z: -0.1 },
      },
    },
    {
      modelo: "assets/models/personajes/alumno4/alumno4.gltf",
      sillaIndex: 4,
      opciones: {
        escala: [2, 2, 2],
        offsetPosicion: { x: -0.5, y: -1, z: 0 },
      },
    },
    {
      modelo: "assets/models/personajes/alumno5/alumno5.gltf",
      sillaIndex: 5,
      opciones: {
        escala: [2, 2, 2],
        offsetPosicion: { x: -0.5, y: -1, z: 0 },
      },
    },
  ];

  // Cargar todos los alumnos usando la función reutilizable
  alumnos.forEach((alumno) => {
    if (posicionesSillas[alumno.sillaIndex]) {
      cargarAlumno(
        loader,
        escena,
        alumno.modelo,
        posicionesSillas[alumno.sillaIndex],
        alumno.opciones
      );
    }
  });

  /****** Cargar Pizarra ******/

  // Cargar pizarra en la pared
  loader.load(
    "./assets/models/pizarra/pizarra.gltf", // <-- ruta a tu modelo descargado
    function (gltf) {
      const pizarra = gltf.scene;

      // Posición: centrada en la pared opuesta
      pizarra.position.set(0, 2, 9.9); // Z positivo para la pared opuesta

      // Escalar según necesites
      pizarra.scale.set(3, 2, 0.1); // ancho x alto x profundidad

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
  // pizzarra atras
  loader.load(
    "./assets/models/BulletinBoard/bulletin_board.glb",
    function (gltf) {
      const cuadro = gltf.scene;
      cuadro.position.set(-1, 1.5, -7);
      escena.add(cuadro);
    },
    undefined,
    function (error) {
      console.error("Error cargando la pizarra de atras:", error);
    }
  );
  //luz techo
  loader.load(
    "./assets/models/luzTecho/luzTecho.glb",
    function (gltf) {
      const luzTecho = gltf.scene;
      luzTecho.position.set(0, 7.5, 0);
      luzTecho.scale.set(0.7, 0.7, 0.7);
      luzTecho.rotation.x = Math.PI;

      escena.add(luzTecho);
    },
    undefined,
    function (error) {
      console.error("Error cargando la luz del techo:", error);
    }
  );

  // libreria
  loader.load(
    "./assets/models/BookShelf/bookshelf.glb",
    function (gltf) {
      const libreria = gltf.scene;
      libreria.position.set(-5.4, -0.5, -5);
      libreria.scale.set(0.002, 0.002, 0.002);
      // libreria.rotation.z = Math.PI / 2;
      escena.add(libreria);
    },
    undefined,
    function (error) {
      console.error("Error cargando el librero:", error);
    }
  );

  // === MONSTRUO: Solo para Mario, aparece con susurro3.mp3 ===
  if (personajeSeleccionado === "Mario") {

    // Función para crear el monstruo cuando se reproduzca susurro3
    function crearMonstruo() {
      // Evitar crear múltiples monstruos
      if (window.monstruoActual) {
        return;
      }

      loader.load(
        "assets/models/personajes/monstruo/monstruo1.gltf",
        function (gltf) {
          const monstruo = gltf.scene;

          // Posición inicial: cerca de la pizarra (frente)
          const posicionInicial = { x: 0, y: -2, z: 8 }; // Cerca de la pizarra
          const posicionFinal = { x: 0, y: -2, z: -10 }; // Hacia la pared opuesta

          monstruo.position.set(
            posicionInicial.x,
            posicionInicial.y,
            posicionInicial.z
          );
          monstruo.scale.set(2, 2, 2);
          monstruo.rotation.y = Math.PI; // Mirando hacia la pared opuesta

          // Configurar animaciones del monstruo
          if (gltf.animations && gltf.animations.length) {
            const monstruoMixer = new THREE.AnimationMixer(monstruo);
            const monstruoAnimations = {};

            gltf.animations.forEach((clip) => {
              const action = monstruoMixer.clipAction(clip);
              monstruoAnimations[clip.name] = action;
            });

            // Reproducir la animación "run" en loop
            if (monstruoAnimations["run"]) {
              monstruoAnimations["run"].setLoop(THREE.LoopRepeat);
              monstruoAnimations["run"].play();
            }

            window.monstruoMixer = monstruoMixer;
          }

          // Configurar movimiento del monstruo
          const velocidad = 6; // Unidades por segundo (aumentado para más velocidad)
          const distanciaTotal = posicionInicial.z - posicionFinal.z;
          const tiempoTotal = distanciaTotal / velocidad;

          // Variables para el movimiento
          let tiempoTranscurrido = 0;
          window.monstruoMovimiento = {
            activo: true,
            posicionInicial: posicionInicial,
            posicionFinal: posicionFinal,
            tiempoTotal: tiempoTotal,
            tiempoTranscurrido: 0,
          };

          // Desactivar frustum culling
          monstruo.traverse((child) => {
            if (child.isMesh) {
              child.frustumCulled = false;
            }
          });

          window.monstruoActual = monstruo;
          escena.add(monstruo);
        },
        undefined,
        function (error) {
          console.error("Error cargando el monstruo:", error);
        }
      );
    }

    // Función para eliminar el monstruo cuando termine susurro3
    function eliminarMonstruo() {
      if (window.monstruoActual) {
        escena.remove(window.monstruoActual);
        window.monstruoActual = null;
        window.monstruoMixer = null;
        window.monstruoMovimiento = null;
      }
    }

    // === MONSTRUO2: aparece aleatoriamente cada 10-40s ===
    // Variables y funciones para monstruo2 (aparece repetidamente en posiciones aleatorias)
    function crearMonstruo2() {
      // Evitar crear si ya existe
      if (window.monstruo2Actual) return;

      loader.load(
        'assets/models/personajes/monstruo2/monstruo2.gltf',
        function (gltf) {
          const m2 = gltf.scene;

          m2.position.set(-6, -2, 5.9);
          // Girar 180 grados en Y para que mire hacia el otro lado
          m2.rotation.y = Math.PI;

          m2.scale.set(2.5, 2.5, 2.5);

          // Animaciones si existen — usar la misma lógica que el monstruo1
          if (gltf.animations && gltf.animations.length) {
            const m2Mixer = new THREE.AnimationMixer(m2);
            const m2Animations = {};

            gltf.animations.forEach((clip) => {
              const action = m2Mixer.clipAction(clip);
              m2Animations[clip.name] = action;
            });

            // Reproducir el clip específico para monstruo2 si existe
            const clipName = 'Armature|mixamo.com|Layer0';
            if (m2Animations[clipName]) {
              m2Animations[clipName].setLoop(THREE.LoopRepeat);
              m2Animations[clipName].play();
            }

            window.monstruo2Mixer = m2Mixer;
          }

          // Desactivar frustum culling
          m2.traverse((child) => {
            if (child.isMesh) child.frustumCulled = false;
          });

          window.monstruo2Actual = m2;
          escena.add(m2);

          // Reproducir grito al aparecer monstruo2 (usar elemento de audio reutilizable)
          try {
            let grito = document.getElementById('gritoMonstruo-audio');
            if (!grito) {
              grito = document.createElement('audio');
              grito.id = 'gritoMonstruo-audio';
              grito.src = 'assets/sounds/gritoMonstruo.mp3';
              // Opcional: ajustar volumen
              grito.volume = 1.0;
              document.body.appendChild(grito);
            }
            // Reiniciar y reproducir (ignore errores por política de autoplay)
            grito.currentTime = 0;
            grito.play().catch((err) => {
              console.log('[Monstruo2] Error reproduciendo grito:', err);
            });
          } catch (e) {
            console.log('[Monstruo2] No se pudo reproducir el grito:', e);
          }

          // Auto-eliminar después de un tiempo (ej. 8s) y programar siguiente aparición
          window.monstruo2RemoveTimeout = setTimeout(() => {
            eliminarMonstruo2();
            scheduleMonstruo2();
          }, 4500);

        },
        undefined,
        function (err) {
          console.error('[Monstruo2] Error cargando:', err);
          // Si falla la carga, reintentar más tarde
          scheduleMonstruo2();
        }
      );
    }

    function eliminarMonstruo2() {
      if (window.monstruo2Actual) {
        escena.remove(window.monstruo2Actual);
        window.monstruo2Actual = null;
      }
      if (window.monstruo2Mixer) {
        window.monstruo2Mixer = null;
      }
      if (window.monstruo2RemoveTimeout) {
        clearTimeout(window.monstruo2RemoveTimeout);
        window.monstruo2RemoveTimeout = null;
      }
        // Detener audio del grito si está sonando
        try {
          const grito = document.getElementById('gritoMonstruo-audio');
          if (grito) {
            grito.pause();
            grito.currentTime = 0;
          }
        } catch (e) {
          // noop
        }
    }

    // Scheduler: programa la próxima aparición en un tiempo aleatorio entre 10 y 40 segundos
    function scheduleMonstruo2() {
      // limpiar si ya hay uno programado
      if (window.monstruo2Timeout) {
        clearTimeout(window.monstruo2Timeout);
      }
  const delay = 10000 + Math.floor(Math.random() * 20001); // 10000..30000 ms
      console.log('[Monstruo2] Programada próxima aparición en', (delay / 1000).toFixed(1), 's');
      window.monstruo2Timeout = setTimeout(() => {
        crearMonstruo2();
      }, delay);
    }

    function cancelScheduleMonstruo2() {
      if (window.monstruo2Timeout) {
        clearTimeout(window.monstruo2Timeout);
        window.monstruo2Timeout = null;
      }
      if (window.monstruo2RemoveTimeout) {
        clearTimeout(window.monstruo2RemoveTimeout);
        window.monstruo2RemoveTimeout = null;
      }
      // Eliminar si está presente
      if (window.monstruo2Actual) eliminarMonstruo2();
    }

    // --- Integración con el estado de Esquizofrenia ---
    // Actualiza el estado local y decide si iniciar/pausar el scheduler
    let esquizofreniaPollInterval = null;
    function updateEsquizofreniaState() {
      const prev = esquizofreniaOn;
      const current = typeof isAutoOn === 'function' ? isAutoOn() : false;
      esquizofreniaOn = current;
      window.esquizofreniaOn = esquizofreniaOn;

      if (prev !== current) {
        if (current) {
          // Si se activa, programar próximas apariciones
          scheduleMonstruo2();
        } else {
          // Si se desactiva, cancelar scheduler y eliminar cualquier monstruo2 presente
          cancelScheduleMonstruo2();
        }
      }

      // Asegurar que exista un poll como fallback si no se disparan eventos desde el módulo
      if (esquizofreniaPollInterval === null) {
        esquizofreniaPollInterval = setInterval(() => {
          const now = typeof isAutoOn === 'function' ? isAutoOn() : false;
          if (now !== esquizofreniaOn) updateEsquizofreniaState();
        }, 1000);
      }
    }

    // Configurar eventos para susurro3.mp3
    // Intentamos encontrar el audio por diferentes métodos
    setTimeout(() => {
      // Buscar por src que contenga susurro3
      let susurro3Audio = Array.from(document.querySelectorAll("audio")).find(
        (audio) => audio.src && audio.src.includes("susurro3.mp3")
      );

      if (susurro3Audio) {
        susurro3Audio.addEventListener("play", crearMonstruo);
        susurro3Audio.addEventListener("ended", eliminarMonstruo);
      } else {
        console.warn("[Monstruo] No se encontró el audio susurro3.mp3");
        // Crear el audio si no existe y configurarlo
        susurro3Audio = document.createElement("audio");
        susurro3Audio.src = "assets/sounds/susurro3.mp3";
        susurro3Audio.addEventListener("play", crearMonstruo);
        susurro3Audio.addEventListener("ended", eliminarMonstruo);
        document.body.appendChild(susurro3Audio);
      }

  // En lugar de iniciar incondicionalmente, consultamos el estado de Esquizofrenia
  // y actuamos cuando cambie. Esto hace que monstruo2 solo aparezca si isAutoOn() está ON.
  updateEsquizofreniaState();

  // Escuchar cambios emitidos por el módulo de esquizofrenia (varias variantes de nombre)
  window.addEventListener('esquizofrenia:change', updateEsquizofreniaState);
  window.addEventListener('esquizofrenia-change', updateEsquizofreniaState);
  window.addEventListener('esquizofrenia-changed', updateEsquizofreniaState);

  // También escuchar los eventos de susurro3 que controlan monstruo1
  window.addEventListener("susurro3-start", crearMonstruo);
  window.addEventListener("susurro3-end", eliminarMonstruo);
  // Añadir listeners para limpiar scheduler si termina susurro3
  window.addEventListener('susurro3-end', cancelScheduleMonstruo2);
    }, 1000); // Delay para asegurar que el DOM esté listo
  } else {
    console.log(
      `[Objetos] NO se carga monstruo para ${
        personajeSeleccionado || "personaje no especificado"
      }. Solo para Mario (esquizofrenia).`
    );
  }

  // --- Modificar la función de carga ---
  loader.load(
    "assets/models/personajes/profesor/Profesor.glb",
    function (gltf) {
      const profesor = gltf.scene;

      // Posición, escala y rotación...
      profesor.position.set(-5, -2.2, 9);
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

        animations["hablando"].play();
        // animations["gritando"].stop();
        // animations["t-pose"].stop();
      }

      // Desactivar frustum culling para que el profesor siempre sea visible
      profesor.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false; // Desactivar culling - siempre visible
        }
      });

      escena.add(profesor);
    },
    undefined,
    function (error) {
      console.error("Error cargando el profesor:", error);
    }
  );
} // Cerrar función crearObjetos

// Función para actualizar todas las animaciones
function actualizarAnimaciones(deltaTime) {
  if (mixer) {
    mixer.update(deltaTime);
  }

  // Actualizar animaciones de los alumnos
  if (window.alumnoMixers) {
    window.alumnoMixers.forEach((alumnoMixer) => {
      alumnoMixer.update(deltaTime);
    });
  }

  // Actualizar animación del monstruo
  if (window.monstruoMixer) {
    window.monstruoMixer.update(deltaTime);
  }

  // Actualizar animación del monstruo2 (si existe)
  if (window.monstruo2Mixer) {
    window.monstruo2Mixer.update(deltaTime);
  }

  // Actualizar movimiento del monstruo
  if (
    window.monstruoMovimiento &&
    window.monstruoMovimiento.activo &&
    window.monstruoActual
  ) {
    const mov = window.monstruoMovimiento;
    mov.tiempoTranscurrido += deltaTime;

    // Calcular progreso (0 a 1)
    const progreso = Math.min(mov.tiempoTranscurrido / mov.tiempoTotal, 1);

    // Interpolación lineal para la posición Z
    const nuevaZ =
      mov.posicionInicial.z +
      (mov.posicionFinal.z - mov.posicionInicial.z) * progreso;

    // Actualizar posición del monstruo
    window.monstruoActual.position.z = nuevaZ;

    // Si llegó al final, desactivar movimiento
    if (progreso >= 1) {
      mov.activo = false;
    }
  }
}

// Función para resetear la bandera de la campana (llamar al volver al menú)
function resetearCampana() {
  campanaYaSono = false;
}

export {
  crearObjetos,
  animations,
  mixer,
  actualizarAnimaciones,
  resetearCampana,
};
