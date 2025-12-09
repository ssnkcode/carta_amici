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

if (typeof selectedItems !== 'undefined') {
    window.selectedItems = selectedItems;
} else {
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

function generarUbicacionGoogleMaps() {
    try {
        const calle = document.getElementById('customer-street')?.value.trim() || '';
        const numero = document.getElementById('customer-number')?.value.trim() || '';
        const ciudad = document.getElementById('customer-city')?.value.trim() || '';
        
        if (!calle || !numero || !ciudad) {
            return null;
        }
        
        const direccionParaMapa = `${calle} ${numero}, ${ciudad}, Córdoba, Argentina`;
        const direccionCodificada = encodeURIComponent(direccionParaMapa);
        const urlGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${direccionCodificada}`;
        
        return {
            texto: `📍 *UBICACIÓN EN GOOGLE MAPS:*\n${urlGoogleMaps}`,
            url: urlGoogleMaps
        };
        
    } catch (error) {
        console.error(error);
        return null;
    }
}

function setupMap() {
    if (typeof window.setupStaticMap === 'function') {
        window.setupStaticMap();
    } else {
        setupMapFallback();
    }
}

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
            title="Ubicación del Negocio">
        </iframe>
    `;
}

function calculateSubtotal() {
    const carrito = getCarritoActual();
    
    if (!carrito || carrito.length === 0) {
        return 0;
    }
    
    const subtotal = carrito.reduce((total, item) => {
        const precio = item.price || 0;
        const cantidad = item.quantity || 1;
        
        const saucesTotal = item.sauces ? item.sauces.reduce((sum, s) => sum + s.price, 0) : 0;
        const generalExtrasTotal = item.generalExtras ? item.generalExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0) : 0;
        
        return total + ((precio * cantidad) + saucesTotal + generalExtrasTotal);
    }, 0);
    
    return subtotal;
}

function calculateGlobalExtras() {
    let totalExtras = 0;
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:not(.cart-item-check)');
    
    checkboxes.forEach(cb => {
        if (cb.checked) {
            if (cb.dataset.price) {
                totalExtras += parseInt(cb.dataset.price) || 0;
            } else {
                if (cb.id.includes('cubiertos')) totalExtras += 50;
                if (cb.id.includes('salsas')) totalExtras += 100;
                if (cb.id.includes('servilletas')) totalExtras += 30;
            }
        }
    });
    
    return totalExtras;
}

function updateOrderSummary() {
    const subtotal = calculateSubtotal();
    const globalExtras = calculateGlobalExtras();
    const totalBase = subtotal + globalExtras;
    
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total-cost');
    const deliveryElement = document.getElementById('delivery-cost');
    
    // 1. Mostrar Subtotal (siempre visible)
    if (subtotalElement) {
        subtotalElement.textContent = `$${totalBase}`;
    }

    // 2. Verificar si la dirección está completa
    const calle = document.getElementById('customer-street')?.value.trim();
    const numero = document.getElementById('customer-number')?.value.trim();
    const ciudad = document.getElementById('customer-city')?.value.trim();
    const addressComplete = calle && numero && ciudad;

    // 3. ESTADO A: Dirección Incompleta (Prioridad sobre todo, incluso si es $0)
    if (!addressComplete) {
        if (deliveryElement) {
            deliveryElement.textContent = "A calcular";
            deliveryElement.className = 'delivery-cost-warning';
            deliveryElement.dataset.cost = "0"; 
        }
        if (totalElement) {
            totalElement.innerHTML = `$${totalBase} <span style="font-size: 0.7em; color: #dc3545;">+ Envío</span>`;
        }
        return; // Salimos aquí para mantener el estado "A calcular"
    }

    // 4. ESTADO B: Dirección Completa - Intentar obtener costo calculado
    let deliveryCost = 0;
    let hasCalculatedDelivery = false;
    let isCalculating = false;
    
    if (deliveryElement) {
        if (deliveryElement.dataset.calculating === "true") {
            isCalculating = true;
        } else if (deliveryElement.dataset.cost) {
            deliveryCost = parseInt(deliveryElement.dataset.cost) || 0;
            // Consideramos calculado si tiene costo o si es explícitamente 0 (gratis)
            // pero NO si el texto sigue diciendo "A calcular" por algún error
            if (!deliveryElement.textContent.includes("A calcular")) {
                hasCalculatedDelivery = true;
            }
        } else {
            const rawText = deliveryElement.textContent;
            if (rawText.includes('$') && /\d/.test(rawText)) {
                deliveryCost = parseInt(rawText.replace(/[^0-9]/g, '')) || 0;
                hasCalculatedDelivery = true;
            }
        }
    }

    // 5. Renderizar Total Final basado en estado de cálculo
    if (totalElement) {
        if (isCalculating) {
             totalElement.innerHTML = `$${totalBase} <span style="font-size: 0.7em; color: #666;">+ Calculando...</span>`;
        } else if (hasCalculatedDelivery) {
            const totalFinal = totalBase + deliveryCost;
            totalElement.textContent = `$${totalFinal}`;
            totalElement.style.color = "#000";
        } else {
            // Fallback si hay dirección pero falló el cálculo
            totalElement.innerHTML = `$${totalBase} <span style="font-size: 0.7em; color: #dc3545;">+ Envío</span>`;
            if (deliveryElement && !isCalculating) {
                deliveryElement.textContent = "A calcular";
                deliveryElement.className = 'delivery-cost-warning';
            }
        }
    }
}

function validateForm() {
    const carrito = getCarritoActual();
    
    if (carrito.length === 0) {
        showCustomAlert("❌ El carrito está vacío", "Agrega productos antes de continuar.");
        return false;
    }
    
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
        showCustomAlert("❌ Campos incompletos", "Por favor completa todos los campos requeridos.");
        return false;
    }
    
    return true;
}

