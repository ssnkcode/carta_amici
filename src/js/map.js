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
    
    // Zonas de cobertura (kilómetros) para Valle de Punilla
    coverageZones: {
        zona1: { maxKm: 10, costoFijo: 500 },    // Bialet Masse y alrededores
        zona2: { maxKm: 30, costoFijo: 1000 },   // Santa María, Cosquín, etc
        zona3: { maxKm: 50, costoFijo: 1500 },   // La Falda, Capilla del Monte
        zona4: { maxKm: 80, costoFijo: 2000 },   // Cruz del Eje, más lejos
        fueraZona: { costoFijo: 0, message: "Fuera de zona de cobertura - Consultar" }
    },
    
    // Cache para evitar peticiones repetidas
    cache: new Map(),
    cacheDuration: 30 * 60 * 1000 // 30 minutos
};

// ============================================
// FUNCIONES PRINCIPALES
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

// 2. Información de zona de cobertura
function addCoverageInfo() {
    const mapHeader = document.querySelector('.map-header');
    if (mapHeader) {
        const infoElement = document.createElement('div');
        infoElement.className = 'coverage-info';
        infoElement.innerHTML = `
            <div class="coverage-badge">
                <i class="fas fa-truck"></i>
                <span>Envíos en Valle de Punilla</span>
            </div>
            <p class="coverage-note">Bialet Masse, Santa María, Cosquín, La Falda, Capilla del Monte</p>
        `;
        
        const existingInfo = mapHeader.querySelector('.coverage-info');
        if (existingInfo) existingInfo.remove();
        mapHeader.appendChild(infoElement);
    }
}

// 3. Convertir dirección a coordenadas (GEOCODIFICACIÓN MEJORADA)
async function geocodeAddress(direccion) {
    console.log("📍 Geocodificando:", direccion);
    
    const cacheKey = `geocode:${direccion}`;
    if (MAP_CONFIG.cache.has(cacheKey)) {
        console.log("✓ Usando caché");
        return MAP_CONFIG.cache.get(cacheKey);
    }
    
    try {
        // Estrategia 1: Buscar en Argentina
        const url1 = `${MAP_CONFIG.nominatimServer}/search?` +
                   `q=${encodeURIComponent(direccion + ', Argentina')}` +
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
        
        // Estrategia 2: Buscar solo en Córdoba
        console.log("🔄 Intentando Estrategia 2...");
        const url2 = `${MAP_CONFIG.nominatimServer}/search?` +
                   `q=${encodeURIComponent(direccion)}` +
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
                
                // Verificar que esté en Córdoba
                if (resultado.ciudad.toLowerCase().includes('córdoba') || 
                    resultado.direccion.toLowerCase().includes('córdoba')) {
                    MAP_CONFIG.cache.set(cacheKey, resultado);
                    console.log("✅ Encontrado con Estrategia 2");
                    return resultado;
                }
            }
        }
        
        // Estrategia 3: Buscar solo ciudad
        const ciudadMatch = direccion.match(/,\s*([^,]+),\s*Córdoba/i);
        if (ciudadMatch) {
            const ciudad = ciudadMatch[1].trim();
            console.log("🔄 Intentando solo ciudad:", ciudad);
            
            const url3 = `${MAP_CONFIG.nominatimServer}/search?` +
                       `q=${encodeURIComponent(ciudad + ', Córdoba, Argentina')}` +
                       `&format=json&limit=1&addressdetails=1`;
            
            const response3 = await fetch(url3, {
                headers: {
                    'User-Agent': 'ComidasAMICI-Delivery/1.0',
                    'Accept': 'application/json'
                }
            });
            
            if (response3.ok) {
                const data3 = await response3.json();
                if (data3 && data3.length > 0) {
                    const resultado = parseGeocodingResult(data3[0]);
                    resultado.direccionCorta = ciudad; // Usamos solo la ciudad
                    MAP_CONFIG.cache.set(cacheKey, resultado);
                    console.log("✅ Encontrado ciudad aproximada");
                    return resultado;
                }
            }
        }
        
        console.warn("❌ No se encontró la dirección");
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

