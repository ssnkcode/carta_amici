// whatsapp-integration.js - Integración con WhatsApp
console.log("📱 whatsapp-integration.js cargado");

function integrarConFormJS() {
    console.log("🔗 Integrando con form.js...");
    
    if (typeof window.processOrder === 'function') {
        console.log("✅ Función processOrder encontrada, integrando...");
        
        const originalProcessOrder = window.processOrder;
        
        window.processOrder = function() {
            console.log("📍 processOrder interceptado - Agregando ubicación de Google Maps");
            
            // Generar URL de ubicación
            const ubicacion = generarUrlUbicacion();
            
            if (ubicacion) {
                console.log("✅ Ubicación generada, procesando mensaje...");
                
                // Buscar el textarea del mensaje
                const messageElement = document.getElementById('whatsapp-message');
                if (messageElement) {
                    let mensajeActual = messageElement.value || '';
                    
                    // Verificar si ya tiene la ubicación para evitar duplicados
                    const ubicacionPattern = /UBICACIÓN EN GOOGLE MAPS:.*google\.com\/maps/i;
                    
                    if (!ubicacionPattern.test(mensajeActual)) {
                        // Buscar donde agregar la ubicación (después de la dirección)
                        const lines = mensajeActual.split('\n');
                        let newMessage = '';
                        let ubicacionAgregada = false;
                        
                        for (let i = 0; i < lines.length; i++) {
                            newMessage += lines[i] + '\n';
                            
                            // Buscar la línea de dirección
                            if (!ubicacionAgregada && 
                                (lines[i].includes('DIRECCIÓN DE ENTREGA:') || 
                                 lines[i].includes('Dirección de entrega:') ||
                                 lines[i].includes('📍 *DIRECCIÓN DE ENTREGA:*'))) {
                                
                                // Agregar la ubicación después de la dirección
                                newMessage += `\n📍 *UBICACIÓN EN GOOGLE MAPS:*\n`;
                                newMessage += `${ubicacion.googleMaps}\n\n`;
                                ubicacionAgregada = true;
                                
                                // Saltar las siguientes líneas que son la dirección misma
                                i++; // línea vacía
                                if (lines[i] && lines[i].trim()) i++; // línea de calle
                                if (lines[i] && lines[i].trim()) i++; // línea de barrio/ciudad
                            }
                        }
                        
                        // Si no encontró donde insertar, agregar al final
                        if (!ubicacionAgregada) {
                            newMessage += `\n\n📍 *UBICACIÓN EN GOOGLE MAPS:*\n${ubicacion.googleMaps}\n`;
                        }
                        
                        messageElement.value = newMessage;
                        console.log("✅ Ubicación de Google Maps agregada al mensaje SIN DUPLICADOS");
                    } else {
                        console.log("ℹ️ El mensaje ya contiene ubicación, no se duplica");
                    }
                }
            }
            
            return originalProcessOrder();
        };
        
        console.log("✅ Función processOrder integrada exitosamente");
        
    } else {
        console.warn("⚠️ Función processOrder no encontrada en form.js");
        integrarWhatsappDirectamente();
    }
}

// 1.1 Integración directa con botón de WhatsApp (fallback)
function integrarWhatsappDirectamente() {
    console.log("🔗 Intentando integración directa con botón WhatsApp...");
    
    const whatsappBtn = document.querySelector('.whatsapp-button, .whatsapp-submit-btn, .submit-btn');
    
    if (whatsappBtn) {
        console.log("✅ Botón WhatsApp encontrado");
        
        // Guardar el onclick original
        const originalOnClick = whatsappBtn.onclick;
        
        whatsappBtn.addEventListener('click', function(e) {
            console.log("📍 Botón WhatsApp clickeado - Agregando ubicación");
            
            // Generar ubicación antes de enviar
            const ubicacion = generarUrlUbicacion();
            
            if (ubicacion) {
                // Intentar actualizar el mensaje si existe
                const messageElement = document.getElementById('whatsapp-message');
                if (messageElement) {
                    let mensaje = messageElement.value || '';
                    
                    // Verificar si ya tiene ubicación para evitar duplicados
                    if (!mensaje.includes('google.com/maps') && !mensaje.includes('UBICACIÓN EN GOOGLE MAPS')) {
                        // Agregar ubicación al final del mensaje
                        mensaje += `\n\n📍 *UBICACIÓN EN GOOGLE MAPS:*\n${ubicacion.googleMaps}`;
                        messageElement.value = mensaje;
                        console.log("✅ Ubicación agregada al mensaje");
                    }
                }
            }
            
            // Si hay función original, ejecutarla
            if (originalOnClick) {
                return originalOnClick.call(this, e);
            }
        });
    }
}

