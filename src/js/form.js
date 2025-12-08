const FORM_CONFIG = {
    phonePattern: /^[0-9]{10,15}$/,
    defaultDeliveryCost: 300,
    businessLocation: {
        address: "Av. Roque Sáenz Peña, Córdoba Capital, Córdoba", 
        lat: -31.307277,  
        lng: -64.463337,    
        zoom: 16 
    }
};

console.log("✅ form.js cargado");

console.log("🔗 Conectando con el carrito real...");

if (typeof selectedItems !== 'undefined') {
    console.log("✓ Carrito encontrado en variable global 'selectedItems'");
    console.log("  - Productos:", selectedItems.length);
    console.log("  - Detalles:", selectedItems.map(p => `${p.name} x${p.quantity}`));
    
    window.selectedItems = selectedItems;
} else {
    console.warn("⚠️ Variable selectedItems no encontrada");
    window.selectedItems = [];
}

function getCarritoActual() {
    if (typeof selectedItems !== 'undefined' && Array.isArray(selectedItems)) {
        return selectedItems;
    }
    if (window.selectedItems && Array.isArray(window.selectedItems)) {
        return window.selectedItems;
    }
    try {
        const saved = localStorage.getItem('deliciasExpress_selectedItems');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch(e) {}
    
    return [];
}

function setupMap() {
    console.log("🗺️ Configurando mapa...");
    
    const mapFrame = document.getElementById('map-frame');
    if (!mapFrame) {
        console.error("❌ #map-frame no encontrado");
        return;
    }
    
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
    
    console.log("✅ Mapa configurado");
}

function calculateSubtotal() {
    const carrito = getCarritoActual();
    console.log("🧮 Calculando subtotal de", carrito.length, "productos...");
    
    const subtotal = carrito.reduce((total, item) => {
        const precio = item.price || 0;
        const cantidad = item.quantity || 1;
        return total + (precio * cantidad);
    }, 0);
    
    console.log("   - Subtotal: $", subtotal);
    return subtotal;
}

function validateForm() {
    console.log("🔍 Validando formulario...");
    
    const carrito = getCarritoActual();
    console.log("   - Productos en carrito:", carrito.length);
    
    if (carrito.length === 0) {
        console.log("❌ Carrito vacío");
        alert("❌ Agrega productos al carrito antes de completar el pedido");
        return false;
    }
    
    console.log("✅ Carrito OK");
    
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
                console.log(`❌ Campo ${campo.nombre} vacío`);
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
    
    console.log("✅ Todos los campos están completos");
    return true;
}

function processOrder() {
    console.log("📞 Procesando pedido para WhatsApp...");
    
    if (!validateForm()) {
        console.log("❌ Validación fallida");
        return;
    }
    
    const nombre = document.getElementById('customer-name').value.trim();
    const telefono = document.getElementById('customer-phone').value.trim();
    const ciudad = document.getElementById('customer-city').value.trim();
    const calle = document.getElementById('customer-street').value.trim();
    const numero = document.getElementById('customer-number').value.trim();
    const barrio = document.getElementById('customer-neighborhood').value.trim();
    const notas = document.getElementById('order-notes')?.value.trim() || '';
    
    const direccion = `${calle} ${numero}, ${barrio}, ${ciudad}`;
    
    const carrito = getCarritoActual();
    
    const subtotal = calculateSubtotal();
    const envio = FORM_CONFIG.defaultDeliveryCost;
    const total = subtotal + envio;
    
    let mensaje = `📋 *NUEVO PEDIDO - COMIDAS AMICI*\n\n`;
    
    mensaje += `👤 *CLIENTE:* ${nombre}\n`;
    mensaje += `📱 *WHATSAPP:* ${telefono}\n`;
    mensaje += `📍 *DIRECCIÓN DE ENTREGA:*\n${direccion}\n`;
    
    if (notas) {
        mensaje += `📝 *NOTAS:* ${notas}\n`;
    }
    
    mensaje += `\n🛒 *DETALLE DEL PEDIDO:*\n`;
    mensaje += `══════════════════════════\n`;
    
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
    mensaje += `• Tiempo estimado de entrega: 45-60 minutos\n`;
    mensaje += `• Aceptamos efectivo, transferencia y Mercado Pago\n`;
    mensaje += `• Para cambios o cancelaciones, contactar dentro de los 10 minutos\n\n`;
    
    mensaje += `¡Gracias por tu pedido! 🍕`;
    
    console.log("📝 Mensaje generado (primeras 300 caracteres):");
    console.log(mensaje.substring(0, 300) + "...");
    
    const telefonoNegocio = '5493541682310';
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://wa.me/${telefonoNegocio}?text=${mensajeCodificado}`;
    
    console.log("📤 Abriendo WhatsApp...");
    window.open(urlWhatsApp, '_blank');
    
    if (typeof showNotification === 'function') {
        showNotification('¡Pedido listo para enviar por WhatsApp!', 'success');
    } else {
        alert('✅ Pedido listo. Se abrirá WhatsApp en un momento...');
    }
}

function initForm() {
    console.log("🔄 Inicializando sistema de pedidos...");
    
    setupMap();
    
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
    
    const carrito = getCarritoActual();
    console.log("📦 Estado del carrito:", carrito.length, "productos");
    console.log("💰 Subtotal actual: $", calculateSubtotal());
}

window.calculateSubtotal = calculateSubtotal;
window.validateForm = validateForm;
window.processOrder = processOrder;
window.getCarritoActual = getCarritoActual;

if (typeof selectedItems !== 'undefined') {
    window.selectedItems = selectedItems;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForm);
} else {
    setTimeout(initForm, 100);
}

console.log("✅ Sistema de pedidos listo");
console.log("📊 Carrito detectado:", getCarritoActual().length, "productos");