// 4. Calcular ruta real con OSRM - ¡¡¡CORREGIDO!!!
async function calculateRoute(origen, destino) {
    console.log("🛣️ Calculando ruta...");
    
    const cacheKey = `route:${origen.lat},${origen.lng}-${destino.lat},${destino.lng}`;
    if (MAP_CONFIG.cache.has(cacheKey)) return MAP_CONFIG.cache.get(cacheKey);
    
    try {
        const url = `${MAP_CONFIG.osrmServer}/route/v1/driving/` +
                   `${origen.lng},${origen.lat};${destino.lng},${destino.lat}` + // ← ¡¡¡CORREGIDO!!!
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
            console.log("✅ Ruta calculada:", resultado.distanciaKm, "km");
            return resultado;
        }
        
        return calculateEstimatedDistance(origen, destino);
        
    } catch (error) {
        console.error("❌ Error calculando ruta:", error);
        return calculateEstimatedDistance(origen, destino);
    }
}

// 5. Cálculo estimado (igual que antes)
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
    const velocidadPromedio = 8.33;
    const tiempoEstimado = distanciaEstimada / velocidadPromedio;
    
    const resultado = {
        distancia: Math.round(distanciaEstimada),
        duracion: Math.round(tiempoEstimado),
        distanciaKm: (distanciaEstimada / 1000).toFixed(2),
        duracionMinutos: Math.ceil(tiempoEstimado / 60),
        esExacto: false,
        esEstimado: true
    };
    
    console.log("✅ Distancia estimada:", resultado.distanciaKm, "km");
    return resultado;
}

// 6. Calcular costo de envío (igual que antes)
function calculateDeliveryCost(distanciaKm) {
    const km = parseFloat(distanciaKm);
    
    if (km <= 10) return { costo: 500, zona: "Zona 1: Bialet Masse (hasta 10 km)", tiempoEstimado: "30-45 min", dentroCobertura: true };
    if (km <= 30) return { costo: 1000, zona: "Zona 2: Santa María/Cosquín (10-30 km)", tiempoEstimado: "45-90 min", dentroCobertura: true };
    if (km <= 50) return { costo: 1500, zona: "Zona 3: La Falda (30-50 km)", tiempoEstimado: "90-120 min", dentroCobertura: true };
    if (km <= 80) return { costo: 2000, zona: "Zona 4: Valle Extendido (50-80 km)", tiempoEstimado: "120-150 min", dentroCobertura: true };
    
    return { costo: 0, zona: "Fuera de cobertura", tiempoEstimado: "Consultar", dentroCobertura: false, mensaje: "Dirección fuera de zona" };
}

// 7. Función principal
async function calculateDeliveryFromAddress(direccionCliente) {
    console.log("🚚 Calculando envío para:", direccionCliente);
    
    const ubicacionCliente = await geocodeAddress(direccionCliente);
    if (!ubicacionCliente) {
        return {
            error: "No se pudo encontrar la dirección. Intenta con: 'Calle, Número, Ciudad'",
            costo: 0,
            dentroCobertura: false,
            sugerencia: "Ejemplo: 'San Martín 500, Cosquín'"
        };
    }
    
    const ruta = await calculateRoute(MAP_CONFIG.businessLocation, ubicacionCliente);
    const costoEnvio = calculateDeliveryCost(ruta.distanciaKm);
    
    return {
        ...costoEnvio,
        distancia: ruta.distanciaKm,
        tiempo: ruta.duracionMinutos,
        direccionCliente: ubicacionCliente.direccionCorta || ubicacionCliente.ciudad,
        barrio: ubicacionCliente.barrio,
        ciudad: ubicacionCliente.ciudad,
        esRutaExacta: ruta.esExacto,
        esEstimado: ruta.esEstimado || false
    };
}

// 8. Actualizar interfaz
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
        } else {
            deliveryCostElement.textContent = "Consultar";
            deliveryCostElement.className = 'delivery-cost-error';
            totalCostElement.textContent = "Consultar";
            
            alert(`⚠️ ${resultado.mensaje || 'Dirección fuera de zona'}`);
        }
    }
    
    updateFormDeliveryInfo(resultado);
}

