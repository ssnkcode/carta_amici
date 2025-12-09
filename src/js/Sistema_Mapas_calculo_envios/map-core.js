console.log("🗺️ map-core.js cargado");

const MAP_CONFIG = {
    businessLocation: {
        lat: -31.342722,
        lng: -64.474847,
        address: "V. Roque Sáenz Peña, Bialet Masse, Córdoba, Argentina"
    },
    
    osrmServer: 'https://router.project-osrm.org',
    nominatimServer: 'https://nominatim.openstreetmap.org',
    
    costoPorMinuto: 500,
    
    validationMode: 'flexible',
    defaultDistanceIfNotFound: 15,
    allowedCities: [
        'villa carlos paz', 'san antonio de arredondo', 'mayu sumaj', 'icho cruz', 'cuesta blanca', 
        'tanti', 'cabalango', 'estancia vieja', 'villa santa cruz del lago', 'siquiman',
        'bialet masse', 'santa maría', 'santa maria de punilla', 'cosquín', 'cosquin', 
        'molinari', 'casa grande', 'valle hermoso', 'la falda', 'huerta grande', 
        'villa giardino', 'la cumbre', 'los cocos', 'san esteban', 'capilla del monte', 
        'charbonier', 'cruz del eje', 'deán funes'
    ],
    
    cache: new Map(),
    cacheDuration: 30 * 60 * 1000
};

