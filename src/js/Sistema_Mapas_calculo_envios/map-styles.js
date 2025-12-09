console.log("🎨 map-styles.js cargado");

function addDeliveryStyles() {
    const mapCss = Array.from(document.styleSheets).find(sheet => 
        sheet.href && sheet.href.includes('map.css')
    );
    
    if (!mapCss) {
        createFallbackStyles();
    }
}

function createFallbackStyles() {
    const styleId = 'map-fallback-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .delivery-details { background: #f8f9fa; border-radius: 8px; padding: 12px; margin: 15px 0; border-left: 4px solid #28a745; }
            .delivery-info { display: flex; flex-direction: column; gap: 8px; }
            .delivery-row { display: flex; align-items: center; gap: 10px; font-size: 14px; }
            .delivery-row i { color: #6c757d; width: 20px; }
            .zone-indicator { padding: 6px 12px; border-radius: 20px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; margin-top: 8px; }
            .zone-1 { background: #d4edda; color: #155724; }
            .zone-2 { background: #fff3cd; color: #856404; }
            .zone-3 { background: #f8d7da; color: #721c24; }
            .zone-4 { background: #cce5ff; color: #004085; }
            .zone-5 { background: #e6d2ff; color: #4b0082; }
            .zone-6 { background: #ffd6cc; color: #cc3300; }
            .zone-out { background: #e2e3e5; color: #383d41; }
            .delivery-cost-ok { color: #28a745; font-weight: bold; }
            .delivery-cost-error { color: #dc3545; font-weight: bold; }
            .loading-indicator { background: rgba(255,255,255,0.9); padding: 10px; border-radius: 8px; text-align: center; margin: 10px 0; }
            .fade-in { animation: fadeIn 0.3s ease-in; }
            .approximation-note { background: #e7f3ff; padding: 5px 10px; border-radius: 4px; font-size: 12px; color: #0066cc; margin-top: 8px; display: flex; align-items: center; gap: 5px; }
            .notification.info { background: #d1ecf1; border-color: #bee5eb; color: #0c5460; }
            .notification.warning { background: #fff3cd; border-color: #ffeaa7; color: #856404; }
            .notification.error { background: #f8d7da; border-color: #f5c6cb; color: #721c24; }
            .delivery-time-info .cost-formula { font-size: 12px; color: #6c757d; margin-top: 5px; }
            .whatsapp-submit-btn:hover { background: #128C7E; transform: scale(1.02); transition: all 0.2s; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `;
        document.head.appendChild(style);
    }
}

window.addDeliveryStyles = addDeliveryStyles;
window.createFallbackStyles = createFallbackStyles;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addDeliveryStyles);
} else {
    addDeliveryStyles();
}