// extras.js - Funciones específicas para adicionales

// Función para generar HTML de extras según categoría
function generateExtrasHTML(item) {
    let html = '';
    
    // Determinar qué extras mostrar según la categoría
    const showSauces = ['hamburguesa', 'sandwich', 'papas'].includes(item.category);
    const showGeneralExtras = item.category === 'pizza'; // Solo pizzas
    const showNotes = true; // Todas las categorías tienen notas
    
    // Texto del botón según lo que se mostrará
    let buttonText = '';
    let buttonIcon = '';
    
    if (showSauces && showGeneralExtras) {
        buttonText = 'Agregar Adicionales';
        buttonIcon = 'fa-plus-circle';
    } else if (showSauces) {
        buttonText = 'Agregar Salsas';
        buttonIcon = 'fa-wine-bottle';
    } else if (showNotes) {
        buttonText = 'Agregar Notas';
        buttonIcon = 'fa-sticky-note';
    }
    
    // Solo mostrar botón si hay algo que mostrar
    if (showSauces || showGeneralExtras || showNotes) {
        html += `
            <button type="button" class="extras-toggle-btn" data-product-id="${item.id}">
                <span>
                    <i class="fas ${buttonIcon}"></i>
                    ${buttonText}
                </span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="extras-container" id="extras-container-${item.id}">
        `;
        
        // Mostrar salsas para categorías específicas
        if (showSauces) {
            html += `
                <div class="sauces-section">
                    <h4 class="sauces-title">
                        <i class="fas fa-wine-bottle"></i>
                        Salsas adicionales:
                    </h4>
                    <div class="sauce-options">
                        <label class="sauce-option">
                            <input type="checkbox" class="sauce-checkbox" 
                                   data-product-id="${item.id}" 
                                   data-name="Mayonesa" 
                                   data-price="50">
                            <span class="sauce-name">Mayonesa</span>
                            <span class="sauce-price">+$50</span>
                        </label>
                        <label class="sauce-option">
                            <input type="checkbox" class="sauce-checkbox" 
                                   data-product-id="${item.id}" 
                                   data-name="Ketchup" 
                                   data-price="50">
                            <span class="sauce-name">Ketchup</span>
                            <span class="sauce-price">+$50</span>
                        </label>
                        <label class="sauce-option">
                            <input type="checkbox" class="sauce-checkbox" 
                                   data-product-id="${item.id}" 
                                   data-name="Mostaza" 
                                   data-price="50">
                            <span class="sauce-name">Mostaza</span>
                            <span class="sauce-price">+$50</span>
                        </label>
                        <label class="sauce-option">
                            <input type="checkbox" class="sauce-checkbox" 
                                   data-product-id="${item.id}" 
                                   data-name="Salsa BBQ" 
                                   data-price="80">
                            <span class="sauce-name">Salsa BBQ</span>
                            <span class="sauce-price">+$80</span>
                        </label>
                    </div>
                </div>
            `;
        }
        
        // Mostrar adicionales generales solo para pizzas
        if (showGeneralExtras) {
            html += `
                <div class="general-extras-section">
                    <h4 class="general-extras-title">
                        <i class="fas fa-plus-circle"></i>
                        Adicionales:
                    </h4>
                    <div class="general-extras-grid">
                        <label class="general-extra-option">
                            <div class="general-extra-info">
                                <div class="general-extra-label">
                                    <span class="general-extra-name">Doble Mozzarella</span>
                                    <span class="general-extra-description">Extra de queso</span>
                                </div>
                                <span class="general-extra-price">+$100</span>
                            </div>
                            <input type="checkbox" class="general-extra-checkbox" 
                                   data-product-id="${item.id}" 
                                   data-extra-id="doble-mozzarella-${item.id}"
                                   data-name="Doble Mozzarella" 
                                   data-price="100">
                            <div class="extra-quantity-selector">
                                <button type="button" class="extra-qty-btn minus" onclick="updateExtraQty('doble-mozzarella-${item.id}', -1)">-</button>
                                <input type="number" id="extra-qty-doble-mozzarella-${item.id}" class="extra-qty-input" value="1" min="1" max="10" readonly>
                                <button type="button" class="extra-qty-btn plus" onclick="updateExtraQty('doble-mozzarella-${item.id}', 1)">+</button>
                            </div>
                        </label>
                        
                        <label class="general-extra-option">
                            <div class="general-extra-info">
                                <div class="general-extra-label">
                                    <span class="general-extra-name">Jamón extra</span>
                                    <span class="general-extra-description">Doble porción</span>
                                </div>
                                <span class="general-extra-price">+$120</span>
                            </div>
                            <input type="checkbox" class="general-extra-checkbox" 
                                   data-product-id="${item.id}" 
                                   data-extra-id="jamon-extra-${item.id}"
                                   data-name="Jamón extra" 
                                   data-price="120">
                            <div class="extra-quantity-selector">
                                <button type="button" class="extra-qty-btn minus" onclick="updateExtraQty('jamon-extra-${item.id}', -1)">-</button>
                                <input type="number" id="extra-qty-jamon-extra-${item.id}" class="extra-qty-input" value="1" min="1" max="10" readonly>
                                <button type="button" class="extra-qty-btn plus" onclick="updateExtraQty('jamon-extra-${item.id}', 1)">+</button>
                            </div>
                        </label>
                        
                        <label class="general-extra-option">
                            <div class="general-extra-info">
                                <div class="general-extra-label">
                                    <span class="general-extra-name">Tomate extra</span>
                                    <span class="general-extra-description">Rodajas adicionales</span>
                                </div>
                                <span class="general-extra-price">+$60</span>
                            </div>
                            <input type="checkbox" class="general-extra-checkbox" 
                                   data-product-id="${item.id}" 
                                   data-extra-id="tomate-extra-${item.id}"
                                   data-name="Tomate extra" 
                                   data-price="60">
                            <div class="extra-quantity-selector">
                                <button type="button" class="extra-qty-btn minus" onclick="updateExtraQty('tomate-extra-${item.id}', -1)">-</button>
                                <input type="number" id="extra-qty-tomate-extra-${item.id}" class="extra-qty-input" value="1" min="1" max="10" readonly>
                                <button type="button" class="extra-qty-btn plus" onclick="updateExtraQty('tomate-extra-${item.id}', 1)">+</button>
                            </div>
                        </label>
                        
                        <label class="general-extra-option">
                            <div class="general-extra-info">
                                <div class="general-extra-label">
                                    <span class="general-extra-name">Morrón</span>
                                    <span class="general-extra-description">Tiras de pimiento</span>
                                </div>
                                <span class="general-extra-price">+$80</span>
                            </div>
                            <input type="checkbox" class="general-extra-checkbox" 
                                   data-product-id="${item.id}" 
                                   data-extra-id="morron-${item.id}"
                                   data-name="Morrón" 
                                   data-price="80">
                            <div class="extra-quantity-selector">
                                <button type="button" class="extra-qty-btn minus" onclick="updateExtraQty('morron-${item.id}', -1)">-</button>
                                <input type="number" id="extra-qty-morron-${item.id}" class="extra-qty-input" value="1" min="1" max="10" readonly>
                                <button type="button" class="extra-qty-btn plus" onclick="updateExtraQty('morron-${item.id}', 1)">+</button>
                            </div>
                        </label>
                        
                        <label class="general-extra-option">
                            <div class="general-extra-info">
                                <div class="general-extra-label">
                                    <span class="general-extra-name">Aceitunas</span>
                                    <span class="general-extra-description">Verdes o negras</span>
                                </div>
                                <span class="general-extra-price">+$70</span>
                            </div>
                            <input type="checkbox" class="general-extra-checkbox" 
                                   data-product-id="${item.id}" 
                                   data-extra-id="aceitunas-${item.id}"
                                   data-name="Aceitunas" 
                                   data-price="70">
                            <div class="extra-quantity-selector">
                                <button type="button" class="extra-qty-btn minus" onclick="updateExtraQty('aceitunas-${item.id}', -1)">-</button>
                                <input type="number" id="extra-qty-aceitunas-${item.id}" class="extra-qty-input" value="1" min="1" max="10" readonly>
                                <button type="button" class="extra-qty-btn plus" onclick="updateExtraQty('aceitunas-${item.id}', 1)">+</button>
                            </div>
                        </label>
                        
                        <label class="general-extra-option">
                            <div class="general-extra-info">
                                <div class="general-extra-label">
                                    <span class="general-extra-name">Anchoas</span>
                                    <span class="general-extra-description">Filetes de anchoa</span>
                                </div>
                                <span class="general-extra-price">+$150</span>
                            </div>
                            <input type="checkbox" class="general-extra-checkbox" 
                                   data-product-id="${item.id}" 
                                   data-extra-id="anchoas-${item.id}"
                                   data-name="Anchoas" 
                                   data-price="150">
                            <div class="extra-quantity-selector">
                                <button type="button" class="extra-qty-btn minus" onclick="updateExtraQty('anchoas-${item.id}', -1)">-</button>
                                <input type="number" id="extra-qty-anchoas-${item.id}" class="extra-qty-input" value="1" min="1" max="10" readonly>
                                <button type="button" class="extra-qty-btn plus" onclick="updateExtraQty('anchoas-${item.id}', 1)">+</button>
                            </div>
                        </label>
                    </div>
                </div>
            `;
        }
        
        // Mostrar notas para todas las categorías (excepto si es pizza, ya tiene el separador arriba)
        if (showNotes) {
            const showSeparator = showSauces || showGeneralExtras;
            html += `
                <div class="product-notes-container">
                    <label class="product-notes-label">
                        <i class="fas fa-sticky-note"></i>
                        Notas específicas:
                    </label>
                    <textarea id="product-notes-${item.id}" class="product-notes-input" 
                              placeholder="Ej: Sin orégano, bien cocida, sin cebolla..." 
                              rows="2"></textarea>
                </div>
            `;
        }
        
        html += `</div>`; // Cierre del contenedor de extras
    }
    
    return html;
}

