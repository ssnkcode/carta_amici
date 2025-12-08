// form.js - Funcionalidades para formulario de cliente y mapa

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
// Inicializar formulario y mapa
function initFormAndMap() {
    setupFormValidation();
    setupMap();
    setupPhoneMask();
}

// Configurar máscara para teléfono
function setupPhoneMask() {
    const phoneInput = document.getElementById('customer-phone');
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', function(e) {
        // Solo permitir números
        let value = e.target.value.replace(/\D/g, '');
        
        // Limitar a 15 dígitos
        if (value.length > 15) {
            value = value.substring(0, 15);
        }
        
        e.target.value = value;
    });
}

// Configurar validación del formulario
function setupFormValidation() {
    const form = document.getElementById('order-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            processOrder();
        }
    });
    
    // Validación en tiempo real
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

// Validar campo individual
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    switch (field.id) {
        case 'customer-name':
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'El nombre debe tener al menos 2 caracteres';
            }
            break;
            
        case 'customer-phone':
            if (!FORM_CONFIG.phonePattern.test(value)) {
                isValid = false;
                errorMessage = 'Ingresa un número de WhatsApp válido (10-15 dígitos)';
            }
            break;
            
        case 'customer-city':
        case 'customer-street':
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'Este campo es requerido';
            }
            break;
            
        case 'customer-number':
            if (!value) {
                isValid = false;
                errorMessage = 'Ingresa el número de dirección';
            }
            break;
            
        case 'customer-neighborhood':
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'Ingresa el barrio';
            }
            break;
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

// Mostrar error en campo
function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '5px';
    errorDiv.style.display = 'flex';
    errorDiv.style.alignItems = 'center';
    errorDiv.style.gap = '5px';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    field.parentNode.appendChild(errorDiv);
    field.style.borderColor = '#dc3545';
}

// Limpiar error de campo
function clearFieldError(field) {
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    field.style.borderColor = '';
}

// Validar formulario completo
function validateForm() {
    let isValid = true;
    
    // Verificar que haya items en el carrito
    if (selectedItems.length === 0) {
        showNotification('Agrega productos al carrito antes de completar el pedido', 'error');
        return false;
    }
    
    // Validar campos requeridos
    const requiredFields = [
        'customer-name',
        'customer-phone',
        'customer-city',
        'customer-street',
        'customer-number',
        'customer-neighborhood'
    ];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Configurar mapa de ubicación
function setupMap() {
    console.log("🔄 Configurando mapa OpenStreetMap para Córdoba...");
    
    const mapFrame = document.getElementById('map-frame');
    if (!mapFrame) {
        console.error("❌ No se encontró #map-frame");
        return;
    }
    
    const lat = FORM_CONFIG.businessLocation.lat;
    const lng = FORM_CONFIG.businessLocation.lng;
    
    // Ajustar el "bbox" para un zoom adecuado (números más pequeños = zoom más cercano)
    const bboxAdjust = 0.003; // Ajusta este valor: más pequeño = zoom más cercano
    
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
        lng - bboxAdjust
    }%2C${
        lat - bboxAdjust
    }%2C${
        lng + bboxAdjust
    }%2C${
        lat + bboxAdjust
    }&layer=mapnik&marker=${lat}%2C${lng}`;
    
    mapFrame.innerHTML = `
        <div class="map-container" style="width: 100%; height: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <iframe 
                src="${osmUrl}"
                width="100%" 
                height="100%" 
                style="border: none;"
                allowfullscreen
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                title="Comidas AMICI - ${FORM_CONFIG.businessLocation.address}">
            </iframe>
        </div>
    `;
    
    console.log("✅ Mapa OpenStreetMap configurado");
    console.log("📍 Ver en Google Maps:", `https://maps.google.com/?q=${lat},${lng}`);
}

// Procesar pedido y generar mensaje de WhatsApp
function processOrder() {
    // Obtener datos del formulario
    const customerName = document.getElementById('customer-name').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const customerCity = document.getElementById('customer-city').value.trim();
    const customerStreet = document.getElementById('customer-street').value.trim();
    const customerNumber = document.getElementById('customer-number').value.trim();
    const customerNeighborhood = document.getElementById('customer-neighborhood').value.trim();
    const orderNotes = document.getElementById('order-notes').value.trim();
    
    // Construir dirección completa
    const fullAddress = `${customerStreet} ${customerNumber}, ${customerNeighborhood}, ${customerCity}`;
    
    // Obtener adicionales generales seleccionados
    const generalExtras = [];
    document.querySelectorAll('.extra-checkbox:checked').forEach(checkbox => {
        generalExtras.push({
            name: checkbox.dataset.name,
            price: parseInt(checkbox.dataset.price)
        });
    });
    
    // Calcular totales
    const subtotal = calculateSubtotal();
    const delivery = FORM_CONFIG.defaultDeliveryCost;
    const extrasTotal = generalExtras.reduce((sum, extra) => sum + extra.price, 0);
    const total = subtotal + delivery + extrasTotal;
    
    // Generar mensaje para WhatsApp
    const whatsappMessage = generateWhatsAppMessage({
        customerName,
        customerPhone,
        address: fullAddress,
        orderNotes,
        items: selectedItems,
        generalExtras,
        subtotal,
        delivery,
        total
    });
    
    // Enviar por WhatsApp
    const phoneNumber = '5491122334455'; // Reemplazar con el número real del negocio
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Abrir en nueva pestaña
    window.open(whatsappUrl, '_blank');
    
    // Mostrar confirmación
    showNotification('¡Pedido listo para enviar por WhatsApp!', 'success');
    
    // Reiniciar carrito después de enviar
    setTimeout(() => {
        clearCart();
    }, 2000);
}

