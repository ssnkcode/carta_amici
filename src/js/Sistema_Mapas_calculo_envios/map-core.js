// map-core.js - Funciones principales de mapas y geolocalización
console.log("🗺️ map-core.js cargado");

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
}

// 2. Convertir dirección a coordenadas - VERSIÓN MEJORADA Y TOLERANTE
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

// 2.1 Función auxiliar para parsear resultados
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

// 2.2 Coordenadas por defecto para ciudades conocidas
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

// 3. Calcular ruta real con OSRM - VERSIÓN TOLERANTE
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

// 4. Cálculo estimado
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

// 5. FUNCIÓN PARA GENERAR URL DE UBICACIÓN DE GOOGLE MAPS
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

// Exportar funciones
window.MAP_CONFIG = MAP_CONFIG;
window.setupStaticMap = setupStaticMap;
window.geocodeAddress = geocodeAddress;
window.parseGeocodingResult = parseGeocodingResult;
window.getDefaultCoordinatesForCity = getDefaultCoordinatesForCity;
window.calculateRoute = calculateRoute;
window.calculateEstimatedDistance = calculateEstimatedDistance;
window.generarUrlUbicacion = generarUrlUbicacion;