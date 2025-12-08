const FORM_CONFIG = {
    phonePattern: /^[0-9]{10,15}$/,
    defaultDeliveryCost: 300,
    whatsappNumber: '5493541682310',
    businessLocation: {
        address: "Av. Roque Sáenz Peña, Córdoba Capital, Córdoba", 
        lat: -31.307277,  
        lng: -64.463337,    
        zoom: 16 
    }
};

function getCarritoActual() {
    if (typeof selectedItems !== 'undefined' && Array.isArray(selectedItems)) {
        return selectedItems;
    }
    if (window.selectedItems && Array.isArray(window.selectedItems)) {
        return window.selectedItems;
    }
    try {
        const saved = localStorage.getItem('deliciasExpress_selectedItems');
        if (saved) return JSON.parse(saved);
    } catch(e) {}
    
    return [];
}

function setupMap() {
    const mapFrame = document.getElementById('map-frame');
    if (!mapFrame) return;
    
    const { lat, lng, address } = FORM_CONFIG.businessLocation;
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.003},${lat-0.003},${lng+0.003},${lat+0.003}&layer=mapnik&marker=${lat},${lng}`;
    
    mapFrame.innerHTML = `
        <iframe 
            src="${osmUrl}"
            width="100%" 
            height="100%" 
            style="border:none;"
            allowfullscreen
            loading="lazy"
            title="Ubicación - ${address}">
        </iframe>
    `;
}

function validateForm() {
    const carrito = getCarritoActual();
    
    if (carrito.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('Tu carrito está vacío', 'error');
        } else {
            alert('Tu carrito está vacío');
        }
        const cartSection = document.getElementById('food-grid');
        if(cartSection) cartSection.scrollIntoView({ behavior: 'smooth' });
        return false;
    }
    
    const requiredFields = [
        {id: 'customer-name'},
        {id: 'customer-phone'},
        {id: 'customer-city'},
        {id: 'customer-street'},
        {id: 'customer-number'},
        {id: 'customer-neighborhood'}
    ];
    
    let isValid = true;
    let firstErrorField = null;
    
    for (let field of requiredFields) {
        const el = document.getElementById(field.id);
        if (el) {
            if (!el.value.trim()) {
                el.style.borderColor = '#ff4757';
                if (!firstErrorField) firstErrorField = el;
                isValid = false;
            } else {
                el.style.borderColor = '#2ecc71';
            }
        }
    }

    const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
    const paymentContainer = document.querySelector('.payment-options');
    
    if (!paymentMethod) {
        if(paymentContainer) paymentContainer.style.border = '1px solid #ff4757';
        isValid = false;
        if (!firstErrorField && paymentContainer) firstErrorField = paymentContainer;
    } else {
        if(paymentContainer) paymentContainer.style.border = 'none';
    }
    
    if (!isValid && firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
        if (typeof showNotification === 'function') {
            showNotification('Completa los campos obligatorios', 'error');
        }
        return false;
    }
    
    return true;
}

function processOrder() {
    if (!validateForm()) return;

    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    submitBtn.disabled = true;

    try {
        const data = {
            name: document.getElementById('customer-name').value.trim(),
            phone: document.getElementById('customer-phone').value.trim(),
            city: document.getElementById('customer-city').value.trim(),
            street: document.getElementById('customer-street').value.trim(),
            number: document.getElementById('customer-number').value.trim(),
            neighborhood: document.getElementById('customer-neighborhood').value.trim(),
            notes: document.getElementById('order-notes')?.value.trim() || '',
            payment: document.querySelector('input[name="payment-method"]:checked').value
        };

        const direccionCompleta = `${data.street} ${data.number}, ${data.neighborhood}, ${data.city}`;
        const carrito = getCarritoActual();

        const subtotal = carrito.reduce((total, item) => {
            const saucesTotal = item.sauces ? item.sauces.reduce((s, sauce) => s + sauce.price, 0) : 0;
            const extrasTotal = item.generalExtras ? item.generalExtras.reduce((s, extra) => s + (extra.price * extra.quantity), 0) : 0;
            return total + ((item.price * item.quantity) + saucesTotal + extrasTotal);
        }, 0);

        const globalExtras = Array.from(document.querySelectorAll('.extra-checkbox:checked'))
            .reduce((total, checkbox) => total + parseInt(checkbox.dataset.price || 0), 0);

        const envio = FORM_CONFIG.defaultDeliveryCost;
        let total = subtotal + globalExtras + envio;
        let discount = 0;

        if (data.payment === 'efectivo') {
            discount = Math.round(total * 0.10);
            total = total - discount;
        }

        const EMOJIS = {
            pizza: '\uD83C\uDF55',
            user: '\uD83D\uDC64',
            phone: '\uD83D\uDCF1',
            pin: '\uD83D\uDCCD',
            note: '\uD83D\uDCDD',
            cart: '\uD83D\uDED2',
            bullet: '\u25AA',
            arrow: '\u21AA',
            box: '\uD83D\uDCE6',
            card: '\uD83D\uDCB3',
            bill: '\uD83E\uDDFE',
            moto: '\uD83D\uDEF5',
            party: '\uD83C\uDF89',
            check: '\u2705'
        };

        let msg = `*HOLA, QUIERO REALIZAR UN PEDIDO* ${EMOJIS.pizza}\n\n`;
        
        msg += `${EMOJIS.user} *Cliente:* ${data.name}\n`;
        msg += `${EMOJIS.phone} *Tel:* ${data.phone}\n`;
        msg += `${EMOJIS.pin} *Dirección:* ${direccionCompleta}\n`;
        
        if (data.notes) {
            msg += `${EMOJIS.note} *Nota a cocina:* ${data.notes}\n`;
        }
        
        msg += `\n--------------------------------\n`;
        msg += `${EMOJIS.cart} *DETALLE DEL PEDIDO:*\n`;
        
        carrito.forEach((item) => {
            msg += `\n${EMOJIS.bullet} *${item.quantity}x ${item.name}*`;
            
            const isEmpanada = item.category === 'empanadas';
            if (item.notes) {
                msg += `\n   ${EMOJIS.arrow} ${isEmpanada ? 'Sabores' : 'Nota'}: ${item.notes}`;
            }

            if (item.sauces && item.sauces.length > 0) {
                const salsaNames = item.sauces.map(s => s.name).join(', ');
                msg += `\n   + Salsas: ${salsaNames}`;
            }

            if (item.generalExtras && item.generalExtras.length > 0) {
                item.generalExtras.forEach(extra => {
                    msg += `\n   + ${extra.quantity}x ${extra.name}`;
                });
            }
            msg += `\n`;
        });

        const selectedGlobalExtras = Array.from(document.querySelectorAll('.extra-checkbox:checked'));
        if(selectedGlobalExtras.length > 0) {
             msg += `\n${EMOJIS.box} *ADICIONALES:*\n`;
             selectedGlobalExtras.forEach(ex => {
                 msg += `   • ${ex.dataset.name}\n`;
             });
        }

        msg += `\n--------------------------------\n`;
        msg += `💰 *RESUMEN DE PAGO:*\n`;
        
        const paymentLabel = data.payment.charAt(0).toUpperCase() + data.payment.slice(1);
        
        msg += `${EMOJIS.card} Pago: *${paymentLabel}*\n`;
        msg += `${EMOJIS.bill} Subtotal: $${subtotal + globalExtras}\n`;
        msg += `${EMOJIS.moto} Envío: $${envio}\n`;
        
        if (discount > 0) {
            msg += `${EMOJIS.party} Descuento (10%): -$${discount}\n`;
        }
        
        msg += `\n${EMOJIS.check} *TOTAL A PAGAR: $${total}*`;
        
        const url = `https://wa.me/${FORM_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
        
        setTimeout(() => {
            window.open(url, '_blank');
            submitBtn.innerHTML = '<i class="fas fa-check"></i> ¡Enviado!';
            submitBtn.style.background = '#2ecc71';
            
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = '';
            }, 3000);
        }, 800);

    } catch (error) {
        console.error(error);
        alert("Error al procesar. Intenta de nuevo.");
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function initForm() {
    setupMap();
    
    const form = document.getElementById('order-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            processOrder();
        });
    }

    const phoneInput = document.getElementById('customer-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
}

window.processOrder = processOrder;
window.validateForm = validateForm;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForm);
} else {
    initForm();
}