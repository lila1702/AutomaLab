// Utilitários diversos

function getCanvasCoords(event, svg = null) {
    svg = svg || document.getElementById('canvas');
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
}

function distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function angle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

function radiansToDegrees(radians) {
    return (radians * 180) / Math.PI;
}

function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

function isValidStateName(name) {
    if (!name || typeof name !== 'string') return false;
    return VALIDATION.STATE_NAME_REGEX.test(name);
}

function isValidSymbol(symbol) {
    if (!symbol || typeof symbol !== 'string') return false;
    return VALIDATION.SYMBOL_REGEX.test(symbol) || symbol === SPECIAL_CHARS.EPSILON;
}

function isValidChain(chain) {
    if (typeof chain !== 'string') return false;
    return VALIDATION.CHAIN_REGEX.test(chain);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
}

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function showNotification(message, type = 'info', duration = 3000) {
    // Criar elemento
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        background: ${
            type === 'success' ? '#4caf50' :
            type === 'error' ? '#f44336' :
            type === 'warning' ? '#ff9800' :
            '#2196f3'
        };
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 13px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remover após duração
    setTimeout(() => {
        notification.style.animation = 'slideInLeft 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

function showConfirmation(message) {
    return new Promise(resolve => {
        if (confirm(message)) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Falha ao copiar:', err);
        return false;
    }
}

function midpoint(p1, p2) {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
    };
}

function offsetPoint(point, angle, distance) {
    return {
        x: point.x + Math.cos(angle) * distance,
        y: point.y + Math.sin(angle) * distance,
    };
}

function circlesCollide(c1, c2) {
    const dist = distance(c1, c2);
    return dist < c1.r + c2.r;
}

function log(message, level = 'log') {
    const timestamp = new Date().toLocaleTimeString();
    console[level](`[${timestamp}] ${message}`);
}

/**
 * Converte strings comuns para o símbolo épsilon (ε)
 * Permite que usuários digitem palavras em vez do símbolo direto
 * @param {string} symbol - Símbolo a ser convertido
 * @returns {string} Símbolo convertido (ε se for épsilon, original caso contrário)
 */
function convertToEpsilon(symbol) {
    if (!symbol || typeof symbol !== 'string') return symbol;
    
    const trimmed = symbol.trim().toLowerCase();
    
    // Lista de strings que representam épsilon
    const epsilonAliases = ['epsilon', 'eps', 'e', 'lambda', 'λ', ''];
    
    if (epsilonAliases.includes(trimmed)) {
        return SPECIAL_CHARS.EPSILON; // ε
    }
    
    return symbol.trim();
}

/**
 * Processa array de símbolos, convertendo épsilon quando necessário
 * @param {string} input - String com símbolos separados por vírgula
 * @returns {Array<string>} Array de símbolos processados
 */
function parseSymbols(input) {
    if (!input || typeof input !== 'string') return [];
    
    return input
        .split(',')
        .map(s => convertToEpsilon(s.trim()))
        .filter(s => s.length > 0);
}