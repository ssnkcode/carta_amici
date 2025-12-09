// map.js - Sistema de cálculo de rutas y distancia con OSM
console.log("🗺️ map.js cargado - Sistema de rutas OSM");

const MAP_CONFIG = {
    // Ubicación del negocio - Bialet Masse, Córdoba
    businessLocation: {
        lat: -31.342722,
        lng: -64.474847,
        address: "V. Roque Sáenz Peña, Bialet Masse, Córdoba, Argentina"
    },
    
    // Configuración de OSM/OSRM
    osrmServer: 'https://router.project-osrm.org',
    nominatimServer: 'https://nominatim.openstreetmap.org',
    
    // NUEVO: Costo por minuto de viaje
    costoPorMinuto: 500, // $500 por cada minuto de viaje
    
    // Configuración de validación RELAJADA para pruebas
    validationMode: 'flexible', // 'strict' o 'flexible'
    defaultDistanceIfNotFound: 15, // km si no se encuentra la dirección
    allowedCities: ['santa maría', 'cosquín', 'la falda', 'capilla del monte', 'bialet masse', 'cruz del eje', 'deán funes'],
    
    // Cache para evitar peticiones repetidas
    cache: new Map(),
    cacheDuration: 30 * 60 * 1000 // 30 minutos
};

// ============================================
// FUNCIONES PRINCIPALES - CON MEJORAS
// ============================================

