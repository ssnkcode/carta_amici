// address-validator.js - Validación de direcciones
console.log("📍 address-validator.js cargado");

// 1. Extraer ciudad de una dirección
function extractCityFromAddress(direccion) {
    // Buscar ciudad en la dirección (último elemento después de la última coma)
    const partes = direccion.split(',').map(p => p.trim());
    
    for (let i = partes.length - 1; i >= 0; i--) {
        const parte = partes[i].toLowerCase();
        
        // Lista de ciudades conocidas
        const ciudadesConocidas = MAP_CONFIG.allowedCities;
        for (const ciudad of ciudadesConocidas) {
            if (parte.includes(ciudad)) {
                return parte.charAt(0).toUpperCase() + parte.slice(1);
            }
        }
        
        // Si es una palabra que podría ser una ciudad
        if (parte.length > 2 && !parte.match(/^\d+$/)) {
            return parte.charAt(0).toUpperCase() + parte.slice(1);
        }
    }
    
    return null;
}

// 2. VALIDACIÓN DE DIRECCIONES - MEJORADA
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
                    
                    // Validación básica
                    if (!calle || !numero || !barrio || !ciudad) {
                        return;
                    }
                    
                    const direccionCompleta = `${calle} ${numero}, ${barrio}, ${ciudad}`;
                    
                    showLoadingIndicator(true);
                    try {
                        const resultado = await calculateDeliveryFromAddress(direccionCompleta);
                        updateDeliveryInfo(resultado);
                    } catch (error) {
                        console.error("Error:", error);
                        showNotification("Error al calcular envío. Intenta nuevamente.", "error");
                    } finally {
                        showLoadingIndicator(false);
                    }
                }, 800); // Tiempo reducido
            });
        }
    });
    
    console.log("✅ Validación de direcciones configurada");
}

// Exportar funciones
window.extractCityFromAddress = extractCityFromAddress;
window.setupAddressValidation = setupAddressValidation;