function cleanAddressForSearch(texto) {
    if (!texto) return '';
    return texto
        .replace(/\b(barrio|b°|b\.|bo\.)\s+/gi, '')
        .replace(/\b(manzana|mz|mza)\s+\w+/gi, '')
        .replace(/\b(lote|lt)\s+\w+/gi, '')
        .replace(/\b(casa)\s+\w+/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function setupStaticMap() {
    const mapFrame = document.getElementById('map-frame');
    if (!mapFrame) return;
    
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
            title="Ubicación Comidas AMICI">
        </iframe>
    `;
}

async function geocodeAddress(direccion) {
    const cacheKey = `geocode:${direccion}`;
    if (MAP_CONFIG.cache.has(cacheKey)) {
        return MAP_CONFIG.cache.get(cacheKey);
    }
    
    try {
        const partes = direccion.split(',');
        const calleSucia = partes[0] || ''; 
        const ciudad = extractCityFromAddress(direccion) || '';
        
        const calleLimpia = cleanAddressForSearch(calleSucia);
        
        const consultas = [];
        
        if (calleLimpia && ciudad) {
            consultas.push({
                q: `${calleLimpia}, ${ciudad}, Córdoba, Argentina`,
                tipo: 'exacta'
            });
        }
        
        if (calleLimpia && ciudad && /\d+/.test(calleLimpia)) {
            const calleSinNumero = calleLimpia.replace(/\d+/g, '').trim();
            consultas.push({
                q: `${calleSinNumero}, ${ciudad}, Córdoba, Argentina`,
                tipo: 'calle_aproximada'
            });
        }

        if (ciudad) {
            consultas.push({
                q: `${ciudad}, Córdoba, Argentina`,
                tipo: 'ciudad'
            });
        }
        
        for (const consulta of consultas) {
            const url = `${MAP_CONFIG.nominatimServer}/search?` +
                       `q=${encodeURIComponent(consulta.q)}` +
                       `&format=json&limit=1&addressdetails=1`;
            
            const response = await fetch(url, {
                headers: { 'User-Agent': 'ComidasAMICI-Delivery/1.0' }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    const resultado = parseGeocodingResult(data[0]);
                    
                    if (consulta.tipo !== 'exacta') {
                        resultado.esAproximado = true;
                        resultado.mensajeNota = consulta.tipo === 'ciudad' 
                            ? "Dirección no encontrada. Calculando al centro de la ciudad." 
                            : "Altura no encontrada. Calculando a la calle.";
                    }
                    
                    MAP_CONFIG.cache.set(cacheKey, resultado);
                    return resultado;
                }
            }
        }
        
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
                esPorDefecto: true,
                mensajeNota: "Ubicación no encontrada en mapa. Usando referencia de ciudad."
            };
            
            MAP_CONFIG.cache.set(cacheKey, resultado);
            return resultado;
        }
        
        return null;
        
    } catch (error) {
        console.error(error);
        return null;
    }
}

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

function getDefaultCoordinatesForCity(ciudad) {
    const ciudades = {
        'villa carlos paz': { lat: -31.4208, lng: -64.4992 },
        'san antonio de arredondo': { lat: -31.4806, lng: -64.5222 },
        'mayu sumaj': { lat: -31.4950, lng: -64.5317 },
        'icho cruz': { lat: -31.4889, lng: -64.5494 },
        'cuesta blanca': { lat: -31.4933, lng: -64.5686 },
        'tanti': { lat: -31.3533, lng: -64.5906 },
        'cabalango': { lat: -31.3917, lng: -64.5611 },
        'estancia vieja': { lat: -31.3789, lng: -64.5233 },
        'villa santa cruz del lago': { lat: -31.3856, lng: -64.5097 },
        'siquiman': { lat: -31.3667, lng: -64.4833 },
        'villa parque siquiman': { lat: -31.3667, lng: -64.4833 },
        'bialet masse': { lat: -31.3427, lng: -64.4748 },
        'santa maría': { lat: -31.3000, lng: -64.4667 },
        'santa maría de punilla': { lat: -31.3000, lng: -64.4667 },
        'cosquín': { lat: -31.2417, lng: -64.4706 },
        'molinari': { lat: -31.2050, lng: -64.4750 },
        'casa grande': { lat: -31.1833, lng: -64.4783 },
        'valle hermoso': { lat: -31.1167, lng: -64.4833 },
        'la falda': { lat: -31.0833, lng: -64.4833 },
        'huerta grande': { lat: -31.0500, lng: -64.4917 },
        'villa giardino': { lat: -31.0333, lng: -64.4950 },
        'la cumbre': { lat: -30.9833, lng: -64.4917 },
        'los cocos': { lat: -30.9250, lng: -64.5000 },
        'san esteban': { lat: -30.9167, lng: -64.5333 },
        'capilla del monte': { lat: -30.8500, lng: -64.5333 },
        'charbonier': { lat: -30.7667, lng: -64.5500 },
        'cruz del eje': { lat: -30.7167, lng: -64.8000 },
        'deán funes': { lat: -30.4333, lng: -64.3500 },
        'córdoba': { lat: -31.4201, lng: -64.1888 }
    };
    
    const ciudadLower = ciudad.toLowerCase();
    
    for (const key in ciudades) {
        if (ciudadLower.includes(key) || key.includes(ciudadLower)) {
            return ciudades[key];
        }
    }
    
    return null;
}

async function calculateRoute(origen, destino) {
    const cacheKey = `route:${origen.lat},${origen.lng}-${destino.lat},${destino.lng}`;
    if (MAP_CONFIG.cache.has(cacheKey)) return MAP_CONFIG.cache.get(cacheKey);
    
    if (destino.esPorDefecto) {
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
            return resultado;
        }
        
        return calculateEstimatedDistance(origen, destino);
        
    } catch (error) {
        return calculateEstimatedDistance(origen, destino);
    }
}

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
    
    const factorCorreccion = 1.4;
    const distanciaEstimada = distanciaLineaRecta * factorCorreccion;
    const velocidadPromedio = 11.11; 
    const tiempoEstimado = distanciaEstimada / velocidadPromedio;
    
    const resultado = {
        distancia: Math.round(distanciaEstimada),
        duracion: Math.round(tiempoEstimado),
        distanciaKm: (distanciaEstimada / 1000).toFixed(2),
        duracionMinutos: Math.ceil(tiempoEstimado / 60),
        esExacto: false,
        esEstimado: true
    };
    
    return resultado;
}

function generarUrlUbicacion() {
    const calle = document.getElementById('customer-street')?.value.trim() || '';
    const numero = document.getElementById('customer-number')?.value.trim() || '';
    const barrio = document.getElementById('customer-neighborhood')?.value.trim() || '';
    const ciudad = document.getElementById('customer-city')?.value.trim() || '';
    
    if (!calle || !numero || !ciudad) {
        return null;
    }
    
    let direccionParaMapa = `${calle}+${numero}`;
    if (barrio) direccionParaMapa += `,+${barrio}`;
    direccionParaMapa += `,+${ciudad},+Córdoba,+Argentina`;
    
    direccionParaMapa = direccionParaMapa
        .replace(/\s+/g, '+')
        .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
        .replace(/[áéíóúÁÉÍÓÚ]/g, m => 'aeiouAEIOU'['áéíóúÁÉÍÓÚ'.indexOf(m)]);
    
    const urlGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionParaMapa)}`;
    
    const direccionTexto = `${calle} ${numero}${barrio ? ', ' + barrio : ''}, ${ciudad}, Córdoba, Argentina`
        .replace(/, ,/g, ',')
        .replace(/^\s*,\s*|\s*,\s*$/g, '');
    
    return {
        googleMaps: urlGoogleMaps,
        direccionTexto: direccionTexto,
        direccionCorta: `${calle} ${numero}, ${ciudad}`
    };
}

window.MAP_CONFIG = MAP_CONFIG;
window.setupStaticMap = setupStaticMap;
window.geocodeAddress = geocodeAddress;
window.parseGeocodingResult = parseGeocodingResult;
window.getDefaultCoordinatesForCity = getDefaultCoordinatesForCity;
window.calculateRoute = calculateRoute;
window.calculateEstimatedDistance = calculateEstimatedDistance;
window.generarUrlUbicacion = generarUrlUbicacion;
window.cleanAddressForSearch = cleanAddressForSearch;