// 1. Configurar mapa estático de OpenStreetMap
function setupStaticMap() {
    console.log("🗺️ Configurando mapa estático OSM...");
    
    const mapFrame = document.getElementById('map-frame');
    if (!mapFrame) {
        console.error("❌ #map-frame no encontrado");
        return;
    }
    
    const lat = MAP_CONFIG.businessLocation.lat;
    const lng = MAP_CONFIG.businessLocation.lng;
    const zoom = 13;
    
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?` +
                   `bbox=${lng-0.05},${lat-0.05},${lng+0.05},${lat+0.05}` +
                   `&layer=mapnik&marker=${lat},${lng}&zoom=${zoom}`;
    
    mapFrame.innerHTML = `
        <iframe 
            src="${osmUrl}"
            width="100%" 
            height="100%" 
            style="border:none; border-radius: 8px;"
            allowfullscreen
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Ubicación Comidas AMICI - ${MAP_CONFIG.businessLocation.address}">
        </iframe>
    `;
    
    console.log("✅ Mapa estático configurado para Bialet Masse");
    addCoverageInfo();
}

// 2. Información de zona de cobertura AMPLIADA
function addCoverageInfo() {
    const mapHeader = document.querySelector('.map-header');
    if (mapHeader) {
        const infoElement = document.createElement('div');
        infoElement.className = 'coverage-info';
        infoElement.innerHTML = `
            <div class="coverage-badge">
                <i class="fas fa-truck"></i>
                <span>Envíos en Córdoba Norte</span>
            </div>
            <p class="coverage-note">Costo de envío: $${MAP_CONFIG.costoPorMinuto} por minuto de viaje</p>
        `;
        
        const existingInfo = mapHeader.querySelector('.coverage-info');
        if (existingInfo) existingInfo.remove();
        mapHeader.appendChild(infoElement);
    }
}

// 3. Convertir dirección a coordenadas - VERSIÓN MEJORADA Y TOLERANTE
async function geocodeAddress(direccion) {
    console.log("📍 Geocodificando:", direccion);
    
    const cacheKey = `geocode:${direccion}`;
    if (MAP_CONFIG.cache.has(cacheKey)) {
        console.log("✓ Usando caché");
        return MAP_CONFIG.cache.get(cacheKey);
    }
    
    try {
        // Primero intentar con formato completo
        const url1 = `${MAP_CONFIG.nominatimServer}/search?` +
                   `q=${encodeURIComponent(direccion + ', Córdoba, Argentina')}` +
                   `&format=json&limit=1&addressdetails=1`;
        
        console.log("🔗 URL 1:", url1);
        
        const response1 = await fetch(url1, {
            headers: {
                'User-Agent': 'ComidasAMICI-Delivery/1.0',
                'Accept': 'application/json'
            }
        });
        
        if (response1.ok) {
            const data1 = await response1.json();
            if (data1 && data1.length > 0) {
                const resultado = parseGeocodingResult(data1[0]);
                MAP_CONFIG.cache.set(cacheKey, resultado);
                console.log("✅ Encontrado con Estrategia 1");
                return resultado;
            }
        }
        
        // Si falla, buscar solo la ciudad
        console.log("🔄 Intentando extraer ciudad...");
        const ciudad = extractCityFromAddress(direccion);
        
        if (ciudad) {
            console.log("🔍 Buscando ciudad:", ciudad);
            const url2 = `${MAP_CONFIG.nominatimServer}/search?` +
                       `q=${encodeURIComponent(ciudad + ', Córdoba, Argentina')}` +
                       `&format=json&limit=1&addressdetails=1`;
            
            const response2 = await fetch(url2, {
                headers: {
                    'User-Agent': 'ComidasAMICI-Delivery/1.0',
                    'Accept': 'application/json'
                }
            });
            
            if (response2.ok) {
                const data2 = await response2.json();
                if (data2 && data2.length > 0) {
                    const resultado = parseGeocodingResult(data2[0]);
                    resultado.direccionCorta = ciudad;
                    resultado.esAproximado = true;
                    MAP_CONFIG.cache.set(cacheKey, resultado);
                    console.log("✅ Ciudad encontrada (aproximada)");
                    return resultado;
                }
            }
        }
        
        // Último recurso: usar ubicación por defecto basada en la ciudad
        console.log("🔄 Usando ubicación por defecto...");
        const ciudadDefault = extractCityFromAddress(direccion) || 'Santa María';
        const defaultCoords = getDefaultCoordinatesForCity(ciudadDefault);
        
        if (defaultCoords) {
            const resultado = {
                lat: defaultCoords.lat,
                lng: defaultCoords.lng,
                direccion: direccion,
                direccionCorta: ciudadDefault,
                barrio: ciudadDefault,
                ciudad: ciudadDefault,
                tipoLugar: 'city',
                esAproximado: true,
                esPorDefecto: true
            };
            
            MAP_CONFIG.cache.set(cacheKey, resultado);
            console.log("✅ Usando coordenadas por defecto para:", ciudadDefault);
            return resultado;
        }
        
        console.warn("❌ No se pudo geocodificar la dirección");
        return null;
        
    } catch (error) {
        console.error("❌ Error en geocodificación:", error);
        return null;
    }
}

// 3.1 Función auxiliar para parsear resultados
function parseGeocodingResult(data) {
    return {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
        direccion: data.display_name,
        direccionCorta: `${data.address.road || ''} ${data.address.house_number || ''}`.trim(),
        barrio: data.address.suburb || data.address.neighbourhood || data.address.village || '',
        ciudad: data.address.city || data.address.town || data.address.municipality || 
                data.address.county || 'Córdoba',
        tipoLugar: data.type
    };
}

// 3.2 Extraer ciudad de una dirección
function extractCityFromAddress(direccion) {
    // Buscar ciudad en la dirección (último elemento después de la última coma)
    const partes = direccion.split(',').map(p => p.trim());
    
    for (let i = partes.length - 1; i >= 0; i--) {
        const parte = partes[i].toLowerCase();
        
        // Lista de ciudades conocidas
        const ciudadesConocidas = MAP_CONFIG.allowedCities;
        for (const ciudad of ciudadesConocidas) {
            if (parte.includes(ciudad)) {
                return parte.charAt(0).toUpperCase() + parte.slice(1);
            }
        }
        
        // Si es una palabra que podría ser una ciudad
        if (parte.length > 2 && !parte.match(/^\d+$/)) {
            return parte.charAt(0).toUpperCase() + parte.slice(1);
        }
    }
    
    return null;
}

// 3.3 Coordenadas por defecto para ciudades conocidas
function getDefaultCoordinatesForCity(ciudad) {
    const ciudades = {
        'santa maría': { lat: -31.3000, lng: -64.4667 },
        'cosquín': { lat: -31.2417, lng: -64.4706 },
        'la falda': { lat: -31.0833, lng: -64.4833 },
        'capilla del monte': { lat: -30.8500, lng: -64.5333 },
        'bialet masse': { lat: -31.3427, lng: -64.4748 },
        'cruz del eje': { lat: -30.7167, lng: -64.8000 },
        'deán funes': { lat: -30.4333, lng: -64.3500 },
        'valle de punilla': { lat: -31.2500, lng: -64.5000 },
        'córdoba': { lat: -31.4201, lng: -64.1888 }
    };
    
    const ciudadLower = ciudad.toLowerCase();
    return ciudades[ciudadLower] || null;
}

// 4. Calcular ruta real con OSRM - VERSIÓN TOLERANTE
async function calculateRoute(origen, destino) {
    console.log("🛣️ Calculando ruta...");
    
    const cacheKey = `route:${origen.lat},${origen.lng}-${destino.lat},${destino.lng}`;
    if (MAP_CONFIG.cache.has(cacheKey)) return MAP_CONFIG.cache.get(cacheKey);
    
    // Si es una ubicación aproximada, usar cálculo estimado
    if (destino.esAproximado || destino.esPorDefecto) {
        console.log("📏 Usando cálculo estimado para ubicación aproximada");
        return calculateEstimatedDistance(origen, destino);
    }
    
    try {
        const url = `${MAP_CONFIG.osrmServer}/route/v1/driving/` +
                   `${origen.lng},${origen.lat};${destino.lng},${destino.lat}` +
                   `?overview=simplified&alternatives=false&steps=true`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`OSRM error: ${response.status}`);
        
        const data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const ruta = data.routes[0];
            const resultado = {
                distancia: ruta.distance,
                duracion: ruta.duration,
                distanciaKm: (ruta.distance / 1000).toFixed(2),
                duracionMinutos: Math.ceil(ruta.duration / 60),
                esExacto: true,
                geometria: ruta.geometry
            };
            
            MAP_CONFIG.cache.set(cacheKey, resultado);
            console.log("✅ Ruta calculada:", resultado.distanciaKm, "km en", resultado.duracionMinutos, "min");
            return resultado;
        }
        
        return calculateEstimatedDistance(origen, destino);
        
    } catch (error) {
        console.error("❌ Error calculando ruta:", error);
        return calculateEstimatedDistance(origen, destino);
    }
}

// 5. Cálculo estimado
function calculateEstimatedDistance(origen, destino) {
    const R = 6371000;
    const φ1 = origen.lat * Math.PI / 180;
    const φ2 = destino.lat * Math.PI / 180;
    const Δφ = (destino.lat - origen.lat) * Math.PI / 180;
    const Δλ = (destino.lng - origen.lng) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanciaLineaRecta = R * c;
    
    const factorCorreccion = 1.5;
    const distanciaEstimada = distanciaLineaRecta * factorCorreccion;
    const velocidadPromedio = 8.33; // m/s = 30 km/h
    const tiempoEstimado = distanciaEstimada / velocidadPromedio;
    
    const resultado = {
        distancia: Math.round(distanciaEstimada),
        duracion: Math.round(tiempoEstimado),
        distanciaKm: (distanciaEstimada / 1000).toFixed(2),
        duracionMinutos: Math.ceil(tiempoEstimado / 60),
        esExacto: false,
        esEstimado: true
    };
    
    console.log("✅ Distancia estimada:", resultado.distanciaKm, "km en", resultado.duracionMinutos, "min");
    return resultado;
}

// 6. Calcular costo de envío - NUEVA LÓGICA: $500 POR MINUTO
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

// 7. Función principal MEJORADA
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

// 7.1 Función auxiliar para tiempo por defecto por ciudad
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

// 7.2 Función auxiliar para distancia por defecto por ciudad
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

// 8. Actualizar interfaz - MEJORADA
function updateDeliveryInfo(resultado) {
    console.log("🔄 Actualizando interfaz...");
    
    const deliveryCostElement = document.getElementById('delivery-cost');
    const totalCostElement = document.getElementById('total-cost');
    
    if (deliveryCostElement && totalCostElement) {
        if (resultado.dentroCobertura) {
            deliveryCostElement.textContent = `$${resultado.costo}`;
            deliveryCostElement.className = 'delivery-cost-ok';
            
            const subtotal = parseFloat(document.getElementById('subtotal').textContent.replace('$', '')) || 0;
            totalCostElement.textContent = `$${subtotal + resultado.costo}`;
            
            showDeliveryDetails(resultado);
            
            // Mostrar nota si es aproximado
            if (resultado.esAproximado || resultado.mensajeNota) {
                showNotification(resultado.mensajeNota || "Cálculo basado en ubicación aproximada", 'info');
            }
        } else {
            deliveryCostElement.textContent = "Consultar";
            deliveryCostElement.className = 'delivery-cost-error';
            totalCostElement.textContent = "Consultar";
            
            if (resultado.mensaje) {
                showNotification(resultado.mensaje, 'warning');
            } else if (resultado.error) {
                showNotification(resultado.error, 'error');
            }
        }
    }
    
    updateFormDeliveryInfo(resultado);
}

// 8.1 Función de notificación mejorada
function showNotification(mensaje, tipo = 'info') {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = mensaje;
        notification.className = `notification ${tipo}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    } else {
        console.warn(mensaje);
    }
}

