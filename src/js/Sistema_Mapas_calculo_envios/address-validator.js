console.log("📍 address-validator.js cargado");

function extractCityFromAddress(direccion) {
    const partes = direccion.split(',').map(p => p.trim());
    for (let i = partes.length - 1; i >= 0; i--) {
        const parte = partes[i].toLowerCase();
        const ciudadesConocidas = MAP_CONFIG.allowedCities;
        for (const ciudad of ciudadesConocidas) {
            if (parte.includes(ciudad)) {
                return parte.charAt(0).toUpperCase() + parte.slice(1);
            }
        }
    }
    return null;
}

function setupAddressValidation() {
    
    const addressFields = ['customer-street', 'customer-number', 'customer-neighborhood', 'customer-city'];
    let validationTimeout;
    
    addressFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            ['input', 'blur', 'change'].forEach(evtType => {
                field.addEventListener(evtType, async function() {
                    
                    const calle = document.getElementById('customer-street')?.value.trim();
                    const numero = document.getElementById('customer-number')?.value.trim();
                    const ciudad = document.getElementById('customer-city')?.value.trim();
                    const barrio = document.getElementById('customer-neighborhood')?.value.trim();
                    
                    if (!calle || !numero || !ciudad) {
                        if (typeof window.updateOrderSummary === 'function') {
                            window.updateOrderSummary();
                        }
                        return;
                    }

                    clearTimeout(validationTimeout);
                    
                    validationTimeout = setTimeout(async () => {
                        const direccionCompleta = `${calle} ${numero}, ${barrio}, ${ciudad}`;
                        
                        if (field.dataset.lastCalc === direccionCompleta) return;
                        field.dataset.lastCalc = direccionCompleta;

                        showLoadingIndicator(true);
                        try {
                            const resultado = await calculateDeliveryFromAddress(direccionCompleta);
                            updateDeliveryInfo(resultado);
                        } catch (error) {
                            console.error(error);
                        } finally {
                            showLoadingIndicator(false);
                        }
                    }, 800);
                });
            });
        }
    });
}

window.extractCityFromAddress = extractCityFromAddress;
window.setupAddressValidation = setupAddressValidation;