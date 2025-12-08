function generateExtrasHTML(item) {
    let html = '';
    
    const showSauces = ['hamburguesa', 'sandwich', 'papas'].includes(item.category);
    const showGeneralExtras = item.category === 'pizza';
    const showNotes = true;
    
    const requiresFlavors = item.category === 'empanadas' && (item.name.includes('1/2 Docena') || item.name.includes('Unidad'));
    
    let buttonText = '';
    let buttonIcon = '';
    
    if (showSauces && showGeneralExtras) {
        buttonText = 'Agregar Adicionales';
        buttonIcon = 'fa-plus-circle';
    } else if (showSauces) {
        buttonText = 'Agregar Salsas';
        buttonIcon = 'fa-wine-bottle';
    } else if (requiresFlavors) {
        buttonText = 'Elegir Sabores *';
        buttonIcon = 'fa-utensils';
    } else if (showNotes) {
        buttonText = 'Agregar Notas';
        buttonIcon = 'fa-sticky-note';
    }
    
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
        
        if (showNotes) {
            const labelText = requiresFlavors ? 'Elegir sabores (Requerido) *' : 'Notas específicas:';
            const placeholderText = requiresFlavors ? 'Ej: 3 de carne dulce, 3 de jamón y queso...' : 'Ej: Sin orégano, bien cocida, sin cebolla...';
            const labelIcon = requiresFlavors ? 'fa-utensils' : 'fa-sticky-note';

            html += `
                <div class="product-notes-container">
                    <label class="product-notes-label" style="${requiresFlavors ? 'color: #d32f2f; font-weight: 700;' : ''}">
                        <i class="fas ${labelIcon}"></i>
                        ${labelText}
                    </label>
                    <textarea id="product-notes-${item.id}" class="product-notes-input" 
                              placeholder="${placeholderText}" 
                              rows="2"></textarea>
                </div>
            `;
        }
        
        html += `</div>`;
    }
    
    return html;
}

function setupExtrasEventListeners(productId) {
    const toggleBtn = document.querySelector(`.extras-toggle-btn[data-product-id="${productId}"]`);
    const extrasContainer = document.getElementById(`extras-container-${productId}`);
    const notesInput = document.getElementById(`product-notes-${productId}`);
    
    if (notesInput) {
        notesInput.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.style.borderColor = '';
            }
        });
    }

    if (toggleBtn && extrasContainer) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const isCurrentlyExpanded = this.classList.contains('expanded');
            
            document.querySelectorAll('.extras-toggle-btn').forEach(btn => {
                btn.classList.remove('expanded');
            });
            document.querySelectorAll('.extras-container').forEach(container => {
                container.classList.remove('expanded');
            });
            
            if (!isCurrentlyExpanded) {
                this.classList.add('expanded');
                extrasContainer.classList.add('expanded');
            }
        });
    }
    
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

function updateExtraQty(extraId, change) {
    const input = document.getElementById(`extra-qty-${extraId}`);
    if (!input) return;
    
    let currentValue = parseInt(input.value) || 1;
    let newValue = currentValue + change;
    
    if (newValue < 1) newValue = 1;
    if (newValue > 10) newValue = 10;
    
    input.value = newValue;
}

function addToCart(id) {
    const foodItem = foodItems.find(item => item.id === id);
    if (!foodItem) return;
    
    const quantityInput = document.getElementById(`qty-${id}`);
    const quantityToAdd = parseInt(quantityInput.value) || 1;
    
    const sauceCheckboxes = document.querySelectorAll(`.sauce-checkbox[data-product-id="${id}"]:checked`);
    const selectedSauces = Array.from(sauceCheckboxes).map(checkbox => ({
        name: checkbox.dataset.name,
        price: parseInt(checkbox.dataset.price)
    }));
    
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
    
    const notesInput = document.getElementById(`product-notes-${id}`);
    const productNotes = notesInput ? notesInput.value.trim() : '';
    
    const requiresFlavors = foodItem.category === 'empanadas' && (foodItem.name.includes('1/2 Docena') || foodItem.name.includes('Unidad'));

    if (requiresFlavors && !productNotes) {
        showNotification('⚠️ Debes especificar los sabores de las empanadas', 'error');
        
        if (notesInput) {
            notesInput.style.borderColor = '#ff4757';
            
            const toggleBtn = document.querySelector(`.extras-toggle-btn[data-product-id="${id}"]`);
            const extrasContainer = document.getElementById(`extras-container-${id}`);
            
            if (toggleBtn && extrasContainer && !toggleBtn.classList.contains('expanded')) {
                document.querySelectorAll('.extras-toggle-btn').forEach(btn => btn.classList.remove('expanded'));
                document.querySelectorAll('.extras-container').forEach(con => con.classList.remove('expanded'));
                
                toggleBtn.classList.add('expanded');
                extrasContainer.classList.add('expanded');
            }
            
            setTimeout(() => {
                notesInput.focus();
            }, 300);
        }
        return;
    }

    const existingItemIndex = selectedItems.findIndex(item => 
        item.id === id && 
        JSON.stringify(item.sauces) === JSON.stringify(selectedSauces) &&
        JSON.stringify(item.generalExtras) === JSON.stringify(selectedGeneralExtras) &&
        item.notes === productNotes
    );
    
    if (existingItemIndex >= 0) {
        selectedItems[existingItemIndex].quantity += quantityToAdd;
        showNotification(`Se agregaron ${quantityToAdd} más de ${foodItem.name}`, 'success');
    } else {
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
    
    resetProductControls(id);
    quantityInput.value = 1;
    
    renderFoodItems();
    renderSelectedItems();
    updateOrderSummary();
    saveToLocalStorage();
}

function resetProductControls(productId) {
    document.querySelectorAll(`.sauce-checkbox[data-product-id="${productId}"]`).forEach(checkbox => {
        checkbox.checked = false;
        checkbox.parentElement.classList.remove('selected');
    });
    
    document.querySelectorAll(`.general-extra-checkbox[data-product-id="${productId}"]`).forEach(checkbox => {
        checkbox.checked = false;
        checkbox.parentElement.classList.remove('selected');
        const extraId = checkbox.dataset.extraId;
        const qtyInput = document.getElementById(`extra-qty-${extraId}`);
        if (qtyInput) qtyInput.value = 1;
    });
    
    const notesInput = document.getElementById(`product-notes-${productId}`);
    if (notesInput) {
        notesInput.value = '';
        notesInput.style.borderColor = '';
    }
    
    const toggleBtn = document.querySelector(`.extras-toggle-btn[data-product-id="${productId}"]`);
    const extrasContainer = document.getElementById(`extras-container-${productId}`);
    
    if (toggleBtn) toggleBtn.classList.remove('expanded');
    if (extrasContainer) extrasContainer.classList.remove('expanded');
}