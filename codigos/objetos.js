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

  // Variables para swap del profesor <-> monstruo3
  let profesorGLTF = null; // almacenará el GLTF original del profesor
  let profesorActivo = null; // referencia a la instancia actualmente en escena
  let profesorSwapTimeout = null; // timeout id para programar swaps
  let profesorReemplazado = false; // flag si actualmente está reemplazado
  // Scheduler compartido para monstruo2 / monstruo3
  let sharedSpawnTimeout = null;

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

          // Auto-eliminar después de un tiempo (ej. 4.5s)
          window.monstruo2RemoveTimeout = setTimeout(() => {
            eliminarMonstruo2();
            // reprogramar usando el scheduler compartido
            scheduleSharedSpawn();
          }, 4500);

        },
        undefined,
        function (err) {
          console.error('[Monstruo2] Error cargando:', err);
            // Si falla la carga, reintentar más tarde con el scheduler compartido
            scheduleSharedSpawn();
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

      // === MONSTRUO4: aparece repetidamente entre 8 y 12s, posición fija y anima 'animation.001' ===
      function crearMonstruo4() {
        if (window.monstruo4Actual) return;

        loader.load('assets/models/personajes/monstruo4/monstruo4.gltf', function(gltf) {
          const m4 = gltf.scene;

          // Posición solicitada
          m4.position.set(-2.2, 0.4, -0.2);
          m4.rotation.y = Math.PI; // mirar hacia el otro lado, igual que monstruo2
          m4.scale.set(0.2, 0.2, 0.2);

          // Animaciones: imitar la estructura de monstruo2 pero reproducir 'animation.001' en LoopOnce
          if (gltf.animations && gltf.animations.length) {
            const m4Mixer = new THREE.AnimationMixer(m4);
            const m4Animations = {};

            gltf.animations.forEach((clip) => {
              const action = m4Mixer.clipAction(clip);
              m4Animations[clip.name] = action;
            });

            // Preferir 'animation.001', fallback a la primera animación
            const clipName = 'animation.001';
            if (m4Animations[clipName]) {
              m4Animations[clipName].setLoop(THREE.LoopOnce);
              m4Animations[clipName].clampWhenFinished = true;
              m4Animations[clipName].play();
            } else if (gltf.animations[0]) {
              const first = gltf.animations[0];
              const action = m4Mixer.clipAction(first);
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true;
              action.play();
            }

            window.monstruo4Mixer = m4Mixer;
          }

          m4.traverse((child) => {
            if (child.isMesh) child.frustumCulled = false;
          });

          window.monstruo4Actual = m4;
          escena.add(m4);

          // Cuando termina la animación, eliminar y reprogramar
          if (window.monstruo4Mixer) {
            const onFinished = (e) => {
              try { window.monstruo4Mixer.removeEventListener('finished', onFinished); } catch (er) {}
              eliminarMonstruo4();
              // usar scheduler compartido para la próxima aparición
              scheduleSharedSpawn();
            };
            window.monstruo4Mixer.addEventListener('finished', onFinished);
          } else {
            // Fallback: auto-eliminar tras 4.5s y reprogramar el scheduler compartido
            window.monstruo4RemoveTimeout = setTimeout(() => {
              eliminarMonstruo4();
              scheduleSharedSpawn();
            }, 4500);
          }

        }, undefined, function(err) {
          console.error('[Monstruo4] Error cargando:', err);
          // reprogramar usando el scheduler compartido
          scheduleSharedSpawn();
        });
      }

      function eliminarMonstruo4() {
        if (window.monstruo4Actual) {
          try { escena.remove(window.monstruo4Actual); } catch (e) {}
          window.monstruo4Actual = null;
        }
        if (window.monstruo4Mixer) {
          window.monstruo4Mixer = null;
        }
        if (window.monstruo4RemoveTimeout) {
          clearTimeout(window.monstruo4RemoveTimeout);
          window.monstruo4RemoveTimeout = null;
        }
      }

      // (NOTE) scheduler de monstruo4 eliminado: ahora participa en el scheduler compartido
    // Scheduler: programa la próxima aparición en un tiempo aleatorio entre 10 y 40 segundos
    function scheduleMonstruo2() {
      // limpiar si ya hay uno programado
      if (window.monstruo2Timeout) {
        clearTimeout(window.monstruo2Timeout);
      }
  const delay = 10000 + Math.floor(Math.random() * 10001); // 10000..30000 ms
      console.log('[Monstruo2] Programada próxima aparición en', (delay / 1000).toFixed(1), 's');
      window.monstruo2Timeout = setTimeout(() => {
        crearMonstruo2();
      }, delay);
    }

    // Scheduler compartido: elige aleatoriamente entre crearMonstruo2 o swapProfesorPorMonstruo3
    function scheduleSharedSpawn() {
      // limpiar si ya hay uno programado
      if (sharedSpawnTimeout) {
        clearTimeout(sharedSpawnTimeout);
        sharedSpawnTimeout = null;
      }
  // intervalo aleatorio entre 8 y 30s (ahora incluye monstruo4)
  const delay = 8000 + Math.floor(Math.random() * 22001); // 8000..30000 ms
  console.log('[SharedSpawn] Programada próxima aparición en', (delay / 1000).toFixed(1), 's');
      sharedSpawnTimeout = setTimeout(() => {
        // Solo ejecutar si esquizofrenia ON y Mario seleccionado
        if (!esquizofreniaOn || personajeSeleccionado !== 'Mario') {
          // reprogramar
          scheduleSharedSpawn();
          return;
        }

        // Elegir aleatoriamente entre monstruo2, monstruo3 y monstruo4 (≈1/3 cada uno)
        const r = Math.random();
        if (r < 1 / 3) {
          crearMonstruo2();
        } else if (r < 2 / 3) {
          swapProfesorPorMonstruo3();
        } else {
          crearMonstruo4();
        }
        // No programamos aquí; cada flujo (eliminación o fin de animación)
        // llamará a scheduleSharedSpawn() para continuar el ciclo.
      }, delay);
    }

    function cancelScheduleSharedSpawn() {
      if (sharedSpawnTimeout) {
        clearTimeout(sharedSpawnTimeout);
        sharedSpawnTimeout = null;
      }
      // cancelar schedulers individuales
      if (profesorSwapTimeout) {
        clearTimeout(profesorSwapTimeout);
        profesorSwapTimeout = null;
      }
      if (window.monstruo2Timeout) {
        clearTimeout(window.monstruo2Timeout);
        window.monstruo2Timeout = null;
      }
      // limpiar timeouts activos de monstruos
      if (window.monstruo2RemoveTimeout) {
        clearTimeout(window.monstruo2RemoveTimeout);
        window.monstruo2RemoveTimeout = null;
      }
      if (window.monstruo4RemoveTimeout) {
        clearTimeout(window.monstruo4RemoveTimeout);
        window.monstruo4RemoveTimeout = null;
      }
      // (sin estado de monstruo4 — scheduler sólo maneja monstruo2 y monstruo3)
      // restaurar profesor si fue reemplazado
      if (profesorReemplazado) restoreProfesor();
      // eliminar monstruo2 si existe
      if (window.monstruo2Actual) eliminarMonstruo2(false);
      // eliminar monstruo4 si existe
      if (window.monstruo4Actual) eliminarMonstruo4();
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

    // --- Swap Profesor <-> Monstruo3 (solo si Mario seleccionado y esquizofrenia ON)
    function scheduleProfesorSwap() {
      // limpiar si ya hay uno programado
      if (profesorSwapTimeout) {
        clearTimeout(profesorSwapTimeout);
        profesorSwapTimeout = null;
      }
      // intervalo aleatorio entre 15 y 30s
      const delay = 15000 + Math.floor(Math.random() * 15001); // 15000..30000 ms
      profesorSwapTimeout = setTimeout(() => {
        if (esquizofreniaOn && personajeSeleccionado === 'Mario') {
          swapProfesorPorMonstruo3();
        } else {
          // si ya no corresponde, reprogramar
          scheduleProfesorSwap();
        }
      }, delay);
    }

    function cancelScheduleProfesorSwap() {
      if (profesorSwapTimeout) {
        clearTimeout(profesorSwapTimeout);
        profesorSwapTimeout = null;
      }
      // Si el profesor fue reemplazado, restaurarlo inmediatamente
      if (profesorReemplazado) {
        restoreProfesor();
      }
    }

    function swapProfesorPorMonstruo3() {
      if (!profesorGLTF || profesorReemplazado || !profesorActivo) return;
      // Remover profesor de la escena
      try {
        escena.remove(profesorActivo);
      } catch (e) {}
      profesorReemplazado = true;

      // Cargar monstruo3 y reproducir animación 'Idle' (LoopOnce)
      loader.load('assets/models/personajes/monstruo3/monstruo3.gltf', function(gltf) {
        const m3 = gltf.scene;
        // Posicionar igual que el profesor
        try {
          m3.position.copy(profesorGLTF.scene.position);
          m3.rotation.copy(profesorGLTF.scene.rotation);
          m3.scale.copy(profesorGLTF.scene.scale);
        } catch (e) {
          // si falla, dejar defaults
        }

        // Animaciones
        let m3Mixer = null;
        if (gltf.animations && gltf.animations.length) {
          m3Mixer = new THREE.AnimationMixer(m3);
          const idleClip = gltf.animations.find(c => c.name === 'Idle') || gltf.animations[0];
          if (idleClip) {
            const action = m3Mixer.clipAction(idleClip);
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.play();
          }
          window.monstruo3Mixer = m3Mixer;
        }

        m3.traverse(child => { if (child.isMesh) child.frustumCulled = false; });
        window.monstruo3Actual = m3;
        escena.add(m3);

        // Esperar a que termine la animación usando el evento 'finished' del mixer
        if (m3Mixer) {
          const onFinished = (e) => {
            // Eliminar listener y la malla
            try { m3Mixer.removeEventListener('finished', onFinished); } catch (er) {}
            try { escena.remove(m3); } catch (er) {}
            window.monstruo3Actual = null;
            window.monstruo3Mixer = null;
            // Restaurar profesor
            restoreProfesor();
            // Programar siguiente aparición usando el scheduler compartido
            scheduleSharedSpawn();
          };
          m3Mixer.addEventListener('finished', onFinished);
        } else {
          // Si no hay mixer, restaurar después de 5s
          setTimeout(() => {
            try { escena.remove(m3); } catch (er) {}
            window.monstruo3Actual = null;
            restoreProfesor();
            scheduleSharedSpawn();
          }, 5000);
        }

      }, undefined, function(err){
        console.error('[ProfesorSwap] Error cargando monstruo3:', err);
        profesorReemplazado = false;
  // Reprogramar (usar scheduler compartido)
  scheduleSharedSpawn();
      });
    }

    function restoreProfesor() {
      if (!profesorGLTF) return;
      // Limpiar animaciones actuales
      try {
        // eliminar propiedades previas de animations
        for (const k in animations) delete animations[k];
      } catch (e) {}

      // Re-crear mixer y acciones para el profesor
      try {
        const prof = profesorGLTF.scene;
        mixer = new THREE.AnimationMixer(prof);
        if (profesorGLTF.animations && profesorGLTF.animations.length) {
          profesorGLTF.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            animations[clip.name] = action;
          });
        }
        if (animations['hablando']) animations['hablando'].play();

        // Añadir de nuevo a la escena si no está
        try { escena.add(prof); } catch (e) {}
        profesorActivo = prof;
        profesorReemplazado = false;
      } catch (e) {
        console.error('[ProfesorSwap] Error restaurando profesor:', e);
      }
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
            // Si se activa, iniciar el scheduler compartido (ahora incluye monstruo4)
            scheduleSharedSpawn();
          } else {
            // Si se desactiva, cancelar los schedulers y limpiar cualquier estado temporal
            cancelScheduleSharedSpawn();
            // Asegurar que no queden timeouts/instancias de monstruo4
            if (window.monstruo4RemoveTimeout) { clearTimeout(window.monstruo4RemoveTimeout); window.monstruo4RemoveTimeout = null; }
            if (window.monstruo4Actual) eliminarMonstruo4();
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
  // NOTA: no cancelamos el scheduler compartido al terminar susurro3
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
      profesor.position.set(-7, -2.2, 9);
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
      // Guardar referencia al GLTF original y la instancia en escena
      profesorGLTF = gltf;
      profesorActivo = profesor;
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

  // Actualizar animación del monstruo3 (si existe)
  if (window.monstruo3Mixer) {
    window.monstruo3Mixer.update(deltaTime);
  }

  // Actualizar animación del monstruo4 (si existe)
  if (window.monstruo4Mixer) {
    window.monstruo4Mixer.update(deltaTime);
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