// 2. INTEGRACIÓN MEJORADA SIN DUPLICADOS
function agregarUbicacionAlMensajeWhatsApp() {
    console.log("📍 Agregando ubicación al mensaje de WhatsApp...");
    
    const messageElement = document.getElementById('whatsapp-message');
    if (!messageElement) {
        console.warn("⚠️ No se encontró textarea de WhatsApp");
        return false;
    }
    
    // Generar ubicación
    const ubicacion = generarUrlUbicacion();
    if (!ubicacion) {
        console.warn("⚠️ No se pudo generar ubicación");
        return false;
    }
    
    let mensaje = messageElement.value || '';
    
    // VERIFICAR DUPLICADOS: Buscar si ya existe una ubicación similar
    const ubicacionExistenteRegex = /📍 \*UBICACIÓN EN GOOGLE MAPS:\*\s*\nhttps:\/\/www\.google\.com\/maps\/[^\n]*/i;
    
    if (ubicacionExistenteRegex.test(mensaje)) {
        console.log("ℹ️ Ya existe ubicación en el mensaje, reemplazando...");
        // Reemplazar la ubicación existente
        mensaje = mensaje.replace(ubicacionExistenteRegex, 
            `📍 *UBICACIÓN EN GOOGLE MAPS:*\n${ubicacion.googleMaps}`);
    } else {
        console.log("➕ Agregando nueva ubicación...");
        // Buscar el mejor lugar para insertar
        const lines = mensaje.split('\n');
        let newMessage = '';
        let ubicacionInsertada = false;
        
        for (let i = 0; i < lines.length; i++) {
            newMessage += lines[i] + '\n';
            
            // Buscar después de la dirección de entrega
            if (!ubicacionInsertada && lines[i].includes('DIRECCIÓN DE ENTREGA')) {
                // Saltar la línea actual y la siguiente (que debería ser la dirección)
                i++; // Saltar línea de dirección
                
                // Agregar la ubicación
                newMessage += `\n📍 *UBICACIÓN EN GOOGLE MAPS:*\n${ubicacion.googleMaps}\n\n`;
                ubicacionInsertada = true;
            }
        }
        
        // Si no encontró donde insertar, agregar antes del resumen de pago
        if (!ubicacionInsertada) {
            const pagoIndex = mensaje.indexOf('RESUMEN DE PAGO:');
            if (pagoIndex !== -1) {
                mensaje = mensaje.slice(0, pagoIndex) + 
                         `\n📍 *UBICACIÓN EN GOOGLE MAPS:*\n${ubicacion.googleMaps}\n\n` +
                         mensaje.slice(pagoIndex);
            } else {
                // Agregar al final como último recurso
                mensaje += `\n\n📍 *UBICACIÓN EN GOOGLE MAPS:*\n${ubicacion.googleMaps}\n`;
            }
        } else {
            mensaje = newMessage;
        }
    }
    
    messageElement.value = mensaje;
    console.log("✅ Ubicación de Google Maps agregada/actualizada SIN DUPLICADOS");
    return true;
}

// Exportar funciones
window.integrarConFormJS = integrarConFormJS;
window.integrarWhatsappDirectamente = integrarWhatsappDirectamente;
window.agregarUbicacionAlMensajeWhatsApp = agregarUbicacionAlMensajeWhatsApp;