/**
 * Frontend-Monitoring-System
 * Erfasst Fehler, Performance-Metriken und User-Activity
 */

// Development-Mode-Prüfung (Browser-kompatibel)
const IS_DEVELOPMENT = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';

// Monitoring-Konfiguration
const MONITORING_CONFIG = {
  enabled: true,
  errorTracking: true,
  performanceTracking: true,
  userActivityTracking: true,
  apiEndpoint: '/api/v1/monitoring/events'
};

// Lokaler Event-Store (wird periodisch an Server gesendet)
const eventStore = {
  errors: [],
  performance: [],
  activities: [],
  maxEvents: 100 // Max. Events bevor Batch-Send
};

/**
 * Initialisiert das Monitoring-System
 */
function initMonitoring() {
  if (!MONITORING_CONFIG.enabled) return;
  
  // Error-Tracking
  if (MONITORING_CONFIG.errorTracking) {
    setupErrorTracking();
  }
  
  // Performance-Tracking
  if (MONITORING_CONFIG.performanceTracking) {
    setupPerformanceTracking();
  }
  
  // User-Activity-Tracking
  if (MONITORING_CONFIG.userActivityTracking) {
    setupActivityTracking();
  }
  
  // Periodisches Senden von Events
  setInterval(sendEventsToServer, 30000); // Alle 30 Sekunden
  
  // Events beim Seitenwechsel senden
  window.addEventListener('beforeunload', () => {
    sendEventsToServer(true); // Synchron senden
  });
}

/**
 * Error-Tracking einrichten
 */