function createOrderModal() {
    if (document.getElementById('order-confirm-modal')) return;

    const modalHTML = `
        <div id="order-confirm-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-icon">📋</div>
                <h3>Confirmar Pedido</h3>
                <div id="order-modal-details" style="text-align: left; margin: 15px 0; font-size: 0.9rem; color: #555; background: #f9f9f9; padding: 15px; border-radius: 8px;">
                    </div>
                <div class="modal-actions">
                    <button id="btn-cancel-order" class="modal-btn cancel">Cancelar</button>
                    <button id="btn-confirm-order" class="modal-btn confirm">Enviar a WhatsApp</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function createAlertModal() {
    if (document.getElementById('custom-alert-modal')) return;

    const modalHTML = `
        <div id="custom-alert-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-icon warning" id="alert-icon">⚠️</div>
                <h3 id="alert-title">Atención</h3>
                <p id="alert-message"></p>
                <div class="modal-actions">
                    <button id="btn-close-alert" class="modal-btn confirm">Entendido</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('btn-close-alert').addEventListener('click', () => {
        document.getElementById('custom-alert-modal').classList.remove('active');
    });
}

function showCustomAlert(title, message) {
    createAlertModal();
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-message').textContent = message;
    document.getElementById('custom-alert-modal').classList.add('active');
}

