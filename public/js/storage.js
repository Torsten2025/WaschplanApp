/**
 * Safe LocalStorage Wrapper mit Fehlerbehandlung
 */

const storage = {
  /**
   * Setzt einen Wert im LocalStorage
   * @param {string} key - Schlüssel
   * @param {string} value - Wert
   * @returns {boolean} true wenn erfolgreich, false bei Fehler
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      // LocalStorage könnte voll sein oder deaktiviert
      if (typeof logger !== 'undefined') {
        logger.warn('LocalStorage setItem fehlgeschlagen', null, { error: error.message });
      } else {
        console.warn('LocalStorage setItem fehlgeschlagen:', error.message);
      }
      return false;
    }
  },
  
  /**
   * Ruft einen Wert aus dem LocalStorage ab
   * @param {string} key - Schlüssel
   * @returns {string|null} Wert oder null bei Fehler
   */
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.warn('LocalStorage getItem fehlgeschlagen', null, { error: error.message });
      } else {
        console.warn('LocalStorage getItem fehlgeschlagen:', error.message);
      }
      return null;
    }
  },
  
  /**
   * Entfernt einen Wert aus dem LocalStorage
   * @param {string} key - Schlüssel
   * @returns {boolean} true wenn erfolgreich, false bei Fehler
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.warn('LocalStorage removeItem fehlgeschlagen', null, { error: error.message });
      } else {
        console.warn('LocalStorage removeItem fehlgeschlagen:', error.message);
      }
      return false;
    }
  },
  
  /**
   * Prüft ob LocalStorage verfügbar ist
   * @returns {boolean} true wenn verfügbar
   */
  isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
};