// 9. Mostrar detalles del envío - ACTUALIZADO CON NUEVA LÓGICA
function showDeliveryDetails(resultado) {
    let detailsElement = document.getElementById('delivery-details');
    if (!detailsElement) {
        detailsElement = document.createElement('div');
        detailsElement.id = 'delivery-details';
        detailsElement.className = 'delivery-details fade-in';
        
        const orderSummary = document.querySelector('.order-summary');
        if (orderSummary) orderSummary.parentNode.insertBefore(detailsElement, orderSummary);
    }
    
    const icon = resultado.esRutaExacta ? '✓' : resultado.esAproximado ? '≈' : '~';
    let zoneClass = 'zone-out';
    const minutos = resultado.duracionCalculada || resultado.tiempo;
    
    // Determinar clase de zona basada en minutos
    if (minutos <= 30) zoneClass = 'zone-1';
    else if (minutos <= 60) zoneClass = 'zone-2';
    else if (minutos <= 90) zoneClass = 'zone-3';
    else if (minutos <= 120) zoneClass = 'zone-4';
    else if (minutos <= 180) zoneClass = 'zone-5';
    else zoneClass = 'zone-6';
    
    let infoExtra = '';
    if (resultado.esAproximado) {
        infoExtra = '<div class="approximation-note"><i class="fas fa-info-circle"></i> Cálculo aproximado</div>';
    }
    
    detailsElement.innerHTML = `
        <div class="delivery-info">
            <div class="delivery-row">
                <i class="fas fa-map-pin"></i>
                <span><strong>${resultado.direccionCliente}, ${resultado.ciudad}</strong></span>
            </div>
            <div class="delivery-row">
                <i class="fas fa-route"></i>
                <span>Distancia: <strong>${resultado.distancia} km</strong> ${icon}</span>
            </div>
            <div class="delivery-row">
                <i class="fas fa-clock"></i>
                <span>Tiempo estimado: <strong>${minutos} minutos</strong></span>
            </div>
            <div class="delivery-row">
                <i class="fas fa-truck"></i>
                <span>Envío: <strong>$${resultado.costo}</strong></span>
            </div>
            <div class="zone-indicator ${zoneClass}">
                <i class="fas ${resultado.dentroCobertura ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${resultado.zona}</span>
            </div>
            ${infoExtra}
        </div>
    `;
}