function showOrderConfirmation(details) {
    createOrderModal();
    const modal = document.getElementById('order-confirm-modal');
    const content = document.getElementById('order-modal-details');
    const btnConfirm = document.getElementById('btn-confirm-order');
    const btnCancel = document.getElementById('btn-cancel-order');
    
    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal Productos:</span> <span>$${details.subtotal}</span>
        </div>
        ${details.extras > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Adicionales Generales:</span> <span>$${details.extras}</span>
        </div>` : ''}
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Envío a ${details.barrio}:</span> <span>$${details.envio}</span>
        </div>
        ${details.descuento > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #2ecc71;">
            <span>Descuento (Efectivo):</span> <span>-$${details.descuento}</span>
        </div>` : ''}
        <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; color: #000;">
            <span>TOTAL FINAL:</span> <span>$${details.total}</span>
        </div>
        <div style="margin-top: 10px; font-size: 0.8rem; text-align: center; color: #888;">
            Tiempo estimado: ${details.tiempo}
        </div>
    `;

    return new Promise((resolve) => {
        modal.classList.add('active');
        
        const handleConfirm = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(true);
        };
        
        const handleCancel = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(false);
        };
        
        const cleanup = () => {
            btnConfirm.removeEventListener('click', handleConfirm);
            btnCancel.removeEventListener('click', handleCancel);
        };

        btnConfirm.addEventListener('click', handleConfirm);
        btnCancel.addEventListener('click', handleCancel);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) handleCancel();
        });
    });
}

async function processOrder() {
    if (!validateForm()) {
        return;
    }
    
    const nombre = document.getElementById('customer-name').value.trim();
    const telefono = document.getElementById('customer-phone').value.trim();
    const ciudad = document.getElementById('customer-city').value.trim();
    const calle = document.getElementById('customer-street').value.trim();
    const numero = document.getElementById('customer-number').value.trim();
    const barrio = document.getElementById('customer-neighborhood').value.trim();
    const notas = document.getElementById('order-notes')?.value.trim() || '';
    const metodoPago = document.querySelector('input[name="payment-method"]:checked')?.value || 'Efectivo';
    
    const direccionCompleta = `${calle} ${numero}, ${barrio}, ${ciudad}`;
    
    let costoEnvio = 0;
    let tiempoEstimado = "Consultar";
    
    const deliveryElement = document.getElementById('delivery-cost');
    if (deliveryElement) {
        if (deliveryElement.dataset.cost) {
            costoEnvio = parseInt(deliveryElement.dataset.cost) || 0;
        } else if (deliveryElement.textContent.includes('$')) {
            costoEnvio = parseInt(deliveryElement.textContent.replace(/[^0-9]/g, '')) || 0;
        }
    }

    if (costoEnvio === 0 && typeof window.calculateDeliveryFromAddress === 'function') {
        try {
            const deliveryResult = await window.calculateDeliveryFromAddress(direccionCompleta);
            if (deliveryResult && deliveryResult.dentroCobertura) {
                costoEnvio = deliveryResult.costo;
                tiempoEstimado = deliveryResult.tiempoEstimado || `${deliveryResult.duracionCalculada} min`;
            }
        } catch (error) {
            console.error(error);
        }
    }
    
    if (costoEnvio === 0) {
         if (!confirm("No se pudo calcular el costo de envío exacto. Se coordinará por WhatsApp. ¿Deseas continuar?")) {
             return;
         }
    }

    const carrito = getCarritoActual();
    const subtotal = calculateSubtotal();
    const extras = calculateGlobalExtras();
    
    let total = subtotal + extras + costoEnvio;
    let descuento = 0;
    
    if (metodoPago === 'efectivo') {
        descuento = Math.round(total * 0.10); 
        total = total - descuento;
    }
    
    const confirmacion = await showOrderConfirmation({
        subtotal: subtotal,
        extras: extras,
        envio: costoEnvio,
        barrio: barrio,
        descuento: descuento,
        total: total,
        tiempo: tiempoEstimado
    });

    if (!confirmacion) {
        return;
    }
    
    let mensaje = `📋 *NUEVO PEDIDO - COMIDAS AMICI*\n\n`;
    
    mensaje += `👤 *CLIENTE:* ${nombre}\n`;
    mensaje += `📱 *WHATSAPP:* ${telefono}\n`;
    mensaje += `📍 *DIRECCIÓN DE ENTREGA:*\n${direccionCompleta}\n`;
    
    const ubicacion = generarUbicacionGoogleMaps();
    if (ubicacion && ubicacion.texto) {
        mensaje += `${ubicacion.texto}\n`;
    }
    
    mensaje += `⏱️ Tiempo estimado: ${tiempoEstimado}\n`;
    
    if (notas) {
        mensaje += `📝 *NOTAS DEL PEDIDO:* ${notas}\n`;
    }
    
    mensaje += `\n🛒 *DETALLE DEL PEDIDO:*\n`;
    mensaje += `══════════════════════════\n`;
    
    carrito.forEach((item, index) => {
        const nombreProducto = item.name || 'Producto';
        const cantidad = item.quantity || 1;
        const precio = item.price || 0;
        
        const saucesTotal = item.sauces ? item.sauces.reduce((sum, s) => sum + s.price, 0) : 0;
        const generalExtrasTotal = item.generalExtras ? item.generalExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0) : 0;
        const totalItem = (precio * cantidad) + saucesTotal + generalExtrasTotal;
        
        mensaje += `${index + 1}. *${nombreProducto}* x${cantidad}\n`;
        
        if (item.empandasFlavors && item.empandasFlavors.length > 0) {
            mensaje += `   🥟 Gustos: ${item.empandasFlavors.join(', ')}\n`;
        }

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
            mensaje += `   📝 Nota producto: ${item.notes}\n`;
        }
        
        mensaje += `   Subtotal: $${totalItem}\n`;
        mensaje += `   ─────────────────\n`;
    });

    const checkboxes = document.querySelectorAll('input[type="checkbox"]:not(.cart-item-check)');
    let hasExtras = false;
    let extrasMsg = `\n➕ *ADICIONALES GENERALES:*\n`;
    
    checkboxes.forEach(cb => {
        if (cb.checked) {
            let name = cb.id; 
            let price = 0;
            if (cb.dataset.price) {
                price = cb.dataset.price;
                name = cb.dataset.name || cb.parentElement.innerText.split('$')[0].trim();
            }
            else if (cb.id.includes('cubiertos')) { name = 'Cubiertos'; price = 50; }
            else if (cb.id.includes('salsas')) { name = 'Salsas'; price = 100; }
            else if (cb.id.includes('servilletas')) { name = 'Servilletas'; price = 30; }
            
            if (price > 0) {
                hasExtras = true;
                extrasMsg += `   • ${name}: $${price}\n`;
            }
        }
    });
    
    if (hasExtras) {
        mensaje += extrasMsg;
    }
    
    mensaje += `\n💰 *RESUMEN DE PAGO:*\n`;
    mensaje += `══════════════════════════\n`;
    mensaje += `Método de pago: ${metodoPago.toUpperCase()}\n`;
    mensaje += `Subtotal productos: $${subtotal}\n`;
    if (extras > 0) mensaje += `Adicionales generales: $${extras}\n`;
    mensaje += `Costo de envío: $${costoEnvio}\n`;
    if (descuento > 0) {
        mensaje += `Descuento (10% Efectivo): -$${descuento}\n`;
    }
    mensaje += `*TOTAL A PAGAR: $${total}*\n\n`;
    
    mensaje += `¡Gracias por tu pedido! 🍕`;
    
    const telefonoNegocio = '5493513707738';
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://wa.me/${telefonoNegocio}?text=${mensajeCodificado}`;
    
    window.open(urlWhatsApp, '_blank');
}

function initForm() {
    setupMap();
    createOrderModal();
    createAlertModal();
    
    const formulario = document.getElementById('order-form');
    if (formulario) {
        formulario.addEventListener('submit', function(e) {
            e.preventDefault();
            processOrder();
        });

        // Escuchar cambios en todo el formulario para actualizar totales
        formulario.addEventListener('change', updateOrderSummary);
        formulario.addEventListener('input', updateOrderSummary);
    }
    
    updateOrderSummary();
}

window.calculateSubtotal = calculateSubtotal;
window.calculateGlobalExtras = calculateGlobalExtras;
window.validateForm = validateForm;
window.processOrder = processOrder;
window.getCarritoActual = getCarritoActual;
window.updateOrderSummary = updateOrderSummary;
window.generarUbicacionGoogleMaps = generarUbicacionGoogleMaps;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForm);
} else {
    setTimeout(initForm, 100);
}