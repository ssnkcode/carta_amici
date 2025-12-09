// delivery-calculator.js - Cálculo de costos y envíos
console.log("💰 delivery-calculator.js cargado");

// 1. Calcular costo de envío - NUEVA LÓGICA: $500 POR MINUTO
function calculateDeliveryCost(duracionMinutos, ciudad = '') {
    const minutos = parseInt(duracionMinutos);
    
    // Verificar si la ciudad está permitida en modo flexible
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
    
    // Validar duración mínima y máxima
    if (isNaN(minutos) || minutos <= 0) {
        return { 
            costo: 500, // Mínimo de $500
            zona: "Costo mínimo",
            tiempoEstimado: "30-45 min", 
            dentroCobertura: true,
            duracionCalculada: 1
        };
    }
    
    if (minutos > 240) { // 4 horas máximo
        return { 
            costo: 0, 
            zona: "Distancia muy larga", 
            tiempoEstimado: "Consultar", 
            dentroCobertura: false, 
            mensaje: "Distancia muy extensa. Por favor consultar disponibilidad." 
        };
    }
    
    // CALCULAR COSTO: $500 por minuto
    const costoTotal = minutos * MAP_CONFIG.costoPorMinuto;
    
    // Determinar zona basada en duración
    let zona = "";
    if (minutos <= 30) {
        zona = "Zona 1: Hasta 30 min";
    } else if (minutos <= 60) {
        zona = "Zona 2: 30-60 min";
    } else if (minutos <= 90) {
        zona = "Zona 3: 60-90 min";
    } else if (minutos <= 120) {
        zona = "Zona 4: 90-120 min";
    } else if (minutos <= 180) {
        zona = "Zona 5: 120-180 min";
    } else {
        zona = "Zona 6: Más de 180 min";
    }
    
    // Calcular tiempo estimado en formato amigable
    let tiempoEstimado = "";
    if (minutos <= 30) {
        tiempoEstimado = "30-45 min";
    } else if (minutos <= 60) {
        tiempoEstimado = "45-90 min";
    } else if (minutos <= 90) {
        tiempoEstimado = "90-120 min";
    } else if (minutos <= 120) {
        tiempoEstimado = "120-150 min";
    } else if (minutos <= 180) {
        tiempoEstimado = "150-180 min";
    } else {
        tiempoEstimado = "Más de 180 min";
    }
    
    return { 
        costo: costoTotal, 
        zona: zona,
        tiempoEstimado: tiempoEstimado,
        dentroCobertura: true,
        duracionCalculada: minutos
    };
}

// 2. Función principal MEJORADA
async function calculateDeliveryFromAddress(direccionCliente) {
    console.log("🚚 Calculando envío para:", direccionCliente);
    
    const ubicacionCliente = await geocodeAddress(direccionCliente);
    
    // Si no se encuentra la dirección exacta pero es una ciudad permitida
    if (!ubicacionCliente) {
        const ciudad = extractCityFromAddress(direccionCliente);
        const ciudadLower = ciudad ? ciudad.toLowerCase() : '';
        const esCiudadPermitida = MAP_CONFIG.allowedCities.some(c => ciudadLower.includes(c));
        
        if (esCiudadPermitida && MAP_CONFIG.validationMode === 'flexible') {
            console.log("📍 Aceptando ciudad permitida en modo flexible:", ciudad);
            
            // Usar tiempo por defecto basado en la ciudad
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
                mensajeNota: "Cálculo aproximado - Dirección no encontrada exactamente"
            };
        }
        
        return {
            error: "No se pudo encontrar la dirección exacta. Intenta con formato: 'Calle Número, Ciudad'",
            costo: 0,
            dentroCobertura: false,
            sugerencia: "Ejemplo: 'San Martín 500, Santa María, Córdoba'"
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
        esAproximado: ubicacionCliente.esAproximado || false
    };
}

// 2.1 Función auxiliar para tiempo por defecto por ciudad
function getDefaultTimeForCity(ciudad) {
    const tiempos = {
        'santa maría': 45,   // 45 minutos
        'cosquín': 60,       // 1 hora
        'la falda': 90,      // 1.5 horas
        'capilla del monte': 120, // 2 horas
        'bialet masse': 15,  // 15 minutos
        'cruz del eje': 150, // 2.5 horas
        'deán funes': 180    // 3 horas
    };
    
    const ciudadLower = ciudad.toLowerCase();
    return tiempos[ciudadLower] || 60; // 1 hora por defecto
}

// 2.2 Función auxiliar para distancia por defecto por ciudad
function getDefaultDistanceForCity(ciudad) {
    const distancias = {
        'santa maría': 5,   // 5 km
        'cosquín': 15,      // 15 km
        'la falda': 25,     // 25 km
        'capilla del monte': 40, // 40 km
        'bialet masse': 2,  // 2 km
        'cruz del eje': 60, // 60 km
        'deán funes': 80    // 80 km
    };
    
    const ciudadLower = ciudad.toLowerCase();
    return distancias[ciudadLower] || 15; // 15 km por defecto
}

// Exportar funciones
window.calculateDeliveryCost = calculateDeliveryCost;
window.calculateDeliveryFromAddress = calculateDeliveryFromAddress;
window.getDefaultTimeForCity = getDefaultTimeForCity;
window.getDefaultDistanceForCity = getDefaultDistanceForCity;