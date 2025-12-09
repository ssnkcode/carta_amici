// form.js - VERSIÓN ACTUALIZADA CON MAPA SEPARADO Y UBICACIÓN GOOGLE MAPS

const FORM_CONFIG = {
    phonePattern: /^[0-9]{10,15}$/,
    // Nota: defaultDeliveryCost ahora será dinámico desde map.js
    defaultDeliveryCost: 300,
    businessLocation: {
        address: "Av. Roque Sáenz Peña, Córdoba Capital, Córdoba", 
        lat: -31.307277,  
        lng: -64.463337,    
        zoom: 16 
    }
};

console.log("✅ form.js cargado - Versión con mapa separado y Google Maps");

// ============================================
// CONEXIÓN CON EL CARRITO REAL
// ============================================

// 1. SINCRONIZAR CON EL CARRITO EXISTENTE
console.log("🔗 Conectando con el carrito real...");

// Verificar si selectedItems existe (la variable global real)
if (typeof selectedItems !== 'undefined') {
    // La variable selectedItems ya existe globalmente (sin window)
    console.log("✓ Carrito encontrado en variable global 'selectedItems'");
    console.log("  - Productos:", selectedItems.length);
    console.log("  - Detalles:", selectedItems.map(p => `${p.name} x${p.quantity}`));
    
    // Crear alias para compatibilidad
    window.selectedItems = selectedItems;
} else {
    console.warn("⚠️ Variable selectedItems no encontrada");
    window.selectedItems = [];
}