// 10. Actualizar formulario
function updateFormDeliveryInfo(resultado) {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        // Remover info anterior
        const existingInfo = document.querySelector('.delivery-time-info');
        if (existingInfo) existingInfo.remove();
        
        if (resultado.dentroCobertura) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'delivery-time-info';
            
            let notaExtra = '';
            if (resultado.esAproximado) {
                notaExtra = '<small><i class="fas fa-info-circle"></i> Cálculo aproximado</small>';
            }
            
            infoDiv.innerHTML = `
                <p>
                    <i class="fas fa-shipping-fast"></i> 
                    Tiempo estimado: <strong>${resultado.tiempo} minutos</strong> | 
                    Costo envío: <strong>$${resultado.costo}</strong>
                </p>
                ${notaExtra}
            `;
            submitBtn.parentNode.insertBefore(infoDiv, submitBtn);
        }
    }
}

// 11. VALIDACIÓN DE DIRECCIONES - MEJORADA
function setupAddressValidation() {
    console.log("🔍 Configurando validación de direcciones...");
    
    const addressFields = ['customer-street', 'customer-number', 'customer-neighborhood', 'customer-city'];
    let validationTimeout;
    
    addressFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', async function() {
                clearTimeout(validationTimeout);
                
                validationTimeout = setTimeout(async () => {
                    const calle = document.getElementById('customer-street')?.value.trim();
                    const numero = document.getElementById('customer-number')?.value.trim();
                    const barrio = document.getElementById('customer-neighborhood')?.value.trim();
                    const ciudad = document.getElementById('customer-city')?.value.trim();
                    
                    // Validación básica
                    if (!calle || !numero || !barrio || !ciudad) {
                        return;
                    }
                    
                    const direccionCompleta = `${calle} ${numero}, ${barrio}, ${ciudad}`;
                    
                    showLoadingIndicator(true);
                    try {
                        const resultado = await calculateDeliveryFromAddress(direccionCompleta);
                        updateDeliveryInfo(resultado);
                    } catch (error) {
                        console.error("Error:", error);
                        showNotification("Error al calcular envío. Intenta nuevamente.", "error");
                    } finally {
                        showLoadingIndicator(false);
                    }
                }, 800); // Tiempo reducido
            });
        }
    });
    
    console.log("✅ Validación de direcciones configurada");
}

