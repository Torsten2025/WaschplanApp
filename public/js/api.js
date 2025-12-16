/**
 * API-Funktionen für die Waschmaschinen-App
 * Mit Retry-Mechanismus, Offline-Handling und Caching
 * 
 * @module api
 */

/**
 * @typedef {Object} Machine
 * @property {number} id - Maschinen-ID
 * @property {string} name - Maschinenname
 * @property {string} type - Maschinentyp ('washer' | 'dryer')
 */

/**
 * @typedef {Object} Slot
 * @property {string} start - Startzeit (HH:mm)
 * @property {string} end - Endzeit (HH:mm)
 * @property {string} label - Slot-Label (z.B. '08:00-10:00')
 */

/**
 * @typedef {Object} Booking
 * @property {number} id - Buchungs-ID
 * @property {number} machine_id - Maschinen-ID
 * @property {string} date - Datum (YYYY-MM-DD)
 * @property {string} slot - Slot-Label
 * @property {string} user_name - Benutzername
 * @property {string} [machine_name] - Maschinenname (optional)
 * @property {string} [machine_type] - Maschinentyp (optional)
 */

/**
 * @typedef {Object} CacheEntry
 * @property {*} data - Gecachte Daten
 * @property {number} timestamp - Zeitstempel der Cachierung
 */

// API-Konfiguration
/** @type {string} */
const API_BASE_URL = '/api/v1'; // API v1 Endpunkt

/** @type {number} */
const RETRY_ATTEMPTS = 3;

/** @type {number} */
const RETRY_DELAY = 1000; // 1 Sekunde

/** @type {number} */
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

/**
 * Cache für statische Daten
 * @type {Object<string, CacheEntry|Object<string, CacheEntry>>}
 */
const cache = {
  /** @type {CacheEntry} */
  machines: { data: null, timestamp: null },
  /** @type {CacheEntry} */
  slots: { data: null, timestamp: null },
  /** @type {Object<string, CacheEntry>} */
  bookings: {} // Key: date, Value: { data, timestamp }
};

// Offline-Status
let isOnline = navigator.onLine;

// Online/Offline Event-Listener
window.addEventListener('online', () => {
  isOnline = true;
  if (typeof logger !== 'undefined') {
    logger.info('Verbindung wiederhergestellt');
  } else {
    console.log('Verbindung wiederhergestellt');
  }
  // Optional: Automatisch Daten neu laden
  if (typeof window.onConnectionRestored === 'function') {
    window.onConnectionRestored();
  }
});

window.addEventListener('offline', () => {
  isOnline = false;
  if (typeof logger !== 'undefined') {
    logger.warn('Keine Internetverbindung');
  } else {
    console.warn('Keine Internetverbindung');
  }
});

/**
 * Prüft ob Cache noch gültig ist
 * @param {CacheEntry|null} cacheEntry - Cache-Eintrag
 * @returns {boolean} true wenn Cache gültig, false sonst
 */
function isCacheValid(cacheEntry) {
  if (!cacheEntry || !cacheEntry.timestamp) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
}

/**
 * Retry-Mechanismus für API-Calls
 * @param {string} url - API-URL
 * @param {RequestInit} [options={}] - Fetch-Optionen
 * @param {number} [retries=RETRY_ATTEMPTS] - Anzahl der Wiederholungsversuche
 * @returns {Promise<Response>} Fetch-Response
 * @throws {Error} Wenn alle Retry-Versuche fehlschlagen
 */