function setupErrorTracking() {
  // Unbehandelte JavaScript-Fehler
  window.addEventListener('error', (event) => {
    trackError({
      type: 'javascript_error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  });
  
  // Unbehandelte Promise-Rejections
  window.addEventListener('unhandledrejection', (event) => {
    trackError({
      type: 'promise_rejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  });
  
  // API-Fehler-Tracking (wird von api.js aufgerufen)
  window.trackApiError = (error, context) => {
    trackError({
      type: 'api_error',
      message: error.message,
      status: error.status,
      url: error.url,
      context: context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  };
}

/**
 * Performance-Tracking einrichten
 */
function setupPerformanceTracking() {
  // Page Load Performance
  if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perf = window.performance.timing;
        const navigation = window.performance.navigation;
        
        trackPerformance({
          type: 'page_load',
          dns: perf.domainLookupEnd - perf.domainLookupStart,
          tcp: perf.connectEnd - perf.connectStart,
          request: perf.responseStart - perf.requestStart,
          response: perf.responseEnd - perf.responseStart,
          dom: perf.domContentLoadedEventEnd - perf.domLoading,
          load: perf.loadEventEnd - perf.navigationStart,
          redirects: navigation.redirectCount,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      }, 1000);
    });
  }
  
  // Resource Timing (Ladezeiten von Assets)
  if (window.performance && window.performance.getEntriesByType) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const resources = window.performance.getEntriesByType('resource');
        const slowResources = resources
          .filter(r => r.duration > 1000) // > 1 Sekunde
          .slice(0, 10) // Max. 10 langsame Resources
          .map(r => ({
            name: r.name,
            duration: Math.round(r.duration),
            size: r.transferSize || 0,
            type: r.initiatorType
          }));
        
        if (slowResources.length > 0) {
          trackPerformance({
            type: 'slow_resources',
            resources: slowResources,
            timestamp: new Date().toISOString(),
            url: window.location.href
          });
        }
      }, 2000);
    });
  }
}

/**
 * User-Activity-Tracking einrichten
 */
function setupActivityTracking() {
  let lastActivity = Date.now();
  let activityCount = 0;
  
  // Aktivitäts-Events
  const activityEvents = ['click', 'keydown', 'scroll', 'mousemove'];
  
  activityEvents.forEach(eventType => {
    document.addEventListener(eventType, () => {
      lastActivity = Date.now();
      activityCount++;
      
      // Alle 100 Aktivitäten tracken
      if (activityCount >= 100) {
        trackActivity({
          type: 'user_activity',
          events: activityCount,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
        activityCount = 0;
      }
    }, { passive: true });
  });
  
  // Sichtbarkeits-Änderungen (Tab-Wechsel)
  document.addEventListener('visibilitychange', () => {
    trackActivity({
      type: 'visibility_change',
      hidden: document.hidden,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  });
}

/**
 * Fehler tracken
 */
function trackError(errorData) {
  if (!MONITORING_CONFIG.errorTracking) return;
  
  eventStore.errors.push(errorData);
  
  // Console-Log für Entwicklung
  if (IS_DEVELOPMENT) {
    if (typeof logger !== 'undefined') {
      logger.error('Tracked Error', null, errorData);
    } else {
      console.error('Tracked Error:', errorData);
    }
  }
  
  // Bei kritischen Fehlern sofort senden
  if (errorData.type === 'javascript_error' && eventStore.errors.length >= 5) {
    sendEventsToServer();
  }
}

/**
 * Performance-Metriken tracken
 */
function trackPerformance(perfData) {
  if (!MONITORING_CONFIG.performanceTracking) return;
  
  eventStore.performance.push(perfData);
  
  // Console-Log für Entwicklung
  if (IS_DEVELOPMENT) {
    if (typeof logger !== 'undefined') {
      logger.debug('Tracked Performance', perfData);
    } else {
      console.log('Tracked Performance:', perfData);
    }
  }
}

/**
 * User-Activity tracken
 */
function trackActivity(activityData) {
  if (!MONITORING_CONFIG.userActivityTracking) return;
  
  eventStore.activities.push(activityData);
}

/**
 * API-Request-Zeit tracken
 */
function trackApiRequest(url, method, duration, status, error = null) {
  if (!MONITORING_CONFIG.performanceTracking) return;
  
  trackPerformance({
    type: 'api_request',
    url: url,
    method: method,
    duration: duration,
    status: status,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  });
  
  // Bei langsamen Requests (> 2 Sekunden) als Fehler tracken
  if (duration > 2000 || status >= 400) {
    trackError({
      type: 'slow_api_request',
      url: url,
      method: method,
      duration: duration,
      status: status,
      message: error ? error.message : `Slow request: ${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Sendet Events an den Server
 */
async function sendEventsToServer(sync = false) {
  if (eventStore.errors.length === 0 && 
      eventStore.performance.length === 0 && 
      eventStore.activities.length === 0) {
    return;
  }
  
  const events = {
    errors: eventStore.errors.slice(),
    performance: eventStore.performance.slice(),
    activities: eventStore.activities.slice(),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    sessionId: getSessionId()
  };
  
  // Store leeren
  eventStore.errors = [];
  eventStore.performance = [];
  eventStore.activities = [];
  
  // An Server senden
  try {
    if (sync) {
      // Synchron senden (nur bei beforeunload)
      navigator.sendBeacon(MONITORING_CONFIG.apiEndpoint, JSON.stringify(events));
    } else {
      // Asynchron senden
      await fetch(MONITORING_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(events),
        keepalive: true // Wichtig für beforeunload
      });
    }
  } catch (error) {
    // Fehler beim Senden - Events wieder in Store
    eventStore.errors.push(...events.errors);
    eventStore.performance.push(...events.performance);
    eventStore.activities.push(...events.activities);
    
    if (typeof logger !== 'undefined') {
      logger.warn('Fehler beim Senden von Monitoring-Events', error);
    } else {
      console.warn('Fehler beim Senden von Monitoring-Events:', error);
    }
  }
}

/**
 * Generiert eine Session-ID
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem('monitoring_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('monitoring_session_id', sessionId);
  }
  return sessionId;
}

// Monitoring beim Laden initialisieren
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMonitoring);
} else {
  initMonitoring();
}

// Export für andere Module
window.monitoring = {
  trackError,
  trackPerformance,
  trackActivity,
  trackApiRequest
};