// 2. Función para obtener siempre el carrito actual
function getCarritoActual() {
    // Primero intentar con la variable global
    if (typeof selectedItems !== 'undefined' && Array.isArray(selectedItems)) {
        return selectedItems;
    }
    // Luego con window.selectedItems
    if (window.selectedItems && Array.isArray(window.selectedItems)) {
        return window.selectedItems;
    }
    // Finalmente con localStorage
    try {
        const saved = localStorage.getItem('deliciasExpress_selectedItems');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch(e) {}
    
    return [];
}

// ============================================
// FUNCIÓN PARA GENERAR UBICACIÓN GOOGLE MAPS
// ============================================

function generarUbicacionGoogleMaps() {
    try {
        // Obtener datos del formulario
        const calle = document.getElementById('customer-street')?.value.trim() || '';
        const numero = document.getElementById('customer-number')?.value.trim() || '';
        const barrio = document.getElementById('customer-neighborhood')?.value.trim() || '';
        const ciudad = document.getElementById('customer-city')?.value.trim() || '';
        
        if (!calle || !numero || !ciudad) {
            console.warn("⚠️ Faltan datos para generar ubicación");
            return null;
        }
        
        // Construir dirección completa
        let direccionCompleta = `${calle} ${numero}`;
        if (barrio) direccionCompleta += `, ${barrio}`;
        direccionCompleta += `, ${ciudad}, Córdoba, Argentina`;
        
        // Codificar para URL
        const direccionCodificada = encodeURIComponent(direccionCompleta);
        
        // Generar URL de Google Maps
        const urlGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${direccionCodificada}`;
        
        console.log("📍 Ubicación de Google Maps generada:", urlGoogleMaps);
        
        return {
            texto: `📍 *UBICACIÓN EN GOOGLE MAPS:*\n${urlGoogleMaps}`,
            url: urlGoogleMaps,
            direccion: direccionCompleta
        };
        
    } catch (error) {
        console.error("❌ Error generando ubicación:", error);
        return null;
    }
}

// ============================================
// FUNCIONES PRINCIPALES (SIMPLIFICADAS)
// ============================================

// Configurar mapa (ahora usa función de map.js)
function setupMap() {
    console.log("🗺️ Configurando mapa a través de map.js...");
    
    // Si map.js está cargado, usar su función
    if (typeof window.setupStaticMap === 'function') {
        window.setupStaticMap();
    } else {
        console.warn("⚠️ map.js no cargado, usando fallback");
        setupMapFallback();
    }
}

// Fallback si map.js no se carga
function setupMapFallback() {
    const mapFrame = document.getElementById('map-frame');
    if (!mapFrame) return;
    
    const lat = FORM_CONFIG.businessLocation.lat;
    const lng = FORM_CONFIG.businessLocation.lng;
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.003},${lat-0.003},${lng+0.003},${lat+0.003}&layer=mapnik&marker=${lat},${lng}`;
    
    mapFrame.innerHTML = `
        <iframe 
            src="${osmUrl}"
            width="100%" 
            height="100%" 
            style="border:none;"
            allowfullscreen
            loading="lazy"
            title="Comidas AMICI - ${FORM_CONFIG.businessLocation.address}">
        </iframe>
    `;
    
    console.log("✅ Mapa fallback configurado");
}

// Calcular subtotal (usa el carrito real)
function calculateSubtotal() {
    const carrito = getCarritoActual();
    
    const subtotal = carrito.reduce((total, item) => {
        const precio = item.price || 0;
        const cantidad = item.quantity || 1;
        return total + (precio * cantidad);
    }, 0);
    
    return subtotal;
}

// Actualizar total considerando envío dinámico
function updateOrderSummary() {
    const subtotal = calculateSubtotal();
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total-cost');
    
    if (subtotalElement) {
        subtotalElement.textContent = `$${subtotal}`;
    }
    
    if (totalElement) {
        // Obtener costo de envío actual
        const deliveryElement = document.getElementById('delivery-cost');
        const deliveryCost = deliveryElement ? 
            parseInt(deliveryElement.textContent.replace('$', '')) || 
            FORM_CONFIG.defaultDeliveryCost : 
            FORM_CONFIG.defaultDeliveryCost;
        
        totalElement.textContent = `$${subtotal + deliveryCost}`;
    }
}

// Validar formulario
function validateForm() {
    console.log("🔍 Validando formulario...");
    
    // 1. Verificar carrito
    const carrito = getCarritoActual();
    
    if (carrito.length === 0) {
        alert("❌ Agrega productos al carrito antes de completar el pedido");
        return false;
    }
    
    // 2. Verificar campos mínimos requeridos
    const campos = [
        {id: 'customer-name', nombre: 'nombre'},
        {id: 'customer-phone', nombre: 'WhatsApp'},
        {id: 'customer-street', nombre: 'calle'},
        {id: 'customer-number', nombre: 'número'},
        {id: 'customer-neighborhood', nombre: 'barrio'},
        {id: 'customer-city', nombre: 'ciudad'}
    ];
    
    let camposValidos = true;
    let primerCampoVacio = null;
    
    for (let campo of campos) {
        const elemento = document.getElementById(campo.id);
        if (elemento) {
            const valor = elemento.value.trim();
            if (!valor) {
                if (!primerCampoVacio) primerCampoVacio = elemento;
                camposValidos = false;
                elemento.style.borderColor = '#dc3545';
            } else {
                elemento.style.borderColor = '';
            }
        }
    }
    
    if (!camposValidos && primerCampoVacio) {
        primerCampoVacio.focus();
        alert("❌ Completa todos los campos requeridos");
        return false;
    }
    
    // 3. Verificar que el envío esté disponible
    const deliveryElement = document.getElementById('delivery-cost');
    if (deliveryElement && deliveryElement.textContent === "Consultar") {
        alert("❌ La dirección está fuera de zona de cobertura. Modifica la dirección o consulta disponibilidad.");
        return false;
    }
    
    return true;
}

// Procesar pedido (genera mensaje detallado CON UBICACIÓN)
async function processOrder() {
    console.log("📞 Procesando pedido para WhatsApp...");
    
    if (!validateForm()) {
        console.log("❌ Validación fallida");
        return;
    }
    
    // Obtener datos del formulario
    const nombre = document.getElementById('customer-name').value.trim();
    const telefono = document.getElementById('customer-phone').value.trim();
    const ciudad = document.getElementById('customer-city').value.trim();
    const calle = document.getElementById('customer-street').value.trim();
    const numero = document.getElementById('customer-number').value.trim();
    const barrio = document.getElementById('customer-neighborhood').value.trim();
    const notas = document.getElementById('order-notes')?.value.trim() || '';
    
    // Construir dirección completa
    const direccion = `${calle} ${numero}, ${barrio}, ${ciudad}`;
    
    // Obtener carrito actual
    const carrito = getCarritoActual();
    
    const subtotal = calculateSubtotal();
    const deliveryElement = document.getElementById('delivery-cost');
    const envio = deliveryElement ? 
        parseInt(deliveryElement.textContent.replace('$', '')) || 
        FORM_CONFIG.defaultDeliveryCost : 
        FORM_CONFIG.defaultDeliveryCost;
    const total = subtotal + envio;
    
    // Obtener info de envío si está disponible
    let infoEnvio = "";
    const deliveryDetails = document.querySelector('.delivery-info');
    if (deliveryDetails) {
        const distancia = deliveryDetails.querySelector('strong')?.textContent || "";
        const tiempo = deliveryDetails.querySelectorAll('strong')[1]?.textContent || "";
        infoEnvio = `📏 Distancia: ${distancia} | ⏱️ Tiempo: ${tiempo}\n`;
    }
    
    // Generar mensaje detallado para WhatsApp
    let mensaje = `📋 *NUEVO PEDIDO - COMIDAS AMICI*\n\n`;
    
    mensaje += `👤 *CLIENTE:* ${nombre}\n`;
    mensaje += `📱 *WHATSAPP:* ${telefono}\n`;
    mensaje += `📍 *DIRECCIÓN DE ENTREGA:*\n${direccion}\n`;
    
    // AGREGAR UBICACIÓN DE GOOGLE MAPS (NUEVO - NO DUPLICA)
    const ubicacion = generarUbicacionGoogleMaps();
    if (ubicacion && ubicacion.texto) {
        mensaje += `${ubicacion.texto}\n`;
    }
    
    mensaje += `${infoEnvio}`;
    
    if (notas) {
        mensaje += `📝 *NOTAS:* ${notas}\n`;
    }
    
    mensaje += `\n🛒 *DETALLE DEL PEDIDO:*\n`;
    mensaje += `══════════════════════════\n`;
    
    // Listar productos
    carrito.forEach((item, index) => {
        const nombreProducto = item.name || 'Producto';
        const cantidad = item.quantity || 1;
        const precio = item.price || 0;
        const totalItem = precio * cantidad;
        
        mensaje += `${index + 1}. *${nombreProducto}* x${cantidad}\n`;
        mensaje += `   Precio unitario: $${precio}\n`;
        
        if (item.sauces && item.sauces.length > 0) {
            const salsas = item.sauces.map(s => s.name).join(', ');
            mensaje += `   🧂 Salsas: ${salsas}\n`;
        }
        
        if (item.generalExtras && item.generalExtras.length > 0) {
            item.generalExtras.forEach(extra => {
                mensaje += `   ➕ ${extra.name} x${extra.quantity || 1}\n`;
            });
        }
        
        if (item.notes) {
            mensaje += `   📝 Notas: ${item.notes}\n`;
        }
        
        mensaje += `   Subtotal: $${totalItem}\n`;
        mensaje += `   ─────────────────\n`;
    });
    
    mensaje += `\n💰 *RESUMEN DE PAGO:*\n`;
    mensaje += `══════════════════════════\n`;
    mensaje += `Subtotal productos: $${subtotal}\n`;
    mensaje += `Costo de envío: $${envio}\n`;
    mensaje += `*TOTAL A PAGAR: $${total}*\n\n`;
    
    mensaje += `⏰ *INFORMACIÓN IMPORTANTE:*\n`;
    mensaje += `• Tiempo estimado de entrega: según cálculo\n`;
    mensaje += `• Aceptamos efectivo, transferencia y Mercado Pago\n`;
    mensaje += `• Para cambios o cancelaciones, contactar dentro de los 10 minutos\n\n`;
    
    mensaje += `¡Gracias por tu pedido! 🍕`;
    
    console.log("📝 Mensaje generado CON UBICACIÓN (primeras 400 caracteres):");
    console.log(mensaje.substring(0, 400) + "...");
    
    // Enviar por WhatsApp
    const telefonoNegocio = '5493541682310';
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://wa.me/${telefonoNegocio}?text=${mensajeCodificado}`;
    
    console.log("📤 Abriendo WhatsApp...");
    window.open(urlWhatsApp, '_blank');
    
    // Mostrar confirmación
    if (typeof showNotification === 'function') {
        showNotification('¡Pedido listo para enviar por WhatsApp!', 'success');
    } else {
        alert('✅ Pedido listo. Se abrirá WhatsApp en un momento...');
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

function initForm() {
    console.log("🔄 Inicializando sistema de pedidos...");
    
    // Configurar mapa (ahora separado)
    setupMap();
    
    // Configurar evento del formulario
    const formulario = document.getElementById('order-form');
    if (formulario) {
        formulario.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("📋 Formulario enviado");
            processOrder();
        });
        console.log("✅ Formulario configurado");
    } else {
        console.error("❌ No se encontró #order-form");
    }
    
    // Mostrar estado actual del carrito
    const carrito = getCarritoActual();
    console.log("📦 Estado del carrito:", carrito.length, "productos");
    
    // Actualizar resumen inicial
    updateOrderSummary();
}

// ============================================
// HACER FUNCIONES GLOBALES
// ============================================

window.calculateSubtotal = calculateSubtotal;
window.validateForm = validateForm;
window.processOrder = processOrder;
window.getCarritoActual = getCarritoActual;
window.updateOrderSummary = updateOrderSummary;
window.generarUbicacionGoogleMaps = generarUbicacionGoogleMaps;

// ============================================
// AUTO-INICIALIZACIÓN
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForm);
} else {
    setTimeout(initForm, 100);
}

console.log("✅ Sistema de pedidos listo CON UBICACIÓN GOOGLE MAPS");
console.log("📊 Carrito detectado:", getCarritoActual().length, "productos");