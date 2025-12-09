// whatsapp-integration.js - Integración con WhatsApp (DESACTIVADO PARA EVITAR DUPLICACIÓN)
console.log("📱 whatsapp-integration.js cargado - MODO DESACTIVADO");
console.log("ℹ️ Esta funcionalidad está desactivada para evitar duplicación en el mensaje");
console.log("ℹ️ La ubicación de Google Maps ahora se genera directamente en form.js");

// Función auxiliar que puede ser útil para otros usos
function generarUrlUbicacion() {
    try {
        const calle = document.getElementById('customer-street')?.value.trim() || '';
        const numero = document.getElementById('customer-number')?.value.trim() || '';
        const barrio = document.getElementById('customer-neighborhood')?.value.trim() || '';
        const ciudad = document.getElementById('customer-city')?.value.trim() || '';
        
        if (!calle || !numero || !ciudad) {
            return null;
        }
        
        let direccionCompleta = `${calle} ${numero}`;
        if (barrio) direccionCompleta += `, ${barrio}`;
        direccionCompleta += `, ${ciudad}, Córdoba, Argentina`;
        
        const direccionCodificada = encodeURIComponent(direccionCompleta);
        const urlGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${direccionCodificada}`;
        
        return {
            googleMaps: urlGoogleMaps,
            direccion: direccionCompleta
        };
    } catch (error) {
        console.error("❌ Error generando ubicación:", error);
        return null;
    }
}

// Función placeholder - NO INTERFIERE CON FORM.JS
function integrarConFormJS() {
    console.log("✅ La generación de ubicación ahora está integrada directamente en form.js");
    return true;
}

// Función placeholder
function integrarWhatsappDirectamente() {
    console.log("ℹ️ Esta función no es necesaria - form.js maneja todo");
}

// Función placeholder
function agregarUbicacionAlMensajeWhatsApp() {
    console.log("ℹ️ La ubicación se agrega directamente en form.js - función desactivada");
    return false;
}

// Exportar funciones (solo por compatibilidad)
window.generarUrlUbicacion = generarUrlUbicacion;
window.integrarConFormJS = integrarConFormJS;
window.integrarWhatsappDirectamente = integrarWhatsappDirectamente;
window.agregarUbicacionAlMensajeWhatsApp = agregarUbicacionAlMensajeWhatsApp;

// NO AUTOEJECUTAR para evitar interferencias
console.log("✅ whatsapp-integration.js configurado en modo pasivo");