console.log("🎨 ui-manager.js cargado");

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

function updateDeliveryInfo(resultado) {
    const deliveryCostElement = document.getElementById('delivery-cost');
    
    if (deliveryCostElement) {
        deliveryCostElement.dataset.calculating = "false"; 

        if (resultado.dentroCobertura) {
            deliveryCostElement.textContent = `$${resultado.costo}`;
            deliveryCostElement.dataset.cost = resultado.costo;
            deliveryCostElement.className = 'delivery-cost-ok';
            
            showDeliveryDetails(resultado);
            
            if (resultado.esAproximado || resultado.mensajeNota) {
                showNotification(resultado.mensajeNota || "Cálculo basado en ubicación aproximada", 'info');
            }
        } else {
            deliveryCostElement.textContent = "A calcular";
            deliveryCostElement.dataset.cost = "0";
            deliveryCostElement.className = 'delivery-cost-error';
            
            if (resultado.mensaje) {
                showNotification(resultado.mensaje, 'warning');
            } else if (resultado.error) {
                showNotification(resultado.error, 'error');
            }
        }
    }
    
    if (typeof window.updateOrderSummary === 'function') {
        window.updateOrderSummary();
    }
    
    updateFormDeliveryInfo(resultado);
}

function showNotification(mensaje, tipo = 'info') {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = mensaje;
        notification.className = `notification ${tipo} show`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 500);
        }, 5000);
    } else {
        console.warn(mensaje);
    }
}

function showDeliveryDetails(resultado) {
    let detailsElement = document.getElementById('delivery-details');
    if (!detailsElement) {
        detailsElement = document.createElement('div');
        detailsElement.id = 'delivery-details';
        detailsElement.className = 'delivery-details fade-in';
        
        const orderSummary = document.querySelector('.order-summary');
        if (orderSummary) orderSummary.parentNode.insertBefore(detailsElement, orderSummary);
    } else {
        detailsElement.style.display = 'block';
    }
    
    const icon = resultado.esRutaExacta ? '✓' : resultado.esAproximado ? '≈' : '~';
    let zoneClass = 'zone-out';
    const minutos = resultado.duracionCalculada || resultado.tiempo;
    
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
                <span>Tiempo estimado: <strong>${resultado.tiempoEstimado || minutos + ' min'}</strong></span>
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

function updateFormDeliveryInfo(resultado) {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
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
                    Tiempo estimado: <strong>${resultado.tiempoEstimado}</strong> | 
                    Costo envío: <strong>$${resultado.costo}</strong>
                </p>
                ${notaExtra}
            `;
            submitBtn.parentNode.insertBefore(infoDiv, submitBtn);
        }
    }
}

function showLoadingIndicator(show) {
    let indicator = document.getElementById('map-loading-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'map-loading-indicator';
        indicator.className = 'loading-indicator';
        indicator.innerHTML = '<i class="fas fa-spinner"></i> Calculando costo de envío...';
        
        const mapFrame = document.getElementById('map-frame');
        if (mapFrame) {
            mapFrame.parentNode.insertBefore(indicator, mapFrame.nextSibling);
        } else {
            const summary = document.querySelector('.order-summary');
            if(summary) summary.parentNode.insertBefore(indicator, summary);
        }
    }
    
    indicator.style.display = show ? 'block' : 'none';
    
    const deliveryCostElement = document.getElementById('delivery-cost');
    if (deliveryCostElement) {
        if (show) {
            deliveryCostElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            deliveryCostElement.dataset.calculating = "true";
            deliveryCostElement.dataset.cost = "0";
        }
    }
    
    if (show && typeof window.updateOrderSummary === 'function') {
        window.updateOrderSummary();
    }
}

window.addCoverageInfo = addCoverageInfo;
window.updateDeliveryInfo = updateDeliveryInfo;
window.showNotification = showNotification;
window.showDeliveryDetails = showDeliveryDetails;
window.updateFormDeliveryInfo = updateFormDeliveryInfo;
window.showLoadingIndicator = showLoadingIndicator;