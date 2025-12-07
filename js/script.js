
// Datos del catálogo de alimentos
const foodItems = [
    {
        id: 1,
        name: "Hamburguesa Clásica",
        description: "Carne de res, lechuga, tomate, cebolla y queso cheddar",
        price: 1200,
        category: "hamburguesas",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 2,
        name: "Hamburguesa BBQ",
        description: "Carne de res, salsa BBQ, aros de cebolla y queso fundido",
        price: 1400,
        category: "hamburguesas",
        image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        name: "Pizza Margarita",
        description: "Salsa de tomate, mozzarella fresca y albahaca",
        price: 1800,
        category: "pizzas",
        image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 4,
        name: "Pizza Pepperoni",
        description: "Salsa de tomate, mozzarella y pepperoni",
        price: 2000,
        category: "pizzas",
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 5,
        name: "Ensalada César",
        description: "Lechuga romana, pollo a la parrilla, crutones y aderezo césar",
        price: 1100,
        category: "ensaladas",
        image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 6,
        name: "Ensalada Mediterránea",
        description: "Tomate, pepino, aceitunas, queso feta y aderezo de oliva",
        price: 1000,
        category: "ensaladas",
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 7,
        name: "Refresco Grande",
        description: "Coca-Cola, Sprite o Fanta (500ml)",
        price: 400,
        category: "bebidas",
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 8,
        name: "Agua Mineral",
        description: "Agua sin gas (500ml)",
        price: 300,
        category: "bebidas",
        image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    }
];

// Estado de la aplicación
let selectedItems = [];
let currentCategory = "todos";

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos del localStorage si existen
    loadFromLocalStorage();
    
    // Inicializar componentes
    renderFoodItems();
    setupEventListeners();
    updateOrderSummary();
    
    // Inicializar menú hamburguesa
    initMobileMenu();
});

// Menú hamburguesa para móviles
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navWhatsappButton = document.getElementById('nav-whatsapp-button');
    
    menuToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        menuToggle.innerHTML = navMenu.classList.contains('active') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    });
    
    // Cerrar menú al hacer clic en un enlace
    navWhatsappButton.addEventListener('click', function() {
        navMenu.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    });
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function(event) {
        if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
            navMenu.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // Cerrar menú en pantallas grandes
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navMenu.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
}

// Guardar en localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('deliciasExpress_selectedItems', JSON.stringify(selectedItems));
        localStorage.setItem('deliciasExpress_currentCategory', currentCategory);
    } catch (e) {
        console.warn('No se pudo guardar en localStorage:', e);
    }
}

// Cargar desde localStorage
function loadFromLocalStorage() {
    try {
        const savedItems = localStorage.getItem('deliciasExpress_selectedItems');
        const savedCategory = localStorage.getItem('deliciasExpress_currentCategory');
        
        if (savedItems) {
            selectedItems = JSON.parse(savedItems);
        }
        
        if (savedCategory) {
            currentCategory = savedCategory;
            // Activar la pestaña correspondiente
            document.querySelectorAll('.category-tab').forEach(tab => {
                if (tab.dataset.category === currentCategory) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
        }
    } catch (e) {
        console.warn('No se pudo cargar desde localStorage:', e);
    }
}

// Renderizar los elementos del catálogo
function renderFoodItems() {
    const foodGrid = document.getElementById('food-grid');
    foodGrid.innerHTML = '';
    
    // Filtrar elementos por categoría
    const filteredItems = currentCategory === "todos" 
        ? foodItems 
        : foodItems.filter(item => item.category === currentCategory);
    
    // Crear elementos HTML para cada comida
    filteredItems.forEach(item => {
        const isSelected = selectedItems.some(selected => selected.id === item.id);
        const selectedItem = selectedItems.find(selected => selected.id === item.id);
        
        const foodItem = document.createElement('div');
        foodItem.className = `food-item ${isSelected ? 'selected' : ''}`;
        foodItem.dataset.id = item.id;
        
        foodItem.innerHTML = `
            <div class="food-img" style="background-image: url('${item.image}')"></div>
            <div class="food-content">
                <h3 class="food-title">${item.name}</h3>
                <p class="food-description">${item.description}</p>
                <div class="food-footer">
                    <div class="food-price">$${item.price}</div>
                    <button class="select-btn ${isSelected ? 'selected' : ''}" data-id="${item.id}">
                        ${isSelected ? '✓ ' + selectedItem.quantity + ' seleccionado(s)' : 'Seleccionar'}
                    </button>
                </div>
            </div>
        `;
        
        foodGrid.appendChild(foodItem);
    });
    
    // Agregar event listeners a los botones de selección
    document.querySelectorAll('.select-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            toggleFoodItem(id);
        });
    });
}