// Generar mensaje de WhatsApp estructurado
function generateWhatsAppMessage(orderData) {
    const timestamp = new Date().toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
    
    let message = `📋 *NUEVO PEDIDO - COMIDAS AMICI*\n`;
    message += `📅 ${timestamp}\n\n`;
    
    message += `👤 *CLIENTE:* ${orderData.customerName}\n`;
    message += `📱 *WHATSAPP:* ${orderData.customerPhone}\n`;
    message += `📍 *DIRECCIÓN DE ENTREGA:*\n${orderData.address}\n\n`;
    
    message += `🛒 *DETALLE DEL PEDIDO:*\n`;
    message += `══════════════════════════\n`;
    
    // Productos
    orderData.items.forEach((item, index) => {
        const itemTotal = (item.price + 
            item.sauces.reduce((sum, sauce) => sum + sauce.price, 0) +
            item.generalExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0)) * item.quantity;
        
        message += `${index + 1}. *${item.name}* x${item.quantity}\n`;
        message += `   Precio unitario: $${item.price}\n`;
        
        // Salsas adicionales del producto
        if (item.sauces.length > 0) {
            message += `   🧂 Salsas: ${item.sauces.map(s => s.name).join(', ')}\n`;
        }
        
        // Adicionales del producto (solo pizzas)
        if (item.generalExtras.length > 0) {
            item.generalExtras.forEach(extra => {
                message += `   ➕ ${extra.name} x${extra.quantity}\n`;
            });
        }
        
        // Notas del producto
        if (item.notes) {
            message += `   📝 Notas: ${item.notes}\n`;
        }
        
        message += `   Subtotal: $${itemTotal}\n`;
        message += `   ─────────────────\n`;
    });
    
    // Adicionales generales
    if (orderData.generalExtras.length > 0) {
        message += `\n🎁 *ADICIONALES GENERALES:*\n`;
        orderData.generalExtras.forEach(extra => {
            message += `• ${extra.name}: $${extra.price}\n`;
        });
    }
    
    // Notas adicionales del pedido
    if (orderData.orderNotes) {
        message += `\n📝 *NOTAS ADICIONALES:*\n`;
        message += `${orderData.orderNotes}\n`;
    }
    
    // Totales
    message += `\n💰 *RESUMEN DE PAGO:*\n`;
    message += `══════════════════════════\n`;
    message += `Subtotal productos: $${orderData.subtotal}\n`;
    
    if (orderData.generalExtras.length > 0) {
        const extrasTotal = orderData.generalExtras.reduce((sum, extra) => sum + extra.price, 0);
        message += `Adicionales generales: $${extrasTotal}\n`;
    }
    
    message += `Costo de envío: $${orderData.delivery}\n`;
    message += `*TOTAL A PAGAR: $${orderData.total}*\n\n`;
    
    message += `⏰ *INFORMACIÓN IMPORTANTE:*\n`;
    message += `• El tiempo estimado de entrega es de 45-60 minutos\n`;
    message += `• Aceptamos efectivo, transferencia y Mercado Pago\n`;
    message += `• Para cambios o cancelaciones, contactar dentro de los 10 minutos\n\n`;
    
    message += `¡Gracias por tu pedido! 🍕`;
    
    return message;
}

// Calcular subtotal del carrito
function calculateSubtotal() {
    return selectedItems.reduce((total, item) => {
        const itemPrice = item.price;
        const saucesTotal = item.sauces.reduce((sum, sauce) => sum + sauce.price, 0);
        const extrasTotal = item.generalExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0);
        return total + (itemPrice + saucesTotal + extrasTotal) * item.quantity;
    }, 0);
}

// Vaciar carrito
function clearCart() {
    selectedItems = [];
    renderSelectedItems();
    renderFoodItems();
    updateOrderSummary();
    saveToLocalStorage();
    
    // Actualizar botón flotante
    const floatCount = document.getElementById('float-count');
    const floatTotal = document.getElementById('float-total');
    if (floatCount) floatCount.textContent = '0';
    if (floatTotal) floatTotal.textContent = '$0';
}

// Exportar funciones para uso global
window.initFormAndMap = initFormAndMap;
window.validateForm = validateForm;
window.processOrder = processOrder;