async function fetchWithRetry(url, options = {}, retries = RETRY_ATTEMPTS) {
  const startTime = Date.now();
  const method = options.method || 'GET';
  
  for (let i = 0; i < retries; i++) {
    try {
      // AbortSignal.timeout() Fallback für ältere Browser
      let abortController = null;
      let timeoutId = null;
      
      // Options kopieren, damit wir sie modifizieren können ohne das Original zu ändern
      const fetchOptions = { ...options };
      
      if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
        // Moderne Browser: AbortSignal.timeout verwenden
        fetchOptions.signal = AbortSignal.timeout(10000);
      } else {
        // Fallback für ältere Browser: AbortController manuell erstellen
        abortController = new AbortController();
        timeoutId = setTimeout(() => abortController.abort(), 10000);
        fetchOptions.signal = abortController.signal;
      }
      
      const response = await fetch(url, fetchOptions);
      const duration = Date.now() - startTime;
      
      // Timeout-Cleanup
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Performance-Tracking
      if (window.monitoring && window.monitoring.trackApiRequest) {
        window.monitoring.trackApiRequest(url, method, duration, response.status);
      }
      
      if (!response.ok) {
        // Bei 4xx Fehlern nicht retryen
        if (response.status >= 400 && response.status < 500) {
          // Response klonen, damit sie später noch gelesen werden kann
          const clonedResponse = response.clone();
          let errorData;
          try {
            const text = await clonedResponse.text();
            errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status} Fehler` };
          } catch (parseError) {
            // Wenn JSON-Parsing fehlschlägt, verwende Status-Text
            errorData = { 
              error: `HTTP ${response.status}: ${response.statusText || 'Unbekannter Fehler'}` 
            };
          }
          
          // Error-Tracking
          if (window.monitoring && window.monitoring.trackError) {
            window.monitoring.trackError({
              type: 'api_error',
              message: errorData.error || `HTTP error! status: ${response.status}`,
              status: response.status,
              url: url,
              method: method,
              duration: duration
            });
          }
          
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        // Bei 5xx Fehlern retryen
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
          continue;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      // Bei Netzwerkfehlern retryen
      if (error.name === 'TypeError' || error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
          continue;
        }
        // Nach letztem Retry: Bessere Fehlermeldung
        throw new Error(`Netzwerkfehler: Server nicht erreichbar. Bitte prüfen Sie ob der Server läuft. (${url})`);
      }
      throw error;
    }
  }
}

/**
 * Ruft alle Maschinen ab (mit Caching)
 * @returns {Promise<Array>} Array von Maschinen-Objekten
 */
async function fetchMachines() {
  // Prüfe Cache
  if (isCacheValid(cache.machines)) {
    if (typeof logger !== 'undefined') {
      logger.debug('Maschinen aus Cache geladen');
    }
    return cache.machines.data;
  }
  
  try {
    if (!isOnline) {
      throw new Error('Keine Internetverbindung. Bitte versuchen Sie es später erneut.');
    }
    
    const response = await fetchWithRetry(`${API_BASE_URL}/machines`);
    const result = await response.json();
    
    // API gibt standardisiertes Format zurück: { success: true, data: ... }
    const data = result.success && result.data ? result.data : result;
    
    // Cache aktualisieren
    cache.machines = { data, timestamp: Date.now() };
    
    return data;
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Abrufen der Maschinen', error);
    }
    
    // Fallback auf Cache wenn verfügbar
    if (cache.machines && cache.machines.data) {
      if (typeof logger !== 'undefined') {
        logger.warn('Verwende gecachte Maschinen-Daten');
      }
      return cache.machines.data;
    }
    
    throw error;
  }
}

/**
 * Ruft alle verfügbaren Zeit-Slots ab (mit Caching)
 * @returns {Promise<Array>} Array von Slot-Objekten mit start, end und label
 */
async function fetchSlots() {
  // Prüfe Cache
  if (isCacheValid(cache.slots)) {
    if (typeof logger !== 'undefined') {
      logger.debug('Slots aus Cache geladen');
    }
    return cache.slots.data;
  }
  
  try {
    if (!isOnline) {
      throw new Error('Keine Internetverbindung. Bitte versuchen Sie es später erneut.');
    }
    
    const response = await fetchWithRetry(`${API_BASE_URL}/slots`);
    const result = await response.json();
    
    // API gibt standardisiertes Format zurück: { success: true, data: ... }
    const data = result.success && result.data ? result.data : result;
    
    // Cache aktualisieren
    cache.slots = { data, timestamp: Date.now() };
    
    return data;
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Abrufen der Slots', error);
    } else {
      console.error('Fehler beim Abrufen der Slots:', error);
    }
    
    // Fallback auf Cache wenn verfügbar
    if (cache.slots && cache.slots.data) {
      if (typeof logger !== 'undefined') {
        logger.warn('Verwende gecachte Slots-Daten');
      } else {
        console.warn('Verwende gecachte Slots-Daten');
      }
      return cache.slots.data;
    }
    
    // Fallback auf statische Slots (Waschküchenordnung: 07–12, 12–17, 17–21)
    if (typeof logger !== 'undefined') {
      logger.warn('Verwende statische Slots als Fallback');
    } else {
      console.warn('Verwende statische Slots als Fallback');
    }
    return [
      { start: '07:00', end: '12:00', label: '07:00-12:00' },
      { start: '12:00', end: '17:00', label: '12:00-17:00' },
      { start: '17:00', end: '21:00', label: '17:00-21:00' }
    ];
  }
}

/**
 * Ruft alle Buchungen für ein bestimmtes Datum ab (mit Caching)
 * @param {string} date - Datum im Format YYYY-MM-DD
 * @param {boolean} forceRefresh - Cache ignorieren und neu laden
 * @returns {Promise<Array>} Array von Buchungs-Objekten
 */
async function fetchBookings(date, forceRefresh = false) {
  if (!date) {
    throw new Error('Datum ist erforderlich');
  }
  
  // Prüfe Cache (nur wenn nicht forceRefresh)
  if (!forceRefresh && cache.bookings[date] && isCacheValid(cache.bookings[date])) {
    if (typeof logger !== 'undefined') {
      logger.debug(`Buchungen für ${date} aus Cache geladen`);
    }
    return cache.bookings[date].data;
  }
  
  try {
    if (!isOnline) {
      throw new Error('Keine Internetverbindung. Bitte versuchen Sie es später erneut.');
    }
    
    const response = await fetchWithRetry(
      `${API_BASE_URL}/bookings?date=${encodeURIComponent(date)}`
    );
    const result = await response.json();
    
    // API gibt standardisiertes Format zurück: { success: true, data: ... }
    const data = result.success && result.data ? result.data : result;
    
    // Cache aktualisieren
    cache.bookings[date] = { data, timestamp: Date.now() };
    
    return data;
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Abrufen der Buchungen', error, { date });
    } else {
      console.error('Fehler beim Abrufen der Buchungen:', error);
    }
    
    // Fallback auf Cache wenn verfügbar
    if (cache.bookings[date] && cache.bookings[date].data) {
      if (typeof logger !== 'undefined') {
        logger.warn(`Verwende gecachte Buchungen für ${date}`);
      } else {
        console.warn(`Verwende gecachte Buchungen für ${date}`);
      }
      return cache.bookings[date].data;
    }
    
    throw error;
  }
}

/**
 * Erstellt eine neue Buchung (mit Retry)
 * @param {Object} data - Buchungsdaten
 * @param {number} data.machine_id - ID der Maschine
 * @param {string} data.date - Datum im Format YYYY-MM-DD
 * @param {string} data.slot - Zeit-Slot (z.B. "08:00-10:00")
 * @param {string} data.user_name - Name des Benutzers
 * @returns {Promise<Object>} Erstelltes Buchungs-Objekt
 */
async function createBooking(data) {
  // user_name wird mitgesendet (für normale Buchungen ohne Login)
  if (!data || !data.machine_id || !data.date || !data.slot || !data.user_name) {
    throw new Error('Alle Felder sind erforderlich: machine_id, date, slot, user_name');
  }
  
  try {
    if (!isOnline) {
      throw new Error('Keine Internetverbindung. Buchung kann nicht erstellt werden.');
    }
    
    // Debug: Logge Request-Details
    console.log('=== CREATE BOOKING REQUEST ===');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('URL:', `${API_BASE_URL}/bookings`);
    console.log('Data:', data);
    
    const response = await fetchWithRetry(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (!response.ok) {
      // Response klonen, damit sie später noch gelesen werden kann
      const clonedResponse = response.clone();
      let errorData;
      try {
        const text = await clonedResponse.text();
        errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status} Fehler` };
      } catch (parseError) {
        errorData = { 
          error: `HTTP ${response.status}: ${response.statusText || 'Unbekannter Fehler'}` 
        };
      }
      // IMMER in Console ausgeben für Debugging
      console.error('=== BOOKING CREATION ERROR ===');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Error Data:', errorData);
      console.error('Error Data String:', JSON.stringify(errorData, null, 2));
      console.error('=== ENDE BOOKING CREATION ERROR ===');
      
      // Fehlermeldung aus API-Response extrahieren
      const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      console.error('Extrahierte Fehlermeldung:', errorMessage);
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('Response Data:', result);
    
    // API gibt standardisiertes Format zurück: { success: true, data: ... }
    const booking = result.success && result.data ? result.data : result;
    console.log('Extracted Booking:', booking);
    console.log('=== END CREATE BOOKING ===');
    
    // Cache für Buchungen invalidieren (für das Datum) - NACH erfolgreichem Request
    // Race Condition vermeiden: Cache erst nach erfolgreichem Response löschen
    if (cache.bookings[data.date]) {
      delete cache.bookings[data.date];
    }
    
    return booking;
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Erstellen der Buchung', error);
    } else {
      console.error('Fehler beim Erstellen der Buchung:', error);
    }
    throw error;
  }
}

