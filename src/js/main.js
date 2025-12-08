// main.js - Funciones principales del sistema
let foodItems = [];
let selectedItems = [];
let currentCategory = "todos";

document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadFromLocalStorage();
    setupEventListeners();
    updateOrderSummary();
});

async function loadProducts() {
    try {
        const response = await fetch('./src/products/products.json');
        const data = await response.json();
        
        foodItems = data.productos.map((item, index) => ({
            id: index + 1,
            name: item.titulo,
            description: item.descripcion || "",
            price: item.precio,
            category: item.category.toLowerCase(),
            image: item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
        }));

        renderFoodItems();
        
    } catch (error) {
        console.error("Error cargando productos:", error);
        const foodGrid = document.getElementById('food-grid');
        foodGrid.innerHTML = '<p class="error-msg">Error al cargar el menú. Por favor intenta más tarde.</p>';
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('deliciasExpress_selectedItems', JSON.stringify(selectedItems));
        localStorage.setItem('deliciasExpress_currentCategory', currentCategory);
    } catch (e) {
        console.warn(e);
    }
}

function loadFromLocalStorage() {
    try {
        const savedItems = localStorage.getItem('deliciasExpress_selectedItems');
        const savedCategory = localStorage.getItem('deliciasExpress_currentCategory');
        
        if (savedItems) {
            selectedItems = JSON.parse(savedItems);
            renderSelectedItems();
        }
        
        if (savedCategory) {
            currentCategory = savedCategory;
            document.querySelectorAll('.category-tab').forEach(tab => {
                if (tab.dataset.category === currentCategory) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
        }
    } catch (e) {
        console.warn(e);
    }
}

function renderFoodItems() {
    const foodGrid = document.getElementById('food-grid');
    foodGrid.innerHTML = '';
    
    const filteredItems = currentCategory === "todos" 
        ? foodItems 
        : foodItems.filter(item => item.category === currentCategory);
    
    filteredItems.forEach(item => {
        const inCart = selectedItems.find(selected => selected.id === item.id);
        
        const foodItem = document.createElement('div');
        foodItem.className = `food-item ${inCart ? 'in-cart' : ''}`;
        foodItem.dataset.id = item.id;
        
        // Generar HTML para controles de extras
        const extrasHTML = generateExtrasHTML(item);
        
        foodItem.innerHTML = `
            <div class="food-img" style="background-image: url('${item.image}')"></div>
            <div class="food-content">
                <h3 class="food-title">${item.name}</h3>
                <p class="food-description">${item.description}</p>
                <div class="food-footer">
                    <div class="food-price">$${item.price}</div>
                </div>
                
                ${extrasHTML}
                
                <div class="card-actions">
                    <div class="quantity-selector">
                        <button class="qty-btn minus" onclick="decreaseCardQty(${item.id})">-</button>
                        <input type="number" id="qty-${item.id}" value="1" min="1" max="99" class="qty-input-card" readonly>
                        <button class="qty-btn plus" onclick="increaseCardQty(${item.id})">+</button>
                    </div>
                    <button class="add-btn" onclick="addToCart(${item.id})">
                        Agregar
                    </button>
                </div>
            </div>
        `;
        
        foodGrid.appendChild(foodItem);
        
        // Agregar event listeners para los nuevos controles
        setTimeout(() => {
            setupExtrasEventListeners(item.id);
        }, 100);
    });
}

function increaseCardQty(id) {
    const input = document.getElementById(`qty-${id}`);
    let value = parseInt(input.value);
    if (value < 99) input.value = value + 1;
}

function decreaseCardQty(id) {
    const input = document.getElementById(`qty-${id}`);
    let value = parseInt(input.value);
    if (value > 1) input.value = value - 1;
}

function renderSelectedItems() {
    const selectedList = document.getElementById('selected-list');
    
    if (!selectedList) return;
    
    if (selectedItems.length === 0) {
        selectedList.innerHTML = `
            <div class="empty-cart" id="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Tu carrito está vacío</p>
                <p>Selecciona productos del catálogo</p>
            </div>
        `;
        return;
    }
    
    let itemsHTML = '';
    
    selectedItems.forEach((item, index) => {
        // Calcular subtotal de extras
        const saucesTotal = item.sauces ? item.sauces.reduce((sum, sauce) => sum + sauce.price, 0) : 0;
        const generalExtrasTotal = item.generalExtras ? item.generalExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0) : 0;
        const extrasTotal = saucesTotal + generalExtrasTotal;
        
        itemsHTML += `
            <div class="selected-item">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-unit-price">($${item.price} c/u)</span>
                </div>
                
                ${item.notes ? `<div class="cart-product-notes">📝 ${item.notes}</div>` : ''}
                
                ${(item.sauces && item.sauces.length > 0 || item.generalExtras && item.generalExtras.length > 0) ? `
                    <div class="cart-extras">
                        <div class="cart-extras-title">Adicionales:</div>
                        ${item.sauces && item.sauces.length > 0 ? item.sauces.map(sauce => `
                            <div class="cart-extra-item">
                                <span class="cart-extra-name">
                                    <i class="fas fa-wine-bottle"></i> ${sauce.name}
                                </span>
                                <span class="cart-extra-price">+$${sauce.price}</span>
                            </div>
                        `).join('') : ''}
                        
                        ${item.generalExtras && item.generalExtras.length > 0 ? item.generalExtras.map(extra => `
                            <div class="cart-extra-item">
                                <span class="cart-extra-name">
                                    <i class="fas fa-plus-circle"></i> ${extra.name}
                                    <span class="cart-extra-quantity">x${extra.quantity}</span>
                                </span>
                                <span class="cart-extra-price">+$${extra.price * extra.quantity}</span>
                            </div>
                        `).join('') : ''}
                    </div>
                ` : ''}
                
                <div class="item-actions">
                    <div class="cart-qty-selector">
                        <button class="cart-qty-btn" onclick="updateCartItemQuantity(${index}, -1)">-</button>
                        <input type="text" value="${item.quantity}" class="cart-qty-input" readonly>
                        <button class="cart-qty-btn" onclick="updateCartItemQuantity(${index}, 1)">+</button>
                    </div>
                    <div class="item-price">$${(item.price * item.quantity) + extrasTotal}</div>
                    <button class="remove-item-btn" onclick="removeSelectedItem(${index})" aria-label="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    });

    itemsHTML += `
        <div class="cart-footer-actions">
            <button onclick="openClearCartModal()" class="clear-cart-btn">
                <i class="fas fa-trash"></i> Vaciar Carrito
            </button>
        </div>
    `;
    
    selectedList.innerHTML = itemsHTML;
}

function updateCartItemQuantity(index, change) {
    const item = selectedItems[index];
    const newQuantity = item.quantity + change;

    if (newQuantity < 1) {
        removeSelectedItem(index);
        return;
    }

    if (newQuantity > 99) return;

    item.quantity = newQuantity;
    
    renderSelectedItems();
    updateOrderSummary();
    saveToLocalStorage();
}

function removeSelectedItem(index) {
    const removedItem = selectedItems[index];
    selectedItems.splice(index, 1);
    showNotification(`${removedItem.name} eliminado`, 'success');
    
    renderSelectedItems();
    renderFoodItems();
    updateOrderSummary();
    saveToLocalStorage();
}

function openClearCartModal() {
    document.getElementById('confirmation-modal').classList.add('active');
}

function closeClearCartModal() {
    document.getElementById('confirmation-modal').classList.remove('active');
}

function confirmClearCart() {
    selectedItems = [];
    renderSelectedItems();
    renderFoodItems();
    updateOrderSummary();
    saveToLocalStorage();
    closeClearCartModal();
    showNotification('Carrito vaciado correctamente', 'success');
    
    document.querySelectorAll('.extra-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
}

function updateOrderSummary() {
    // Calcular subtotal de productos con sus extras
    const foodSubtotal = selectedItems.reduce((total, item) => {
        const saucesTotal = item.sauces ? item.sauces.reduce((sum, sauce) => sum + sauce.price, 0) : 0;
        const generalExtrasTotal = item.generalExtras ? item.generalExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0) : 0;
        const itemTotal = (item.price * item.quantity) + saucesTotal + generalExtrasTotal;
        return total + itemTotal;
    }, 0);
    
    // Calcular subtotal de extras globales (los que ya estaban)
    const globalExtrasSubtotal = Array.from(document.querySelectorAll('.extra-checkbox:checked'))
        .reduce((total, checkbox) => {
            return total + parseInt(checkbox.dataset.price || 0);
        }, 0);
    
    const subtotal = foodSubtotal + globalExtrasSubtotal;
    const deliveryCost = 300;
    const total = subtotal + deliveryCost;
    
    const subtotalElement = document.getElementById('subtotal');
    const deliveryElement = document.getElementById('delivery-cost');
    const totalElement = document.getElementById('total-cost');
    
    if (subtotalElement) subtotalElement.textContent = `$${subtotal}`;
    if (deliveryElement) deliveryElement.textContent = `$${deliveryCost}`;
    if (totalElement) totalElement.textContent = `$${total}`;

    // Update Floating Button
    const floatBtn = document.getElementById('floating-cart-btn');
    const floatCount = document.getElementById('float-count');
    const floatTotal = document.getElementById('float-total');

    if(selectedItems.length > 0) {
        const totalQty = selectedItems.reduce((acc, item) => acc + item.quantity, 0);
        floatCount.textContent = totalQty;
        floatTotal.textContent = `$${total}`;
        floatBtn.classList.add('visible');
    } else {
        floatBtn.classList.remove('visible');
    }
}

function setupEventListeners() {
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            currentCategory = this.dataset.category;
            renderFoodItems();
            saveToLocalStorage();
        });
    });
    
    document.querySelectorAll('.extra-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateOrderSummary();
            saveToLocalStorage();
            
            if (this.checked) {
                showNotification(`${this.dataset.name} añadido`, 'success');
            }
        });
    });
    
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendOrderViaWhatsApp();
        });
    }
    
    const phoneInput = document.getElementById('customer-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 15);
        });
    }
    
    const notification = document.getElementById('notification');
    if (notification) {
        notification.addEventListener('click', function() {
            this.classList.remove('show');
        });
    }

    const modalCancelBtn = document.getElementById('modal-cancel');
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', closeClearCartModal);
    }

    const modalConfirmBtn = document.getElementById('modal-confirm');
    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener('click', confirmClearCart);
    }
    
    const modalOverlay = document.getElementById('confirmation-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeClearCartModal();
            }
        });
    }

    // Floating Button Logic
    const floatingBtn = document.getElementById('floating-cart-btn');
    if(floatingBtn) {
        floatingBtn.addEventListener('click', function() {
            const cartSection = document.getElementById('cart-section');
            if(cartSection) {
                cartSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

function sendOrderViaWhatsApp() {
    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const addressInput = document.getElementById('customer-address');
    const notesInput = document.getElementById('order-notes');
    
    if (!nameInput || !phoneInput || !addressInput) {
        showNotification('Error: formulario no encontrado', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    const notes = notesInput ? notesInput.value.trim() : '';
    
    if (!name) {
        showNotification('Por favor, ingresa tu nombre', 'error');
        nameInput.focus();
        return;
    }
    
    if (!phone || phone.length < 8) {
        showNotification('Por favor, ingresa un número de WhatsApp válido', 'error');
        phoneInput.focus();
        return;
    }
    
    if (!address) {
        showNotification('Por favor, ingresa tu dirección de entrega', 'error');
        addressInput.focus();
        return;
    }
    
    if (selectedItems.length === 0) {
        showNotification('Por favor, selecciona al menos un producto', 'error');
        return;
    }
    
    const selectedExtras = Array.from(document.querySelectorAll('.extra-checkbox:checked'))
        .map(checkbox => ({
            name: checkbox.dataset.name || 'Adicional',
            price: parseInt(checkbox.dataset.price || 0)
        }));
    
    // Calcular subtotal incluyendo extras de productos
    const foodSubtotal = selectedItems.reduce((total, item) => {
        const saucesTotal = item.sauces ? item.sauces.reduce((sum, sauce) => sum + sauce.price, 0) : 0;
        const generalExtrasTotal = item.generalExtras ? item.generalExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0) : 0;
        const itemTotal = (item.price * item.quantity) + saucesTotal + generalExtrasTotal;
        return total + itemTotal;
    }, 0);
    
    const extraSubtotal = selectedExtras.reduce((total, extra) => total + extra.price, 0);
    const subtotal = foodSubtotal + extraSubtotal;
    const deliveryCost = 300;
    const total = subtotal + deliveryCost;
    
    let message = `*NUEVO PEDIDO - Comidas AMICI*%0A%0A`;
    message += `*Cliente:* ${name}%0A`;
    message += `*Teléfono:* ${phone}%0A`;
    message += `*Dirección:* ${address}%0A`;
    message += `%0A*PEDIDO:*%0A`;
    
    selectedItems.forEach(item => {
        // Calcular total del item con extras
        const saucesTotal = item.sauces ? item.sauces.reduce((sum, sauce) => sum + sauce.price, 0) : 0;
        const generalExtrasTotal = item.generalExtras ? item.generalExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0) : 0;
        const itemTotal = (item.price * item.quantity) + saucesTotal + generalExtrasTotal;
        
        message += `➡ *${item.name}* x${item.quantity} - $${itemTotal}%0A`;
        
        // Agregar salsas
        if (item.sauces && item.sauces.length > 0) {
            item.sauces.forEach(sauce => {
                message += `   🍯 ${sauce.name} (+$${sauce.price})%0A`;
            });
        }
        
        // Agregar adicionales generales
        if (item.generalExtras && item.generalExtras.length > 0) {
            item.generalExtras.forEach(extra => {
                message += `   ➕ ${extra.name} x${extra.quantity} (+$${extra.price * extra.quantity})%0A`;
            });
        }
        
        // Agregar notas del producto
        if (item.notes) {
            message += `   📝 *Nota:* ${item.notes}%0A`;
        }
    });
    
    if (selectedExtras.length > 0) {
        message += `%0A*Adicionales generales:*%0A`;
        selectedExtras.forEach(extra => {
            message += `➡ ${extra.name} - $${extra.price}%0A`;
        });
    }
    
    if (notes !== '') {
        message += `%0A*Notas adicionales:*%0A${notes}%0A`;
    }
    
    message += `%0A*RESUMEN DE PAGO:*%0A`;
    message += `Subtotal: $${subtotal}%0A`;
    message += `Costo de envío: $${deliveryCost}%0A`;
    message += `*TOTAL: $${total}*%0A%0A`;
    message += `*¡Gracias por tu pedido!*`;
    
    const phoneNumber = "5493541682310"; 
    
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${message}`;
    
    const newWindow = window.open(whatsappURL, '_blank');
    
    if (newWindow) {
        showNotification('Pedido enviado por WhatsApp ✓', 'success');
        
        setTimeout(() => {
            if (document.getElementById('order-form')) {
                document.getElementById('order-form').reset();
            }
            
            selectedItems = [];
            renderFoodItems();
            renderSelectedItems();
            updateOrderSummary();
            saveToLocalStorage();
            
            document.querySelectorAll('.extra-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // También limpiar los extras específicos de productos
            document.querySelectorAll('.sauce-checkbox').forEach(checkbox => {
                checkbox.checked = false;
                checkbox.parentElement.classList.remove('selected');
            });
            
            document.querySelectorAll('.general-extra-checkbox').forEach(checkbox => {
                checkbox.checked = false;
                checkbox.parentElement.classList.remove('selected');
            });
            
            document.querySelectorAll('.extra-qty-input').forEach(input => {
                input.value = 1;
            });
            
            document.querySelectorAll('.product-notes-input').forEach(textarea => {
                textarea.value = '';
            });
            
            // Cerrar todos los botones de extras
            document.querySelectorAll('.extras-toggle-btn').forEach(btn => {
                btn.classList.remove('expanded');
            });
            
            document.querySelectorAll('.extras-container').forEach(container => {
                container.classList.remove('expanded');
            });
            
            showNotification('Formulario reiniciado. ¡Gracias por tu pedido!', 'success');
        }, 2000);
    } else {
        showNotification('Error al abrir WhatsApp. Por favor, habilita las ventanas emergentes.', 'error');
    }
}

function showNotification(text, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    if (!notification || !notificationText) return;
    
    notificationText.textContent = text;
    
    notification.className = 'notification';
    notification.classList.add(type === 'error' ? 'error' : 'show');
    notification.classList.add('show');
    
    const hideTime = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
        notification.classList.remove('show');
    }, hideTime);
}

document.addEventListener('touchstart', function() {}, {passive: true});

document.addEventListener('touchmove', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        e.preventDefault();
    }
}, {passive: false});

// Inicializar formulario y mapa cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Si el archivo form.js está cargado, inicializar
    if (typeof initFormAndMap === 'function') {
        initFormAndMap();
    }
});