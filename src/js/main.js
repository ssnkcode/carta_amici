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
        
        const excludedFlavors = ["1/2 Docena", "Unidad", "2 x Fritas (Saladas)"];
        
        const empanadaFlavors = data.productos
            .filter(item => item.category === "Empanadas" && !excludedFlavors.includes(item.titulo))
            .map(item => item.titulo);

        foodItems = data.productos.map((item, index) => {
            let itemFlavors = [];
            
            if (item.category === "Empanadas" && (item.titulo === "Unidad" || item.titulo === "1/2 Docena")) {
                itemFlavors = empanadaFlavors;
            }

            return {
                id: index + 1,
                name: item.titulo,
                description: item.descripcion || "",
                price: item.precio,
                category: item.category.toLowerCase(),
                image: item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
                flavors: itemFlavors
            };
        });

        renderFoodItems();
        
    } catch (error) {
        console.error(error);
        const foodGrid = document.getElementById('food-grid');
        foodGrid.innerHTML = '<p class="error-msg">Error al cargar el menú.</p>';
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
        const saucesTotal = item.sauces ? item.sauces.reduce((sum, sauce) => sum + sauce.price, 0) : 0;
        const generalExtrasTotal = item.generalExtras ? item.generalExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0) : 0;
        const extrasTotal = saucesTotal + generalExtrasTotal;
        
        itemsHTML += `
            <div class="selected-item">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-unit-price">($${item.price} c/u)</span>
                </div>
                
                ${item.empandasFlavors && item.empandasFlavors.length > 0 ? `
                    <div class="cart-flavors">
                        <div class="cart-extras-title">Gustos:</div>
                        <ul class="flavors-list">
                            ${item.empandasFlavors.map(f => `<li>• ${f}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

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
    const foodSubtotal = selectedItems.reduce((total, item) => {
        const saucesTotal = item.sauces ? item.sauces.reduce((sum, sauce) => sum + sauce.price, 0) : 0;
        const generalExtrasTotal = item.generalExtras ? item.generalExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0) : 0;
        const itemTotal = (item.price * item.quantity) + saucesTotal + generalExtrasTotal;
        return total + itemTotal;
    }, 0);
    
    const globalExtrasSubtotal = Array.from(document.querySelectorAll('.extra-checkbox:checked'))
        .reduce((total, checkbox) => {
            return total + parseInt(checkbox.dataset.price || 0);
        }, 0);
    
    const subtotal = foodSubtotal + globalExtrasSubtotal;
    
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
    const discountRow = document.getElementById('discount-row');
    const discountAmountElem = document.getElementById('discount-amount');
    
    let total = subtotal;

    if (paymentMethod === 'efectivo') {
        const discount = Math.round(total * 0.10);
        total = total - discount;
        if(discountRow && discountAmountElem) {
            discountRow.style.display = 'flex';
            discountAmountElem.textContent = `-$${discount}`;
        }
    } else {
        if(discountRow) discountRow.style.display = 'none';
    }
    
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total-cost');
    
    if (subtotalElement) subtotalElement.textContent = `$${subtotal}`;
    
    if (totalElement) totalElement.textContent = `$${total}`;

    const floatBtn = document.getElementById('floating-cart-btn');
    const floatCount = document.getElementById('float-count');
    const floatTotal = document.getElementById('float-total');

    if(selectedItems.length > 0) {
        const totalQty = selectedItems.reduce((acc, item) => acc + item.quantity, 0);
        if (floatCount) floatCount.textContent = totalQty;
        if (floatTotal) floatTotal.textContent = `$${total}`;
        if (floatBtn) floatBtn.classList.add('visible');
    } else {
        if (floatBtn) floatBtn.classList.remove('visible');
    }
}

function addToCart(id) {
    const foodItem = foodItems.find(item => item.id === id);
    if (!foodItem) return;
    
    const quantityInput = document.getElementById(`qty-${id}`);
    const quantityToAdd = parseInt(quantityInput.value) || 1;
    
    const isEmpanada = foodItem.category === 'empanadas';
    const isUnit = isEmpanada && foodItem.name.toLowerCase().includes('unidad');
    const isHalfDozen = isEmpanada && foodItem.name.toLowerCase().includes('1/2');
    
    let empandasFlavors = [];
    
    if (isEmpanada) {
        if (isUnit) {
            const flavors = window.getEmpanadaSelection(id, true, false);
            if (!flavors || flavors.length === 0) {
                showNotification("⚠️ Debes seleccionar 1 gusto para la empanada", "error");
                const toggleBtn = document.querySelector(`.extras-toggle-btn[data-product-id="${id}"]`);
                if (toggleBtn && !toggleBtn.classList.contains('expanded')) {
                    toggleBtn.click();
                }
                return;
            }
            empandasFlavors = flavors;
        } else if (isHalfDozen) {
            const selection = window.getEmpanadaSelection(id, false, true);
            
            if (selection.totalCount !== 6) {
                showNotification(`⚠️ Debes seleccionar exactamente 6 empanadas (llevas ${selection.totalCount})`, "error");
                const toggleBtn = document.querySelector(`.extras-toggle-btn[data-product-id="${id}"]`);
                if (toggleBtn && !toggleBtn.classList.contains('expanded')) {
                    toggleBtn.click();
                }
                return;
            }
            empandasFlavors = selection.flavorsList;
        }
    }

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
    
    const existingItemIndex = selectedItems.findIndex(item => 
        item.id === id && 
        JSON.stringify(item.sauces) === JSON.stringify(selectedSauces) &&
        JSON.stringify(item.generalExtras) === JSON.stringify(selectedGeneralExtras) &&
        JSON.stringify(item.empandasFlavors) === JSON.stringify(empandasFlavors) &&
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
            empandasFlavors: empandasFlavors,
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
    if (notesInput) notesInput.value = '';
    
    if (typeof window.resetEmpanadaSelection === 'function') {
        window.resetEmpanadaSelection(productId);
    }
    
    const toggleBtn = document.querySelector(`.extras-toggle-btn[data-product-id="${productId}"]`);
    const extrasContainer = document.getElementById(`extras-container-${productId}`);
    
    if (toggleBtn) toggleBtn.classList.remove('expanded');
    if (extrasContainer) extrasContainer.classList.remove('expanded');
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
    
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', updateOrderSummary);
    });
    
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (typeof processOrder === 'function') {
                processOrder();
            }
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

function showNotification(text, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    if (!notification || !notificationText) return;
    
    notificationText.textContent = text;
    
    notification.className = 'notification';
    notification.classList.add(type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'show'));
    notification.classList.add('show');
    
    const hideTime = type === 'error' || type === 'warning' ? 5000 : 3000;
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