// 9. Mostrar detalles del envío
function showDeliveryDetails(resultado) {
    let detailsElement = document.getElementById('delivery-details');
    if (!detailsElement) {
        detailsElement = document.createElement('div');
        detailsElement.id = 'delivery-details';
        detailsElement.className = 'delivery-details fade-in';
        
        const orderSummary = document.querySelector('.order-summary');
        if (orderSummary) orderSummary.parentNode.insertBefore(detailsElement, orderSummary);
    }
    
    const icon = resultado.esRutaExacta ? '✓' : '≈';
    let zoneClass = 'zone-out';
    if (resultado.distancia <= 10) zoneClass = 'zone-1';
    else if (resultado.distancia <= 30) zoneClass = 'zone-2';
    else if (resultado.distancia <= 50) zoneClass = 'zone-3';
    else if (resultado.distancia <= 80) zoneClass = 'zone-4';
    
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
                <span>Tiempo: <strong>${resultado.tiempoEstimado}</strong> (${resultado.tiempo} min)</span>
            </div>
            <div class="zone-indicator ${zoneClass}">
                <i class="fas ${resultado.dentroCobertura ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${resultado.zona}</span>
            </div>
        </div>
    `;
}

// 10. Actualizar formulario
function updateFormDeliveryInfo(resultado) {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn && resultado.dentroCobertura) {
        const existingInfo = document.querySelector('.delivery-time-info');
        if (!existingInfo) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'delivery-time-info';
            infoDiv.innerHTML = `<p><i class="fas fa-shipping-fast"></i> Entrega: <strong>${resultado.tiempoEstimado}</strong></p>`;
            submitBtn.parentNode.insertBefore(infoDiv, submitBtn);
        }
    }
}

// 11. VALIDACIÓN DE DIRECCIONES (AÑADIR ESTA FUNCIÓN)
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
                    
                    if (calle && numero && barrio && ciudad) {
                        const direccionCompleta = `${calle} ${numero}, ${barrio}, ${ciudad}`;
                        
                        showLoadingIndicator(true);
                        try {
                            const resultado = await calculateDeliveryFromAddress(direccionCompleta);
                            updateDeliveryInfo(resultado);
                        } catch (error) {
                            console.error("Error:", error);
                        } finally {
                            showLoadingIndicator(false);
                        }
                    }
                }, 1000);
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
// INICIALIZACIÓN
// ============================================

function initMapSystem() {
    console.log("🔄 Inicializando sistema de mapas...");
    
    setupStaticMap();
    
    setTimeout(() => {
        setupAddressValidation();
    }, 1000);
    
    integrateWithExistingSystem();
    
    console.log("✅ Sistema de mapas inicializado");
}

// 13. Integración con sistema existente
function integrateWithExistingSystem() {
    console.log("🔗 Integrando con sistema existente...");
    
    if (typeof window.calculateSubtotal === 'function') {
        const originalCalculateSubtotal = window.calculateSubtotal;
        
        window.calculateSubtotal = function() {
            const subtotal = originalCalculateSubtotal();
            const deliveryElement = document.getElementById('delivery-cost');
            let deliveryCost = 500; // Default para zona 1
            
            if (deliveryElement && !deliveryElement.textContent.includes('$')) {
                deliveryCost = parseInt(deliveryElement.textContent.replace('$', '')) || 500;
            }
            
            return subtotal + deliveryCost;
        };
        
        console.log("✅ calculateSubtotal integrado");
    }
    
    addDeliveryStyles();
}

// 14. Añadir estilos CSS
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

// 15. Estilos de respaldo
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
            .zone-out { background: #e2e3e5; color: #383d41; }
            .delivery-cost-ok { color: #28a745; font-weight: bold; }
            .delivery-cost-error { color: #dc3545; font-weight: bold; }
            .loading-indicator { background: rgba(255,255,255,0.9); padding: 10px; border-radius: 8px; text-align: center; margin: 10px 0; }
            .fade-in { animation: fadeIn 0.3s ease-in; }
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
window.geocodeAddress = geocodeAddress; // Para debug

// ============================================
// AUTO-INICIALIZACIÓN
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapSystem);
} else {
    setTimeout(initMapSystem, 500);
}

console.log("✅ Sistema de mapas y rutas listo para Valle de Punilla");