/**
 * Logging-Helper für Frontend
 * Ersetzt console.log/warn/error mit strukturiertem Logging
 * Verhindert das Loggen sensibler Daten
 */

// Sensible Daten-Muster (werden nicht geloggt)
const SENSITIVE_PATTERNS = [
  /password/i,
  /passwort/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /auth/i,
  /session/i,
  /cookie/i
];

/**
 * Prüft ob Daten sensible Informationen enthalten
 */
function containsSensitiveData(data) {
  if (!data) return false;
  
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(dataStr));
}

/**
 * Sanitisiert Daten für Logging (entfernt sensible Informationen)
 */
function sanitizeData(data) {
  if (!data) return data;
  
  if (typeof data === 'string') {
    // Prüfe ob String sensible Daten enthält
    if (containsSensitiveData(data)) {
      return '[SENSITIVE DATA REMOVED]';
    }
    return data;
  }
  
  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (containsSensitiveData(key) || containsSensitiveData(value)) {
        sanitized[key] = '[SENSITIVE DATA REMOVED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Prüft ob wir in Produktion sind (Browser-kompatibel)
 */
function isProduction() {
  // Im Browser gibt es kein process.env, daher prüfen wir die URL
  return window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1' &&
         !window.location.hostname.startsWith('192.168.');
}

/**
 * Logger-Objekt
 */
const logger = {
  /**
   * Info-Log
   */
  info: (message, data = null) => {
    if (isProduction()) {
      // In Produktion nur wichtige Logs
      return;
    }
    
    const sanitized = data ? sanitizeData(data) : null;
    console.log(`[INFO] ${message}`, sanitized || '');
  },
  
  /**
   * Warn-Log
   */
  warn: (message, data = null) => {
    const sanitized = data ? sanitizeData(data) : null;
    console.warn(`[WARN] ${message}`, sanitized || '');
  },
  
  /**
   * Error-Log
   */
  error: (message, error = null, data = null) => {
    const sanitized = data ? sanitizeData(data) : null;
    
    if (error) {
      // Error-Objekt loggen (ohne sensible Daten)
      const errorInfo = {
        name: error.name,
        message: error.message,
        stack: !isProduction() ? error.stack : undefined
      };
      console.error(`[ERROR] ${message}`, errorInfo, sanitized || '');
    } else {
      console.error(`[ERROR] ${message}`, sanitized || '');
    }
  },
  
  /**
   * Debug-Log (nur in Entwicklung)
   */
  debug: (message, data = null) => {
    if (isProduction()) {
      return;
    }
    
    const sanitized = data ? sanitizeData(data) : null;
    console.log(`[DEBUG] ${message}`, sanitized || '');
  }
};

// Export für Verwendung in anderen Dateien
if (typeof module !== 'undefined' && module.exports) {
  module.exports = logger;
}