// Función para configurar event listeners de extras
function setupExtrasEventListeners(productId) {
    // Botón para desplegar/ocultar extras
    const toggleBtn = document.querySelector(`.extras-toggle-btn[data-product-id="${productId}"]`);
    const extrasContainer = document.getElementById(`extras-container-${productId}`);
    
    if (toggleBtn && extrasContainer) {
        toggleBtn.addEventListener('click', function() {
            this.classList.toggle('expanded');
            extrasContainer.classList.toggle('expanded');
        });
    }
    
    // Salsas
    document.querySelectorAll(`.sauce-checkbox[data-product-id="${productId}"]`).forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const parent = this.parentElement;
            if (this.checked) {
                parent.classList.add('selected');
            } else {
                parent.classList.remove('selected');
            }
        });
    });
    
    // Adicionales generales (solo para pizzas)
    document.querySelectorAll(`.general-extra-checkbox[data-product-id="${productId}"]`).forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const parent = this.parentElement;
            if (this.checked) {
                parent.classList.add('selected');
            } else {
                parent.classList.remove('selected');
            }
        });
    });
}

// Función para actualizar cantidad de extras
function updateExtraQty(extraId, change) {
    const input = document.getElementById(`extra-qty-${extraId}`);
    if (!input) return;
    
    let currentValue = parseInt(input.value) || 1;
    let newValue = currentValue + change;
    
    if (newValue < 1) newValue = 1;
    if (newValue > 10) newValue = 10;
    
    input.value = newValue;
}

