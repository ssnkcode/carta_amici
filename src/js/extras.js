function generateExtrasHTML(item) {
    let html = '';
    
    const showSauces = ['hamburguesa', 'sandwich', 'papas'].includes(item.category);
    const showGeneralExtras = item.category === 'pizza';
    
    const isEmpanada = item.category === 'empanadas';
    const isEmpanadaUnidad = isEmpanada && item.name.toLowerCase().includes('unidad');
    const isEmpanadaMediaDocena = isEmpanada && item.name.toLowerCase().includes('1/2');

    const showNotes = true;
    
    let buttonText = '';
    let buttonIcon = '';
    
    if (isEmpanadaUnidad || isEmpanadaMediaDocena) {
        buttonText = 'Elegir Gustos (Obligatorio)';
        buttonIcon = 'fa-utensils';
    } else if (showSauces && showGeneralExtras) {
        buttonText = 'Agregar Adicionales';
        buttonIcon = 'fa-plus-circle';
    } else if (showSauces) {
        buttonText = 'Agregar Salsas';
        buttonIcon = 'fa-wine-bottle';
    } else if (showNotes) {
        buttonText = 'Agregar Notas';
        buttonIcon = 'fa-sticky-note';
    }
    
    if (showSauces || showGeneralExtras || showNotes || isEmpanada) {
        const extraClass = (isEmpanadaUnidad || isEmpanadaMediaDocena) ? 'required-section' : '';
        
        html += `
            <button type="button" class="extras-toggle-btn ${extraClass}" data-product-id="${item.id}">
                <span>
                    <i class="fas ${buttonIcon}"></i>
                    ${buttonText}
                </span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="extras-container" id="extras-container-${item.id}">
        `;
        
        if (isEmpanadaUnidad && item.flavors && item.flavors.length > 0) {
            html += `
                <div class="flavors-section">
                    <h4 class="flavors-title">Seleccioná el gusto (1):</h4>
                    <div class="flavors-grid-radio">
                        ${item.flavors.map((sabor, index) => `
                            <label class="flavor-radio-option">
                                <input type="radio" name="flavor-unit-${item.id}" value="${sabor}" class="flavor-unit-radio">
                                <span class="flavor-name">${sabor}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (isEmpanadaMediaDocena && item.flavors && item.flavors.length > 0) {
            html += `
                <div class="flavors-section">
                    <h4 class="flavors-title">Seleccioná los 6 gustos:</h4>
                    <div class="flavors-counter-info">Llevas seleccionadas: <span id="counter-total-${item.id}">0</span>/6</div>
                    <div class="general-extras-grid">
                        ${item.flavors.map((sabor, index) => `
                            <div class="general-extra-option flavor-counter-row">
                                <span class="flavor-name-counter">${sabor}</span>
                                <div class="extra-quantity-selector">
                                    <button type="button" class="extra-qty-btn minus" onclick="updateFlavorQty('${item.id}', '${index}', -1)">-</button>
                                    <input type="number" id="flavor-qty-${item.id}-${index}" 
                                           class="extra-qty-input flavor-qty-input-${item.id}" 
                                           data-name="${sabor}"
                                           value="0" min="0" max="6" readonly>
                                    <button type="button" class="extra-qty-btn plus" onclick="updateFlavorQty('${item.id}', '${index}', 1)">+</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (showSauces) {
            html += `
                <div class="sauces-section">
                    <h4 class="sauces-title"><i class="fas fa-wine-bottle"></i> Salsas adicionales:</h4>
                    <div class="sauce-options">
                        ${['Mayonesa', 'Ketchup', 'Mostaza'].map(sauce => `
                            <label class="sauce-option">
                                <input type="checkbox" class="sauce-checkbox" data-product-id="${item.id}" data-name="${sauce}" data-price="50">
                                <span class="sauce-name">${sauce}</span>
                                <span class="sauce-price">+$50</span>
                            </label>
                        `).join('')}
                        <label class="sauce-option">
                            <input type="checkbox" class="sauce-checkbox" data-product-id="${item.id}" data-name="Salsa BBQ" data-price="80">
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
                    <h4 class="general-extras-title"><i class="fas fa-plus-circle"></i> Adicionales:</h4>
                    <div class="general-extras-grid">
                        ${[
                            {id: 'doble-mozzarella', name: 'Doble Mozzarella', price: 100, desc: 'Extra de queso'},
                            {id: 'jamon-extra', name: 'Jamón extra', price: 120, desc: 'Doble porción'},
                            {id: 'tomate-extra', name: 'Tomate extra', price: 60, desc: 'Rodajas adicionales'},
                            {id: 'morron', name: 'Morrón', price: 80, desc: 'Tiras de pimiento'},
                            {id: 'aceitunas', name: 'Aceitunas', price: 70, desc: 'Verdes o negras'},
                            {id: 'anchoas', name: 'Anchoas', price: 150, desc: 'Filetes de anchoa'}
                        ].map(extra => `
                            <label class="general-extra-option">
                                <div class="general-extra-info">
                                    <div class="general-extra-label">
                                        <span class="general-extra-name">${extra.name}</span>
                                        <span class="general-extra-description">${extra.desc}</span>
                                    </div>
                                    <span class="general-extra-price">+$${extra.price}</span>
                                </div>
                                <input type="checkbox" class="general-extra-checkbox" 
                                       data-product-id="${item.id}" 
                                       data-extra-id="${extra.id}-${item.id}"
                                       data-name="${extra.name}" 
                                       data-price="${extra.price}">
                                <div class="extra-quantity-selector">
                                    <button type="button" class="extra-qty-btn minus" onclick="updateExtraQty('${extra.id}-${item.id}', -1)">-</button>
                                    <input type="number" id="extra-qty-${extra.id}-${item.id}" class="extra-qty-input" value="1" min="1" max="10" readonly>
                                    <button type="button" class="extra-qty-btn plus" onclick="updateExtraQty('${extra.id}-${item.id}', 1)">+</button>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (showNotes) {
            html += `
                <div class="product-notes-container">
                    <label class="product-notes-label">
                        <i class="fas fa-sticky-note"></i>
                        Notas adicionales:
                    </label>
                    <textarea id="product-notes-${item.id}" class="product-notes-input" 
                              placeholder="Ej: Sin sal, bien cocida..." 
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
    
    if (toggleBtn && extrasContainer) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isCurrentlyExpanded = this.classList.contains('expanded');
            
            if (!isCurrentlyExpanded) {
                this.classList.add('expanded');
                extrasContainer.classList.add('expanded');
            } else {
                this.classList.remove('expanded');
                extrasContainer.classList.remove('expanded');
            }
        });
    }
    
    document.querySelectorAll(`.sauce-checkbox[data-product-id="${productId}"]`).forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const parent = this.parentElement;
            if (this.checked) parent.classList.add('selected');
            else parent.classList.remove('selected');
        });
    });
    
    document.querySelectorAll(`.general-extra-checkbox[data-product-id="${productId}"]`).forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const parent = this.parentElement;
            if (this.checked) parent.classList.add('selected');
            else parent.classList.remove('selected');
        });
    });
    
    document.querySelectorAll(`input[name="flavor-unit-${productId}"]`).forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll(`input[name="flavor-unit-${productId}"]`).forEach(r => {
                r.parentElement.classList.remove('selected');
            });
            if (this.checked) this.parentElement.classList.add('selected');
        });
    });
}

function updateFlavorQty(productId, flavorIndex, change) {
    const input = document.getElementById(`flavor-qty-${productId}-${flavorIndex}`);
    const totalDisplay = document.getElementById(`counter-total-${productId}`);
    
    if (!input || !totalDisplay) return;
    
    let currentTotal = 0;
    const allInputs = document.querySelectorAll(`.flavor-qty-input-${productId}`);
    allInputs.forEach(inp => currentTotal += parseInt(inp.value || 0));
    
    let currentValue = parseInt(input.value) || 0;
    let newValue = currentValue + change;
    
    if (newValue < 0) return;
    
    if (change > 0 && currentTotal >= 6) {
        showNotification("¡Ya seleccionaste las 6 empanadas!", "warning");
        return;
    }
    
    input.value = newValue;
    
    currentTotal = 0;
    allInputs.forEach(inp => currentTotal += parseInt(inp.value || 0));
    totalDisplay.textContent = currentTotal;
    
    if (newValue > 0) input.parentElement.parentElement.classList.add('selected');
    else input.parentElement.parentElement.classList.remove('selected');
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

window.getEmpanadaSelection = function(productId, isUnit, isHalfDozen) {
    if (isUnit) {
        const selected = document.querySelector(`input[name="flavor-unit-${productId}"]:checked`);
        return selected ? [selected.value] : [];
    }
    
    if (isHalfDozen) {
        const flavors = [];
        const inputs = document.querySelectorAll(`.flavor-qty-input-${productId}`);
        inputs.forEach(input => {
            const qty = parseInt(input.value || 0);
            const name = input.dataset.name;
            if (qty > 0) {
                flavors.push(`${qty}x ${name}`);
            }
        });
        
        let totalCount = 0;
        inputs.forEach(input => totalCount += parseInt(input.value || 0));
        
        return {
            flavorsList: flavors,
            totalCount: totalCount
        };
    }
    
    return null;
};

window.resetEmpanadaSelection = function(productId) {
    document.querySelectorAll(`input[name="flavor-unit-${productId}"]`).forEach(r => {
        r.checked = false;
        r.parentElement.classList.remove('selected');
    });
    
    document.querySelectorAll(`.flavor-qty-input-${productId}`).forEach(i => {
        i.value = 0;
        i.parentElement.parentElement.classList.remove('selected');
    });
    const totalDisplay = document.getElementById(`counter-total-${productId}`);
    if (totalDisplay) totalDisplay.textContent = '0';
};