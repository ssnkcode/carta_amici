// ui-manager.js - Gestión de interfaz y notificaciones
console.log("🎨 ui-manager.js cargado");

// 1. Información de zona de cobertura AMPLIADA
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

// 2. Actualizar interfaz - MEJORADA
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

// 2.1 Función de notificación mejorada
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

// 3. Mostrar detalles del envío - ACTUALIZADO CON NUEVA LÓGICA
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

// 4. Actualizar formulario
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

// 5. Indicador de carga
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

// Exportar funciones
window.addCoverageInfo = addCoverageInfo;
window.updateDeliveryInfo = updateDeliveryInfo;
window.showNotification = showNotification;
window.showDeliveryDetails = showDeliveryDetails;
window.updateFormDeliveryInfo = updateFormDeliveryInfo;
window.showLoadingIndicator = showLoadingIndicator;