// Función para agregar al carrito (llamada desde main.js)
function addToCart(id) {
    const foodItem = foodItems.find(item => item.id === id);
    if (!foodItem) return;
    
    const quantityInput = document.getElementById(`qty-${id}`);
    const quantityToAdd = parseInt(quantityInput.value) || 1;
    
    // Obtener salsas seleccionadas para este producto (si aplica)
    const sauceCheckboxes = document.querySelectorAll(`.sauce-checkbox[data-product-id="${id}"]:checked`);
    const selectedSauces = Array.from(sauceCheckboxes).map(checkbox => ({
        name: checkbox.dataset.name,
        price: parseInt(checkbox.dataset.price)
    }));
    
    // Obtener adicionales generales seleccionados para este producto (si aplica - solo pizzas)
    const generalExtras = document.querySelectorAll(`.general-extra-checkbox[data-product-id="${id}"]:checked`);
    const selectedGeneralExtras = Array.from(generalExtras).map(checkbox => {
        const quantityInput = document.getElementById(`extra-qty-${checkbox.dataset.extraId}`);
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
        
        return {
            id: checkbox.dataset.extraId,
            name: checkbox.dataset.name,
            price: parseInt(checkbox.dataset.price),
            quantity: quantity
        };
    });
    
    // Obtener notas específicas del producto (siempre disponible)
    const notesInput = document.getElementById(`product-notes-${id}`);
    const productNotes = notesInput ? notesInput.value.trim() : '';
    
    // Verificar si ya existe en el carrito
    const existingItemIndex = selectedItems.findIndex(item => 
        item.id === id && 
        JSON.stringify(item.sauces) === JSON.stringify(selectedSauces) &&
        JSON.stringify(item.generalExtras) === JSON.stringify(selectedGeneralExtras) &&
        item.notes === productNotes
    );
    
    if (existingItemIndex >= 0) {
        // Si es exactamente el mismo producto con los mismos extras, incrementar cantidad
        selectedItems[existingItemIndex].quantity += quantityToAdd;
        showNotification(`Se agregaron ${quantityToAdd} más de ${foodItem.name}`, 'success');
    } else {
        // Crear nuevo item con sus extras
        const newItem = {
            ...foodItem,
            quantity: quantityToAdd,
            sauces: selectedSauces,
            generalExtras: selectedGeneralExtras,
            notes: productNotes
        };
        
        selectedItems.push(newItem);
        showNotification(`${foodItem.name} agregado al carrito`, 'success');
    }
    
    // Reiniciar controles del producto
    resetProductControls(id);
    quantityInput.value = 1;
    
    renderFoodItems();
    renderSelectedItems();
    updateOrderSummary();
    saveToLocalStorage();
}

// Función para reiniciar controles del producto
function resetProductControls(productId) {
    // Desmarcar todas las salsas
    document.querySelectorAll(`.sauce-checkbox[data-product-id="${productId}"]`).forEach(checkbox => {
        checkbox.checked = false;
        checkbox.parentElement.classList.remove('selected');
    });
    
    // Desmarcar y reiniciar adicionales generales
    document.querySelectorAll(`.general-extra-checkbox[data-product-id="${productId}"]`).forEach(checkbox => {
        checkbox.checked = false;
        checkbox.parentElement.classList.remove('selected');
        const extraId = checkbox.dataset.extraId;
        const qtyInput = document.getElementById(`extra-qty-${extraId}`);
        if (qtyInput) qtyInput.value = 1;
    });
    
    // Limpiar notas del producto
    const notesInput = document.getElementById(`product-notes-${productId}`);
    if (notesInput) notesInput.value = '';
    
    // Cerrar el panel de extras
    const toggleBtn = document.querySelector(`.extras-toggle-btn[data-product-id="${productId}"]`);
    const extrasContainer = document.getElementById(`extras-container-${productId}`);
    
    if (toggleBtn) toggleBtn.classList.remove('expanded');
    if (extrasContainer) extrasContainer.classList.remove('expanded');
}