/**
 * Löscht eine Buchung (mit Retry)
 * @param {number|string} id - ID der zu löschenden Buchung
 * @param {string} date - Optional: Datum der Buchung (für Cache-Invalidierung)
 * @returns {Promise<Object>} Bestätigungs-Objekt mit message
 */
async function deleteBooking(id, date = null) {
  if (!id) {
    throw new Error('ID ist erforderlich');
  }
  
  try {
    if (!isOnline) {
      throw new Error('Keine Internetverbindung. Buchung kann nicht gelöscht werden.');
    }
    
    // Hole aktuellen Benutzernamen aus dem Input-Feld oder localStorage
    let userName = '';
    try {
      const nameInput = document.getElementById('name-input');
      if (nameInput && nameInput.value) {
        userName = nameInput.value.trim();
      } else if (typeof storage !== 'undefined') {
        userName = storage.getItem('waschmaschine_user_name') || '';
      }
    } catch (e) {
      // Ignoriere Fehler beim Zugriff auf DOM/storage
    }
    
    // user_name als Query-Parameter übergeben
    const url = userName 
      ? `${API_BASE_URL}/bookings/${id}?user_name=${encodeURIComponent(userName)}`
      : `${API_BASE_URL}/bookings/${id}`;
    
    const response = await fetchWithRetry(url, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      // Response klonen, damit sie später noch gelesen werden kann
      const clonedResponse = response.clone();
      let errorData;
      try {
        const text = await clonedResponse.text();
        errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status} Fehler` };
      } catch (parseError) {
        errorData = { 
          error: `HTTP ${response.status}: ${response.statusText || 'Unbekannter Fehler'}` 
        };
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // API gibt standardisiertes Format zurück: { success: true, data: ... }
    const deleteResult = result.success && result.data ? result.data : result;
    
    // Cache für Buchungen invalidieren (für das Datum) - NACH erfolgreichem Request
    // Race Condition vermeiden: Cache erst nach erfolgreichem Response löschen
    if (date && cache.bookings[date]) {
      delete cache.bookings[date];
    }
    
    return deleteResult;
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Löschen der Buchung', error, { id });
    } else {
      console.error('Fehler beim Löschen der Buchung:', error);
    }
    throw error;
  }
}

/**
 * Cache manuell leeren
 */
function clearCache() {
  cache.machines = { data: null, timestamp: null };
  cache.slots = { data: null, timestamp: null };
  cache.bookings = {};
  if (typeof logger !== 'undefined') {
    logger.debug('Cache geleert');
  }
}

/**
 * Prüft Online-Status
 */
function checkOnlineStatus() {
  return isOnline;
}

/**
 * Ruft Buchungen für eine Arbeitswoche ab (Montag bis Freitag)
 * @param {string} startDate - Startdatum im Format YYYY-MM-DD (beliebiges Datum der Woche)
 * @returns {Promise<Object>} Objekt mit week_start, week_end und bookings
 */
async function fetchBookingsWeek(startDate) {
  if (!startDate) {
    throw new Error('Startdatum ist erforderlich');
  }
  
  try {
    if (!isOnline) {
      throw new Error('Keine Internetverbindung. Bitte versuchen Sie es später erneut.');
    }
    
    const response = await fetchWithRetry(
      `${API_BASE_URL}/bookings/week?start_date=${encodeURIComponent(startDate)}`
    );
    const result = await response.json();
    
    const data = result.success && result.data ? result.data : result;
    return data;
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Abrufen der Wochen-Buchungen', error, { year, week });
    } else {
      console.error('Fehler beim Abrufen der Wochen-Buchungen:', error);
    }
    throw error;
  }
}

/**
 * Ruft Buchungen für einen Monat ab
 * @param {number} year - Jahr (z.B. 2024)
 * @param {number} month - Monat (1-12)
 * @returns {Promise<Object>} Objekt mit year, month, month_start, month_end und bookings
 */
async function fetchBookingsMonth(year, month) {
  if (!year || !month) {
    throw new Error('Jahr und Monat sind erforderlich');
  }
  
  try {
    if (!isOnline) {
      throw new Error('Keine Internetverbindung. Bitte versuchen Sie es später erneut.');
    }
    
    const response = await fetchWithRetry(
      `${API_BASE_URL}/bookings/month?year=${year}&month=${month}`
    );
    const result = await response.json();
    
    const data = result.success && result.data ? result.data : result;
    return data;
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Abrufen der Monats-Buchungen', error, { year, month });
    } else {
      console.error('Fehler beim Abrufen der Monats-Buchungen:', error);
    }
    throw error;
  }
}

/**
 * Authentifizierungs-Funktionen
 */

/**
 * Meldet einen Benutzer an
 * @param {string} username - Benutzername
 * @param {string} password - Passwort
 * @returns {Promise<Object>} Benutzer-Objekt
 */
async function login(username, password) {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Wichtig für Sessions
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: 'Unbekannter Fehler',
        message: 'Unbekannter Fehler'
      }));
      
      // Backend gibt verschiedene Fehlerformate zurück
      const errorMessage = errorData.error || 
                           errorData.message || 
                           (Array.isArray(errorData.details) ? errorData.details[0] : errorData.details) || 
                           `HTTP error! status: ${response.status}`;
      
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    return result.success && result.data ? result.data : result;
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Login', error);
    } else {
      console.error('Fehler beim Login:', error);
    }
    throw error;
  }
}

/**
 * Einfaches Login (nur Name, kein Passwort) - für normale Benutzer
 * @param {string} name - Name des Benutzers
 * @returns {Promise<Object>} Benutzer-Objekt
 */
async function loginSimple(name) {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/auth/login-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Wichtig für Sessions
      body: JSON.stringify({ name })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: 'Unbekannter Fehler',
        message: 'Unbekannter Fehler'
      }));
      
      const errorMessage = errorData.error || 
                           errorData.message || 
                           (Array.isArray(errorData.details) ? errorData.details[0] : errorData.details) || 
                           `HTTP error! status: ${response.status}`;
      
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    return result.success && result.data ? result.data : result;
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim einfachen Login', error);
    } else {
      console.error('Fehler beim einfachen Login:', error);
    }
    throw error;
  }
}

/**
 * Meldet einen Benutzer ab
 * @returns {Promise<Object>} Bestätigungs-Objekt
 */
async function logout() {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success && result.data ? result.data : result;
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Logout', error);
    } else {
      console.error('Fehler beim Logout:', error);
    }
    throw error;
  }
}

/**
 * Registriert einen neuen Benutzer
 * @param {string} username - Benutzername
 * @param {string} password - Passwort
 * @returns {Promise<Object>} Registrierungs-Objekt
 */
async function register(username, password) {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Wichtig für Sessions
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: 'Unbekannter Fehler',
        message: 'Unbekannter Fehler'
      }));
      
      // Backend gibt verschiedene Fehlerformate zurück
      const errorMessage = errorData.error || 
                           errorData.message || 
                           (Array.isArray(errorData.details) ? errorData.details[0] : errorData.details) || 
                           `HTTP error! status: ${response.status}`;
      
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    return result.success && result.data ? result.data : result;
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Fehler bei der Registrierung', error);
    } else {
      console.error('Fehler bei der Registrierung:', error);
    }
    throw error;
  }
}

/**
 * Ruft Informationen über den aktuellen Benutzer ab
 * @returns {Promise<Object>} Benutzer-Objekt oder null wenn nicht eingeloggt
 */
async function getCurrentUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return null; // Nicht eingeloggt
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    // Backend gibt direkt User-Objekt zurück: { id, username, role }
    return result.success && result.data ? result.data : null;
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Abrufen des Benutzers', error);
    } else {
      console.error('Fehler beim Abrufen des Benutzers:', error);
    }
    return null;
  }
}