// 12. Indicador de carga
function showLoadingIndicator(show) {
    let indicator = document.getElementById('map-loading-indicator');
    
    if (!indicator && show) {
        indicator = document.createElement('div');
        indicator.id = 'map-loading-indicator';
        indicator.className = 'loading-indicator';
        indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculando envío...';
        
        const mapFrame = document.getElementById('map-frame');
        if (mapFrame) mapFrame.parentNode.insertBefore(indicator, mapFrame.nextSibling);
    }
    
    if (indicator) indicator.style.display = show ? 'block' : 'none';
}

// ============================================
// 13. FUNCIÓN PARA GENERAR URL DE UBICACIÓN DE GOOGLE MAPS
// ============================================

function generarUrlUbicacion() {
    console.log("📍 Generando URL de Google Maps...");
    
    // Obtener datos del formulario
    const calle = document.getElementById('customer-street')?.value.trim() || '';
    const numero = document.getElementById('customer-number')?.value.trim() || '';
    const barrio = document.getElementById('customer-neighborhood')?.value.trim() || '';
    const ciudad = document.getElementById('customer-city')?.value.trim() || '';
    
    // Verificar datos mínimos
    if (!calle || !numero || !ciudad) {
        console.warn("⚠️ Faltan datos para generar ubicación");
        return null;
    }
    
    // Construir dirección para Google Maps
    let direccionParaMapa = `${calle}+${numero}`;
    if (barrio) direccionParaMapa += `,+${barrio}`;
    direccionParaMapa += `,+${ciudad},+Córdoba,+Argentina`;
    
    // Limpiar caracteres especiales
    direccionParaMapa = direccionParaMapa
        .replace(/\s+/g, '+')
        .replace(/ñ/g, 'n')
        .replace(/Ñ/g, 'N')
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/Á/g, 'A')
        .replace(/É/g, 'E')
        .replace(/Í/g, 'I')
        .replace(/Ó/g, 'O')
        .replace(/Ú/g, 'U');
    
    // Generar URL de Google Maps
    const urlGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionParaMapa)}`;
    
    // Generar texto legible
    const direccionTexto = `${calle} ${numero}${barrio ? ', ' + barrio : ''}, ${ciudad}, Córdoba, Argentina`
        .replace(/, ,/g, ',')
        .replace(/^\s*,\s*|\s*,\s*$/g, '');
    
    console.log("✅ URL de Google Maps generada:", urlGoogleMaps);
    
    return {
        googleMaps: urlGoogleMaps,
        direccionTexto: direccionTexto,
        direccionCorta: `${calle} ${numero}, ${ciudad}`
    };
}

// ============================================
// 14. INTEGRACIÓN CON FORM.JS - VERSIÓN SIMPLIFICADA SIN DUPLICADOS
// ============================================

function integrarConFormJS() {
    console.log("🔗 Integrando con form.js...");
    
    // Sobrescribir la función submitOrder de form.js
    if (typeof window.submitOrder === 'function') {
        console.log("✅ Función submitOrder encontrada, integrando...");
        
        const originalSubmitOrder = window.submitOrder;
        
        window.submitOrder = function() {
            console.log("📍 submitOrder interceptado - Agregando ubicación de Google Maps");
            
            // Generar URL de ubicación
            const ubicacion = generarUrlUbicacion();
            
            if (ubicacion) {
                console.log("✅ Ubicación generada, procesando mensaje...");
                
                // Buscar el textarea del mensaje
                const messageElement = document.getElementById('whatsapp-message');
                if (messageElement) {
                    let mensajeActual = messageElement.value || '';
                    
                    // Verificar si ya tiene la ubicación para evitar duplicados
                    const ubicacionPattern = /UBICACIÓN EN GOOGLE MAPS:.*google\.com\/maps/i;
                    
                    if (!ubicacionPattern.test(mensajeActual)) {
                        // Buscar donde agregar la ubicación (después de la dirección)
                        const lines = mensajeActual.split('\n');
                        let newMessage = '';
                        let ubicacionAgregada = false;
                        
                        for (let i = 0; i < lines.length; i++) {
                            newMessage += lines[i] + '\n';
                            
                            // Buscar la línea de dirección
                            if (!ubicacionAgregada && 
                                (lines[i].includes('DIRECCIÓN DE ENTREGA:') || 
                                 lines[i].includes('Dirección de entrega:') ||
                                 lines[i].includes('📍 *DIRECCIÓN DE ENTREGA:*'))) {
                                
                                // Agregar la ubicación después de la dirección
                                newMessage += `\n📍 *UBICACIÓN EN GOOGLE MAPS:*\n`;
                                newMessage += `${ubicacion.googleMaps}\n\n`;
                                ubicacionAgregada = true;
                                
                                // Saltar las siguientes líneas que son la dirección misma
                                i++; // línea vacía
                                if (lines[i] && lines[i].trim()) i++; // línea de calle
                                if (lines[i] && lines[i].trim()) i++; // línea de barrio/ciudad
                            }
                        }
                        
                        // Si no encontró donde insertar, agregar al final
                        if (!ubicacionAgregada) {
                            newMessage += `\n\n📍 *UBICACIÓN EN GOOGLE MAPS:*\n${ubicacion.googleMaps}\n`;
                        }
                        
                        messageElement.value = newMessage;
                        console.log("✅ Ubicación de Google Maps agregada al mensaje SIN DUPLICADOS");
                    } else {
                        console.log("ℹ️ El mensaje ya contiene ubicación, no se duplica");
                    }
                }
            }
            
            // Ejecutar la función original
            return originalSubmitOrder();
        };
        
        console.log("✅ Función submitOrder integrada exitosamente");
        
    } else {
        console.warn("⚠️ Función submitOrder no encontrada en form.js");
        integrarWhatsappDirectamente();
    }
}

// 14.1 Integración directa con botón de WhatsApp (fallback)
function integrarWhatsappDirectamente() {
    console.log("🔗 Intentando integración directa con botón WhatsApp...");
    
    const whatsappBtn = document.querySelector('.whatsapp-button, .whatsapp-submit-btn, .submit-btn');
    
    if (whatsappBtn) {
        console.log("✅ Botón WhatsApp encontrado");
        
        // Guardar el onclick original
        const originalOnClick = whatsappBtn.onclick;
        
        whatsappBtn.addEventListener('click', function(e) {
            console.log("📍 Botón WhatsApp clickeado - Agregando ubicación");
            
            // Generar ubicación antes de enviar
            const ubicacion = generarUrlUbicacion();
            
            if (ubicacion) {
                // Intentar actualizar el mensaje si existe
                const messageElement = document.getElementById('whatsapp-message');
                if (messageElement) {
                    let mensaje = messageElement.value || '';
                    
                    // Verificar si ya tiene ubicación para evitar duplicados
                    if (!mensaje.includes('google.com/maps') && !mensaje.includes('UBICACIÓN EN GOOGLE MAPS')) {
                        // Agregar ubicación al final del mensaje
                        mensaje += `\n\n📍 *UBICACIÓN EN GOOGLE MAPS:*\n${ubicacion.googleMaps}`;
                        messageElement.value = mensaje;
                        console.log("✅ Ubicación agregada al mensaje");
                    }
                }
            }
            
            // Si hay función original, ejecutarla
            if (originalOnClick) {
                return originalOnClick.call(this, e);
            }
        });
    }
}

// ============================================
// 15. INTEGRACIÓN MEJORADA SIN DUPLICADOS
// ============================================

function agregarUbicacionAlMensajeWhatsApp() {
    console.log("📍 Agregando ubicación al mensaje de WhatsApp...");
    
    const messageElement = document.getElementById('whatsapp-message');
    if (!messageElement) {
        console.warn("⚠️ No se encontró textarea de WhatsApp");
        return false;
    }
    
    // Generar ubicación
    const ubicacion = generarUrlUbicacion();
    if (!ubicacion) {
        console.warn("⚠️ No se pudo generar ubicación");
        return false;
    }
    
    let mensaje = messageElement.value || '';
    
    // VERIFICAR DUPLICADOS: Buscar si ya existe una ubicación similar
    const ubicacionExistenteRegex = /📍 \*UBICACIÓN EN GOOGLE MAPS:\*\s*\nhttps:\/\/www\.google\.com\/maps\/[^\n]*/i;
    
    if (ubicacionExistenteRegex.test(mensaje)) {
        console.log("ℹ️ Ya existe ubicación en el mensaje, reemplazando...");
        // Reemplazar la ubicación existente
        mensaje = mensaje.replace(ubicacionExistenteRegex, 
            `📍 *UBICACIÓN EN GOOGLE MAPS:*\n${ubicacion.googleMaps}`);
    } else {
        console.log("➕ Agregando nueva ubicación...");
        // Buscar el mejor lugar para insertar
        const lines = mensaje.split('\n');
        let newMessage = '';
        let ubicacionInsertada = false;
        
        for (let i = 0; i < lines.length; i++) {
            newMessage += lines[i] + '\n';
            
            // Buscar después de la dirección de entrega
            if (!ubicacionInsertada && lines[i].includes('DIRECCIÓN DE ENTREGA')) {
                // Saltar la línea actual y la siguiente (que debería ser la dirección)
                i++; // Saltar línea de dirección
                
                // Agregar la ubicación
                newMessage += `\n📍 *UBICACIÓN EN GOOGLE MAPS:*\n${ubicacion.googleMaps}\n\n`;
                ubicacionInsertada = true;
            }
        }
        
        // Si no encontró donde insertar, agregar antes del resumen de pago
        if (!ubicacionInsertada) {
            const pagoIndex = mensaje.indexOf('RESUMEN DE PAGO:');
            if (pagoIndex !== -1) {
                mensaje = mensaje.slice(0, pagoIndex) + 
                         `\n📍 *UBICACIÓN EN GOOGLE MAPS:*\n${ubicacion.googleMaps}\n\n` +
                         mensaje.slice(pagoIndex);
            } else {
                // Agregar al final como último recurso
                mensaje += `\n\n📍 *UBICACIÓN EN GOOGLE MAPS:*\n${ubicacion.googleMaps}\n`;
            }
        } else {
            mensaje = newMessage;
        }
    }
    
    messageElement.value = mensaje;
    console.log("✅ Ubicación de Google Maps agregada/actualizada SIN DUPLICADOS");
    return true;
}

// ============================================
// INICIALIZACIÓN
// ============================================

function initMapSystem() {
    console.log("🔄 Inicializando sistema de mapas...");
    
    setupStaticMap();
    
    setTimeout(() => {
        setupAddressValidation();
    }, 1000);
    
    integrateWithExistingSystem();
    
    // Integrar con form.js después de un tiempo
    setTimeout(() => {
        integrarConFormJS();
    }, 1500);
    
    console.log("✅ Sistema de mapas inicializado - Costo: $", MAP_CONFIG.costoPorMinuto, "por minuto");
}

// 16. Integración con sistema existente
function integrateWithExistingSystem() {
    console.log("🔗 Integrando con sistema existente...");
    
    if (typeof window.calculateSubtotal === 'function') {
        const originalCalculateSubtotal = window.calculateSubtotal;
        
        window.calculateSubtotal = function() {
            const subtotal = originalCalculateSubtotal();
            const deliveryElement = document.getElementById('delivery-cost');
            let deliveryCost = 500; // Default mínimo
            
            if (deliveryElement && !deliveryElement.textContent.includes('$')) {
                deliveryCost = parseInt(deliveryElement.textContent.replace('$', '')) || 500;
            }
            
            return subtotal + deliveryCost;
        };
        
        console.log("✅ calculateSubtotal integrado");
    }
    
    addDeliveryStyles();
}

// 17. Añadir estilos CSS
function addDeliveryStyles() {
    console.log("✅ Usando map.css para estilos");
    
    const mapCss = Array.from(document.styleSheets).find(sheet => 
        sheet.href && sheet.href.includes('map.css')
    );
    
    if (mapCss) {
        console.log("✅ map.css detectado");
    } else {
        console.warn("⚠️ map.css no detectado");
        createFallbackStyles();
    }
}

// 18. Estilos de respaldo - ACTUALIZADOS
function createFallbackStyles() {
    const styleId = 'map-fallback-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .delivery-details { background: #f8f9fa; border-radius: 8px; padding: 12px; margin: 15px 0; border-left: 4px solid #28a745; }
            .delivery-info { display: flex; flex-direction: column; gap: 8px; }
            .delivery-row { display: flex; align-items: center; gap: 10px; font-size: 14px; }
            .delivery-row i { color: #6c757d; width: 20px; }
            .zone-indicator { padding: 6px 12px; border-radius: 20px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; margin-top: 8px; }
            .zone-1 { background: #d4edda; color: #155724; }
            .zone-2 { background: #fff3cd; color: #856404; }
            .zone-3 { background: #f8d7da; color: #721c24; }
            .zone-4 { background: #cce5ff; color: #004085; }
            .zone-5 { background: #e6d2ff; color: #4b0082; }
            .zone-6 { background: #ffd6cc; color: #cc3300; }
            .zone-out { background: #e2e3e5; color: #383d41; }
            .delivery-cost-ok { color: #28a745; font-weight: bold; }
            .delivery-cost-error { color: #dc3545; font-weight: bold; }
            .loading-indicator { background: rgba(255,255,255,0.9); padding: 10px; border-radius: 8px; text-align: center; margin: 10px 0; }
            .fade-in { animation: fadeIn 0.3s ease-in; }
            .approximation-note { background: #e7f3ff; padding: 5px 10px; border-radius: 4px; font-size: 12px; color: #0066cc; margin-top: 8px; display: flex; align-items: center; gap: 5px; }
            .notification.info { background: #d1ecf1; border-color: #bee5eb; color: #0c5460; }
            .notification.warning { background: #fff3cd; border-color: #ffeaa7; color: #856404; }
            .notification.error { background: #f8d7da; border-color: #f5c6cb; color: #721c24; }
            .delivery-time-info .cost-formula { font-size: 12px; color: #6c757d; margin-top: 5px; }
            .whatsapp-submit-btn:hover { background: #128C7E; transform: scale(1.02); transition: all 0.2s; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `;
        document.head.appendChild(style);
    }
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

window.setupStaticMap = setupStaticMap;
window.calculateDeliveryFromAddress = calculateDeliveryFromAddress;
window.updateDeliveryInfo = updateDeliveryInfo;
window.initMapSystem = initMapSystem;
window.geocodeAddress = geocodeAddress;
window.generarUrlUbicacion = generarUrlUbicacion;
window.agregarUbicacionAlMensajeWhatsApp = agregarUbicacionAlMensajeWhatsApp;

// ============================================
// AUTO-INICIALIZACIÓN
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapSystem);
} else {
    setTimeout(initMapSystem, 500);
}

console.log("✅ Sistema de mapas listo - Costo: $", MAP_CONFIG.costoPorMinuto, "por minuto de viaje");