// map-init.js - Inicialización y configuración
console.log("🚀 map-init.js cargado");

// 1. INICIALIZACIÓN PRINCIPAL
function initMapSystem() {
    console.log("🔄 Inicializando sistema de mapas...");
    
    setupStaticMap();
    addCoverageInfo();
    
    setTimeout(() => {
        setupAddressValidation();
    }, 1000);
    
    integrateWithExistingSystem();
    
    // Integrar con form.js después de un tiempo
    setTimeout(() => {
        integrarConFormJS();
    }, 1500);
    
    console.log("✅ Sistema de mapas inicializado - Costo: $", MAP_CONFIG.costoPorMinuto, "por minuto");
}

// 2. AUTO-INICIALIZACIÓN
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapSystem);
} else {
    setTimeout(initMapSystem, 500);
}

console.log("✅ Sistema de mapas listo - Costo: $", MAP_CONFIG.costoPorMinuto, "por minuto de viaje");

// Exportar funciones
window.initMapSystem = initMapSystem;
window.calculateDeliveryFromAddress = calculateDeliveryFromAddress;
window.updateDeliveryInfo = updateDeliveryInfo;
window.geocodeAddress = geocodeAddress;
window.generarUrlUbicacion = generarUrlUbicacion;
window.agregarUbicacionAlMensajeWhatsApp = agregarUbicacionAlMensajeWhatsApp;