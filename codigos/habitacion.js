function crearHabitacion(escena) {
    // Crear una caja más grande que simule una habitación con paredes de distintos colores
    const habitacionGeometry = new THREE.BoxGeometry(20, 10, 20);
    const loaderTextura = new THREE.TextureLoader();
    const texturaSuelo = loaderTextura.load('./assets/textures/suelo/Planks021_1K-JPG_Color.jpg');
    const texturaParedes = loaderTextura.load('./assets/textures/paredes/Plaster003_1K-JPG_Color.jpg');
    const texturaTecho = loaderTextura.load('./assets/textures/techo/OfficeCeiling001_1K-JPG_AmbientOcclusion.jpg');

    // Colores para cada cara: [derecha, izquierda, arriba, abajo, frente, atrás]
    const materialesHabitacion = [
        new THREE.MeshStandardMaterial({ map: texturaParedes, side: THREE.BackSide }), // derecha
        new THREE.MeshStandardMaterial({ map: texturaParedes, side: THREE.BackSide }), // izquierda
        new THREE.MeshStandardMaterial({ map: texturaTecho, side: THREE.BackSide }), // arriba (techo)
        new THREE.MeshStandardMaterial({ map: texturaSuelo, side: THREE.BackSide }), // abajo (suelo)
        new THREE.MeshStandardMaterial({ map: texturaParedes, side: THREE.BackSide }), // frente
        new THREE.MeshStandardMaterial({ map: texturaParedes, side: THREE.BackSide })  // atrás
    ];


    // Mueve la habitación para que el suelo esté en y = 0
    const habitacion = new THREE.Mesh(habitacionGeometry, materialesHabitacion);
    habitacion.position.set(0, 5 / 2, 0); // La base (suelo) queda en y = 0
    escena.add(habitacion);

    // Definir límites de la habitación (paredes internas)
    const margen = 0.5; // grosor de la "cámara"
    const limites = {
        xMin: -10 + margen,
        xMax: 10 - margen,
        yMin: 0 + margen,
        yMax: 10 - margen,
        zMin: -10 + margen,
        zMax: 10 - margen
    };
}

export { crearHabitacion };