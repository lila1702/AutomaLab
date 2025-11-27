/**
 * Converte coordenadas do mouse para coordenadas do canvas SVG
 * @param {MouseEvent} event - Evento do mouse
 * @param {SVGElement} svg - Elemento SVG
 * @returns {Object} {x, y} - Coordenadas no canvas
 */
function getCanvasCoords(event, svg = null) {
    svg = svg || document.getElementById('canvas');
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
}

/**
 * Calcula distância entre dois pontos
 * @param {Object} p1 - {x, y}
 * @param {Object} p2 - {x, y}
 * @returns {number} Distância
 */
function distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula ângulo entre dois pontos
 * @param {Object} p1 - {x, y}
 * @param {Object} p2 - {x, y}
 * @returns {number} Ângulo em radianos
 */
function angle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Converte ângulo de radianos para graus
 * @param {number} radians - Ângulo em radianos
 * @returns {number} Ângulo em graus
 */
function radiansToDegrees(radians) {
    return (radians * 180) / Math.PI;
}

/**
 * Converte ângulo de graus para radianos
 * @param {number} degrees - Ângulo em graus
 * @returns {number} Ângulo em radianos
 */
function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

/**
 * Valida nome de estado
 * @param {string} name - Nome do estado
 * @returns {boolean} True se válido
 */
function isValidStateName(name) {
    if (!name || typeof name !== 'string') return false;
    return VALIDATION.STATE_NAME_REGEX.test(name);
}

/**
 * Valida símbolo de transição
 * @param {string} symbol - Símbolo
 * @returns {boolean} True se válido
 */
function isValidSymbol(symbol) {
    if (!symbol || typeof symbol !== 'string') return false;
    return VALIDATION.SYMBOL_REGEX.test(symbol) || symbol === SPECIAL_CHARS.EPSILON;
}

/**
 * Valida cadeia de entrada
 * @param {string} chain - Cadeia
 * @returns {boolean} True se válida
 */
function isValidChain(chain) {
    if (typeof chain !== 'string') return false;
    return VALIDATION.CHAIN_REGEX.test(chain);
}

/**
 * Gera ID único
 * @returns {string} ID único
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Clona objeto profundamente
 * @param {Object} obj - Objeto a clonar
 * @returns {Object} Cópia do objeto
 */
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

/**
 * Sanitiza string para HTML
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizada
 */
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Formata data para string legível
 * @param {Date} date - Data
 * @returns {string} Data formatada
 */
function formatDate(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Mostra notificação/toast
 * @param {string} message - Mensagem
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duração em ms
 */
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

/**
 * Mostra confirmação
 * @param {string} message - Mensagem
 * @returns {Promise<boolean>} True se confirmado
 */
function showConfirmation(message) {
    return new Promise(resolve => {
        if (confirm(message)) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

/**
 * Aguarda tempo especificado
 * @param {number} ms - Milissegundos
 * @returns {Promise}
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce de função
 * @param {Function} func - Função
 * @param {number} wait - Tempo de espera
 * @returns {Function} Função debounced
 */
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

/**
 * Throttle de função
 * @param {Function} func - Função
 * @param {number} limit - Tempo limite
 * @returns {Function} Função throttled
 */
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

/**
 * Verifica se elemento está visível na viewport
 * @param {Element} element - Elemento
 * @returns {boolean} True se visível
 */
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Copia texto para clipboard
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} True se copiado
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Falha ao copiar:', err);
        return false;
    }
}

/**
 * Calcula ponto intermediário entre dois pontos
 * @param {Object} p1 - {x, y}
 * @param {Object} p2 - {x, y}
 * @returns {Object} Ponto intermediário
 */
function midpoint(p1, p2) {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
    };
}

/**
 * Calcula offset de ponto a uma distância em uma direção
 * @param {Object} point - {x, y}
 * @param {number} angle - Ângulo em radianos
 * @param {number} distance - Distância
 * @returns {Object} Novo ponto
 */
function offsetPoint(point, angle, distance) {
    return {
        x: point.x + Math.cos(angle) * distance,
        y: point.y + Math.sin(angle) * distance,
    };
}

/**
 * Verifica colisão entre dois círculos
 * @param {Object} c1 - {x, y, r}
 * @param {Object} c2 - {x, y, r}
 * @returns {boolean} True se colidem
 */
function circlesCollide(c1, c2) {
    const dist = distance(c1, c2);
    return dist < c1.r + c2.r;
}

/**
 * Log com timestamp
 * @param {string} message - Mensagem
 * @param {string} level - 'log', 'warn', 'error'
 */
function log(message, level = 'log') {
    const timestamp = new Date().toLocaleTimeString();
    console[level](`[${timestamp}] ${message}`);
}