// Alternar selección de un elemento de comida
function toggleFoodItem(id) {
    const foodItem = foodItems.find(item => item.id === id);
    const existingIndex = selectedItems.findIndex(item => item.id === id);
    
    if (existingIndex >= 0) {
        // Si ya está seleccionado, quitarlo
        selectedItems.splice(existingIndex, 1);
        showNotification(`${foodItem.name} eliminado del pedido`, 'success');
    } else {
        // Si no está seleccionado, añadirlo
        selectedItems.push({
            ...foodItem,
            quantity: 1
        });
        showNotification(`${foodItem.name} añadido al pedido`, 'success');
    }
    
    // Actualizar la interfaz
    renderFoodItems();
    renderSelectedItems();
    updateOrderSummary();
    saveToLocalStorage();
}

// Renderizar la lista de elementos seleccionados
function renderSelectedItems() {
    const selectedList = document.getElementById('selected-list');
    const emptyCart = document.getElementById('empty-cart');
    
    if (!selectedList || !emptyCart) {
        console.error('Elementos del DOM no encontrados');
        return;
    }
    
    if (selectedItems.length === 0) {
        emptyCart.style.display = 'block';
        selectedList.innerHTML = '';
        return;
    }
    
    emptyCart.style.display = 'none';
    
    let itemsHTML = '';
    
    selectedItems.forEach((item, index) => {
        itemsHTML += `
            <div class="selected-item">
                <div class="item-name">${item.name}</div>
                <div class="item-controls">
                    <input type="number" min="1" max="99" value="${item.quantity}" class="item-qty" data-index="${index}">
                    <button class="remove-item" data-index="${index}" aria-label="Eliminar ${item.name}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="item-price">$${item.price * item.quantity}</div>
            </div>
        `;
    });
    
    selectedList.innerHTML = itemsHTML;
    
    // Agregar event listeners a los controles de cantidad
    document.querySelectorAll('.item-qty').forEach(input => {
        input.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            const newQuantity = parseInt(this.value);
            
            if (newQuantity > 99) {
                this.value = 99;
                updateQuantity(index, 99);
            } else if (newQuantity < 1) {
                this.value = 1;
                updateQuantity(index, 1);
            } else {
                updateQuantity(index, newQuantity);
            }
        });
        
        input.addEventListener('input', function() {
            const value = this.value.replace(/[^0-9]/g, '');
            this.value = value;
        });
    });
    
    // Agregar event listeners a los botones de eliminación
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            removeSelectedItem(index);
        });
    });
}

// Actualizar la cantidad de un elemento seleccionado
function updateQuantity(index, quantity) {
    if (quantity < 1 || quantity > 99) return;
    
    selectedItems[index].quantity = quantity;
    showNotification(`${selectedItems[index].name} actualizado: ${quantity} unidad(es)`, 'success');
    
    renderSelectedItems();
    renderFoodItems();
    updateOrderSummary();
    saveToLocalStorage();
}

// Eliminar un elemento seleccionado
function removeSelectedItem(index) {
    const removedItem = selectedItems[index];
    selectedItems.splice(index, 1);
    showNotification(`${removedItem.name} eliminado del pedido`, 'success');
    
    renderSelectedItems();
    renderFoodItems();
    updateOrderSummary();
    saveToLocalStorage();
}

// Actualizar el resumen del pedido
function updateOrderSummary() {
    // Calcular subtotal de alimentos
    const foodSubtotal = selectedItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    
    // Calcular subtotal de adicionales
    const extraSubtotal = Array.from(document.querySelectorAll('.extra-checkbox:checked'))
        .reduce((total, checkbox) => {
            return total + parseInt(checkbox.dataset.price || 0);
        }, 0);
    
    const subtotal = foodSubtotal + extraSubtotal;
    const deliveryCost = 300;
    const total = subtotal + deliveryCost;
    
    // Actualizar la interfaz
    const subtotalElement = document.getElementById('subtotal');
    const deliveryElement = document.getElementById('delivery-cost');
    const totalElement = document.getElementById('total-cost');
    
    if (subtotalElement) subtotalElement.textContent = `$${subtotal}`;
    if (deliveryElement) deliveryElement.textContent = `$${deliveryCost}`;
    if (totalElement) totalElement.textContent = `$${total}`;
}

