console.log("💰 delivery-calculator.js cargado");

function calculateDeliveryCost(duracionMinutos, ciudad = '') {
    const minutos = parseInt(duracionMinutos);
    
    if (MAP_CONFIG.validationMode === 'flexible' && ciudad) {
        const ciudadLower = ciudad.toLowerCase();
        const ciudadPermitida = MAP_CONFIG.allowedCities.some(c => ciudadLower.includes(c));
        
        if (!ciudadPermitida) {
            return { 
                costo: 0, 
                zona: "Ciudad no cubierta", 
                tiempoEstimado: "Consultar", 
                dentroCobertura: false, 
                mensaje: "Esta ciudad no está en nuestra zona de cobertura" 
            };
        }
    }
    
    if (isNaN(minutos) || minutos <= 0) {
        return { 
            costo: 500, 
            zona: "Costo mínimo",
            tiempoEstimado: "30-45 min", 
            dentroCobertura: true,
            duracionCalculada: 1
        };
    }
    
    if (minutos > 300) { 
        return { 
            costo: 0, 
            zona: "Distancia muy larga", 
            tiempoEstimado: "Consultar", 
            dentroCobertura: false, 
            mensaje: "Distancia muy extensa. Por favor consultar disponibilidad." 
        };
    }
    
    const costoTotal = minutos * MAP_CONFIG.costoPorMinuto;
    
    let zona = "";
    if (minutos <= 30) zona = "Zona 1: Hasta 30 min";
    else if (minutos <= 60) zona = "Zona 2: 30-60 min";
    else if (minutos <= 90) zona = "Zona 3: 60-90 min";
    else if (minutos <= 120) zona = "Zona 4: 90-120 min";
    else if (minutos <= 180) zona = "Zona 5: 120-180 min";
    else zona = "Zona 6: Larga Distancia";
    
    let tiempoEstimado = "";
    if (minutos <= 30) tiempoEstimado = "30-45 min";
    else if (minutos <= 60) tiempoEstimado = "45-90 min";
    else if (minutos <= 90) tiempoEstimado = "90-120 min";
    else if (minutos <= 120) tiempoEstimado = "2 - 2.5 hs";
    else tiempoEstimado = "Más de 2.5 hs";
    
    return { 
        costo: costoTotal, 
        zona: zona,
        tiempoEstimado: tiempoEstimado,
        dentroCobertura: true,
        duracionCalculada: minutos
    };
}

async function calculateDeliveryFromAddress(direccionCliente) {
    const ubicacionCliente = await geocodeAddress(direccionCliente);
    
    if (!ubicacionCliente) {
        const ciudad = extractCityFromAddress(direccionCliente);
        const ciudadLower = ciudad ? ciudad.toLowerCase() : '';
        const esCiudadPermitida = MAP_CONFIG.allowedCities.some(c => ciudadLower.includes(c));
        
        if (esCiudadPermitida && MAP_CONFIG.validationMode === 'flexible') {
            const tiempoDefault = getDefaultTimeForCity(ciudad);
            const costoEnvio = calculateDeliveryCost(tiempoDefault, ciudad);
            
            return {
                ...costoEnvio,
                distancia: getDefaultDistanceForCity(ciudad),
                tiempo: tiempoDefault,
                direccionCliente: ciudad,
                barrio: ciudad,
                ciudad: ciudad,
                esAproximado: true,
                mensajeNota: "Dirección exacta no encontrada. Costo basado en centro de la ciudad."
            };
        }
        
        return {
            error: "Dirección no encontrada. Intenta: 'Calle Número, Ciudad'",
            costo: 0,
            dentroCobertura: false,
            sugerencia: "Verifica que la ciudad esté bien escrita."
        };
    }
    
    const ruta = await calculateRoute(MAP_CONFIG.businessLocation, ubicacionCliente);
    const costoEnvio = calculateDeliveryCost(ruta.duracionMinutos, ubicacionCliente.ciudad);
    
    return {
        ...costoEnvio,
        distancia: ruta.distanciaKm,
        tiempo: ruta.duracionMinutos,
        direccionCliente: ubicacionCliente.direccionCorta || ubicacionCliente.ciudad,
        barrio: ubicacionCliente.barrio,
        ciudad: ubicacionCliente.ciudad,
        esRutaExacta: ruta.esExacto,
        esEstimado: ruta.esEstimado || false,
        esAproximado: ubicacionCliente.esAproximado || false,
        mensajeNota: ubicacionCliente.mensajeNota || null
    };
}

function getDefaultTimeForCity(ciudad) {
    const tiempos = {
        'villa carlos paz': 40,
        'san antonio de arredondo': 50,
        'mayu sumaj': 55,
        'icho cruz': 60,
        'cuesta blanca': 65,
        'tanti': 45,
        'cabalango': 40,
        'estancia vieja': 30,
        'villa santa cruz del lago': 25,
        'siquiman': 15,
        'villa parque siquiman': 15,
        'bialet masse': 10,
        'santa maría': 15,
        'santa maría de punilla': 15,
        'cosquín': 20,
        'molinari': 25,
        'casa grande': 30,
        'valle hermoso': 40,
        'la falda': 45,
        'huerta grande': 50,
        'villa giardino': 55,
        'la cumbre': 65,
        'los cocos': 75,
        'san esteban': 80,
        'capilla del monte': 90,
        'charbonier': 100,
        'cruz del eje': 120,
        'deán funes': 150
    };
    
    const ciudadLower = ciudad.toLowerCase();
    for (const key in tiempos) {
        if (ciudadLower.includes(key)) return tiempos[key];
    }
    
    return 60;
}

function getDefaultDistanceForCity(ciudad) {
    const distancias = {
        'villa carlos paz': 20,
        'san antonio de arredondo': 25,
        'mayu sumaj': 28,
        'icho cruz': 30,
        'cuesta blanca': 32,
        'tanti': 22,
        'cabalango': 18,
        'estancia vieja': 15,
        'villa santa cruz del lago': 12,
        'siquiman': 8,
        'villa parque siquiman': 8,
        'bialet masse': 3,
        'santa maría': 5,
        'santa maría de punilla': 5,
        'cosquín': 8,
        'molinari': 12,
        'casa grande': 15,
        'valle hermoso': 20,
        'la falda': 23,
        'huerta grande': 26,
        'villa giardino': 29,
        'la cumbre': 35,
        'los cocos': 40,
        'san esteban': 45,
        'capilla del monte': 50,
        'charbonier': 60,
        'cruz del eje': 80,
        'deán funes': 110
    };
    
    const ciudadLower = ciudad.toLowerCase();
    for (const key in distancias) {
        if (ciudadLower.includes(key)) return distancias[key];
    }
    
    return 20; 
}

window.calculateDeliveryCost = calculateDeliveryCost;
window.calculateDeliveryFromAddress = calculateDeliveryFromAddress;
window.getDefaultTimeForCity = getDefaultTimeForCity;
window.getDefaultDistanceForCity = getDefaultDistanceForCity;