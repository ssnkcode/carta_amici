const FORM_CONFIG = {
    phonePattern: /^[0-9]{10,15}$/,
    defaultDeliveryCost: 300,
    businessLocation: {
        address: "Calle Principal 123, Ciudad",
        lat: -34.6037,
        lng: -58.3816,
        zoom: 15
    }
};

function initFormAndMap() {
    setupFormValidation();
    setupMap();
    setupPhoneMask();
}

function setupPhoneMask() {
    const phoneInput = document.getElementById('customer-phone');
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 15) {
            value = value.substring(0, 15);
        }
        e.target.value = value;
    });
}

function setupFormValidation() {
    const form = document.getElementById('order-form');
    if (!form) return;
    
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

function clearFieldError(field) {
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    field.style.borderColor = '';
}

function validateForm() {
    let isValid = true;
    
    if (selectedItems.length === 0) {
        showNotification('Agrega productos al carrito antes de completar el pedido', 'error');
        return false;
    }
    
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

    const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
    if (!paymentMethod) {
        showNotification('Selecciona una forma de pago', 'error');
        isValid = false;
    }
    
    return isValid;
}

function setupMap() {
    const mapFrame = document.getElementById('map-frame');
    if (!mapFrame) return;
    
    const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3284.016713276848!2d${FORM_CONFIG.businessLocation.lng}!3d${FORM_CONFIG.businessLocation.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDM2JzEzLjMiUyA1OMKwMjInNTQuNyJX!5e0!3m2!1ses!2sar!4v1629999999999!5m2!1ses!2sar&z=${FORM_CONFIG.businessLocation.zoom}`;
    
    mapFrame.innerHTML = `
        <iframe 
            src="${mapUrl}" 
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen="" 
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade">
        </iframe>
    `;
}

function processOrder() {
    if (!validateForm()) return;

    const customerName = document.getElementById('customer-name').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const customerCity = document.getElementById('customer-city').value.trim();
    const customerStreet = document.getElementById('customer-street').value.trim();
    const customerNumber = document.getElementById('customer-number').value.trim();
    const customerNeighborhood = document.getElementById('customer-neighborhood').value.trim();
    const orderNotes = document.getElementById('order-notes').value.trim();
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    
    const fullAddress = `${customerStreet} ${customerNumber}, ${customerNeighborhood}, ${customerCity}`;
    
    const generalExtras = [];
    document.querySelectorAll('.extra-checkbox:checked').forEach(checkbox => {
        generalExtras.push({
            name: checkbox.dataset.name,
            price: parseInt(checkbox.dataset.price)
        });
    });
    
    const subtotal = calculateSubtotal();
    const delivery = FORM_CONFIG.defaultDeliveryCost;
    const extrasTotal = generalExtras.reduce((sum, extra) => sum + extra.price, 0);
    let total = subtotal + delivery + extrasTotal;
    let discount = 0;

    if (paymentMethod === 'efectivo') {
        discount = Math.round(total * 0.10);
        total = total - discount;
    }
    
    const whatsappMessage = generateWhatsAppMessage({
        customerName,
        customerPhone,
        address: fullAddress,
        orderNotes,
        paymentMethod,
        items: selectedItems,
        generalExtras,
        subtotal,
        delivery,
        total,
        discount
    });
    
    const phoneNumber = '5491122334455'; 
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    showNotification('¡Pedido listo para enviar por WhatsApp!', 'success');
    
    setTimeout(() => {
        clearCart();
        document.getElementById('order-form').reset();
    }, 2000);
}

function generateWhatsAppMessage(orderData) {
    const timestamp = new Date().toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
    
    let paymentText = '';
    switch(orderData.paymentMethod) {
        case 'efectivo': paymentText = 'Efectivo (10% OFF)'; break;
        case 'tarjeta': paymentText = 'Tarjeta'; break;
        case 'transferencia': paymentText = 'Transferencia'; break;
        default: paymentText = orderData.paymentMethod;
    }

    let message = `📋 *NUEVO PEDIDO - COMIDAS AMICI*\n`;
    message += `📅 ${timestamp}\n\n`;
    
    message += `👤 *CLIENTE:* ${orderData.customerName}\n`;
    message += `📱 *WHATSAPP:* ${orderData.customerPhone}\n`;
    message += `📍 *DIRECCIÓN DE ENTREGA:*\n${orderData.address}\n`;
    message += `💳 *FORMA DE PAGO:* ${paymentText}\n\n`;
    
    message += `🛒 *DETALLE DEL PEDIDO:*\n`;
    message += `══════════════════════════\n`;
    
    orderData.items.forEach((item, index) => {
        const itemTotal = (item.price + 
            item.sauces.reduce((sum, sauce) => sum + sauce.price, 0) +
            item.generalExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0)) * item.quantity;
        
        message += `${index + 1}. *${item.name}* x${item.quantity}\n`;
        message += `   Precio unitario: $${item.price}\n`;
        
        if (item.sauces.length > 0) {
            message += `   🧂 Salsas: ${item.sauces.map(s => s.name).join(', ')}\n`;
        }
        
        if (item.generalExtras.length > 0) {
            item.generalExtras.forEach(extra => {
                message += `   ➕ ${extra.name} x${extra.quantity}\n`;
            });
        }
        
        if (item.notes) {
            message += `   📝 Notas: ${item.notes}\n`;
        }
        
        message += `   Subtotal: $${itemTotal}\n`;
        message += `   ─────────────────\n`;
    });
    
    if (orderData.generalExtras.length > 0) {
        message += `\n🎁 *ADICIONALES GENERALES:*\n`;
        orderData.generalExtras.forEach(extra => {
            message += `• ${extra.name}: $${extra.price}\n`;
        });
    }
    
    if (orderData.orderNotes) {
        message += `\n📝 *NOTAS ADICIONALES:*\n`;
        message += `${orderData.orderNotes}\n`;
    }
    
    message += `\n💰 *RESUMEN DE PAGO:*\n`;
    message += `══════════════════════════\n`;
    message += `Subtotal productos: $${orderData.subtotal}\n`;
    
    if (orderData.generalExtras.length > 0) {
        const extrasTotal = orderData.generalExtras.reduce((sum, extra) => sum + extra.price, 0);
        message += `Adicionales generales: $${extrasTotal}\n`;
    }
    
    message += `Costo de envío: $${orderData.delivery}\n`;
    
    if (orderData.discount > 0) {
        message += `Descuento (Efectivo): -$${orderData.discount}\n`;
    }

    message += `*TOTAL A PAGAR: $${orderData.total}*\n\n`;
    
    message += `⏰ *INFORMACIÓN IMPORTANTE:*\n`;
    message += `• El tiempo estimado de entrega es de 45-60 minutos\n`;
    message += `• Aceptamos efectivo, transferencia y Mercado Pago\n`;
    message += `• Para cambios o cancelaciones, contactar dentro de los 10 minutos\n\n`;
    
    message += `¡Gracias por tu pedido! 🍕`;
    
    return message;
}

function calculateSubtotal() {
    return selectedItems.reduce((total, item) => {
        const itemPrice = item.price;
        const saucesTotal = item.sauces.reduce((sum, sauce) => sum + sauce.price, 0);
        const extrasTotal = item.generalExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0);
        return total + (itemPrice + saucesTotal + extrasTotal) * item.quantity;
    }, 0);
}

function clearCart() {
    selectedItems = [];
    renderSelectedItems();
    renderFoodItems();
    updateOrderSummary();
    saveToLocalStorage();
    
    const floatCount = document.getElementById('float-count');
    const floatTotal = document.getElementById('float-total');
    if (floatCount) floatCount.textContent = '0';
    if (floatTotal) floatTotal.textContent = '$0';
}

window.initFormAndMap = initFormAndMap;
window.validateForm = validateForm;
window.processOrder = processOrder;