// Configurar event listeners
function setupEventListeners() {
    // Filtros de categoría
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Actualizar pestaña activa
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Actualizar categoría y renderizar
            currentCategory = this.dataset.category;
            renderFoodItems();
            saveToLocalStorage();
        });
    });
    
    // Checkboxes de adicionales
    document.querySelectorAll('.extra-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateOrderSummary();
            saveToLocalStorage();
            
            if (this.checked) {
                showNotification(`${this.dataset.name} añadido`, 'success');
            }
        });
    });
    
    // Formulario de pedido
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendOrderViaWhatsApp();
        });
    }
    
    // Validar campos del formulario
    const phoneInput = document.getElementById('customer-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 15);
        });
    }
    
    // Cerrar notificación al hacer clic
    const notification = document.getElementById('notification');
    if (notification) {
        notification.addEventListener('click', function() {
            this.classList.remove('show');
        });
    }
}

// Enviar pedido por WhatsApp
function sendOrderViaWhatsApp() {
    // Obtener datos del formulario
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
    
    // Validaciones
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
    
    // Validar que hay productos seleccionados
    if (selectedItems.length === 0) {
        showNotification('Por favor, selecciona al menos un producto', 'error');
        return;
    }
    
    // Obtener adicionales seleccionados
    const selectedExtras = Array.from(document.querySelectorAll('.extra-checkbox:checked'))
        .map(checkbox => ({
            name: checkbox.dataset.name || 'Adicional',
            price: parseInt(checkbox.dataset.price || 0)
        }));
    
    // Calcular totales
    const foodSubtotal = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const extraSubtotal = selectedExtras.reduce((total, extra) => total + extra.price, 0);
    const subtotal = foodSubtotal + extraSubtotal;
    const deliveryCost = 300;
    const total = subtotal + deliveryCost;
    
    // Construir mensaje para WhatsApp
    let message = `*NUEVO PEDIDO - Delicias Express*%0A%0A`;
    message += `*Cliente:* ${name}%0A`;
    message += `*Teléfono:* ${phone}%0A`;
    message += `*Dirección:* ${address}%0A`;
    message += `%0A*PEDIDO:*%0A`;
    
    // Añadir productos
    selectedItems.forEach(item => {
        message += `➡ ${item.name} x${item.quantity} - $${item.price * item.quantity}%0A`;
    });
    
    // Añadir adicionales
    if (selectedExtras.length > 0) {
        message += `%0A*Adicionales:*%0A`;
        selectedExtras.forEach(extra => {
            message += `➡ ${extra.name} - $${extra.price}%0A`;
        });
    }
    
    // Añadir notas
    if (notes !== '') {
        message += `%0A*Notas adicionales:*%0A${notes}%0A`;
    }
    
    // Añadir resumen de pago
    message += `%0A*RESUMEN DE PAGO:*%0A`;
    message += `Subtotal: $${subtotal}%0A`;
    message += `Costo de envío: $${deliveryCost}%0A`;
    message += `*TOTAL: $${total}*%0A%0A`;
    message += `*¡Gracias por tu pedido!*`;
    
    // NÚMERO DE WHATSAPP ACTUALIZADO - ¡ESTE ES EL NÚMERO QUE RECIBIRÁ LOS PEDIDOS!
    const phoneNumber = "5493541682310"; // <<< ¡TU NÚMERO AQUÍ!
    
    // Crear enlace de WhatsApp
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${message}`;
    
    // Abrir WhatsApp en una nueva pestaña
    const newWindow = window.open(whatsappURL, '_blank');
    
    if (newWindow) {
        // Mostrar confirmación
        showNotification('Pedido enviado por WhatsApp ✓', 'success');
        
        // Resetear el formulario después de 2 segundos
        setTimeout(() => {
            if (document.getElementById('order-form')) {
                document.getElementById('order-form').reset();
            }
            
            // Limpiar carrito (opcional - comentar si no quieres que se limpie)
            selectedItems = [];
            renderFoodItems();
            renderSelectedItems();
            updateOrderSummary();
            saveToLocalStorage();
            
            // Desmarcar checkboxes de adicionales
            document.querySelectorAll('.extra-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            showNotification('Formulario reiniciado. ¡Gracias por tu pedido!', 'success');
        }, 2000);
    } else {
        showNotification('Error al abrir WhatsApp. Por favor, habilita las ventanas emergentes.', 'error');
    }
}

// Mostrar notificación
function showNotification(text, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    if (!notification || !notificationText) return;
    
    notificationText.textContent = text;
    
    // Cambiar color según tipo
    notification.className = 'notification';
    notification.classList.add(type === 'error' ? 'error' : 'show');
    
    // Mostrar notificación
    notification.classList.add('show');
    
    // Ocultar después de 3 segundos (5 para errores)
    const hideTime = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
        notification.classList.remove('show');
    }, hideTime);
}

// Mejorar experiencia táctil en móviles
document.addEventListener('touchstart', function() {}, {passive: true});

// Prevenir zoom en inputs en iOS
document.addEventListener('touchmove', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        e.preventDefault();
    }
}, {passive: false});
