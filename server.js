const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// WICHTIG für Render/HTTPS: Trust Proxy aktivieren
// Render läuft hinter einem Proxy, Express muss wissen, dass die Verbindung HTTPS ist
if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
  app.set('trust proxy', 1);
}

// ============================================================================
// LOGGING-UTILITIES
// ============================================================================

/**
 * Strukturiertes Logging-System
 * 
 * @namespace logger
 * @description Zentrale Logging-Utilities für strukturierte Log-Ausgaben
 * 
 * @example
 * logger.info('Server gestartet', { port: 3000 });
 * logger.error('Fehler aufgetreten', error, { context: 'API' });
 * 
 * @typedef {Object} LoggerContext
 * @property {string} [port] - Port-Nummer
 * @property {string} [context] - Kontext-Information
 * @property {*} [error] - Fehler-Objekt
 */
const logger = {
  /**
   * Info-Log ausgeben
   * @param {string} message - Log-Nachricht
   * @param {LoggerContext} [context={}] - Zusätzlicher Kontext
   * @returns {void}
   */
  info: (message, context = {}) => {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` | ${JSON.stringify(context)}` : '';
    console.log(`[${timestamp}] [INFO] ${message}${contextStr}`);
  },
  
  /**
   * Error-Log ausgeben
   * @param {string} message - Log-Nachricht
   * @param {Error|null} [error=null] - Fehler-Objekt
   * @param {LoggerContext} [context={}] - Zusätzlicher Kontext
   * @returns {Object} Error-Details für erweiterte Logging-Systeme
   */
  error: (message, error = null, context = {}) => {
    const timestamp = new Date().toISOString();
    const errorDetails = {
      message: message,
      timestamp: timestamp,
      error: error ? {
        name: error.name || 'UnknownError',
        message: error.message || String(error),
        code: error.code,
        errno: error.errno,
        sql: error.sql,
        stack: error.stack
      } : null,
      context: Object.keys(context).length > 0 ? context : null
    };
    
    // Detailliertes Error-Log
    console.error(`[${timestamp}] [ERROR] ${message}`);
    if (error) {
      console.error(`[${timestamp}] [ERROR] Error Name: ${error.name || 'UnknownError'}`);
      console.error(`[${timestamp}] [ERROR] Error Message: ${error.message || String(error)}`);
      if (error.code) {
        console.error(`[${timestamp}] [ERROR] Error Code: ${error.code}`);
      }
      if (error.errno) {
        console.error(`[${timestamp}] [ERROR] Error Number: ${error.errno}`);
      }
      if (error.sql) {
        console.error(`[${timestamp}] [ERROR] SQL: ${error.sql}`);
      }
      if (error.stack) {
        console.error(`[${timestamp}] [ERROR] Stack Trace:\n${error.stack}`);
      }
    }
    if (Object.keys(context).length > 0) {
      console.error(`[${timestamp}] [ERROR] Context: ${JSON.stringify(context, null, 2)}`);
    }
    
    // Error-Details für erweiterte Logging-Systeme (z.B. ELK, Splunk)
    return errorDetails;
  },
  
  /**
   * Warn-Log ausgeben
   * @param {string} message - Log-Nachricht
   * @param {LoggerContext} [context={}] - Zusätzlicher Kontext
   * @returns {void}
   */
  warn: (message, context = {}) => {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` | ${JSON.stringify(context)}` : '';
    console.warn(`[${timestamp}] [WARN] ${message}${contextStr}`);
  },
  
  /**
   * Debug-Log ausgeben
   * @param {string} message - Log-Nachricht
   * @param {LoggerContext} [context={}] - Zusätzlicher Kontext
   * @returns {void}
   */
  debug: (message, context = {}) => {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` | ${JSON.stringify(context)}` : '';
    console.log(`[${timestamp}] [DEBUG] ${message}${contextStr}`);
  }
};

// Middleware
// CORS-Konfiguration
// In Produktion sollte origin auf spezifische Domains beschränkt werden
const allowedOrigins = process.env.ALLOWED_ORIGIN 
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
  : (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
      ? [
          'http://localhost:3000',
          'https://waschplanapp.onrender.com', // Render-URL automatisch erlauben
          'https://*.onrender.com' // Alle Render-Subdomains erlauben (als Fallback)
        ]
      : ['http://localhost:3000', 'http://127.0.0.1:3000']); // Development: Lokale Origins

// CORS-Konfiguration mit Validierung
app.use(cors({
  origin: function (origin, callback) {
    // Erlaube Requests ohne Origin (z.B. Postman, curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // In Development: Erlaube alle lokalen Origins
    if (process.env.NODE_ENV !== 'production' && process.env.RENDER !== 'true') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    // Prüfe auf Render-Subdomains (z.B. https://waschplanapp.onrender.com) - ZUERST prüfen
    const isRenderDomain = origin.match(/^https:\/\/[\w-]+\.onrender\.com$/);
    if (isRenderDomain) {
      logger.debug('CORS: Render-Domain erlaubt', { origin });
      return callback(null, true);
    }
    
    // Prüfe ob Origin in erlaubter Liste ist
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    logger.warn('CORS: Origin nicht erlaubt', { origin, allowedOrigins });
    callback(new Error('CORS: Origin nicht erlaubt'));
  },
  credentials: true, // Wichtig für Sessions
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security Headers
app.use((req, res, next) => {
  // XSS-Schutz
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Content Security Policy (locker für Entwicklung)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
  }
  next();
});

// Body-Parser mit Größenlimit (verhindert große Payloads)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Session-Konfiguration mit File-Store
// Sessions-Verzeichnis erstellen, falls nicht vorhanden
const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!existsSync(SESSIONS_DIR)) {
  fs.mkdir(SESSIONS_DIR, { recursive: true }).catch(err => {
    logger.warn('Fehler beim Erstellen des Sessions-Verzeichnisses', { error: err.message });
  });
}

// Session-Konfiguration
// Auf Render: FileStore kann problematisch sein, daher Fallback auf Memory-Store
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'waschmaschine-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true', // HTTPS in Produktion oder auf Render
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 Stunden
    sameSite: 'lax', // 'lax' funktioniert am besten für Same-Origin-Requests auf Render
    path: '/' // Cookie für alle Pfade gültig
  }
  // name weggelassen - verwende Standard-Namen 'connect.sid' für bessere Kompatibilität
};

// Session-Store: Auf Render verwende Memory-Store (FileStore funktioniert nicht zuverlässig)
// In Development kann FileStore verwendet werden
if (process.env.RENDER === 'true' || process.env.NODE_ENV === 'production') {
  // Auf Render/Production: Memory-Store verwenden
  // Hinweis: Sessions gehen bei Server-Neustart verloren, aber das ist auf Render akzeptabel
  logger.info('Session-Memory-Store aktiviert (für Render/Production)');
  // Memory-Store ist der Standard, kein expliziter Store nötig
} else {
  // Development: Versuche FileStore zu verwenden
  try {
    if (!existsSync(SESSIONS_DIR)) {
      try {
        const fsSync = require('fs');
        fsSync.mkdirSync(SESSIONS_DIR, { recursive: true });
        logger.info('Sessions-Verzeichnis erstellt', { path: SESSIONS_DIR });
      } catch (mkdirError) {
        logger.warn('Sessions-Verzeichnis konnte nicht erstellt werden, verwende Memory-Store', { 
          path: SESSIONS_DIR,
          error: mkdirError.message 
        });
      }
    }
    
    if (existsSync(SESSIONS_DIR)) {
      try {
        // Test-Schreibzugriff
        const testFile = path.join(SESSIONS_DIR, '.test-write');
        const fsSync = require('fs');
        fsSync.writeFileSync(testFile, 'test');
        fsSync.unlinkSync(testFile);
        
        // FileStore verwenden (nur Development)
        sessionConfig.store = new FileStore({
          path: SESSIONS_DIR,
          ttl: 86400, // 24 Stunden in Sekunden
          retries: 1,
          logFn: (message) => {
            logger.debug(`Session-File-Store: ${message}`);
          }
        });
        logger.info('Session-File-Store aktiviert (Development)', { path: SESSIONS_DIR });
      } catch (writeError) {
        logger.warn('Sessions-Verzeichnis ist nicht beschreibbar, verwende Memory-Store', { 
          path: SESSIONS_DIR,
          error: writeError.message 
        });
      }
    }
  } catch (error) {
    logger.warn('FileStore konnte nicht initialisiert werden, verwende Memory-Store', { error: error.message });
  }
}

app.use(session(sessionConfig));

// Log Trust Proxy Status (nach Logger-Initialisierung)
if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
  logger.info('Trust Proxy aktiviert für Render/HTTPS');
}

// Statische Dateien werden NACH API-Routen registriert (siehe unten)

// Request-Logging Middleware (verbessert)
app.use((req, res, next) => {
  const queryStr = req.query && Object.keys(req.query).length > 0 
    ? '?' + new URLSearchParams(req.query).toString() 
    : '';
  logger.info(`${req.method} ${req.path}${queryStr}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ============================================================================
// RATE-LIMITING
// ============================================================================

/**
 * In-Memory Rate-Limiting-System
 * Verhindert API-Missbrauch durch konfigurierbare Limits pro Endpunkt
 */
const rateLimitStore = new Map();

// Rate-Limit-Konfiguration pro Endpunkt
const rateLimitConfig = {
  '/api/slots': { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 Requests pro 15 Minuten
  '/api/machines': { maxRequests: 60, windowMs: 15 * 60 * 1000 }, // 60 Requests pro 15 Minuten
  '/api/bookings': { maxRequests: 30, windowMs: 15 * 60 * 1000 }, // 30 Requests pro 15 Minuten (GET)
  'POST:/api/bookings': { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 Requests pro Stunde (POST)
  'DELETE:/api/bookings': { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 Requests pro Stunde (DELETE)
  '/api/statistics': { maxRequests: 30, windowMs: 15 * 60 * 1000 }, // 30 Requests pro 15 Minuten
  '/api/backup': { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 Requests pro Stunde
  '/api/restore': { maxRequests: 3, windowMs: 60 * 60 * 1000 } // 3 Requests pro Stunde
};

/**
 * Rate-Limiting-Middleware
 */
function createRateLimiter(config) {
  return (req, res, next) => {
    const clientId = req.ip || 'unknown';
    const endpoint = `${req.method}:${req.path}`;
    const configKey = rateLimitConfig[endpoint] ? endpoint : req.path;
    const limit = rateLimitConfig[configKey] || { maxRequests: 100, windowMs: 15 * 60 * 1000 };
    
    const key = `${clientId}:${configKey}`;
    const now = Date.now();
    
    // Alte Einträge bereinigen
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 0, resetTime: now + limit.windowMs });
    }
    
    const record = rateLimitStore.get(key);
    
    // Zeitfenster abgelaufen? Zurücksetzen
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + limit.windowMs;
    }
    
    // Limit überschritten?
    if (record.count >= limit.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      logger.warn('Rate-Limit überschritten', {
        clientId,
        endpoint: configKey,
        count: record.count,
        limit: limit.maxRequests
      });
      
      res.status(429).json({
        success: false,
        error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
        retryAfter: retryAfter,
        limit: limit.maxRequests,
        windowMs: limit.windowMs
      });
      return;
    }
    
    // Request zählen
    record.count++;
    
    // Rate-Limit-Header setzen
    res.setHeader('X-RateLimit-Limit', limit.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit.maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
    
    next();
  };
}

// ============================================================================
// TEMPORÄRER ADMIN-RESET ENDPOINT (NUR FÜR NOTFALL - NACH GEBRAUCH ENTFERNEN!)
// WICHTIG: Muss VOR allen anderen Routen sein, damit er nicht abgefangen wird!
// ============================================================================
app.get('/reset-admin', async (req, res) => {
  try {
    logger.info('Admin-Reset-Endpoint aufgerufen');
    
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'admin123';
    
    // Verwende dbHelper (verwendet die gleiche Datenbank wie der Server)
    try {
      // Prüfe ob Admin existiert
      const existingAdmin = await dbHelper.get('SELECT id, username FROM users WHERE username = ?', [ADMIN_USERNAME]);
      
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      if (existingAdmin) {
        // Admin existiert - Passwort zurücksetzen
        await dbHelper.run(
          'UPDATE users SET password_hash = ?, role = ? WHERE username = ?',
          [hash, 'admin', ADMIN_USERNAME]
        );
        
        logger.info('Admin-Passwort erfolgreich zurückgesetzt');
        res.json({
          success: true,
          message: 'Admin-Benutzer erfolgreich zurückgesetzt!',
          username: ADMIN_USERNAME,
          password: ADMIN_PASSWORD,
          warning: '⚠️ WICHTIG: Bitte entfernen Sie diesen Endpoint nach Gebrauch aus dem Code!'
        });
      } else {
        // Admin existiert nicht - erstellen
        await dbHelper.run(
          'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
          [ADMIN_USERNAME, hash, 'admin']
        );
        
        logger.info('Admin-Benutzer erfolgreich erstellt');
        res.json({
          success: true,
          message: 'Admin-Benutzer erfolgreich erstellt!',
          username: ADMIN_USERNAME,
          password: ADMIN_PASSWORD,
          warning: '⚠️ WICHTIG: Bitte entfernen Sie diesen Endpoint nach Gebrauch aus dem Code!'
        });
      }
    } catch (dbError) {
      logger.error('Fehler beim Zurücksetzen des Admin-Passworts', dbError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Zurücksetzen des Admin-Passworts: ' + dbError.message
      });
    }
  } catch (error) {
    logger.error('Unerwarteter Fehler im Admin-Reset-Endpoint', error);
    res.status(500).json({
      success: false,
      error: 'Unerwarteter Fehler: ' + error.message
    });
  }
});

// Rate-Limiting auf alle API-Routen anwenden
app.use('/api', createRateLimiter());

// Alte Rate-Limit-Einträge regelmäßig bereinigen (alle 5 Minuten)
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime + (60 * 60 * 1000)) { // Einträge älter als 1 Stunde löschen
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    logger.debug(`Rate-Limit-Store bereinigt: ${cleaned} alte Einträge entfernt`);
  }
}, 5 * 60 * 1000);

// ============================================================================
// API-RESPONSE-STANDARDISIERUNG
// ============================================================================

/**
 * Standardisierte API-Response-Helper
 */
const apiResponse = {
  success: (res, data, statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      data: data
    });
  },
  
  error: (res, message, statusCode = 500, details = null) => {
    const response = {
      success: false,
      error: message
    };
    if (details) {
      response.details = details;
    }
    res.status(statusCode).json(response);
  },
  
  validationError: (res, message, details = null) => {
    const response = {
      success: false,
      error: message,
      type: 'validation_error'
    };
    if (details) {
      response.details = details;
    }
    res.status(400).json(response);
  },
  
  notFound: (res, resource = 'Ressource') => {
    res.status(404).json({
      success: false,
      error: `${resource} nicht gefunden`
    });
  },
  
  conflict: (res, message) => {
    res.status(409).json({
      success: false,
      error: message,
      type: 'conflict'
    });
  },
  
  unauthorized: (res, message = 'Nicht autorisiert') => {
    res.status(401).json({
      success: false,
      error: message,
      type: 'unauthorized'
    });
  },
  
  forbidden: (res, message = 'Zugriff verweigert') => {
    res.status(403).json({
      success: false,
      error: message,
      type: 'forbidden'
    });
  }
};

// ============================================================================
// DATENBANK-HELPER
// ============================================================================

/**
 * Wrapper für Datenbank-Abfragen mit standardisierter Fehlerbehandlung
 * 
 * @namespace dbHelper
 * @description Abstraktions-Layer für SQLite-Datenbankoperationen mit Promise-basierter API
 * 
 * @example
 * // Alle Zeilen abrufen
 * const machines = await dbHelper.all('SELECT * FROM machines');
 * 
 * @example
 * // Einzelne Zeile abrufen
 * const machine = await dbHelper.get('SELECT * FROM machines WHERE id = ?', [1]);
 * 
 * @example
 * // Daten einfügen/aktualisieren
 * const result = await dbHelper.run('INSERT INTO machines (name, type) VALUES (?, ?)', ['Test', 'washer']);
 * console.log('ID:', result.lastID);
 */
const dbHelper = {
  all: (query, params = []) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      db.all(query, params, (err, rows) => {
        const duration = Date.now() - startTime;
        trackDbQuery(query, duration, err);
        
        if (err) {
          logger.error('Datenbank-Abfrage fehlgeschlagen', err, { query, params });
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  },
  
  get: (query, params = []) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      db.get(query, params, (err, row) => {
        const duration = Date.now() - startTime;
        trackDbQuery(query, duration, err);
        
        if (err) {
          logger.error('Datenbank-Abfrage fehlgeschlagen', err, { query, params });
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  },
  
  run: (query, params = []) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      db.run(query, params, function(err) {
        const duration = Date.now() - startTime;
        trackDbQuery(query, duration, err);
        
        if (err) {
          logger.error('Datenbank-Operation fehlgeschlagen', err, { query, params });
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }
};

// ============================================================================
// DATENBANK-CONNECTION-HANDLING
// ============================================================================

/**
 * Datenbank-Connection mit optimierten Einstellungen
 * SQLite hat kein echtes Connection-Pooling, aber wir können Performance optimieren
 */
let db = null;
let isShuttingDown = false;
let activeRequests = 0;

function createDatabaseConnection() {
  return new Promise((resolve, reject) => {
    // Verwende konfigurierbaren Datenbank-Pfad (für Render Persistent Disk)
    // Fallback-Pfade für Render (versuche verschiedene Optionen)
    let databasePath = process.env.DATABASE_PATH;
    const possiblePaths = databasePath 
      ? [databasePath]  // Wenn explizit gesetzt, nur diesen verwenden
      : [
          './waschmaschine.db',           // Relativer Pfad (sollte funktionieren)
          '/tmp/waschmaschine.db',        // Temp-Verzeichnis
          '/var/tmp/waschmaschine.db',    // Alternative Temp
          './data/waschmaschine.db'       // Relativer Pfad mit Unterverzeichnis
        ];
    
    // Versuche jeden Pfad nacheinander
    let currentPathIndex = 0;
    
    function tryNextPath() {
      if (currentPathIndex >= possiblePaths.length) {
        // Letzter Fallback: In-Memory Datenbank (geht bei jedem Neustart verloren, aber App funktioniert)
        logger.warn('Alle Datenbank-Pfade fehlgeschlagen, verwende In-Memory Datenbank als Fallback', {
          triedPaths: possiblePaths,
          cwd: process.cwd(),
          warning: 'Daten gehen bei Neustart verloren!'
        });
        
        const memoryDatabase = new sqlite3.Database(':memory:', (err) => {
          if (err) {
            logger.error('Auch In-Memory Datenbank konnte nicht erstellt werden', err);
            reject(err);
            return;
          }
          
          logger.warn('In-Memory Datenbank verwendet - Daten gehen bei Neustart verloren!');
          
          // Performance-Optimierungen
          memoryDatabase.serialize(() => {
            memoryDatabase.run('PRAGMA journal_mode = WAL');
            memoryDatabase.run('PRAGMA synchronous = NORMAL');
            memoryDatabase.run('PRAGMA cache_size = -10000');
            memoryDatabase.run('PRAGMA foreign_keys = ON');
            memoryDatabase.run('PRAGMA temp_store = MEMORY');
          });
          
          memoryDatabase.on('error', (err) => {
            logger.error('Datenbank-Fehler aufgetreten', err);
          });
          
          resolve(memoryDatabase);
        });
        return;
      }
      
      databasePath = possiblePaths[currentPathIndex];
      currentPathIndex++;
      
      // Verzeichnis erstellen, falls es nicht existiert (wichtig für Render)
      const dbDir = path.dirname(databasePath);
      if (dbDir !== '.' && dbDir !== '' && !existsSync(dbDir)) {
        try {
          fs.mkdirSync(dbDir, { recursive: true });
          logger.info(`Datenbank-Verzeichnis erstellt: ${dbDir}`);
        } catch (err) {
          logger.warn(`Konnte Verzeichnis nicht erstellen: ${dbDir}`, { error: err.message });
          // Versuche nächsten Pfad
          tryNextPath();
          return;
        }
      }
      
      logger.info(`Versuche Datenbank zu öffnen: ${databasePath}`);
      
      const database = new sqlite3.Database(databasePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          logger.warn(`Fehler beim Öffnen der Datenbank: ${databasePath}`, {
            error: err.message,
            code: err.code,
            willTryNext: currentPathIndex < possiblePaths.length
          });
          
          // Versuche nächsten Pfad
          if (currentPathIndex < possiblePaths.length) {
            tryNextPath();
          } else {
            logger.error('Alle Datenbank-Pfade fehlgeschlagen', {
              triedPaths: possiblePaths,
              lastError: err.message,
              cwd: process.cwd()
            });
            reject(err);
          }
          return;
        }
        
        // Erfolg! Datenbank wurde geöffnet
        logger.info(`Datenbank erfolgreich geöffnet: ${databasePath}`);
        
        // Performance-Optimierungen
        database.serialize(() => {
        // WAL-Mode aktivieren für bessere Concurrency (Write-Ahead Logging)
        database.run('PRAGMA journal_mode = WAL', (err) => {
          if (err) {
            logger.warn('WAL-Mode konnte nicht aktiviert werden', { error: err.message });
          } else {
            logger.debug('WAL-Mode aktiviert für bessere Performance');
          }
        });
        
        // Synchronisation optimieren (NORMAL ist ein guter Kompromiss)
        database.run('PRAGMA synchronous = NORMAL', (err) => {
          if (err) {
            logger.warn('Synchronous-Mode konnte nicht gesetzt werden', { error: err.message });
          }
        });
        
        // Cache-Größe erhöhen (Standard: 2000, wir setzen 10000)
        database.run('PRAGMA cache_size = -10000', (err) => {
          if (err) {
            logger.warn('Cache-Size konnte nicht gesetzt werden', { error: err.message });
          } else {
            logger.debug('Cache-Size auf 10000 Seiten erhöht');
          }
        });
        
        // Foreign Keys aktivieren
        database.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            logger.warn('Foreign Keys konnten nicht aktiviert werden', { error: err.message });
          }
        });
        
        // Temp Store im Memory (für bessere Performance)
        database.run('PRAGMA temp_store = MEMORY', (err) => {
          if (err) {
            logger.warn('Temp Store konnte nicht gesetzt werden', { error: err.message });
          }
        });
      });
      
        logger.info('Datenbank erfolgreich verbunden mit optimierten Einstellungen');
        
        // Error-Handler für Datenbank-Fehler
        database.on('error', (err) => {
          logger.error('Datenbank-Fehler aufgetreten', err);
        });
        
        resolve(database);
      });
    }
    
    // Starte Versuch mit erstem Pfad
    tryNextPath();
  });
}

// Datenbank initialisieren und Server starten
createDatabaseConnection()
  .then(async (database) => {
    db = database;
    try {
      // Datenbank-Schema initialisieren
      await initDatabase();
      logger.info('Datenbank-Schema erfolgreich initialisiert');
      
      // Migrationen ausführen (nach Schema-Initialisierung)
      await runMigrations();
      logger.info('Datenbank-Initialisierung und Migrationen abgeschlossen');
      
      // Server starten NACH erfolgreicher Datenbank-Initialisierung
      // Binde explizit an 0.0.0.0, damit Server auf allen Interfaces erreichbar ist
      app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server erfolgreich gestartet`, { 
          port: PORT, 
          url: `http://localhost:${PORT}`,
          networkUrl: `http://0.0.0.0:${PORT}`,
          accessibleOn: 'alle Netzwerk-Interfaces (0.0.0.0)'
        });
      });
    } catch (error) {
      logger.error('Kritischer Fehler: Datenbank konnte nicht initialisiert werden', error);
      process.exit(1);
    }
  })
  .catch((error) => {
    logger.error('Kritischer Fehler: Datenbank-Verbindung konnte nicht hergestellt werden', error);
    process.exit(1);
  });

// Request-Tracking-Middleware
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.status(503).json({
      success: false,
      error: 'Server wird heruntergefahren. Bitte versuchen Sie es später erneut.'
    });
    return;
  }
  
  activeRequests++;
  
  res.on('finish', () => {
    activeRequests--;
  });
  
  next();
});

// ============================================================================
// DATENBANK-INITIALISIERUNG
// ============================================================================

/**
 * Datenbank-Schema erstellen und Seed-Daten einfügen
 * Robuste Initialisierung mit besserer Fehlerbehandlung
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      let hasError = false;
      
      // Foreign Keys aktivieren
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          logger.error('Fehler beim Aktivieren der Foreign Keys', err);
          hasError = true;
          reject(err);
          return;
        }
        logger.debug('Foreign Keys aktiviert');
      });

    // Maschinen-Tabelle
    db.run(`CREATE TABLE IF NOT EXISTS machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL
    )`, (err) => {
      if (err) {
        logger.error('Fehler beim Erstellen der machines-Tabelle', err);
      } else {
        logger.debug('Tabelle machines erstellt oder bereits vorhanden');
      }
    });

    // Benutzer-Tabelle
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT,  -- NULL erlaubt für einfaches Login (nur Name)
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )`, (err) => {
      if (err) {
        logger.error('Fehler beim Erstellen der users-Tabelle', err);
      } else {
        logger.debug('Tabelle users erstellt oder bereits vorhanden');
        
        // Index für Username
        db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)', (err) => {
          if (err) {
            logger.warn('Fehler beim Erstellen des Index idx_users_username', { error: err.message });
          }
        });
      }
    });

    // Buchungen-Tabelle
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      slot TEXT NOT NULL,
      user_name TEXT NOT NULL,
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    )`, (err) => {
      if (err) {
        logger.error('Fehler beim Erstellen der bookings-Tabelle', err);
      } else {
        logger.debug('Tabelle bookings erstellt oder bereits vorhanden');
        
        // Indizes für Performance-Optimierung erstellen
        db.run('CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)', (err) => {
          if (err) {
            logger.warn('Fehler beim Erstellen des Index idx_bookings_date', { error: err.message });
          } else {
            logger.debug('Index idx_bookings_date erstellt oder bereits vorhanden');
          }
        });
        
        db.run('CREATE INDEX IF NOT EXISTS idx_bookings_machine_date ON bookings(machine_id, date)', (err) => {
          if (err) {
            logger.warn('Fehler beim Erstellen des Index idx_bookings_machine_date', { error: err.message });
          } else {
            logger.debug('Index idx_bookings_machine_date erstellt oder bereits vorhanden');
          }
        });
        
        // Eindeutiger Index für Doppelbuchungen (Performance + Datenintegrität)
        db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique ON bookings(machine_id, date, slot)', (err) => {
          if (err) {
            logger.warn('Fehler beim Erstellen des Unique Index idx_bookings_unique', { error: err.message });
          } else {
            logger.debug('Unique Index idx_bookings_unique erstellt oder bereits vorhanden');
          }
        });
        
        // Index für machine_id (für Statistiken und Maschinen-Löschung)
        db.run('CREATE INDEX IF NOT EXISTS idx_bookings_machine_id ON bookings(machine_id)', (err) => {
          if (err) {
            logger.warn('Fehler beim Erstellen des Index idx_bookings_machine_id', { error: err.message });
          } else {
            logger.debug('Index idx_bookings_machine_id erstellt oder bereits vorhanden');
          }
        });
        
        // Index für user_name (für Admin-Funktionen und Benutzer-Buchungen)
        db.run('CREATE INDEX IF NOT EXISTS idx_bookings_user_name ON bookings(user_name)', (err) => {
          if (err) {
            logger.warn('Fehler beim Erstellen des Index idx_bookings_user_name', { error: err.message });
          } else {
            logger.debug('Index idx_bookings_user_name erstellt oder bereits vorhanden');
          }
        });
        
        // Index für slot (für ORDER BY slot Abfragen)
        db.run('CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot)', (err) => {
          if (err) {
            logger.warn('Fehler beim Erstellen des Index idx_bookings_slot', { error: err.message });
          } else {
            logger.debug('Index idx_bookings_slot erstellt oder bereits vorhanden');
          }
        });
        
        // Composite Index für häufige ORDER BY Abfragen (date DESC, slot)
        db.run('CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON bookings(date DESC, slot)', (err) => {
          if (err) {
            logger.warn('Fehler beim Erstellen des Index idx_bookings_date_slot', { error: err.message });
          } else {
            logger.debug('Index idx_bookings_date_slot erstellt oder bereits vorhanden');
          }
        });
      }
    });
    
    // Index für machines.type (für Filterung nach Maschinentyp)
    db.run('CREATE INDEX IF NOT EXISTS idx_machines_type ON machines(type)', (err) => {
      if (err) {
        logger.warn('Fehler beim Erstellen des Index idx_machines_type', { error: err.message });
      } else {
        logger.debug('Index idx_machines_type erstellt oder bereits vorhanden');
      }
    });

    // Seed-Daten: Maschinen einfügen (nur wenn Tabelle leer ist)
    db.get('SELECT COUNT(*) as count FROM machines', (err, row) => {
      if (err) {
        logger.error('Fehler beim Prüfen der Maschinen-Tabelle', err);
        return;
      }
      
      if (row.count === 0) {
        logger.info('Maschinen-Tabelle ist leer, füge Seed-Daten ein');
        const seedMachines = [
          { name: 'Waschmaschine 1', type: 'washer' },
          { name: 'Waschmaschine 2', type: 'washer' },
          { name: 'Waschmaschine 3', type: 'washer' },
          { name: 'Trocknungsraum 1', type: 'dryer' },
          { name: 'Trocknungsraum 2', type: 'dryer' },
          { name: 'Trocknungsraum 3', type: 'dryer' },
          { name: 'Tumbler 1', type: 'tumbler' },
          { name: 'Tumbler 2', type: 'tumbler' }
        ];

        let inserted = 0;
        seedMachines.forEach(machine => {
          db.run(
            'INSERT INTO machines (name, type) VALUES (?, ?)',
            [machine.name, machine.type],
            (err) => {
              if (err) {
                logger.error('Fehler beim Einfügen der Seed-Daten', err, { machine });
              } else {
                inserted++;
                logger.info(`Maschine eingefügt: ${machine.name}`, { type: machine.type });
                if (inserted === seedMachines.length) {
                  logger.info(`Alle ${inserted} Maschinen erfolgreich eingefügt`);
                }
              }
            }
          );
        });
      } else {
        logger.info(`Maschinen-Tabelle enthält bereits ${row.count} Einträge, keine Seed-Daten nötig`);
      }
    });

      // Seed-Daten: Admin-Benutzer erstellen (nur wenn Tabelle leer ist)
      db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
        if (err) {
          logger.error('Fehler beim Prüfen der users-Tabelle', err);
          reject(err);
          return;
        }
        
        if (row && row.count === 0) {
          logger.info('Users-Tabelle ist leer, füge Admin-Benutzer ein');
          const defaultPassword = 'admin123'; // Sollte in Produktion geändert werden!
          
          try {
            const hash = await bcrypt.hash(defaultPassword, 10);
            
            db.run(
              'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
              ['admin', hash, 'admin'],
              (err) => {
                if (err) {
                  logger.error('Fehler beim Einfügen des Admin-Benutzers', err);
                  reject(err);
                } else {
                  logger.info('Admin-Benutzer erstellt: username=admin, password=admin123');
                  logger.warn('WICHTIG: Bitte ändern Sie das Admin-Passwort nach dem ersten Login!');
                  resolve();
                }
              }
            );
          } catch (hashError) {
            logger.error('Fehler beim Hashen des Admin-Passworts', hashError);
            reject(hashError);
          }
        } else if (row) {
          logger.info(`Users-Tabelle enthält bereits ${row.count} Einträge, keine Seed-Daten nötig`);
          resolve();
        } else {
          logger.warn('Unerwarteter Zustand: row ist null');
          resolve();
        }
      });
    });
  });
}

// Feste Slots (nicht in Datenbank gespeichert)
// Abbildung der offiziellen Zeitfenster aus der Waschküchenordnung:
// 07–12 Uhr, 12–17 Uhr, 17–21 Uhr
const TIME_SLOTS = [
  { start: '07:00', end: '12:00', label: '07:00-12:00' },
  { start: '12:00', end: '17:00', label: '12:00-17:00' },
  { start: '17:00', end: '21:00', label: '17:00-21:00' }
];

/**
 * Validiert ob ein Slot gültig ist
 * 
 * @param {string} slot - Der zu validierende Slot (z.B. "08:00-10:00")
 * @returns {boolean} true wenn Slot gültig, false sonst
 * 
 * @example
 * isValidSlot('08:00-10:00'); // true
 * isValidSlot('invalid'); // false
 */
function isValidSlot(slot) {
  return TIME_SLOTS.some(s => s.label === slot);
}

/**
 * Validiert ein Datum (Format YYYY-MM-DD, nicht in Vergangenheit)
 * 
 * @param {string} dateString - Das zu validierende Datum im Format YYYY-MM-DD
 * @returns {boolean} true wenn Datum gültig, false sonst
 * 
 * @description
 * Prüft:
 * - Format YYYY-MM-DD
 * - Ob Datum wirklich gültig ist (z.B. nicht 2024-13-45)
 * - Ob Datum nicht in Vergangenheit liegt
 * 
 * @example
 * isValidDate('2024-12-31'); // true (wenn heute <= 2024-12-31)
 * isValidDate('2020-01-01'); // false (Vergangenheit)
 * isValidDate('invalid'); // false
 */
function isValidDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  
  const trimmedDate = dateString.trim();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(trimmedDate)) {
    return false;
  }
  
  // Prüfe ob Datum wirklich gültig ist (z.B. nicht 2024-13-45)
  const date = new Date(trimmedDate + 'T00:00:00');
  if (isNaN(date.getTime())) {
    return false;
  }
  
  // Prüfe ob Datum mit Eingabe übereinstimmt (verhindert 2024-02-30)
  const [year, month, day] = trimmedDate.split('-').map(Number);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return false;
  }
  
  // Prüfe ob Datum nicht in Vergangenheit liegt
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

// Hilfsfunktion: String validieren und trimmen
function validateAndTrimString(value, fieldName) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Hilfsfunktion: Integer validieren
function validateInteger(value, fieldName) {
  if (value === null || value === undefined) {
    return null;
  }
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

// ============================================================================
// REQUEST-VALIDIERUNG-MIDDLEWARE
// ============================================================================

/**
 * Wiederverwendbare Validierungs-Middleware
 * Reduziert Code-Duplikation und sorgt für konsistente Validierung
 */
const validators = {
  /**
   * Validiert Request-Body-Felder
   * @param {Object} schema - Validierungsschema { field: { required, type, validator } }
   */
  body: (schema) => {
    return (req, res, next) => {
      const errors = [];
      const validated = {};
      
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];
        
        // Pflichtfeld-Prüfung
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} ist ein Pflichtfeld`);
          continue;
        }
        
        // Optionales Feld überspringen, wenn nicht vorhanden
        if (!rules.required && (value === undefined || value === null || value === '')) {
          continue;
        }
        
        // Typ-Validierung
        if (rules.type) {
          if (rules.type === 'string' && typeof value !== 'string') {
            errors.push(`${field} muss ein String sein`);
            continue;
          }
          if (rules.type === 'integer' && !Number.isInteger(Number(value))) {
            errors.push(`${field} muss eine ganze Zahl sein`);
            continue;
          }
          if (rules.type === 'date' && typeof value !== 'string') {
            errors.push(`${field} muss ein Datum (String) sein`);
            continue;
          }
        }
        
        // Custom Validator
        if (rules.validator) {
          const validationResult = rules.validator(value, field);
          if (validationResult !== true && validationResult !== null) {
            if (typeof validationResult === 'string') {
              errors.push(validationResult);
            } else {
              errors.push(`${field} ist ungültig`);
            }
            continue;
          }
        }
        
        // Wert normalisieren und speichern
        if (rules.normalize) {
          validated[field] = rules.normalize(value);
        } else {
          validated[field] = value;
        }
      }
      
      if (errors.length > 0) {
        logger.warn('Validierungsfehler', { errors, body: req.body });
        apiResponse.validationError(res, 'Validierungsfehler', errors);
        return;
      }
      
      // Validierte Werte in req.validated speichern
      req.validated = validated;
      next();
    };
  },
  
  /**
   * Validiert Query-Parameter
   * @param {Object} schema - Validierungsschema
   */
  query: (schema) => {
    return (req, res, next) => {
      const errors = [];
      const validated = {};
      
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.query[field];
        
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`Query-Parameter ${field} ist erforderlich`);
          continue;
        }
        
        if (!rules.required && (value === undefined || value === null || value === '')) {
          continue;
        }
        
        if (rules.validator) {
          const validationResult = rules.validator(value, field);
          if (validationResult !== true && validationResult !== null) {
            if (typeof validationResult === 'string') {
              errors.push(validationResult);
            } else {
              errors.push(`Query-Parameter ${field} ist ungültig`);
            }
            continue;
          }
        }
        
        validated[field] = rules.normalize ? rules.normalize(value) : value;
      }
      
      if (errors.length > 0) {
        logger.warn('Query-Validierungsfehler', { errors, query: req.query });
        apiResponse.validationError(res, 'Query-Validierungsfehler', errors);
        return;
      }
      
      req.validated = validated;
      next();
    };
  },
  
  /**
   * Validiert URL-Parameter
   * @param {Object} schema - Validierungsschema
   */
  params: (schema) => {
    return (req, res, next) => {
      const errors = [];
      const validated = {};
      
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.params[field];
        
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`URL-Parameter ${field} ist erforderlich`);
          continue;
        }
        
        if (!rules.required && (value === undefined || value === null || value === '')) {
          continue;
        }
        
        if (rules.validator) {
          const validationResult = rules.validator(value, field);
          if (validationResult !== true && validationResult !== null) {
            if (typeof validationResult === 'string') {
              errors.push(validationResult);
            } else {
              errors.push(`URL-Parameter ${field} ist ungültig`);
            }
            continue;
          }
        }
        
        validated[field] = rules.normalize ? rules.normalize(value) : value;
      }
      
      if (errors.length > 0) {
        logger.warn('Params-Validierungsfehler', { errors, params: req.params });
        apiResponse.validationError(res, 'Params-Validierungsfehler', errors);
        return;
      }
      
      req.validated = validated;
      next();
    };
  }
};

/**
 * Vordefinierte Validatoren für häufige Fälle
 */
const commonValidators = {
  date: (value) => {
    if (!isValidDate(value)) {
      return 'Ungültiges Datum. Format: YYYY-MM-DD, Datum muss gültig sein und darf nicht in der Vergangenheit liegen.';
    }
    return true;
  },
  
  slot: (value) => {
    if (!isValidSlot(value)) {
      return `Ungültiger Slot. Gültige Slots: ${TIME_SLOTS.map(s => s.label).join(', ')}`;
    }
    return true;
  },
  
  string: (value, fieldName) => {
    const trimmed = validateAndTrimString(value, fieldName);
    if (!trimmed) {
      return `${fieldName} muss ein nicht-leerer String sein`;
    }
    return true;
  },
  
  integer: (value, fieldName) => {
    const validated = validateInteger(value, fieldName);
    if (!validated) {
      return `${fieldName} muss eine positive ganze Zahl sein`;
    }
    return true;
  },
  
  normalizeString: (value) => {
    return typeof value === 'string' ? value.trim() : String(value);
  },
  
  normalizeInteger: (value) => {
    return validateInteger(value) || parseInt(value, 10);
  }
};

// ============================================================================
// MONITORING & METRIKEN
// ============================================================================

/**
 * Metriken-Sammlung für Monitoring
 * Sammelt Request-Zeiten, Fehlerraten, API-Statistiken, etc.
 */
const metrics = {
  // Request-Statistiken
  requests: {
    total: 0,
    byMethod: {},
    byEndpoint: {},
    byStatus: {},
    errors: 0,
    startTime: Date.now()
  },
  
  // Performance-Metriken
  performance: {
    responseTimes: [], // Array von Response-Zeiten in ms
    slowRequests: [], // Requests > 1000ms
    dbQueryTimes: [] // Datenbank-Abfrage-Zeiten
  },
  
  // System-Metriken
  system: {
    memory: {
      peak: 0,
      current: 0
    },
    uptime: 0,
    activeConnections: 0
  },
  
  // Datenbank-Metriken
  database: {
    queries: {
      total: 0,
      errors: 0,
      slow: 0 // Queries > 100ms
    },
    connections: {
      active: 0,
      peak: 0
    }
  },
  
  // API-spezifische Metriken
  api: {
    bookings: {
      created: 0,
      deleted: 0,
      errors: 0
    },
    auth: {
      logins: 0,
      logouts: 0,
      failures: 0
    }
  },
  
  // Zeitfenster-Metriken (letzte Stunde)
  lastHour: {
    requests: 0,
    errors: 0,
    avgResponseTime: 0,
    timestamp: Date.now()
  }
};

/**
 * Berechnet Durchschnittswert eines Arrays
 */
function calculateAverage(arr) {
  if (!arr || arr.length === 0) return 0;
  const sum = arr.reduce((a, b) => a + b, 0);
  return Math.round(sum / arr.length);
}

/**
 * Berechnet Perzentile (p50, p95, p99)
 */
function calculatePercentiles(arr, percentiles = [50, 95, 99]) {
  if (!arr || arr.length === 0) return {};
  
  const sorted = [...arr].sort((a, b) => a - b);
  const result = {};
  
  percentiles.forEach(p => {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    result[`p${p}`] = sorted[Math.max(0, index)];
  });
  
  return result;
}

/**
 * Aktualisiert Request-Metriken
 */
function updateRequestMetrics(req, res, responseTime) {
  const method = req.method;
  const endpoint = req.path;
  const status = res.statusCode;
  
  // Gesamt-Statistiken
  metrics.requests.total++;
  
  // Nach Methode
  if (!metrics.requests.byMethod[method]) {
    metrics.requests.byMethod[method] = 0;
  }
  metrics.requests.byMethod[method]++;
  
  // Nach Endpoint
  if (!metrics.requests.byEndpoint[endpoint]) {
    metrics.requests.byEndpoint[endpoint] = { count: 0, totalTime: 0, errors: 0 };
  }
  metrics.requests.byEndpoint[endpoint].count++;
  metrics.requests.byEndpoint[endpoint].totalTime += responseTime;
  
  // Nach Status
  const statusGroup = Math.floor(status / 100) * 100; // 200, 300, 400, 500
  if (!metrics.requests.byStatus[statusGroup]) {
    metrics.requests.byStatus[statusGroup] = 0;
  }
  metrics.requests.byStatus[statusGroup]++;
  
  // Fehler zählen (4xx, 5xx)
  if (status >= 400) {
    metrics.requests.errors++;
    metrics.requests.byEndpoint[endpoint].errors++;
  }
  
  // Performance-Metriken
  metrics.performance.responseTimes.push(responseTime);
  
  // Nur letzte 1000 Response-Zeiten behalten (Speicher-Optimierung)
  if (metrics.performance.responseTimes.length > 1000) {
    metrics.performance.responseTimes.shift();
  }
  
  // Langsame Requests tracken (> 1000ms)
  if (responseTime > 1000) {
    metrics.performance.slowRequests.push({
      method,
      endpoint,
      status,
      responseTime,
      timestamp: Date.now()
    });
    
    // Nur letzte 100 langsame Requests behalten
    if (metrics.performance.slowRequests.length > 100) {
      metrics.performance.slowRequests.shift();
    }
  }
  
  // Zeitfenster-Metriken aktualisieren (letzte Stunde)
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  if (metrics.lastHour.timestamp < oneHourAgo) {
    // Neue Stunde - zurücksetzen
    metrics.lastHour = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      timestamp: now
    };
  }
  
  metrics.lastHour.requests++;
  if (status >= 400) {
    metrics.lastHour.errors++;
  }
}

/**
 * Performance-Monitoring-Middleware
 * Misst Response-Zeiten für alle Requests
 */
function performanceMonitoring(req, res, next) {
  const startTime = Date.now();
  
  // Response-Zeit messen wenn Response fertig ist
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    updateRequestMetrics(req, res, responseTime);
  });
  
  next();
}

/**
 * Datenbank-Performance-Tracking
 */
function trackDbQuery(query, duration, error = null) {
  metrics.database.queries.total++;
  
  if (error) {
    metrics.database.queries.errors++;
  }
  
  if (duration > 100) {
    metrics.database.queries.slow++;
  }
  
  metrics.performance.dbQueryTimes.push(duration);
  
  // Nur letzte 500 DB-Query-Zeiten behalten
  if (metrics.performance.dbQueryTimes.length > 500) {
    metrics.performance.dbQueryTimes.shift();
  }
}

/**
 * Aktualisiert System-Metriken
 */
function updateSystemMetrics() {
  const memUsage = process.memoryUsage();
  const currentMemory = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  metrics.system.memory.current = currentMemory;
  if (currentMemory > metrics.system.memory.peak) {
    metrics.system.memory.peak = currentMemory;
  }
  
  metrics.system.uptime = process.uptime();
  metrics.system.activeConnections = activeRequests;
  
  // Zeitfenster-Durchschnitt berechnen
  if (metrics.lastHour.requests > 0) {
    const recentTimes = metrics.performance.responseTimes.slice(-metrics.lastHour.requests);
    metrics.lastHour.avgResponseTime = calculateAverage(recentTimes);
  }
}

// System-Metriken alle 30 Sekunden aktualisieren
setInterval(updateSystemMetrics, 30000);

// ============================================================================
// API-VERSIONIERUNG
// ============================================================================

// ============================================================================
// AUTHENTIFIZIERUNG & AUTORISIERUNG
// ============================================================================

/**
 * Middleware: Prüft ob Benutzer eingeloggt ist
 */
function requireAuth(req, res, next) {
  logger.debug('requireAuth Middleware', {
    hasSession: !!req.session,
    hasUserId: !!(req.session && req.session.userId),
    sessionId: req.sessionID,
    userId: req.session?.userId,
    username: req.session?.username,
    role: req.session?.role
  });
  
  if (req.session && req.session.userId) {
    next();
  } else {
    logger.warn('requireAuth: Keine gültige Session', {
      hasSession: !!req.session,
      sessionId: req.sessionID,
      cookies: req.headers.cookie
    });
    apiResponse.error(res, 'Authentifizierung erforderlich', 401);
  }
}

/**
 * Middleware: Prüft ob Benutzer Admin ist
 */
function requireAdmin(req, res, next) {
  logger.debug('requireAdmin Middleware', {
    hasSession: !!req.session,
    hasUserId: !!(req.session && req.session.userId),
    isAdmin: !!(req.session && req.session.role === 'admin'),
    sessionId: req.sessionID,
    userId: req.session?.userId,
    username: req.session?.username,
    role: req.session?.role
  });
  
  if (req.session && req.session.userId && req.session.role === 'admin') {
    next();
  } else {
    logger.warn('requireAdmin: Keine Admin-Rechte', {
      hasSession: !!req.session,
      hasUserId: !!(req.session && req.session.userId),
      role: req.session?.role,
      sessionId: req.sessionID,
      cookies: req.headers.cookie ? 'vorhanden' : 'fehlt'
    });
    apiResponse.unauthorized(res, 'Admin-Rechte erforderlich');
  }
}

/**
 * Hilfsfunktion: Aktuellen Benutzer aus Session abrufen
 */
async function getCurrentUser(req) {
  if (!req.session || !req.session.userId) {
    return null;
  }
  
  try {
    const user = await dbHelper.get('SELECT id, username, role FROM users WHERE id = ?', [req.session.userId]);
    return user;
  } catch (error) {
    logger.error('Fehler beim Abrufen des aktuellen Benutzers', error);
    return null;
  }
}

// ============================================================================
// TEMPORÄRER ADMIN-RESET ENDPOINT (NUR FÜR NOTFALL - NACH GEBRAUCH ENTFERNEN!)
// WICHTIG: Muss VOR allen anderen Routen sein, damit er nicht abgefangen wird!
// ============================================================================

// API-Router für Versionierung
const apiV1 = express.Router();

// ============================================================================
// AUTH-ENDPUNKTE
// ============================================================================

// Einfaches Login (nur Name, kein Passwort) - für normale Benutzer
apiV1.post('/auth/login-simple', async (req, res) => {
  try {
    const { name, username } = req.body; // Unterstütze beide Varianten
    const trimmedName = (name || username || '').trim();
    
    logger.debug('Einfaches Login-Versuch', { 
      name: trimmedName ? 'vorhanden' : 'fehlt',
      hasSession: !!req.session,
      sessionId: req.sessionID
    });
    
    if (!trimmedName) {
      logger.warn('Einfaches Login ohne Name');
      apiResponse.validationError(res, 'Name ist erforderlich');
      return;
    }
    
    // Validierung: Name-Länge
    if (trimmedName.length < 2) {
      apiResponse.validationError(res, 'Name muss mindestens 2 Zeichen lang sein');
      return;
    }
    if (trimmedName.length > 50) {
      apiResponse.validationError(res, 'Name darf maximal 50 Zeichen lang sein');
      return;
    }
    
    // Prüfe ob Benutzer existiert, sonst erstellen
    let user = await dbHelper.get('SELECT * FROM users WHERE username = ?', [trimmedName]);
    
    if (!user) {
      // Benutzer existiert nicht - erstelle automatisch (ohne Passwort)
      logger.info('Erstelle neuen Benutzer für einfaches Login', { username: trimmedName });
      
      // Erstelle User ohne Passwort (password_hash = NULL für einfache Login)
      const result = await dbHelper.run(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        [trimmedName, null, 'user']
      );
      
      user = await dbHelper.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
      logger.info('Neuer Benutzer erstellt', { userId: user.id, username: user.username });
    }
    
    // Session erstellen
    if (!req.session) {
      logger.error('KRITISCH: req.session ist undefined!');
      apiResponse.error(res, 'Session-Fehler', 500);
      return;
    }
    
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    
    logger.debug('Session gesetzt (einfaches Login)', { 
      userId: req.session.userId,
      username: req.session.username,
      role: req.session.role,
      sessionId: req.sessionID
    });
    
    // Session explizit speichern
    await new Promise((resolve) => {
      req.session.save((err) => {
        if (err) {
          logger.error('Fehler beim Speichern der Session', err);
        } else {
          logger.debug('Session erfolgreich gespeichert (einfaches Login)', { sessionId: req.sessionID });
        }
        resolve();
      });
    });
    
    // Last-Login aktualisieren
    await dbHelper.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    logger.info('Einfaches Login erfolgreich', { username: user.username, sessionId: req.sessionID });
    
    metrics.api.auth.logins++;
    
    apiResponse.success(res, {
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    logger.error('Fehler beim einfachen Login', error, { 
      errorMessage: error.message,
      errorStack: error.stack,
      name: req.body?.name
    });
    apiResponse.error(res, 'Fehler beim Login', 500);
  }
});

// Senior-Login (nur Name, kein Passwort, erstellt User mit Rolle 'senior')
apiV1.post('/auth/login-senior', async (req, res) => {
  try {
    const { name, username } = req.body; // Unterstütze beide Varianten
    const trimmedName = (name || username || '').trim();
    
    logger.debug('Senior-Login-Versuch', { 
      name: trimmedName ? 'vorhanden' : 'fehlt',
      hasSession: !!req.session,
      sessionId: req.sessionID
    });
    
    if (!trimmedName) {
      logger.warn('Senior-Login ohne Name');
      apiResponse.validationError(res, 'Name ist erforderlich');
      return;
    }
    
    // Validierung: Name-Länge
    if (trimmedName.length < 2) {
      apiResponse.validationError(res, 'Name muss mindestens 2 Zeichen lang sein');
      return;
    }
    if (trimmedName.length > 50) {
      apiResponse.validationError(res, 'Name darf maximal 50 Zeichen lang sein');
      return;
    }
    
    // Prüfe ob Benutzer existiert, sonst erstellen mit Rolle 'senior'
    let user = await dbHelper.get('SELECT * FROM users WHERE username = ?', [trimmedName]);
    
    if (!user) {
      // Benutzer existiert nicht - erstelle automatisch mit Rolle 'senior'
      logger.info('Erstelle neuen Senior-Benutzer', { username: trimmedName });
      
      // Erstelle User ohne Passwort (password_hash = NULL) mit Rolle 'senior'
      const result = await dbHelper.run(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        [trimmedName, null, 'senior']
      );
      
      user = await dbHelper.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
      logger.info('Neuer Senior-Benutzer erstellt', { userId: user.id, username: user.username });
    } else {
      // Benutzer existiert - aktualisiere Rolle auf 'senior' falls nötig
      if (user.role !== 'senior') {
        await dbHelper.run('UPDATE users SET role = ? WHERE id = ?', ['senior', user.id]);
        user.role = 'senior';
        logger.info('Benutzer-Rolle auf senior aktualisiert', { userId: user.id, username: user.username });
      }
    }
    
    // Session erstellen
    if (!req.session) {
      logger.error('KRITISCH: req.session ist undefined!');
      apiResponse.error(res, 'Session-Fehler', 500);
      return;
    }
    
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    
    logger.debug('Session gesetzt (Senior-Login)', { 
      userId: req.session.userId,
      username: req.session.username,
      role: req.session.role,
      sessionId: req.sessionID
    });
    
    // Session explizit speichern
    await new Promise((resolve) => {
      req.session.save((err) => {
        if (err) {
          logger.error('Fehler beim Speichern der Session', err);
        } else {
          logger.debug('Session erfolgreich gespeichert (Senior-Login)', { sessionId: req.sessionID });
        }
        resolve();
      });
    });
    
    // Last-Login aktualisieren
    await dbHelper.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    logger.info('Senior-Login erfolgreich', { username: user.username, sessionId: req.sessionID });
    
    metrics.api.auth.logins++;
    
    apiResponse.success(res, {
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    logger.error('Fehler beim Senior-Login', error, { 
      errorMessage: error.message,
      errorStack: error.stack,
      name: req.body?.name
    });
    apiResponse.error(res, 'Fehler beim Login', 500);
  }
});

// Login (mit Passwort - für Admin)
apiV1.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    logger.debug('Login-Versuch', { 
      username: username ? 'vorhanden' : 'fehlt',
      password: password ? 'vorhanden' : 'fehlt',
      hasSession: !!req.session,
      sessionId: req.sessionID
    });
    
    if (!username || !password) {
      logger.warn('Login-Versuch ohne Benutzername oder Passwort', { username: !!username, password: !!password });
      apiResponse.validationError(res, 'Benutzername und Passwort sind erforderlich');
      return;
    }
    
    const user = await dbHelper.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      logger.warn('Login-Versuch mit unbekanntem Benutzer', { username });
      apiResponse.error(res, 'Ungültiger Benutzername oder Passwort', 401);
      return;
    }
    
    logger.debug('Benutzer gefunden', { userId: user.id, username: user.username, role: user.role });
    
    // Prüfe ob User ein Passwort hat (password_hash nicht NULL)
    if (!user.password_hash) {
      logger.warn('Login-Versuch für User ohne Passwort (nur einfaches Login erlaubt)', { username });
      metrics.api.auth.failures++;
      apiResponse.error(res, 'Dieser Benutzer hat kein Passwort. Bitte verwenden Sie das einfache Login.', 401);
      return;
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      logger.warn('Login-Versuch mit falschem Passwort', { username });
      metrics.api.auth.failures++;
      apiResponse.error(res, 'Ungültiger Benutzername oder Passwort', 401);
      return;
    }
    
    // Session prüfen und erstellen
    if (!req.session) {
      logger.error('KRITISCH: req.session ist undefined!');
      apiResponse.error(res, 'Session-Fehler', 500);
      return;
    }
    
    // Session erstellen
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    
    logger.debug('Session gesetzt', { 
      userId: req.session.userId,
      username: req.session.username,
      role: req.session.role,
      sessionId: req.sessionID
    });
    
    // Session explizit speichern (für FileStore)
    req.session.save((err) => {
      if (err) {
        logger.error('Fehler beim Speichern der Session', err);
      } else {
        logger.info('Session erfolgreich gespeichert', { 
          sessionId: req.sessionID,
          userId: req.session.userId,
          username: req.session.username,
          role: req.session.role
        });
      }
    });
    
    // WICHTIG: Warte auf Session-Speicherung bevor Response gesendet wird
    // Für FileStore: Session muss gespeichert sein bevor Cookie gesetzt wird
    await new Promise((resolve) => {
      req.session.save((err) => {
        if (err) {
          logger.error('Fehler beim finalen Speichern der Session', err);
        }
        resolve();
      });
    });
    
    // Last-Login aktualisieren
    await dbHelper.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    logger.info('Benutzer erfolgreich eingeloggt', { 
      username: user.username, 
      role: user.role, 
      sessionId: req.sessionID,
      cookieSecure: sessionConfig.cookie.secure,
      nodeEnv: process.env.NODE_ENV,
      isRender: process.env.RENDER === 'true'
    });
    
    // Metriken aktualisieren
    metrics.api.auth.logins++;
    
    apiResponse.success(res, {
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    logger.error('Fehler beim Login', error, { 
      errorMessage: error.message,
      errorStack: error.stack,
      username: req.body?.username,
      hasSession: !!req.session,
      sessionId: req.sessionID
    });
    
    // Detailliertere Fehlermeldung für Debugging
    let errorMessage = 'Fehler beim Login';
    if (error.message.includes('SQLITE') || error.message.includes('database')) {
      errorMessage = 'Datenbankfehler beim Login. Bitte versuchen Sie es später erneut.';
    } else if (error.message.includes('bcrypt')) {
      errorMessage = 'Fehler bei der Passwort-Validierung.';
    } else if (!req.session) {
      errorMessage = 'Session-Fehler. Bitte laden Sie die Seite neu.';
    }
    
    apiResponse.error(res, errorMessage, 500);
  }
});

// Registrierung
apiV1.post('/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      apiResponse.validationError(res, 'Benutzername und Passwort sind erforderlich');
      return;
    }
    
    // Validierung: Benutzername
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      apiResponse.validationError(res, 'Benutzername muss mindestens 3 Zeichen lang sein');
      return;
    }
    if (trimmedUsername.length > 50) {
      apiResponse.validationError(res, 'Benutzername darf maximal 50 Zeichen lang sein');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      apiResponse.validationError(res, 'Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten');
      return;
    }
    
    // Validierung: Passwort
    if (password.length < 6) {
      apiResponse.validationError(res, 'Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    if (password.length > 100) {
      apiResponse.validationError(res, 'Passwort darf maximal 100 Zeichen lang sein');
      return;
    }
    
    // Prüfen ob Benutzer bereits existiert
    const existingUser = await dbHelper.get('SELECT id FROM users WHERE username = ?', [trimmedUsername]);
    if (existingUser) {
      apiResponse.conflict(res, 'Benutzername ist bereits vergeben');
      return;
    }
    
    // Passwort hashen
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Benutzer erstellen
    const result = await dbHelper.run(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [trimmedUsername, passwordHash, 'user']
    );
    
    logger.info('Neuer Benutzer registriert', { 
      username: trimmedUsername,
      user_id: result.lastID 
    });
    
    apiResponse.success(res, {
      message: 'Registrierung erfolgreich',
      user: {
        id: result.lastID,
        username: trimmedUsername,
        role: 'user'
      }
    }, 201);
  } catch (error) {
    logger.error('Fehler bei der Registrierung', error, {
      errorMessage: error.message,
      errorStack: error.stack,
      username: req.body?.username,
      hasSession: !!req.session
    });
    
    // Detailliertere Fehlermeldung für Debugging
    let errorMessage = 'Fehler bei der Registrierung';
    if (error.message.includes('SQLITE') || error.message.includes('database')) {
      errorMessage = 'Datenbankfehler bei der Registrierung. Bitte versuchen Sie es später erneut.';
    } else if (error.message.includes('bcrypt')) {
      errorMessage = 'Fehler beim Hashen des Passworts.';
    } else if (error.message.includes('UNIQUE constraint')) {
      errorMessage = 'Benutzername ist bereits vergeben.';
    }
    
    apiResponse.error(res, errorMessage, 500);
  }
});

// Logout
apiV1.post('/auth/logout', (req, res) => {
  const username = req.session?.username;
  req.session.destroy((err) => {
    if (err) {
      logger.error('Fehler beim Logout', err);
      apiResponse.error(res, 'Fehler beim Logout', 500);
    } else {
      logger.info('Benutzer erfolgreich ausgeloggt', { username });
      metrics.api.auth.logouts++;
      apiResponse.success(res, { message: 'Erfolgreich ausgeloggt' });
    }
  });
});

// Aktuelle Session abrufen
// Session-Endpoint: Prüft ob Benutzer eingeloggt ist (ohne requireAuth, damit 401 normal ist)
apiV1.get('/auth/session', async (req, res) => {
  try {
    // Debug-Logging für Session-Check
    logger.debug('Session-Check', {
      hasSession: !!req.session,
      hasUserId: !!(req.session && req.session.userId),
      sessionId: req.sessionID,
      userId: req.session?.userId,
      username: req.session?.username,
      cookies: req.headers.cookie ? 'vorhanden' : 'fehlt',
      cookieHeader: req.headers.cookie
    });
    
    // Prüfe ob Session vorhanden ist
    if (!req.session || !req.session.userId) {
      logger.debug('Session-Check: Nicht eingeloggt', {
        hasSession: !!req.session,
        hasUserId: !!(req.session && req.session.userId),
        sessionId: req.sessionID
      });
      apiResponse.error(res, 'Nicht eingeloggt', 401);
      return;
    }
    
    const user = await getCurrentUser(req);
    if (user) {
      apiResponse.success(res, {
        id: user.id,
        username: user.username,
        role: user.role
      });
    } else {
      // Session vorhanden, aber User nicht in DB gefunden - Session ungültig
      logger.warn('Session vorhanden, aber User nicht in DB gefunden', {
        sessionId: req.sessionID,
        userId: req.session.userId,
        username: req.session.username
      });
      // Session löschen
      req.session.destroy((err) => {
        if (err) {
          logger.error('Fehler beim Löschen der ungültigen Session', err);
        }
      });
      apiResponse.error(res, 'Session ungültig', 401);
    }
  } catch (error) {
    logger.error('Fehler beim Abrufen der Session', error);
    apiResponse.error(res, 'Fehler beim Abrufen der Session', 500);
  }
});

// Aktuellen Benutzer abrufen (öffentlicher Endpunkt, keine Auth erforderlich)
apiV1.get('/auth/me', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (user) {
      apiResponse.success(res, {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } else {
      apiResponse.unauthorized(res, 'Nicht authentifiziert');
    }
  } catch (error) {
    logger.error('Fehler beim Abrufen des Benutzers', error);
    apiResponse.error(res, 'Fehler beim Abrufen des Benutzers', 500);
  }
});

// Passwort ändern (für eingeloggten Benutzer)
apiV1.post('/auth/change-password', requireAuth, validators.body({
  current_password: { required: true, type: 'string' },
  new_password: { required: true, type: 'string', validator: (value) => {
    if (value.length < 6) {
      return 'Neues Passwort muss mindestens 6 Zeichen lang sein';
    }
    return true;
  }}
}), async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.session.userId;
    
    // Aktuellen Benutzer aus Datenbank abrufen
    const user = await dbHelper.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      apiResponse.error(res, 'Benutzer nicht gefunden', 404);
      return;
    }
    
    // Aktuelles Passwort prüfen
    const passwordMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!passwordMatch) {
      logger.warn('Passwort-Änderung: Falsches aktuelles Passwort', { username: user.username });
      apiResponse.error(res, 'Aktuelles Passwort ist falsch', 401);
      return;
    }
    
    // Neues Passwort darf nicht gleich dem alten sein
    const samePassword = await bcrypt.compare(new_password, user.password_hash);
    if (samePassword) {
      apiResponse.validationError(res, 'Das neue Passwort muss sich vom aktuellen Passwort unterscheiden');
      return;
    }
    
    // Neues Passwort hashen
    const newPasswordHash = await bcrypt.hash(new_password, 10);
    
    // Passwort in Datenbank aktualisieren
    await dbHelper.run('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, userId]);
    
    logger.info('Passwort erfolgreich geändert', { username: user.username });
    
    apiResponse.success(res, { message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    logger.error('Fehler beim Ändern des Passworts', error);
    apiResponse.error(res, 'Fehler beim Ändern des Passworts', 500);
  }
});

// ============================================================================
// API-ROUTEN V1
// ============================================================================

// Health-Check-Endpunkt für Monitoring
app.get('/api/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: require('./package.json').version
    };
    
    // Datenbank-Health-Check
    try {
      await dbHelper.get('SELECT 1');
      health.database = 'connected';
    } catch (dbError) {
      health.database = 'disconnected';
      health.status = 'degraded';
      logger.warn('Datenbank-Health-Check fehlgeschlagen', { error: dbError.message });
    }
    
    // Memory-Info
    const memUsage = process.memoryUsage();
    health.memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Health-Check fehlgeschlagen', error);
    res.status(503).json({
      success: false,
      error: 'Health-Check fehlgeschlagen'
    });
  }
});

// Health-Check auch in v1 verfügbar
apiV1.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: require('./package.json').version
    };
    
    try {
      await dbHelper.get('SELECT 1');
      health.database = 'connected';
    } catch (dbError) {
      health.database = 'disconnected';
      health.status = 'degraded';
      logger.warn('Datenbank-Health-Check fehlgeschlagen', { error: dbError.message });
    }
    
    const memUsage = process.memoryUsage();
    health.memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Health-Check fehlgeschlagen', error);
    res.status(503).json({
      success: false,
      error: 'Health-Check fehlgeschlagen'
    });
  }
});

// ============================================================================
// DATENBANK-INFO ENDPUNKT
// ============================================================================

// API-Route: Datenbank-Informationen abrufen
app.get('/api/database/info', async (req, res) => {
  try {
    const dbInfo = {
      path: './waschmaschine.db',
      exists: existsSync('./waschmaschine.db'),
      timestamp: new Date().toISOString()
    };
    
    if (dbInfo.exists) {
      try {
        const stats = await fs.stat('./waschmaschine.db');
        dbInfo.size = stats.size;
        dbInfo.sizeFormatted = `${(stats.size / 1024).toFixed(2)} KB`;
        dbInfo.createdAt = stats.birthtime.toISOString();
        dbInfo.modifiedAt = stats.mtime.toISOString();
      } catch (statError) {
        logger.warn('Fehler beim Abrufen der Datei-Statistiken', { error: statError.message });
      }
    }
    
    // SQLite-Version
    try {
      const version = await dbHelper.get('SELECT sqlite_version() as version');
      dbInfo.sqliteVersion = version ? version.version : 'unknown';
    } catch (versionError) {
      logger.warn('Fehler beim Abrufen der SQLite-Version', { error: versionError.message });
      dbInfo.sqliteVersion = 'unknown';
    }
    
    // Tabellen-Informationen
    try {
      const tables = await dbHelper.all(`
        SELECT 
          name,
          (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name=m.name) as index_count
        FROM sqlite_master m
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);
      
      const tableDetails = await Promise.all(tables.map(async (table) => {
        try {
          // Sicherheit: Tabellennamen validieren (nur alphanumerische Zeichen und Unterstriche)
          const tableName = table.name;
          if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            logger.warn(`Ungültiger Tabellenname erkannt: ${tableName}`);
            return {
              name: tableName,
              rowCount: 'invalid',
              columnCount: 'invalid',
              indexCount: table.index_count || 0
            };
          }
          
          const rowCount = await dbHelper.get(`SELECT COUNT(*) as count FROM ${tableName}`);
          // PRAGMA table_info verwendet parametrisierte Abfrage nicht direkt, daher Validierung oben
          const tableInfo = await dbHelper.get(`PRAGMA table_info(${tableName})`);
          
          return {
            name: tableName,
            rowCount: rowCount ? rowCount.count : 0,
            columnCount: tableInfo ? Object.keys(tableInfo).length : 0,
            indexCount: table.index_count || 0
          };
        } catch (error) {
          logger.warn(`Fehler beim Abrufen der Tabellen-Details für ${table.name}`, { error: error.message });
          return {
            name: table.name,
            rowCount: 'unknown',
            columnCount: 'unknown',
            indexCount: table.index_count || 0
          };
        }
      }));
      
      dbInfo.tables = tableDetails;
      dbInfo.tableCount = tables.length;
    } catch (tableError) {
      logger.warn('Fehler beim Abrufen der Tabellen-Informationen', { error: tableError.message });
      dbInfo.tables = [];
      dbInfo.tableCount = 0;
    }
    
    // Indizes-Informationen
    try {
      const indexes = await dbHelper.all(`
        SELECT 
          name,
          tbl_name as table_name,
          sql
        FROM sqlite_master
        WHERE type='index' AND name NOT LIKE 'sqlite_%'
        ORDER BY tbl_name, name
      `);
      dbInfo.indexes = indexes;
      dbInfo.indexCount = indexes.length;
    } catch (indexError) {
      logger.warn('Fehler beim Abrufen der Index-Informationen', { error: indexError.message });
      dbInfo.indexes = [];
      dbInfo.indexCount = 0;
    }
    
    logger.debug('Datenbank-Info abgerufen');
    apiResponse.success(res, dbInfo);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Datenbank-Info', error);
    apiResponse.error(res, 'Fehler beim Abrufen der Datenbank-Info', 500);
  }
});

// API-Route: System-Informationen abrufen
app.get('/api/system/info', async (req, res) => {
  try {
    const systemInfo = {
      timestamp: new Date().toISOString(),
      nodejs: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      },
      application: {
        name: require('./package.json').name,
        version: require('./package.json').version,
        uptime: process.uptime(),
        uptimeFormatted: formatUptime(process.uptime()),
        environment: process.env.NODE_ENV || 'development'
      },
      memory: (() => {
        const memUsage = process.memoryUsage();
        return {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapUsedFormatted: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotalFormatted: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          rssFormatted: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
        };
      })(),
      cpu: {
        usage: process.cpuUsage(),
        usageFormatted: {
          user: `${(process.cpuUsage().user / 1000000).toFixed(2)}s`,
          system: `${(process.cpuUsage().system / 1000000).toFixed(2)}s`
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: PORT,
        allowedOrigin: process.env.ALLOWED_ORIGIN || '*'
      }
    };
    
    logger.debug('System-Info abgerufen');
    apiResponse.success(res, systemInfo);
  } catch (error) {
    logger.error('Fehler beim Abrufen der System-Info', error);
    apiResponse.error(res, 'Fehler beim Abrufen der System-Info', 500);
  }
});

/**
 * Formatiert Uptime in lesbares Format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days} Tag${days > 1 ? 'e' : ''}`);
  if (hours > 0) parts.push(`${hours} Stunde${hours > 1 ? 'n' : ''}`);
  if (minutes > 0) parts.push(`${minutes} Minute${minutes > 1 ? 'n' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} Sekunde${secs !== 1 ? 'n' : ''}`);
  
  return parts.join(', ');
}

// ============================================================================
// MONITORING-API-ENDPUNKTE
// ============================================================================

/**
 * API-Endpunkt: Metriken abrufen
 * Gibt alle gesammelten Metriken zurück
 */
app.get('/api/monitoring/metrics', async (req, res) => {
  try {
    updateSystemMetrics();
    
    const responseTimes = metrics.performance.responseTimes;
    const dbQueryTimes = metrics.performance.dbQueryTimes;
    
    const metricsData = {
      timestamp: new Date().toISOString(),
      requests: {
        total: metrics.requests.total,
        byMethod: metrics.requests.byMethod,
        byStatus: metrics.requests.byStatus,
        errors: metrics.requests.errors,
        errorRate: metrics.requests.total > 0 
          ? ((metrics.requests.errors / metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%',
        topEndpoints: Object.entries(metrics.requests.byEndpoint)
          .map(([endpoint, data]) => ({
            endpoint,
            count: data.count,
            avgTime: Math.round(data.totalTime / data.count),
            errors: data.errors
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      },
      performance: {
        responseTime: {
          avg: calculateAverage(responseTimes),
          min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
          max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
          percentiles: calculatePercentiles(responseTimes)
        },
        dbQueryTime: {
          avg: calculateAverage(dbQueryTimes),
          min: dbQueryTimes.length > 0 ? Math.min(...dbQueryTimes) : 0,
          max: dbQueryTimes.length > 0 ? Math.max(...dbQueryTimes) : 0,
          percentiles: calculatePercentiles(dbQueryTimes)
        },
        slowRequests: metrics.performance.slowRequests.slice(-10) // Letzte 10 langsame Requests
      },
      system: {
        ...metrics.system,
        memory: {
          ...metrics.system.memory,
          usage: metrics.system.memory.current > 0
            ? ((metrics.system.memory.current / metrics.system.memory.peak) * 100).toFixed(2) + '%'
            : '0%'
        }
      },
      database: {
        ...metrics.database,
        errorRate: metrics.database.queries.total > 0
          ? ((metrics.database.queries.errors / metrics.database.queries.total) * 100).toFixed(2) + '%'
          : '0%',
        slowQueryRate: metrics.database.queries.total > 0
          ? ((metrics.database.queries.slow / metrics.database.queries.total) * 100).toFixed(2) + '%'
          : '0%'
      },
      api: metrics.api,
      lastHour: {
        ...metrics.lastHour,
        errorRate: metrics.lastHour.requests > 0
          ? ((metrics.lastHour.errors / metrics.lastHour.requests) * 100).toFixed(2) + '%'
          : '0%'
      },
      uptime: {
        seconds: metrics.system.uptime,
        formatted: formatUptime(metrics.system.uptime)
      }
    };
    
    logger.debug('Metriken abgerufen');
    apiResponse.success(res, metricsData);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Metriken', error);
    apiResponse.error(res, 'Fehler beim Abrufen der Metriken', 500);
  }
});

/**
 * API-Endpunkt: Health-Check erweitert mit Metriken
 */
app.get('/api/monitoring/health', async (req, res) => {
  try {
    updateSystemMetrics();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      uptimeFormatted: formatUptime(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: require('./package.json').version
    };
    
    // Datenbank-Health-Check
    try {
      const dbStartTime = Date.now();
      await dbHelper.get('SELECT 1');
      const dbResponseTime = Date.now() - dbStartTime;
      health.database = {
        status: 'connected',
        responseTime: dbResponseTime
      };
    } catch (dbError) {
      health.database = {
        status: 'disconnected',
        error: dbError.message
      };
      health.status = 'degraded';
      logger.warn('Datenbank-Health-Check fehlgeschlagen', { error: dbError.message });
    }
    
    // Memory-Info
    const memUsage = process.memoryUsage();
    health.memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      usage: metrics.system.memory.peak > 0
        ? ((metrics.system.memory.current / metrics.system.memory.peak) * 100).toFixed(2) + '%'
        : '0%'
    };
    
    // Request-Statistiken
    health.requests = {
      total: metrics.requests.total,
      errors: metrics.requests.errors,
      errorRate: metrics.requests.total > 0
        ? ((metrics.requests.errors / metrics.requests.total) * 100).toFixed(2) + '%'
        : '0%',
      avgResponseTime: calculateAverage(metrics.performance.responseTimes),
      active: metrics.system.activeConnections
    };
    
    // Warnungen basierend auf Metriken
    const warnings = [];
    if (metrics.requests.errors > 0 && metrics.requests.total > 100) {
      const errorRate = (metrics.requests.errors / metrics.requests.total) * 100;
      if (errorRate > 5) {
        warnings.push(`Hohe Fehlerrate: ${errorRate.toFixed(2)}%`);
        health.status = 'degraded';
      }
    }
    
    if (metrics.system.memory.current > 500) { // > 500MB
      warnings.push(`Hoher Speicherverbrauch: ${metrics.system.memory.current}MB`);
    }
    
    const avgResponseTime = calculateAverage(metrics.performance.responseTimes);
    if (avgResponseTime > 1000) {
      warnings.push(`Lange Antwortzeiten: ${avgResponseTime}ms Durchschnitt`);
      health.status = 'degraded';
    }
    
    if (warnings.length > 0) {
      health.warnings = warnings;
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Health-Check fehlgeschlagen', error);
    res.status(503).json({
      success: false,
      error: 'Health-Check fehlgeschlagen'
    });
  }
});

/**
 * API-Endpunkt: Frontend-Events empfangen
 */
app.post('/api/v1/monitoring/events', express.json({ limit: '1mb' }), async (req, res) => {
  try {
    // Optional chaining für req.body, falls es undefined ist
    const { errors = [], performance = [], activities = [], timestamp, userAgent, url, sessionId } = req.body || {};
    
    // Events loggen (in Produktion könnte man hier z.B. an ein Logging-System senden)
    if (errors && errors.length > 0) {
      errors.forEach(error => {
        logger.error('Frontend Error', null, {
          type: error.type,
          message: error.message,
          filename: error.filename,
          lineno: error.lineno,
          stack: error.stack,
          userAgent,
          url: error.url || url,
          sessionId
        });
      });
    }
    
    if (performance && performance.length > 0) {
      performance.forEach(perf => {
        if (perf.type === 'slow_api_request' || perf.duration > 2000) {
          logger.warn('Frontend Performance Issue', {
            type: perf.type,
            duration: perf.duration,
            url: perf.url,
            userAgent,
            sessionId
          });
        }
      });
    }
    
    // Metriken aktualisieren (optional)
    if (errors && errors.length > 0) {
      // Frontend-Fehler könnten in separaten Metriken gespeichert werden
    }
    
    apiResponse.success(res, { message: 'Events received' });
  } catch (error) {
    logger.error('Fehler beim Empfangen von Monitoring-Events', error);
    apiResponse.error(res, 'Fehler beim Empfangen von Events', 500);
  }
});

// API-Route: Slots abrufen
apiV1.get('/slots', async (req, res) => {
  try {
    logger.debug('Slots abgerufen');
    apiResponse.success(res, TIME_SLOTS);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Slots', error);
    apiResponse.error(res, 'Interner Serverfehler beim Abrufen der Slots', 500);
  }
});

// API-Route: Maschinen abrufen
apiV1.get('/machines', async (req, res) => {
  try {
    const machines = await dbHelper.all('SELECT * FROM machines ORDER BY id');
    logger.info(`Maschinen abgerufen: ${machines.length} gefunden`);
    apiResponse.success(res, machines);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Maschinen', error);
    apiResponse.error(res, 'Fehler beim Abrufen der Maschinen aus der Datenbank', 500);
  }
});

// API-Route: Buchungen für ein Datum abrufen
apiV1.get('/bookings', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      logger.warn('Buchungen abrufen: Datum-Parameter fehlt');
      apiResponse.validationError(res, 'Datum-Parameter (date) ist erforderlich. Format: YYYY-MM-DD');
      return;
    }
    
    // Datum validieren und trimmen
    const trimmedDate = typeof date === 'string' ? date.trim() : String(date);
    
    // Prüfe Format zuerst (schnellere Validierung)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(trimmedDate)) {
      logger.warn('Buchungen abrufen: Ungültiges Datum-Format', { date: trimmedDate });
      apiResponse.validationError(res, 'Ungültiges Datum-Format. Erwartetes Format: YYYY-MM-DD (z.B. 2024-12-31)');
      return;
    }
    
    if (!isValidDate(trimmedDate)) {
      logger.warn('Buchungen abrufen: Ungültiges Datum', { date: trimmedDate });
      apiResponse.validationError(res, 'Ungültiges Datum. Format: YYYY-MM-DD, Datum muss gültig sein und darf nicht in der Vergangenheit liegen.');
      return;
    }
    
    // Buchungen mit Maschinen-Informationen abrufen
    const bookings = await dbHelper.all(`
      SELECT 
        b.id,
        b.machine_id,
        b.date,
        b.slot,
        b.user_name,
        m.name as machine_name,
        m.type as machine_type
      FROM bookings b
      INNER JOIN machines m ON b.machine_id = m.id
      WHERE b.date = ?
      ORDER BY b.slot, m.name
    `, [trimmedDate]);
    
    logger.info(`Buchungen abgerufen für Datum ${trimmedDate}: ${bookings.length} gefunden`);
    apiResponse.success(res, bookings);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Buchungen', error, { date: req.query.date });
    apiResponse.error(res, 'Fehler beim Abrufen der Buchungen aus der Datenbank', 500);
  }
});

// API-Route: Buchungen für eine Woche abrufen (Arbeitswoche: Montag bis Freitag)
apiV1.get('/bookings/week', async (req, res) => {
  try {
    const { start_date } = req.query;
    
    if (!start_date) {
      logger.warn('Buchungen Woche abrufen: start_date-Parameter fehlt');
      apiResponse.validationError(res, 'start_date-Parameter ist erforderlich. Format: YYYY-MM-DD');
      return;
    }
    
    const trimmedDate = typeof start_date === 'string' ? start_date.trim() : start_date;
    const startDate = new Date(trimmedDate + 'T00:00:00');
    
    if (isNaN(startDate.getTime())) {
      logger.warn('Buchungen Woche abrufen: Ungültiges Datum', { start_date: trimmedDate });
      apiResponse.validationError(res, 'Ungültiges Datum. Format: YYYY-MM-DD');
      return;
    }
    
    // Montag der Woche finden
    const dayOfWeek = startDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Montag = 1, Sonntag = 0
    const monday = new Date(startDate);
    monday.setDate(startDate.getDate() + diff);
    
    // Freitag der Woche (5 Tage später)
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    
    const mondayStr = monday.toISOString().split('T')[0];
    const fridayStr = friday.toISOString().split('T')[0];
    
    // Buchungen für die Arbeitswoche (Mo-Fr) abrufen
    const bookings = await dbHelper.all(`
      SELECT 
        b.id,
        b.machine_id,
        b.date,
        b.slot,
        b.user_name,
        m.name as machine_name,
        m.type as machine_type
      FROM bookings b
      INNER JOIN machines m ON b.machine_id = m.id
      WHERE b.date >= ? AND b.date <= ?
      ORDER BY b.date, b.slot, m.name
    `, [mondayStr, fridayStr]);
    
    logger.info(`Buchungen abgerufen für Woche ${mondayStr} bis ${fridayStr}: ${bookings.length} gefunden`);
    apiResponse.success(res, {
      week_start: mondayStr,
      week_end: fridayStr,
      bookings: bookings
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Wochen-Buchungen', error, { start_date: req.query.start_date });
    apiResponse.error(res, 'Fehler beim Abrufen der Wochen-Buchungen aus der Datenbank', 500);
  }
});

// API-Route: Buchungen für einen Monat abrufen
apiV1.get('/bookings/month', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      logger.warn('Buchungen Monat abrufen: year oder month fehlt');
      apiResponse.validationError(res, 'year und month Parameter sind erforderlich. Format: year=YYYY, month=MM');
      return;
    }
    
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      logger.warn('Buchungen Monat abrufen: Ungültige Parameter', { year, month });
      apiResponse.validationError(res, 'Ungültige year oder month Parameter');
      return;
    }
    
    // Ersten und letzten Tag des Monats berechnen
    const firstDay = new Date(yearNum, monthNum - 1, 1);
    const lastDay = new Date(yearNum, monthNum, 0);
    
    const firstDayStr = firstDay.toISOString().split('T')[0];
    const lastDayStr = lastDay.toISOString().split('T')[0];
    
    // Buchungen für den Monat abrufen
    const bookings = await dbHelper.all(`
      SELECT 
        b.id,
        b.machine_id,
        b.date,
        b.slot,
        b.user_name,
        m.name as machine_name,
        m.type as machine_type
      FROM bookings b
      INNER JOIN machines m ON b.machine_id = m.id
      WHERE b.date >= ? AND b.date <= ?
      ORDER BY b.date, b.slot, m.name
    `, [firstDayStr, lastDayStr]);
    
    logger.info(`Buchungen abgerufen für Monat ${yearNum}-${monthNum}: ${bookings.length} gefunden`);
    apiResponse.success(res, {
      year: yearNum,
      month: monthNum,
      month_start: firstDayStr,
      month_end: lastDayStr,
      bookings: bookings
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Monats-Buchungen', error, { year: req.query.year, month: req.query.month });
    apiResponse.error(res, 'Fehler beim Abrufen der Monats-Buchungen aus der Datenbank', 500);
  }
});

// API-Route: Buchung erstellen
// WICHTIG: Normale Buchungen funktionieren mit einfachem Namen (kein Login nötig)
// Der Admin-Bereich verwendet weiterhin eigene Authentifizierung mit Passwort
apiV1.post('/bookings', async (req, res) => {
  try {
    const { machine_id, date, slot, user_name } = req.body;
    
    // Validierung und Normalisierung: Pflichtfelder
    const validatedMachineId = validateInteger(machine_id, 'machine_id');
    const validatedDate = date ? (typeof date === 'string' ? date.trim() : String(date)) : null;
    const validatedSlot = validateAndTrimString(slot, 'slot');
    const validatedUserName = validateAndTrimString(user_name, 'user_name');
    
    // Prüfe ob Pflichtfelder vorhanden sind
    if (!validatedMachineId) {
      logger.warn('Buchung erstellen: machine_id fehlt oder ist ungültig', { machine_id });
      apiResponse.validationError(res, 'machine_id ist erforderlich und muss eine positive Zahl sein');
      return;
    }
    
    if (!validatedDate) {
      logger.warn('Buchung erstellen: date fehlt', { date });
      apiResponse.validationError(res, 'date ist erforderlich (Format: YYYY-MM-DD)');
      return;
    }
    
    if (!validatedSlot) {
      logger.warn('Buchung erstellen: slot fehlt oder ist leer', { slot });
      apiResponse.validationError(res, 'slot ist erforderlich und darf nicht leer sein');
      return;
    }
    
    if (!validatedUserName) {
      logger.warn('Buchung erstellen: user_name fehlt oder ist leer', { user_name });
      apiResponse.validationError(res, 'user_name ist erforderlich und darf nicht leer sein');
      return;
    }
    
    // Validierung: Benutzername-Länge (max 100 Zeichen laut DB-Constraint)
    if (validatedUserName.length > 100) {
      logger.warn('Buchung erstellen: user_name zu lang', { user_name_length: validatedUserName.length });
      apiResponse.validationError(res, 'user_name darf maximal 100 Zeichen lang sein');
      return;
    }
    
    // Validierung: Datum
    if (!isValidDate(validatedDate)) {
      logger.warn('Buchung erstellen: Ungültiges Datum', { date: validatedDate });
      apiResponse.validationError(res, 'Ungültiges Datum. Format: YYYY-MM-DD, Datum muss gültig sein und darf nicht in der Vergangenheit liegen.');
      return;
    }
    
    // Validierung: Slot
    if (!isValidSlot(validatedSlot)) {
      logger.warn('Buchung erstellen: Ungültiger Slot', { slot: validatedSlot });
      apiResponse.validationError(res, `Ungültiger Slot. Gültige Slots: ${TIME_SLOTS.map(s => s.label).join(', ')}`);
      return;
    }
    
    // Validierung: Maschine existiert
    const machine = await dbHelper.get('SELECT * FROM machines WHERE id = ?', [validatedMachineId]);
    if (!machine) {
      logger.warn('Buchung erstellen: Maschine nicht gefunden', { machine_id: validatedMachineId });
      apiResponse.notFound(res, 'Maschine');
      return;
    }
    
    // ============================================================================
    // REGEL 6: Wochenend- und Sperrtage
    // ============================================================================
    // Sonntag ist gesperrt für Waschmaschinen - Trocknungsräume können gebucht werden
    // WICHTIG: Datum lokal parsen, um Zeitzonen-Probleme zu vermeiden
    const [year, month, day] = validatedDate.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day); // month ist 0-basiert
    const dayOfWeek = bookingDate.getDay(); // 0 = Sonntag, 6 = Samstag
    
    // Konfigurierbare Sperrtage (Standard: Sonntag = 0)
    const BLOCKED_WEEKDAYS = process.env.BLOCKED_WEEKDAYS 
      ? process.env.BLOCKED_WEEKDAYS.split(',').map(d => parseInt(d.trim()))
      : [0]; // Standard: Sonntag
    
    // Prüfe ob es ein Sperrtag ist UND ob es eine Waschmaschine ist
    // Trocknungsräume können auch an Sperrtagen gebucht werden
    const isWasher = machine.type === 'washer';
    const isBlockedDay = BLOCKED_WEEKDAYS.includes(dayOfWeek);
    
    // Debug-Logging
    logger.debug('Buchung erstellen: Wochenend-Prüfung', {
      date: validatedDate,
      year,
      month,
      day,
      dayOfWeek,
      blockedWeekdays: BLOCKED_WEEKDAYS,
      isBlockedDay: isBlockedDay,
      machine_type: machine.type,
      is_washer: isWasher,
      should_block: isBlockedDay && isWasher
    });
    
    // Nur blockieren wenn: Sperrtag UND Waschmaschine
    if (isBlockedDay && isWasher) {
      const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
      logger.warn('Buchung erstellen: Sperrtag für Waschmaschine erkannt', {
        date: validatedDate,
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        machine_type: machine.type,
        machine_name: machine.name,
        user_name: validatedUserName
      });
      apiResponse.validationError(res, 
        `Waschmaschinen-Buchungen sind an ${dayNames[dayOfWeek]}en nicht möglich. Trocknungsräume können jedoch gebucht werden. Bitte wählen Sie einen anderen Tag oder eine Trocknungsraum-Maschine.`
      );
      return;
    }
    
    // Debug-Logging: Maschine gefunden
    logger.debug('Buchung erstellen: Maschine gefunden', {
      machine_id: validatedMachineId,
      machine_name: machine.name,
      machine_type: machine.type,
      machine: machine
    });
    
    // ============================================================================
    // REGEL 3: Waschmaschinen-Limits
    // ============================================================================
    // NEUE REGELN:
    // - Bis zu 3 Waschmaschinen-Buchungen pro Tag möglich
    // - Pro Waschmaschine nur 1 Zeitslot (man kann Maschine 1 (8-12) buchen, 
    //   Maschine 2 (8-12) buchen, Maschine 3 (8-12) buchen, aber NICHT 
    //   Maschine 1 (8-12) UND Maschine 1 (12-17))
    const isDryer = machine.type === 'dryer' || machine.type === 'tumbler';
    
    // Konfigurierbare Limits (Standard-Werte)
    // REGEL 3: Maximal 3 Waschmaschinen-Slots pro Person pro Tag
    const MAX_WASHER_MACHINES_PER_DAY = parseInt(process.env.MAX_WASHER_MACHINES_PER_DAY) || 3;
    
    if (isWasher) {
      // Prüfe ob bereits ein Slot für diese Maschine an diesem Tag gebucht ist
      const existingBookingSameMachine = await dbHelper.get(
        `SELECT * FROM bookings 
         WHERE machine_id = ? AND date = ? AND user_name = ?`,
        [validatedMachineId, validatedDate, validatedUserName]
      );
      
      if (existingBookingSameMachine) {
        logger.warn('Buchung erstellen: Bereits ein Slot für diese Waschmaschine gebucht', {
          user_name: validatedUserName,
          date: validatedDate,
          machine_id: validatedMachineId,
          existing_slot: existingBookingSameMachine.slot,
          requested_slot: validatedSlot
        });
        apiResponse.validationError(res,
          `Sie haben bereits einen Slot für diese Waschmaschine am ${validatedDate} gebucht (${existingBookingSameMachine.slot}). ` +
          `Pro Waschmaschine ist nur 1 Zeitslot pro Tag möglich.`
        );
        return;
      }
      
      // Prüfe wie viele verschiedene Waschmaschinen bereits gebucht sind und welche Slots
      const washerBookingsToday = await dbHelper.all(
        `SELECT b.machine_id, b.slot
         FROM bookings b
         INNER JOIN machines m ON b.machine_id = m.id
         WHERE b.user_name = ? AND b.date = ? AND m.type = 'washer'`,
        [validatedUserName, validatedDate]
      );
      
      const washerMachineCount = washerBookingsToday.length;
      
      // NEUE REGEL: Alle Waschmaschinen-Buchungen müssen denselben Slot haben
      if (washerMachineCount > 0) {
        // Prüfe ob alle bereits gebuchten Slots identisch sind
        const existingSlots = [...new Set(washerBookingsToday.map(b => b.slot))];
        
        if (existingSlots.length > 1) {
          // Das sollte eigentlich nicht passieren, aber zur Sicherheit prüfen
          logger.error('Buchung erstellen: Inkonsistente Slot-Buchungen gefunden', {
            user_name: validatedUserName,
            date: validatedDate,
            existing_slots: existingSlots
          });
          apiResponse.validationError(res,
            `Fehler: Sie haben bereits Waschmaschinen-Buchungen mit verschiedenen Slots für ${validatedDate}. ` +
            `Alle Waschmaschinen-Buchungen müssen denselben Slot haben.`
          );
          return;
        }
        
        // Alle vorhandenen Buchungen haben denselben Slot - prüfe ob der neue Slot übereinstimmt
        const existingSlot = existingSlots[0];
        if (existingSlot !== validatedSlot) {
          logger.warn('Buchung erstellen: Slot stimmt nicht mit bereits gebuchten Waschmaschinen überein', {
            user_name: validatedUserName,
            date: validatedDate,
            existing_slot: existingSlot,
            requested_slot: validatedSlot
          });
          apiResponse.validationError(res,
            `Sie haben bereits Waschmaschinen für den Slot ${existingSlot} gebucht. ` +
            `Alle Waschmaschinen-Buchungen am selben Tag müssen denselben Slot haben. ` +
            `Bitte wählen Sie den Slot ${existingSlot} für diese Waschmaschine.`
          );
          return;
        }
      }
      
      // Wenn bereits 3 verschiedene Waschmaschinen gebucht sind und diese Maschine nicht dabei ist
      if (washerMachineCount >= MAX_WASHER_MACHINES_PER_DAY) {
        // Prüfe ob diese Maschine bereits gebucht ist
        const isMachineAlreadyBooked = washerBookingsToday.some(b => b.machine_id === validatedMachineId);
        if (!isMachineAlreadyBooked) {
          logger.warn('Buchung erstellen: Tageslimit für Waschmaschinen erreicht', {
            user_name: validatedUserName,
            date: validatedDate,
            current_count: washerMachineCount,
            limit: MAX_WASHER_MACHINES_PER_DAY,
            machine_id: validatedMachineId
          });
          apiResponse.validationError(res,
            `Sie haben bereits ${washerMachineCount} verschiedene Waschmaschinen für ${validatedDate} gebucht. ` +
            `Maximum: ${MAX_WASHER_MACHINES_PER_DAY} verschiedene Waschmaschinen pro Tag.`
          );
          return;
        }
      }
      
      logger.debug('Buchung erstellen: Waschmaschinen-Prüfung erfolgreich', {
        user_name: validatedUserName,
        date: validatedDate,
        machine_id: validatedMachineId,
        slot: validatedSlot,
        washer_machine_count: washerMachineCount,
        max_washer_machines: MAX_WASHER_MACHINES_PER_DAY
      });
    }
    
    // ============================================================================
    // TROCKNUNGSRAUM-SPEZIFISCHE REGELN
    // ============================================================================
    // NEUE REGELN:
    // - Nur 1 Trockenraum insgesamt (nicht pro Tag, sondern gesamt)
    // - Maximal 3 aufeinanderfolgende Slots
    // - Beginn: frühester Zeitslot, der bei einer Waschmaschine gebucht wurde
    // - Tagübergreifend möglich, aber am Folgetag nur max 1 Slot
    if (isDryer) {
      // Prüfe ob es ein Sonntag ist (oder anderer Sperrtag)
      const [year, month, day] = validatedDate.split('-').map(Number);
      const bookingDate = new Date(year, month - 1, day);
      const dayOfWeek = bookingDate.getDay();
      const BLOCKED_WEEKDAYS = process.env.BLOCKED_WEEKDAYS 
        ? process.env.BLOCKED_WEEKDAYS.split(',').map(d => parseInt(d.trim()))
        : [0]; // Standard: Sonntag
      const isBlockedDay = BLOCKED_WEEKDAYS.includes(dayOfWeek);
      
      // REGEL 3: Maximal 1 Trocknungsraum-Slot pro Person pro Tag
      // Prüfe Trockenräume-Buchungen der Person für DIESEN Tag
      const dryerBookingsToday = await dbHelper.all(
        `SELECT b.date, b.slot, b.machine_id, m.name as machine_name
         FROM bookings b
         INNER JOIN machines m ON b.machine_id = m.id
         WHERE b.user_name = ? AND b.date = ? AND (m.type = 'dryer' OR m.type = 'tumbler')
         ORDER BY b.slot ASC`,
        [validatedUserName, validatedDate]
      );
      
      // Prüfe ob bereits ein Trockenraum-Slot für diesen Tag gebucht ist
      // WICHTIG: Verschiedene Maschinen zählen als verschiedene Räume, aber nur 1 Slot pro Tag erlaubt
      if (dryerBookingsToday.length > 0) {
        // Prüfe ob es derselbe Trockenraum ist (dann kann Serie erweitert werden)
        const existingDryerMachineIds = [...new Set(dryerBookingsToday.map(b => b.machine_id))];
        const requestedMachineIsDryer = existingDryerMachineIds.includes(validatedMachineId);
        
        // Wenn bereits ein ANDERER Trockenraum für diesen Tag gebucht ist, blockiere
        if (!requestedMachineIsDryer) {
          logger.warn('Buchung erstellen: Bereits ein anderer Trockenraum für diesen Tag gebucht', {
            user_name: validatedUserName,
            date: validatedDate,
            existing_dryer_machines: existingDryerMachineIds,
            requested_machine_id: validatedMachineId
          });
          apiResponse.validationError(res,
            `Sie haben bereits einen anderen Trockenraum für ${validatedDate} gebucht. ` +
            `Maximal 1 Trocknungsraum pro Tag erlaubt.`
          );
          return;
        }
      }
      
      // Für Serie-Prüfung: Hole alle Buchungen für diesen Trockenraum (auch andere Tage)
      const allDryerBookingsForMachine = await dbHelper.all(
        `SELECT b.date, b.slot, b.machine_id, m.name as machine_name
         FROM bookings b
         INNER JOIN machines m ON b.machine_id = m.id
         WHERE b.user_name = ? AND b.machine_id = ? AND (m.type = 'dryer' OR m.type = 'tumbler')
         ORDER BY b.date ASC, b.slot ASC`,
        [validatedUserName, validatedMachineId]
      );
      
      // REGEL 2: Beginn muss ab frühestem Waschmaschinen-Slot sein
      // Hole alle Waschmaschinen-Buchungen der Person am GLEICHEN Tag
      if (!isBlockedDay) {
        // BUGFIX: Filtere nur Waschmaschinen-Buchungen am gleichen Tag
        const washerBookingsSameDay = await dbHelper.all(
          `SELECT b.date, b.slot
           FROM bookings b
           INNER JOIN machines m ON b.machine_id = m.id
           WHERE b.user_name = ? AND b.date = ? AND m.type = 'washer'
           ORDER BY b.slot ASC`,
          [validatedUserName, validatedDate]
        );
        
        if (washerBookingsSameDay.length === 0) {
          // Prüfe ob überhaupt Waschmaschinen-Buchungen existieren (für tagübergreifende Buchungen)
          const allWasherBookings = await dbHelper.all(
            `SELECT b.date, b.slot
             FROM bookings b
             INNER JOIN machines m ON b.machine_id = m.id
             WHERE b.user_name = ? AND m.type = 'washer'
             ORDER BY b.date ASC, b.slot ASC`,
            [validatedUserName]
          );
          
          if (allWasherBookings.length === 0) {
            logger.warn('Buchung erstellen: Trocknungsraum-Buchung ohne Waschmaschinen-Buchung', {
              user_name: validatedUserName,
              date: validatedDate
            });
            apiResponse.validationError(res,
              `Eine Trocknungsraum-Buchung ist nur möglich, wenn Sie mindestens eine Waschmaschinen-Buchung haben. ` +
              `Bitte buchen Sie zuerst eine Waschmaschine.`
            );
            return;
          }
          
          // Tagübergreifende Buchung: Erlaubt (keine Slot-Prüfung)
          logger.debug('Buchung erstellen: Trocknungsraum-Buchung an anderem Tag als Waschmaschinen-Buchungen - erlaubt für tagübergreifende Buchungen');
        } else {
          // Finde den frühesten Waschmaschinen-Slot am gleichen Tag
          const earliestWasherBooking = washerBookingsSameDay[0];
          const earliestWasherSlotIndex = TIME_SLOTS.findIndex(s => s.label === earliestWasherBooking.slot);
          const requestedSlotIndex = TIME_SLOTS.findIndex(s => s.label === validatedSlot);
          
          if (requestedSlotIndex === -1) {
            logger.error('Buchung erstellen: Slot nicht gefunden', { slot: validatedSlot });
            apiResponse.validationError(res, `Ungültiger Slot: ${validatedSlot}`);
            return;
          }
          
          if (earliestWasherSlotIndex === -1) {
            logger.error('Buchung erstellen: Frühester Waschmaschinen-Slot nicht gefunden', { slot: earliestWasherBooking.slot });
            apiResponse.validationError(res, `Ungültiger Slot: ${earliestWasherBooking.slot}`);
            return;
          }
          
          // Prüfe ob Trocknungsraum-Slot frühestens ab frühestem Waschmaschinen-Slot beginnt
          if (requestedSlotIndex < earliestWasherSlotIndex) {
            logger.warn('Buchung erstellen: Trocknungsraum-Slot vor frühestem Waschmaschinen-Slot', {
              user_name: validatedUserName,
              date: validatedDate,
              requested_slot: validatedSlot,
              requested_slot_index: requestedSlotIndex,
              earliest_washer_slot: earliestWasherBooking.slot,
              earliest_washer_slot_index: earliestWasherSlotIndex
            });
            apiResponse.validationError(res,
              `Der Trocknungsraum-Slot muss frühestens ab dem frühesten Waschmaschinen-Slot (${earliestWasherBooking.slot}) beginnen. ` +
              `Sie haben ${validatedSlot} gewählt, was vor diesem Slot liegt.`
            );
            return;
          }
        }
      }
      
      // REGEL 3: Maximal 3 aufeinanderfolgende Slots
      // REGEL 4: Tagübergreifend möglich, aber am Folgetag nur max 1 Slot
      
      // Prüfe Slot-Serien: Nur aufeinanderfolgende Slots sind erlaubt (bis zu 3)
      // Verwende allDryerBookingsForMachine (bereits oben definiert)
      
      if (allDryerBookingsForMachine.length > 0) {
        // Finde die längste Serie von aufeinanderfolgenden Slots
        let maxSeriesLength = 0;
        let currentSeriesLength = 1;
        let lastDate = null;
        let lastSlotIndex = -1;
        
        for (const booking of allDryerBookingsForMachine) {
          const bookingSlotIndex = TIME_SLOTS.findIndex(s => s.label === booking.slot);
          if (bookingSlotIndex === -1) continue;
          
          // Prüfe ob Slot direkt aufeinanderfolgend ist
          const isConsecutive = lastSlotIndex !== -1 && (
            // Gleicher Tag: nächster Slot
            (booking.date === lastDate && bookingSlotIndex === lastSlotIndex + 1) ||
            // Tagübergreifend: letzter Slot des Vortags zu erstem Slot des nächsten Tages
            (lastSlotIndex === TIME_SLOTS.length - 1 && bookingSlotIndex === 0 && 
             new Date(booking.date).getTime() === new Date(lastDate).getTime() + 24 * 60 * 60 * 1000)
          );
          
          if (isConsecutive) {
            currentSeriesLength++;
          } else {
            maxSeriesLength = Math.max(maxSeriesLength, currentSeriesLength);
            currentSeriesLength = 1;
          }
          
          lastDate = booking.date;
          lastSlotIndex = bookingSlotIndex;
        }
        maxSeriesLength = Math.max(maxSeriesLength, currentSeriesLength);
        
        // Prüfe ob die neue Buchung die Serie erweitert
        const newSlotIndex = TIME_SLOTS.findIndex(s => s.label === validatedSlot);
        if (newSlotIndex === -1) {
          logger.error('Buchung erstellen: Slot nicht gefunden', { slot: validatedSlot });
          apiResponse.validationError(res, `Ungültiger Slot: ${validatedSlot}`);
          return;
        }
        
        let extendsSeries = false;
        if (allDryerBookingsForMachine.length > 0) {
          // Prüfe ob nach der letzten Buchung (chronologisch)
          const lastBooking = allDryerBookingsForMachine[allDryerBookingsForMachine.length - 1];
          const lastBookingSlotIndex = TIME_SLOTS.findIndex(s => s.label === lastBooking.slot);
          
          if (lastBookingSlotIndex !== -1) {
            // Prüfe ob direkt aufeinanderfolgend NACH der letzten Buchung
            const isConsecutiveAfter = (
              // Gleicher Tag: nächster Slot
              (validatedDate === lastBooking.date && newSlotIndex === lastBookingSlotIndex + 1) ||
              // Tagübergreifend: letzter Slot des Vortags zu erstem Slot des nächsten Tages
              (lastBookingSlotIndex === TIME_SLOTS.length - 1 && newSlotIndex === 0 &&
               new Date(validatedDate).getTime() === new Date(lastBooking.date).getTime() + 24 * 60 * 60 * 1000)
            );
            
            // Prüfe ob vor der ersten Buchung (chronologisch) - für rückwärts Buchungen
            const firstBooking = allDryerBookingsForMachine[0];
            const firstBookingSlotIndex = TIME_SLOTS.findIndex(s => s.label === firstBooking.slot);
            const isConsecutiveBefore = firstBookingSlotIndex !== -1 && (
              // Gleicher Tag: Slot direkt davor
              (validatedDate === firstBooking.date && newSlotIndex === firstBookingSlotIndex - 1) ||
              // Tagübergreifend: letzter Slot des Vortags zu erstem Slot des aktuellen Tages
              (newSlotIndex === TIME_SLOTS.length - 1 && firstBookingSlotIndex === 0 &&
               new Date(firstBooking.date).getTime() === new Date(validatedDate).getTime() + 24 * 60 * 60 * 1000)
            );
            
            if (isConsecutiveAfter || isConsecutiveBefore) {
              extendsSeries = true;
              maxSeriesLength++;
            }
          }
        }
        
        logger.debug('Buchung erstellen: Trocknungsraum - Slot-Serien-Prüfung', {
          user_name: validatedUserName,
          date: validatedDate,
          slot: validatedSlot,
          existing_bookings_count: allDryerBookingsForMachine.length,
          max_series_length: maxSeriesLength,
          extends_series: extendsSeries
        });
        
        // Regel 3: Maximal 3 aufeinanderfolgende Slots
        if (maxSeriesLength > 3) {
          logger.warn('Buchung erstellen: Trocknungsraum-Serie würde Maximum überschreiten', {
            user_name: validatedUserName,
            max_series_length: maxSeriesLength
          });
          apiResponse.validationError(res,
            `Maximum: 3 aufeinanderfolgende Trocknungsraum-Slots. ` +
            `Diese Buchung würde eine Serie von ${maxSeriesLength} Slots ergeben.`
          );
          return;
        }
        
        // Regel 4: Am Folgetag nur max 1 Slot
        // Prüfe ob es eine tagübergreifende Buchung ist (Folgetag)
        // BUGFIX: Prüfung auch ohne extendsSeries durchführen (z.B. wenn man den ersten Slot am Folgetag bucht)
        if (allDryerBookingsForMachine.length > 0) {
          const lastBooking = allDryerBookingsForMachine[allDryerBookingsForMachine.length - 1];
          const isNextDay = new Date(validatedDate).getTime() === new Date(lastBooking.date).getTime() + 24 * 60 * 60 * 1000;
          
          if (isNextDay) {
            // Prüfe wie viele Slots bereits am Folgetag gebucht sind
            const bookingsOnNextDay = allDryerBookingsForMachine.filter(b => b.date === validatedDate);
            
            if (bookingsOnNextDay.length >= 1) {
              logger.warn('Buchung erstellen: Am Folgetag bereits 1 Slot gebucht', {
                user_name: validatedUserName,
                date: validatedDate,
                existing_count: bookingsOnNextDay.length
              });
              apiResponse.validationError(res,
                `Am Folgetag ist maximal 1 Zeitslot erlaubt. Sie haben bereits ${bookingsOnNextDay.length} Slot${bookingsOnNextDay.length > 1 ? 's' : ''} am ${validatedDate} gebucht.`
              );
              return;
            }
          }
        }
        
        // Prüfe ob die neue Buchung nicht aufeinanderfolgend ist
        // extendsSeries prüft jetzt beide Richtungen (vor und nach), daher vereinfachen wir hier
        if (!extendsSeries && allDryerBookingsForMachine.length > 0) {
          logger.warn('Buchung erstellen: Trocknungsraum-Buchung nicht aufeinanderfolgend', {
            user_name: validatedUserName,
            date: validatedDate,
            slot: validatedSlot,
            existing_bookings: allDryerBookingsForMachine
          });
          apiResponse.validationError(res,
            `Trocknungsraum-Slots müssen direkt aufeinanderfolgend sein. ` +
            `Ihre bestehenden Trocknungsraum-Buchungen: ${allDryerBookingsForMachine.map(b => `${b.date} ${b.slot}`).join(', ')}`
          );
          return;
        }
      }
    }
    
    // ============================================================================
    // REGEL 4: Vorausbuchungsregel
    // ============================================================================
    // Max. 1 Buchung in der Zukunft pro Person
    // Gilt für alle Maschinenarten gemeinsam
    // Erst nach Ablauf oder Löschung darf erneut gebucht werden
    // WICHTIG: Buchungen für heute sind weiterhin möglich (auch wenn zukünftige Buchung existiert)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Prüfe ob Buchung in der Zukunft liegt (nicht heute oder in Vergangenheit)
    // WICHTIG: Buchungen für heute sind IMMER erlaubt, auch wenn zukünftige Buchung existiert
    const bookingDateForComparison = new Date(year, month - 1, day);
    bookingDateForComparison.setHours(0, 0, 0, 0);
    
    // Vergleich: bookingDateForComparison > today bedeutet Zukunft (nicht heute)
    const isFutureBooking = bookingDateForComparison.getTime() > today.getTime();
    const isTodayBooking = bookingDateForComparison.getTime() === today.getTime();
    
    // Debug-Logging
    logger.debug('Buchung erstellen: Vorausbuchungs-Prüfung', {
      today: todayStr,
      today_timestamp: today.getTime(),
      requested_date: validatedDate,
      booking_date_timestamp: bookingDateForComparison.getTime(),
      is_future_booking: isFutureBooking,
      is_today_booking: isTodayBooking,
      user_name: validatedUserName,
      comparison: {
        booking_date: bookingDateForComparison.toISOString(),
        today_date: today.toISOString(),
        booking_time: bookingDateForComparison.getTime(),
        today_time: today.getTime(),
        difference_ms: bookingDateForComparison.getTime() - today.getTime()
      }
    });
    
    // Nur für zukünftige Buchungen prüfen (nicht für heute)
    if (isFutureBooking) {
      // Prüfe ob Person bereits eine zukünftige Buchung hat
      // WICHTIG: Für Trocknungsräume zählen Slot-Serien als eine Buchung
      const futureBookings = await dbHelper.all(
        `SELECT b.id, b.date, b.slot, m.name as machine_name, m.type as machine_type
         FROM bookings b
         INNER JOIN machines m ON b.machine_id = m.id
         WHERE b.user_name = ? AND b.date > ?
         ORDER BY b.date ASC, b.slot ASC`,
        [validatedUserName, todayStr]
      );
      
      // Für Trocknungsräume: Gruppiere aufeinanderfolgende Slots zu Serien
      // Eine Serie zählt als eine Buchung
      let hasFutureBooking = false;
      let futureBookingMessage = '';
      
      if (futureBookings.length > 0) {
        if (isDryer) {
          // Prüfe ob es eine Trocknungsraum-Serie gibt
          const dryerSeries = [];
          let currentSeries = [];
          let lastDate = null;
          let lastSlotIndex = -1;
          
          for (const booking of futureBookings) {
            // NEU: Tumbler werden wie Trocknungsräume behandelt
            if (booking.machine_type === 'dryer' || booking.machine_type === 'tumbler') {
              const bookingSlotIndex = TIME_SLOTS.findIndex(s => s.label === booking.slot);
              if (bookingSlotIndex === -1) continue;
              
              const isConsecutive = lastSlotIndex !== -1 && (
                (booking.date === lastDate && bookingSlotIndex === lastSlotIndex + 1) ||
                (lastSlotIndex === TIME_SLOTS.length - 1 && bookingSlotIndex === 0 &&
                 new Date(booking.date).getTime() === new Date(lastDate).getTime() + 24 * 60 * 60 * 1000)
              );
              
              if (isConsecutive && currentSeries.length > 0) {
                currentSeries.push(booking);
              } else {
                if (currentSeries.length > 0) {
                  dryerSeries.push([...currentSeries]);
                }
                currentSeries = [booking];
              }
              
              lastDate = booking.date;
              lastSlotIndex = bookingSlotIndex;
            } else {
              // Nicht-Trocknungsraum-Buchung zählt als separate Buchung
              hasFutureBooking = true;
              futureBookingMessage = `${booking.machine_name} am ${booking.date} (${booking.slot})`;
              break;
            }
          }
          
          if (currentSeries.length > 0) {
            dryerSeries.push(currentSeries);
          }
          
          // Wenn es eine Trocknungsraum-Serie gibt, prüfe ob die neue Buchung Teil dieser Serie ist
          if (dryerSeries.length > 0) {
            const firstSeries = dryerSeries[0];
            const lastInSeries = firstSeries[firstSeries.length - 1];
            const lastInSeriesSlotIndex = TIME_SLOTS.findIndex(s => s.label === lastInSeries.slot);
            const newSlotIndex = TIME_SLOTS.findIndex(s => s.label === validatedSlot);
            
            // Prüfe ob die neue Buchung die Serie erweitert (direkt aufeinanderfolgend)
            // WICHTIG: Prüfe auch, ob es sich um dasselbe Datum handelt oder tagübergreifend
            const extendsSeries = lastInSeriesSlotIndex !== -1 && newSlotIndex !== -1 && (
              // Gleicher Tag: nächster Slot
              (validatedDate === lastInSeries.date && newSlotIndex === lastInSeriesSlotIndex + 1) ||
              // Tagübergreifend: letzter Slot des Vortags zu erstem Slot des nächsten Tages
              (lastInSeriesSlotIndex === TIME_SLOTS.length - 1 && newSlotIndex === 0 &&
               new Date(validatedDate).getTime() === new Date(lastInSeries.date).getTime() + 24 * 60 * 60 * 1000)
            );
            
            logger.debug('Buchung erstellen: Trocknungsraum-Serie-Prüfung für Vorausbuchungsregel', {
              series_length: firstSeries.length,
              last_slot: lastInSeries.slot,
              last_slot_date: lastInSeries.date,
              last_slot_index: lastInSeriesSlotIndex,
              new_slot: validatedSlot,
              new_slot_date: validatedDate,
              new_slot_index: newSlotIndex,
              extends_series: extendsSeries,
              date_comparison: {
                last_date: lastInSeries.date,
                new_date: validatedDate,
                dates_equal: validatedDate === lastInSeries.date,
                date_diff_ms: new Date(validatedDate).getTime() - new Date(lastInSeries.date).getTime()
              }
            });
            
            // Wenn die Serie bereits 3 Slots hat, blockiere weitere Erweiterungen
            if (firstSeries.length >= 3 && extendsSeries) {
              hasFutureBooking = true;
              futureBookingMessage = `Trocknungsraum-Serie: ${firstSeries.length} Slots ab ${firstSeries[0].date} (${firstSeries[0].slot}) bis ${lastInSeries.date} (${lastInSeries.slot})`;
            } else if (firstSeries.length < 3 && extendsSeries) {
              // Serie kann noch erweitert werden - erlaube es
              hasFutureBooking = false;
              logger.debug('Buchung erstellen: Trocknungsraum-Serie kann erweitert werden', {
                current_series_length: firstSeries.length,
                new_slot: validatedSlot,
                extends_series: true
              });
            } else {
              // Neue Buchung ist nicht Teil der Serie - blockiere
              hasFutureBooking = true;
              if (firstSeries.length === 1) {
                futureBookingMessage = `Trocknungsraum-Serie: ${lastInSeries.machine_name} am ${lastInSeries.date} (${lastInSeries.slot})`;
              } else {
                futureBookingMessage = `Trocknungsraum-Serie: ${firstSeries.length} Slots ab ${firstSeries[0].date} (${firstSeries[0].slot}) bis ${lastInSeries.date} (${lastInSeries.slot})`;
              }
            }
          }
        } else {
          // Für Nicht-Trocknungsräume (Waschmaschinen): 
          // Prüfe ob bereits ein ANDERER zukünftiger TAG gebucht ist
          // Mehrere Buchungen am GLEICHEN Tag sind erlaubt (bis zu 3 Waschmaschinen)
          const uniqueFutureDates = [...new Set(futureBookings.map(b => b.date))];
          const requestedDateInFutureBookings = uniqueFutureDates.includes(validatedDate);
          
          // Wenn das angeforderte Datum bereits in den zukünftigen Buchungen ist, ist es erlaubt
          // (mehrere Buchungen am selben Tag sind OK)
          if (!requestedDateInFutureBookings && uniqueFutureDates.length > 0) {
            // Es gibt bereits eine Buchung an einem ANDEREN zukünftigen Tag
            hasFutureBooking = true;
            const firstFutureDate = uniqueFutureDates[0];
            const bookingsOnFirstDate = futureBookings.filter(b => b.date === firstFutureDate);
            const nextBooking = bookingsOnFirstDate[0];
            futureBookingMessage = `${nextBooking.machine_name} am ${nextBooking.date} (${nextBooking.slot})`;
          } else {
            // Entweder keine zukünftigen Buchungen ODER Buchung am gleichen Tag -> erlaubt
            hasFutureBooking = false;
          }
        }
      }
      
      logger.debug('Buchung erstellen: Zukünftige Buchungen gefunden', {
        user_name: validatedUserName,
        future_bookings_count: futureBookings.length,
        future_bookings: futureBookings,
        today_str: todayStr,
        is_dryer: isDryer,
        has_future_booking: hasFutureBooking
      });
      
      if (hasFutureBooking) {
        logger.warn('Buchung erstellen: Vorausbuchungsregel verletzt', {
          user_name: validatedUserName,
          existing_future_booking_message: futureBookingMessage,
          requested_date: validatedDate,
          machine_type: machine.type
        });
        apiResponse.validationError(res, 
          `Sie haben bereits eine zukünftige Buchung: ${futureBookingMessage}. ` +
          `Sie können erst nach Ablauf oder Löschung dieser Buchung eine neue erstellen.`
        );
        return;
      }
    } else if (isTodayBooking) {
      // Buchung für heute - Vorausbuchungsregel greift NICHT
      logger.debug('Buchung erstellen: Buchung für heute - Vorausbuchungsregel wird übersprungen', {
        user_name: validatedUserName,
        date: validatedDate,
        machine_type: machine.type
      });
    }
    
    // ============================================================================
    // REGEL 7: Doppelbuchungen verhindern (maschinenübergreifend)
    // ============================================================================
    // Eine Person darf nicht zwei Buchungen im gleichen Slot haben
    // Auch nicht auf unterschiedlichen Maschinen
    // Slot + Datum + Person müssen eindeutig sein
    
    // 1. Prüfe: Gleiche Maschine + Slot + Datum (ursprüngliche Prüfung)
    const existingBookingSameMachine = await dbHelper.get(
      'SELECT * FROM bookings WHERE machine_id = ? AND date = ? AND slot = ?',
      [validatedMachineId, validatedDate, validatedSlot]
    );
    
    if (existingBookingSameMachine) {
      logger.warn('Buchung erstellen: Doppelbuchung erkannt (gleiche Maschine)', {
        machine_id: validatedMachineId,
        date: validatedDate,
        slot: validatedSlot
      });
      apiResponse.conflict(res, 'Dieser Slot ist bereits für diese Maschine und dieses Datum gebucht.');
      return;
    }
    
    // 2. Prüfe: Derselbe Slot + Datum auf verschiedenen Maschinen (REGEL 7)
    // WICHTIG: Diese Prüfung gilt NUR für Trocknungsräume, NICHT für Waschmaschinen!
    // Für Waschmaschinen ist es erlaubt, denselben Slot auf verschiedenen Maschinen zu buchen
    // (siehe REGEL 3: Bis zu 3 Waschmaschinen am Tag mit demselben Slot)
    if (isDryer) {
      const existingBookingSameSlot = await dbHelper.get(
        'SELECT b.*, m.name as machine_name, m.type as machine_type FROM bookings b INNER JOIN machines m ON b.machine_id = m.id WHERE b.user_name = ? AND b.date = ? AND b.slot = ? AND b.machine_id != ? AND (m.type = ? OR m.type = ?)',
        [validatedUserName, validatedDate, validatedSlot, validatedMachineId, 'dryer', 'tumbler']
      );
      
      if (existingBookingSameSlot) {
        logger.warn('Buchung erstellen: Doppelbuchung erkannt (gleicher Slot auf anderem Trocknungsraum)', {
          user_name: validatedUserName,
          date: validatedDate,
          slot: validatedSlot,
          existing_machine: existingBookingSameSlot.machine_name,
          requested_machine_id: validatedMachineId
        });
        apiResponse.validationError(res,
          `Sie haben bereits eine Buchung für den Slot ${validatedSlot} am ${validatedDate} auf ${existingBookingSameSlot.machine_name}. ` +
          `Eine Person darf nicht zwei Trocknungsraum-Buchungen im gleichen Slot haben.`
        );
        return;
      }
    }
    
    // Buchung erstellen
    logger.debug('Buchung erstellen - Vor INSERT', {
      machine_id: validatedMachineId,
      date: validatedDate,
      slot: validatedSlot,
      user_name: validatedUserName
    });
    
    const result = await dbHelper.run(
      'INSERT INTO bookings (machine_id, date, slot, user_name) VALUES (?, ?, ?, ?)',
      [validatedMachineId, validatedDate, validatedSlot, validatedUserName]
    );
    
    logger.info('Buchung erfolgreich erstellt', {
      booking_id: result.lastID,
      machine_id: validatedMachineId,
      date: validatedDate,
      slot: validatedSlot,
      user_name: validatedUserName,
      result: result
    });
    
    // Verifiziere dass die Buchung wirklich in der DB ist
    const verifyBooking = await dbHelper.get('SELECT * FROM bookings WHERE id = ?', [result.lastID]);
    if (verifyBooking) {
      logger.debug('Buchung-Verifizierung erfolgreich', {
        booking_id: result.lastID,
        found: true,
        booking: verifyBooking
      });
    } else {
      logger.error('KRITISCH: Buchung wurde erstellt, aber nicht in DB gefunden!', null, {
        booking_id: result.lastID
      });
    }
    
    // Metriken aktualisieren
    metrics.api.bookings.created++;
    
    // Erstellte Buchung mit Maschinen-Informationen zurückgeben
    const booking = await dbHelper.get(`
      SELECT 
        b.id,
        b.machine_id,
        b.date,
        b.slot,
        b.user_name,
        m.name as machine_name,
        m.type as machine_type
      FROM bookings b
      INNER JOIN machines m ON b.machine_id = m.id
      WHERE b.id = ?
    `, [result.lastID]);
    
    if (!booking) {
      logger.error('Buchung erstellt, aber Details konnten nicht abgerufen werden', null, { booking_id: result.lastID });
      apiResponse.error(res, 'Buchung wurde erstellt, aber Fehler beim Abrufen der Details', 500);
      return;
    }
    
    apiResponse.success(res, booking, 201);
  } catch (error) {
    logger.error('Fehler beim Erstellen der Buchung', error, { body: req.body });
    metrics.api.bookings.errors++;
    apiResponse.error(res, 'Fehler beim Erstellen der Buchung in der Datenbank', 500);
  }
});

// API-Route: Buchung löschen (nur eigene Buchungen)
apiV1.delete('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validierung: ID muss eine positive Zahl sein
    const validatedId = validateInteger(id, 'id');
    if (!validatedId) {
      logger.warn('Buchung löschen: Ungültige ID', { id });
      apiResponse.validationError(res, 'Ungültige Buchungs-ID. ID muss eine positive Zahl sein.');
      return;
    }
    
    // Prüfen ob Buchung existiert
    const booking = await dbHelper.get('SELECT * FROM bookings WHERE id = ?', [validatedId]);
    if (!booking) {
      logger.warn('Buchung löschen: Buchung nicht gefunden', { booking_id: validatedId });
      apiResponse.notFound(res, 'Buchung');
      return;
    }
    
    // Sicherheit: Prüfen ob Benutzer berechtigt ist (eigene Buchung oder Admin)
    // SICHERHEIT: Nur eingeloggte Benutzer können Buchungen löschen
    // Session ist jetzt erforderlich - keine Query-Parameter mehr erlaubt
    if (!req.session || !req.session.username) {
      logger.warn('Buchung löschen: Keine Session vorhanden', {
        booking_id: validatedId,
        booking_owner: booking.user_name,
        has_session: !!req.session,
        sessionId: req.sessionID
      });
      apiResponse.unauthorized(res, 'Bitte melden Sie sich an, um Buchungen zu löschen');
      return;
    }
    
    const currentUsername = req.session.username;
    const isAdmin = req.session.role === 'admin';
    const isOwner = booking.user_name === currentUsername;
    
    if (!isOwner && !isAdmin) {
      logger.warn('Buchung löschen: Keine Berechtigung', {
        booking_id: validatedId,
        booking_owner: booking.user_name,
        requester: currentUsername
      });
      apiResponse.forbidden(res, 'Sie können nur Ihre eigenen Buchungen löschen');
      return;
    }
    
    // Buchung löschen
    await dbHelper.run('DELETE FROM bookings WHERE id = ?', [validatedId]);
    
    logger.info('Buchung erfolgreich gelöscht', {
      booking_id: validatedId,
      date: booking.date,
      slot: booking.slot,
      user_name: booking.user_name
    });
    
    // Metriken aktualisieren
    metrics.api.bookings.deleted++;
    
    apiResponse.success(res, { message: 'Buchung erfolgreich gelöscht' });
  } catch (error) {
    logger.error('Fehler beim Löschen der Buchung', error, { booking_id: req.params.id });
    apiResponse.error(res, 'Fehler beim Löschen der Buchung aus der Datenbank', 500);
  }
});

// ============================================================================
// DATENBANK-BACKUP & WIEDERHERSTELLUNG
// ============================================================================

const BACKUP_DIR = path.join(__dirname, 'backups');
// Datenbank-Pfad konfigurierbar (für Render Persistent Disk)
const DB_PATH = process.env.DATABASE_PATH || './waschmaschine.db';

/**
 * Backup-Verzeichnis erstellen, falls nicht vorhanden
 */
async function ensureBackupDir() {
  try {
    if (!existsSync(BACKUP_DIR)) {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
      logger.info('Backup-Verzeichnis erstellt', { path: BACKUP_DIR });
    }
  } catch (error) {
    logger.error('Fehler beim Erstellen des Backup-Verzeichnisses', error);
    throw error;
  }
}

/**
 * Automatisches Backup erstellen
 */
async function createBackup() {
  try {
    await ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.db`);
    
    await fs.copyFile(DB_PATH, backupPath);
    
    logger.info('Automatisches Backup erstellt', { backupPath });
    
    // Alte Backups löschen (nur die letzten 10 behalten)
    const backups = await fs.readdir(BACKUP_DIR);
    const backupFiles = backups
      .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
      .map(async (f) => {
        const filePath = path.join(BACKUP_DIR, f);
        const stats = await fs.stat(filePath);
        return {
          name: f,
          path: filePath,
          time: stats.mtime
        };
      });
    
    const backupFilesWithTime = await Promise.all(backupFiles);
    backupFilesWithTime.sort((a, b) => b.time.getTime() - a.time.getTime());
    
    // Alte Backups löschen (mehr als 10)
    if (backupFilesWithTime.length > 10) {
      const toDelete = backupFilesWithTime.slice(10);
      for (const file of toDelete) {
        await fs.unlink(file.path);
        logger.debug('Altes Backup gelöscht', { file: file.name });
      }
    }
    
    return backupPath;
  } catch (error) {
    logger.error('Fehler beim Erstellen des Backups', error);
    throw error;
  }
}

// Automatisches Backup alle 24 Stunden
setInterval(async () => {
  try {
    await createBackup();
  } catch (error) {
    logger.error('Fehler beim automatischen Backup', error);
  }
}, 24 * 60 * 60 * 1000);

// ============================================================================
// ADMIN-BACKUP-ENDPUNKTE (nur für Admins)
// ============================================================================

// Admin-Router definieren (wird später in Zeile 3116 nochmal definiert, aber hier bereits benötigt)
const adminRouter = express.Router();

// Admin: Manuelles Backup erstellen
adminRouter.post('/backup', async (req, res) => {
  try {
    const backupPath = await createBackup();
    const backupName = path.basename(backupPath);
    const stats = await fs.stat(backupPath);
    
    logger.info('Manuelles Backup erstellt (Admin)', { 
      backupPath, 
      backupName,
      size: stats.size,
      requestedBy: req.session.username || req.ip 
    });
    
    apiResponse.success(res, {
      message: 'Backup erfolgreich erstellt',
      backupName: backupName,
      size: stats.size,
      sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Fehler beim Erstellen des manuellen Backups (Admin)', error, {
      requestedBy: req.session.username || req.ip
    });
    apiResponse.error(res, 'Fehler beim Erstellen des Backups', 500);
  }
});

// Admin: Backup-Liste abrufen
adminRouter.get('/backups', async (req, res) => {
  try {
    await ensureBackupDir();
    const backups = await fs.readdir(BACKUP_DIR);
    const backupFiles = backups
      .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
      .map(async (f) => {
        const filePath = path.join(BACKUP_DIR, f);
        const stats = await fs.stat(filePath);
        return {
          name: f,
          size: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString()
        };
      });
    
    const backupList = await Promise.all(backupFiles);
    backupList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    logger.debug('Backup-Liste abgerufen (Admin)', { count: backupList.length });
    apiResponse.success(res, backupList);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Backup-Liste (Admin)', error);
    apiResponse.error(res, 'Fehler beim Abrufen der Backup-Liste', 500);
  }
});

// Admin: Backup wiederherstellen
adminRouter.post('/restore', async (req, res) => {
  try {
    const { backupName } = req.body;
    
    if (!backupName || typeof backupName !== 'string') {
      apiResponse.validationError(res, 'backupName ist erforderlich');
      return;
    }
    
    // Sicherheitsprüfung: Validierung des Backup-Namens
    // 1. Prüfe Format (muss mit 'backup-' beginnen und mit '.db' enden)
    if (!backupName.startsWith('backup-') || !backupName.endsWith('.db')) {
      apiResponse.validationError(res, 'Ungültiger Backup-Name: Format muss "backup-*.db" sein');
      return;
    }
    
    // 2. Prüfe auf Path-Traversal-Versuche (../, ..\\, etc.)
    if (backupName.includes('..') || backupName.includes('/') || backupName.includes('\\')) {
      apiResponse.validationError(res, 'Ungültiger Backup-Name: Path-Traversal nicht erlaubt');
      return;
    }
    
    // 3. Erstelle normalisierten Pfad
    const backupPath = path.join(BACKUP_DIR, backupName);
    const normalizedBackupPath = path.normalize(backupPath);
    const normalizedBackupDir = path.normalize(path.resolve(BACKUP_DIR));
    
    // 4. Prüfe ob normalisierter Pfad wirklich innerhalb des Backup-Verzeichnisses liegt
    if (!normalizedBackupPath.startsWith(normalizedBackupDir)) {
      logger.warn('Path-Traversal-Versuch erkannt (Admin)', { 
        backupName, 
        backupPath: normalizedBackupPath,
        requestedBy: req.session.username || req.ip
      });
      apiResponse.validationError(res, 'Ungültiger Backup-Name: Path-Traversal nicht erlaubt');
      return;
    }
    
    if (!existsSync(backupPath)) {
      apiResponse.notFound(res, 'Backup');
      return;
    }
    
    // Datenbank schließen
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          logger.error('Fehler beim Schließen der Datenbank', err);
          reject(err);
        } else {
          logger.info('Datenbank geschlossen für Wiederherstellung (Admin)', {
            requestedBy: req.session.username || req.ip
          });
          resolve();
        }
      });
    });
    
    // Backup wiederherstellen
    await fs.copyFile(backupPath, DB_PATH);
    logger.info('Backup wiederhergestellt (Admin)', { 
      backupName, 
      requestedBy: req.session.username || req.ip 
    });
    
    // Datenbank-Verbindung wiederherstellen
    try {
      const newDb = await createDatabaseConnection();
      db = newDb;
      logger.info('Datenbank-Verbindung nach Wiederherstellung wieder geöffnet');
    } catch (reopenError) {
      logger.error('Fehler beim erneuten Öffnen der Datenbank nach Wiederherstellung', reopenError);
      apiResponse.error(res, 'Backup wiederhergestellt, aber Datenbank-Verbindung konnte nicht wiederhergestellt werden. Bitte starten Sie den Server neu.', 500);
      return;
    }
    
    apiResponse.success(res, {
      message: 'Backup erfolgreich wiederhergestellt und Datenbank-Verbindung wiederhergestellt.',
      backupName: backupName,
      timestamp: new Date().toISOString(),
      requiresRestart: false
    });
  } catch (error) {
    logger.error('Fehler beim Wiederherstellen des Backups (Admin)', error, {
      requestedBy: req.session.username || req.ip
    });
    
    // Versuche, Datenbank wieder zu öffnen, falls sie geschlossen wurde
    try {
      const newDb = await createDatabaseConnection();
      db = newDb;
      logger.info('Datenbank nach fehlgeschlagener Wiederherstellung wieder geöffnet');
    } catch (reopenError) {
      logger.error('Kritischer Fehler: Datenbank konnte nicht wieder geöffnet werden', reopenError);
    }
    
    apiResponse.error(res, 'Fehler beim Wiederherstellen des Backups', 500);
  }
});

// ============================================================================
// DATENBANK-STATISTIKEN
// ============================================================================

// API-Route: Statistiken abrufen
app.get('/api/statistics', async (req, res) => {
  try {
    const { date } = req.query;
    
    // Gesamtstatistiken
    const totalMachines = await dbHelper.get('SELECT COUNT(*) as count FROM machines');
    const totalBookings = await dbHelper.get('SELECT COUNT(*) as count FROM bookings');
    
    // Buchungen pro Maschine
    const bookingsPerMachine = await dbHelper.all(`
      SELECT 
        m.id,
        m.name,
        m.type,
        COUNT(b.id) as booking_count
      FROM machines m
      LEFT JOIN bookings b ON m.id = b.machine_id
      GROUP BY m.id, m.name, m.type
      ORDER BY booking_count DESC
    `);
    
    // Buchungen pro Tag (letzte 30 Tage)
    const bookingsPerDay = await dbHelper.all(`
      SELECT 
        date,
        COUNT(*) as booking_count
      FROM bookings
      WHERE date >= date('now', '-30 days')
      GROUP BY date
      ORDER BY date DESC
      LIMIT 30
    `);
    
    // Buchungen pro Slot (gesamt)
    const bookingsPerSlot = await dbHelper.all(`
      SELECT 
        slot,
        COUNT(*) as booking_count
      FROM bookings
      GROUP BY slot
      ORDER BY booking_count DESC
    `);
    
    // Statistiken für spezifisches Datum (falls angegeben)
    let dateStats = null;
    if (date && isValidDate(date)) {
      const trimmedDate = typeof date === 'string' ? date.trim() : date;
      const bookingsForDate = await dbHelper.all(`
        SELECT 
          m.id,
          m.name,
          m.type,
          b.slot,
          COUNT(*) as booking_count
        FROM bookings b
        INNER JOIN machines m ON b.machine_id = m.id
        WHERE b.date = ?
        GROUP BY m.id, m.name, m.type, b.slot
        ORDER BY m.name, b.slot
      `, [trimmedDate]);
      
      dateStats = {
        date: trimmedDate,
        totalBookings: bookingsForDate.reduce((sum, b) => sum + b.booking_count, 0),
        bookingsByMachine: bookingsForDate
      };
    }
    
    const statistics = {
      overview: {
        totalMachines: totalMachines.count,
        totalBookings: totalBookings.count
      },
      bookingsPerMachine: bookingsPerMachine,
      bookingsPerDay: bookingsPerDay,
      bookingsPerSlot: bookingsPerSlot,
      dateStats: dateStats
    };
    
    logger.debug('Statistiken abgerufen', { date: date || 'all' });
    apiResponse.success(res, statistics);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Statistiken', error);
    apiResponse.error(res, 'Fehler beim Abrufen der Statistiken', 500);
  }
});

// ============================================================================
// DATENBANK-MIGRATIONS-SYSTEM
// ============================================================================

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const SCHEMA_VERSION_TABLE = 'schema_version';

/**
 * Migrations-Verzeichnis erstellen, falls nicht vorhanden
 */
async function ensureMigrationsDir() {
  try {
    if (!existsSync(MIGRATIONS_DIR)) {
      await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
      logger.info('Migrations-Verzeichnis erstellt', { path: MIGRATIONS_DIR });
    }
  } catch (error) {
    logger.error('Fehler beim Erstellen des Migrations-Verzeichnisses', error);
    throw error;
  }
}

/**
 * Schema-Version-Tabelle erstellen
 */
async function initSchemaVersionTable() {
  try {
    await dbHelper.run(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA_VERSION_TABLE} (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.debug('Schema-Version-Tabelle initialisiert');
  } catch (error) {
    logger.error('Fehler beim Initialisieren der Schema-Version-Tabelle', error);
    throw error;
  }
}

/**
 * Aktuelle Schema-Version abrufen
 */
async function getCurrentSchemaVersion() {
  try {
    const version = await dbHelper.get(`
      SELECT MAX(version) as version FROM ${SCHEMA_VERSION_TABLE}
    `);
    return version ? version.version : 0;
  } catch (error) {
    logger.error('Fehler beim Abrufen der Schema-Version', error);
    return 0;
  }
}

/**
 * Migration anwenden
 */
async function applyMigration(version, name, sql) {
  try {
    // Migration in Transaktion ausführen
    await dbHelper.run('BEGIN TRANSACTION');
    
    try {
      // SQL ausführen
      const statements = sql.split(';').filter(s => s.trim().length > 0);
      for (const statement of statements) {
        await dbHelper.run(statement.trim());
      }
      
      // Version speichern
      await dbHelper.run(
        `INSERT INTO ${SCHEMA_VERSION_TABLE} (version, name) VALUES (?, ?)`,
        [version, name]
      );
      
      await dbHelper.run('COMMIT');
      logger.info('Migration angewendet', { version, name });
      return true;
    } catch (error) {
      await dbHelper.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Fehler beim Anwenden der Migration', error, { version, name });
    throw error;
  }
}

/**
 * Verfügbare Migrationen laden
 */
async function loadMigrations() {
  try {
    await ensureMigrationsDir();
    const files = await fs.readdir(MIGRATIONS_DIR);
    const migrations = files
      .filter(f => f.endsWith('.sql'))
      .map(f => {
        const match = f.match(/^(\d+)_(.+)\.sql$/);
        if (match) {
          return {
            version: parseInt(match[1]),
            name: match[2],
            file: f,
            path: path.join(MIGRATIONS_DIR, f)
          };
        }
        return null;
      })
      .filter(m => m !== null)
      .sort((a, b) => a.version - b.version);
    
    return migrations;
  } catch (error) {
    logger.error('Fehler beim Laden der Migrationen', error);
    return [];
  }
}

/**
 * Ausstehende Migrationen anwenden
 */
async function runMigrations() {
  try {
    await initSchemaVersionTable();
    const currentVersion = await getCurrentSchemaVersion();
    const migrations = await loadMigrations();
    
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);
    
    if (pendingMigrations.length === 0) {
      logger.info('Keine ausstehenden Migrationen', { currentVersion });
      return;
    }
    
    logger.info(`Wende ${pendingMigrations.length} ausstehende Migration(en) an`, {
      currentVersion,
      pendingVersions: pendingMigrations.map(m => m.version)
    });
    
    for (const migration of pendingMigrations) {
      const sql = await fs.readFile(migration.path, 'utf8');
      await applyMigration(migration.version, migration.name, sql);
    }
    
    logger.info('Alle Migrationen erfolgreich angewendet');
  } catch (error) {
    logger.error('Fehler beim Ausführen der Migrationen', error);
    throw error;
  }
}

// Migrationen werden bereits in der Datenbank-Initialisierung ausgeführt (siehe initDatabase)
// Kein separater Aufruf nötig, da dies zu Race Conditions führen kann

// API-Route: Schema-Version abrufen
app.get('/api/migrations/version', async (req, res) => {
  try {
    const currentVersion = await getCurrentSchemaVersion();
    const migrations = await loadMigrations();
    
    apiResponse.success(res, {
      currentVersion: currentVersion,
      latestVersion: migrations.length > 0 ? Math.max(...migrations.map(m => m.version)) : 0,
      pendingMigrations: migrations.filter(m => m.version > currentVersion).length,
      totalMigrations: migrations.length
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Schema-Version', error);
    apiResponse.error(res, 'Fehler beim Abrufen der Schema-Version', 500);
  }
});

// API-Route: Migrationen-Status abrufen
app.get('/api/migrations/status', async (req, res) => {
  try {
    const currentVersion = await getCurrentSchemaVersion();
    const migrations = await loadMigrations();
    const appliedMigrations = await dbHelper.all(`
      SELECT * FROM ${SCHEMA_VERSION_TABLE} ORDER BY version
    `);
    
    const status = migrations.map(m => ({
      version: m.version,
      name: m.name,
      applied: m.version <= currentVersion,
      appliedAt: appliedMigrations.find(am => am.version === m.version)?.applied_at || null
    }));
    
    apiResponse.success(res, {
      currentVersion: currentVersion,
      migrations: status
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen des Migrations-Status', error);
    apiResponse.error(res, 'Fehler beim Abrufen des Migrations-Status', 500);
  }
});

// ============================================================================
// ADMIN-API-ENDPUNKTE (nur für Admins)
// ============================================================================

// adminRouter wurde bereits oben definiert (vor ADMIN-BACKUP-ENDPUNKTE)

// DEBUG: Direkter Endpoint zum Testen (OHNE Auth, nur für Debugging)
apiV1.get('/debug/all-bookings', async (req, res) => {
  try {
    // Direkt alle Buchungen aus DB holen (ohne JOIN)
    const allBookings = await dbHelper.all('SELECT * FROM bookings ORDER BY id DESC');
    const totalCount = await dbHelper.get('SELECT COUNT(*) as count FROM bookings');
    
    // Prüfe auch ob Maschinen existieren
    const machines = await dbHelper.all('SELECT * FROM machines');
    
    logger.info('DEBUG: Alle Buchungen direkt aus DB', {
      totalBookings: totalCount ? totalCount.count : 0,
      bookingsFound: allBookings.length,
      bookings: allBookings,
      machinesCount: machines.length,
      machines: machines
    });
    
    apiResponse.success(res, {
      totalCount: totalCount ? totalCount.count : 0,
      bookings: allBookings,
      machines: machines
    });
  } catch (error) {
    logger.error('DEBUG: Fehler beim Abrufen aller Buchungen', error);
    apiResponse.error(res, 'Fehler beim Abrufen der Buchungen', 500);
  }
});

// DEBUG: Prüfe ob Admin-Benutzer existiert
apiV1.get('/debug/admin-user', async (req, res) => {
  try {
    const adminUser = await dbHelper.get('SELECT id, username, role FROM users WHERE username = ?', ['admin']);
    const allUsers = await dbHelper.all('SELECT id, username, role FROM users');
    
    logger.info('DEBUG: Admin-Benutzer-Prüfung', {
      adminExists: !!adminUser,
      adminUser: adminUser,
      totalUsers: allUsers.length,
      allUsers: allUsers
    });
    
    apiResponse.success(res, {
      adminExists: !!adminUser,
      adminUser: adminUser,
      totalUsers: allUsers.length,
      allUsers: allUsers
    });
  } catch (error) {
    logger.error('DEBUG: Fehler beim Prüfen des Admin-Benutzers', error);
    apiResponse.error(res, 'Fehler beim Prüfen des Admin-Benutzers', 500);
  }
});

// Alle Admin-Routen erfordern Admin-Rechte
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

// Admin: Alle Buchungen abrufen
adminRouter.get('/bookings', async (req, res) => {
  try {
    const { date, limit = 100 } = req.query;
    
    // Debug: Logge Query-Parameter
    logger.debug('Admin: Buchungen abrufen - Query-Parameter', { date, limit });
    
    // Prüfe ob überhaupt Buchungen in der DB sind (ohne Filter)
    const totalBookings = await dbHelper.get('SELECT COUNT(*) as count FROM bookings');
    const totalCount = totalBookings ? totalBookings.count : 0;
    
    logger.info(`Admin: Gesamtanzahl Buchungen in DB: ${totalCount}`);
    
    // Prüfe alle Buchungen ohne JOIN (für Debug) - IMMER, auch wenn totalCount = 0
    const allBookingsRaw = await dbHelper.all('SELECT * FROM bookings ORDER BY id DESC LIMIT 10');
    logger.info('Admin: Letzte 10 Buchungen (roh, ohne JOIN)', {
      totalCount: totalCount,
      rawCount: allBookingsRaw.length,
      bookings: allBookingsRaw.map(b => ({
        id: b.id,
        machine_id: b.machine_id,
        date: b.date,
        slot: b.slot,
        user_name: b.user_name
      }))
    });
    
    // Wenn keine Buchungen in DB sind, direkt zurückgeben
    if (totalCount === 0) {
      logger.warn('Admin: Keine Buchungen in der Datenbank gefunden!', {
        totalCount: totalCount,
        rawBookings: allBookingsRaw.length,
        rawBookingsData: allBookingsRaw
      });
      apiResponse.success(res, []);
      return;
    }
    
    let query = `
      SELECT 
        b.id,
        b.machine_id,
        b.date,
        b.slot,
        b.user_name,
        COALESCE(m.name, 'Unbekannt') as machine_name,
        COALESCE(m.type, 'unknown') as machine_type
      FROM bookings b
      LEFT JOIN machines m ON b.machine_id = m.id
    `;
    const params = [];
    
    if (date) {
      // Datum normalisieren (trim und validieren)
      const normalizedDate = typeof date === 'string' ? date.trim() : String(date);
      query += ' WHERE b.date = ?';
      params.push(normalizedDate);
      logger.debug('Admin: Buchungen mit Datum-Filter abrufen', { date: normalizedDate });
    }
    
    query += ' ORDER BY b.date DESC, b.slot, m.name LIMIT ?';
    params.push(parseInt(limit) || 100);
    
    logger.debug('Admin: SQL Query', { query, params });
    
    const bookings = await dbHelper.all(query, params);
    
    // Debug: Prüfe ob JOIN-Problem vorliegt
    if (totalCount > 0 && bookings.length === 0) {
      logger.warn('Admin: PROBLEM ERKANNT - Buchungen in DB, aber JOIN liefert keine Ergebnisse!', {
        totalInDB: totalCount,
        rawBookings: allBookingsRaw.length,
        dateFilter: date || 'kein Filter',
        query: query,
        params: params
      });
      
      // Versuche ohne JOIN als Fallback
      let fallbackQuery = 'SELECT * FROM bookings';
      const fallbackParams = [];
      if (date) {
        const normalizedDate = typeof date === 'string' ? date.trim() : String(date);
        fallbackQuery += ' WHERE date = ?';
        fallbackParams.push(normalizedDate);
      }
      fallbackQuery += ' ORDER BY date DESC, slot LIMIT ?';
      fallbackParams.push(parseInt(limit) || 100);
      
      const fallbackBookings = await dbHelper.all(fallbackQuery, fallbackParams);
      logger.info('Admin: Fallback-Query (ohne JOIN) liefert', {
        count: fallbackBookings.length,
        bookings: fallbackBookings.map(b => ({ id: b.id, date: b.date, slot: b.slot, user: b.user_name }))
      });
      
      // Wenn Fallback Ergebnisse liefert, verwende diese (ohne Maschinen-Info)
      if (fallbackBookings.length > 0) {
        const bookingsWithMachineInfo = await Promise.all(fallbackBookings.map(async (b) => {
          const machine = await dbHelper.get('SELECT * FROM machines WHERE id = ?', [b.machine_id]);
          return {
            id: b.id,
            machine_id: b.machine_id,
            date: b.date,
            slot: b.slot,
            user_name: b.user_name,
            machine_name: machine ? machine.name : 'Unbekannt',
            machine_type: machine ? machine.type : 'unknown'
          };
        }));
        
        logger.info(`Admin: Buchungen abgerufen (mit Fallback): ${bookingsWithMachineInfo.length} gefunden`, {
          totalInDB: totalCount,
          dateFilter: date || 'kein Filter',
          found: bookingsWithMachineInfo.length
        });
        
        apiResponse.success(res, bookingsWithMachineInfo);
        return;
      }
    }
    
    logger.info(`Admin: Buchungen abgerufen: ${bookings.length} gefunden`, {
      totalInDB: totalCount,
      dateFilter: date || 'kein Filter',
      limit: parseInt(limit) || 100,
      found: bookings.length,
      bookings: bookings.map(b => ({ id: b.id, date: b.date, slot: b.slot, user: b.user_name }))
    });
    
    apiResponse.success(res, bookings);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Buchungen (Admin)', error, { 
      query: req.query,
      errorMessage: error.message,
      errorStack: error.stack
    });
    apiResponse.error(res, 'Fehler beim Abrufen der Buchungen', 500);
  }
});

// Admin: Buchung löschen (jede Buchung)
adminRouter.delete('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedId = validateInteger(id, 'id');
    
    if (!validatedId) {
      apiResponse.validationError(res, 'Ungültige Buchungs-ID');
      return;
    }
    
    const booking = await dbHelper.get('SELECT * FROM bookings WHERE id = ?', [validatedId]);
    if (!booking) {
      apiResponse.notFound(res, 'Buchung');
      return;
    }
    
    await dbHelper.run('DELETE FROM bookings WHERE id = ?', [validatedId]);
    
    logger.info('Admin: Buchung gelöscht', {
      booking_id: validatedId,
      deleted_by: req.session.username,
      booking: booking
    });
    
    apiResponse.success(res, { message: 'Buchung erfolgreich gelöscht' });
  } catch (error) {
    logger.error('Fehler beim Löschen der Buchung (Admin)', error);
    apiResponse.error(res, 'Fehler beim Löschen der Buchung', 500);
  }
});

// Admin: Alle Maschinen abrufen
adminRouter.get('/machines', async (req, res) => {
  try {
    const machines = await dbHelper.all('SELECT * FROM machines ORDER BY id');
    apiResponse.success(res, machines);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Maschinen (Admin)', error);
    apiResponse.error(res, 'Fehler beim Abrufen der Maschinen', 500);
  }
});

// Admin: Neue Maschine erstellen
adminRouter.post('/machines', validators.body({
  name: { required: true, type: 'string', validator: commonValidators.string, normalize: commonValidators.normalizeString },
  type: { required: true, type: 'string', validator: (value) => {
    if (value !== 'washer' && value !== 'dryer') {
      return 'Typ muss "washer" oder "dryer" sein';
    }
    return true;
  }}
}), async (req, res) => {
  try {
    const { name, type } = req.validated;
    
    const result = await dbHelper.run(
      'INSERT INTO machines (name, type) VALUES (?, ?)',
      [name, type]
    );
    
    const machine = await dbHelper.get('SELECT * FROM machines WHERE id = ?', [result.lastID]);
    
    logger.info('Admin: Maschine erstellt', {
      machine_id: result.lastID,
      name,
      type,
      created_by: req.session.username
    });
    
    apiResponse.success(res, machine, 201);
  } catch (error) {
    logger.error('Fehler beim Erstellen der Maschine (Admin)', error);
    if (error.message && error.message.includes('UNIQUE constraint')) {
      apiResponse.conflict(res, 'Eine Maschine mit diesem Namen existiert bereits');
    } else {
      apiResponse.error(res, 'Fehler beim Erstellen der Maschine', 500);
    }
  }
});

// Admin: Maschine aktualisieren
adminRouter.put('/machines/:id', validators.params({
  id: { required: true, validator: commonValidators.integer }
}), validators.body({
  name: { required: true, type: 'string', validator: commonValidators.string, normalize: commonValidators.normalizeString },
  type: { required: true, type: 'string', validator: (value) => {
    if (value !== 'washer' && value !== 'dryer') {
      return 'Typ muss "washer" oder "dryer" sein';
    }
    return true;
  }}
}), async (req, res) => {
  try {
    const { id } = req.validated;
    const { name, type } = req.body;
    
    const machine = await dbHelper.get('SELECT * FROM machines WHERE id = ?', [id]);
    if (!machine) {
      apiResponse.notFound(res, 'Maschine');
      return;
    }
    
    await dbHelper.run(
      'UPDATE machines SET name = ?, type = ? WHERE id = ?',
      [name, type, id]
    );
    
    const updatedMachine = await dbHelper.get('SELECT * FROM machines WHERE id = ?', [id]);
    
    logger.info('Admin: Maschine aktualisiert', {
      machine_id: id,
      updated_by: req.session.username
    });
    
    apiResponse.success(res, updatedMachine);
  } catch (error) {
    logger.error('Fehler beim Aktualisieren der Maschine (Admin)', error);
    apiResponse.error(res, 'Fehler beim Aktualisieren der Maschine', 500);
  }
});

// Admin: Maschine löschen
adminRouter.delete('/machines/:id', validators.params({
  id: { required: true, validator: commonValidators.integer }
}), async (req, res) => {
  try {
    const { id } = req.validated;
    
    const machine = await dbHelper.get('SELECT * FROM machines WHERE id = ?', [id]);
    if (!machine) {
      apiResponse.notFound(res, 'Maschine');
      return;
    }
    
    // Prüfe ob Maschine noch Buchungen hat
    const bookings = await dbHelper.get('SELECT COUNT(*) as count FROM bookings WHERE machine_id = ?', [id]);
    if (bookings && bookings.count > 0) {
      apiResponse.error(res, `Maschine kann nicht gelöscht werden, da noch ${bookings.count} Buchung(en) vorhanden sind`, 409);
      return;
    }
    
    await dbHelper.run('DELETE FROM machines WHERE id = ?', [id]);
    
    logger.info('Admin: Maschine gelöscht', {
      machine_id: id,
      deleted_by: req.session.username
    });
    
    apiResponse.success(res, { message: 'Maschine erfolgreich gelöscht' });
  } catch (error) {
    logger.error('Fehler beim Löschen der Maschine (Admin)', error);
    apiResponse.error(res, 'Fehler beim Löschen der Maschine', 500);
  }
});

// Admin: Alle Benutzer abrufen
adminRouter.get('/users', async (req, res) => {
  try {
    const users = await dbHelper.all(`
      SELECT id, username, role, created_at, last_login 
      FROM users 
      ORDER BY created_at DESC
    `);
    apiResponse.success(res, users);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Benutzer (Admin)', error);
    apiResponse.error(res, 'Fehler beim Abrufen der Benutzer', 500);
  }
});

// Admin: Neuen Benutzer erstellen
adminRouter.post('/users', validators.body({
  username: { required: true, type: 'string', validator: (value) => {
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      return 'Benutzername muss mindestens 3 Zeichen lang sein';
    }
    if (trimmed.length > 50) {
      return 'Benutzername darf maximal 50 Zeichen lang sein';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return 'Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten';
    }
    return true;
  }, normalize: commonValidators.normalizeString },
  password: { required: true, type: 'string', validator: (value) => {
    if (value.length < 6) {
      return 'Passwort muss mindestens 6 Zeichen lang sein';
    }
    return true;
  }},
  role: { required: true, type: 'string', validator: (value) => {
    if (value !== 'admin' && value !== 'user') {
      return 'Rolle muss "admin" oder "user" sein';
    }
    return true;
  }}
}), async (req, res) => {
  try {
    const { username, password, role } = req.validated;
    
    // Prüfe ob Benutzer bereits existiert
    const existingUser = await dbHelper.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      apiResponse.conflict(res, 'Ein Benutzer mit diesem Benutzernamen existiert bereits');
      return;
    }
    
    // Passwort hashen
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await dbHelper.run(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, role]
    );
    
    const user = await dbHelper.get(`
      SELECT id, username, role, created_at 
      FROM users 
      WHERE id = ?
    `, [result.lastID]);
    
    logger.info('Admin: Benutzer erstellt', {
      user_id: result.lastID,
      username,
      role,
      created_by: req.session.username
    });
    
    apiResponse.success(res, user, 201);
  } catch (error) {
    logger.error('Fehler beim Erstellen des Benutzers (Admin)', error);
    apiResponse.error(res, 'Fehler beim Erstellen des Benutzers', 500);
  }
});

// Admin: Benutzer aktualisieren
adminRouter.put('/users/:id', validators.params({
  id: { required: true, validator: commonValidators.integer }
}), validators.body({
  username: { required: false, type: 'string', validator: (value) => {
    if (value && value.trim().length < 3) {
      return 'Benutzername muss mindestens 3 Zeichen lang sein';
    }
    return true;
  }, normalize: (value) => value ? value.trim() : null },
  password: { required: false, type: 'string', validator: (value) => {
    if (value && value.length < 6) {
      return 'Passwort muss mindestens 6 Zeichen lang sein';
    }
    return true;
  }},
  role: { required: false, type: 'string', validator: (value) => {
    if (value && value !== 'admin' && value !== 'user') {
      return 'Rolle muss "admin" oder "user" sein';
    }
    return true;
  }}
}), async (req, res) => {
  try {
    const { id } = req.validated;
    const { username, password, role } = req.body;
    
    const user = await dbHelper.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      apiResponse.notFound(res, 'Benutzer');
      return;
    }
    
    // Verhindere, dass der letzte Admin seine Admin-Rolle verliert
    if (role && role !== 'admin' && user.role === 'admin') {
      const adminCount = await dbHelper.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
      if (adminCount && adminCount.count <= 1) {
        apiResponse.error(res, 'Der letzte Admin kann nicht zu einem normalen Benutzer gemacht werden', 409);
        return;
      }
    }
    
    let updateQuery = 'UPDATE users SET ';
    const updateParams = [];
    const updates = [];
    
    if (username) {
      // Prüfe ob neuer Username bereits existiert
      const existingUser = await dbHelper.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
      if (existingUser) {
        apiResponse.conflict(res, 'Ein Benutzer mit diesem Benutzernamen existiert bereits');
        return;
      }
      updates.push('username = ?');
      updateParams.push(username.trim());
    }
    
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      updateParams.push(passwordHash);
    }
    
    if (role) {
      updates.push('role = ?');
      updateParams.push(role);
    }
    
    if (updates.length === 0) {
      apiResponse.validationError(res, 'Mindestens ein Feld muss aktualisiert werden');
      return;
    }
    
    updateQuery += updates.join(', ') + ' WHERE id = ?';
    updateParams.push(id);
    
    await dbHelper.run(updateQuery, updateParams);
    
    const updatedUser = await dbHelper.get(`
      SELECT id, username, role, created_at, last_login 
      FROM users 
      WHERE id = ?
    `, [id]);
    
    logger.info('Admin: Benutzer aktualisiert', {
      user_id: id,
      updated_by: req.session.username
    });
    
    apiResponse.success(res, updatedUser);
  } catch (error) {
    logger.error('Fehler beim Aktualisieren des Benutzers (Admin)', error);
    apiResponse.error(res, 'Fehler beim Aktualisieren des Benutzers', 500);
  }
});

// Admin: Benutzer löschen
adminRouter.delete('/users/:id', validators.params({
  id: { required: true, validator: commonValidators.integer }
}), async (req, res) => {
  try {
    const { id } = req.validated;
    
    // Verhindere Selbst-Löschung
    if (parseInt(id) === req.session.userId) {
      apiResponse.error(res, 'Sie können sich nicht selbst löschen', 409);
      return;
    }
    
    const user = await dbHelper.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      apiResponse.notFound(res, 'Benutzer');
      return;
    }
    
    // Verhindere Löschung des letzten Admins
    if (user.role === 'admin') {
      const adminCount = await dbHelper.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
      if (adminCount && adminCount.count <= 1) {
        apiResponse.error(res, 'Der letzte Admin kann nicht gelöscht werden', 409);
        return;
      }
    }
    
    await dbHelper.run('DELETE FROM users WHERE id = ?', [id]);
    
    logger.info('Admin: Benutzer gelöscht', {
      user_id: id,
      deleted_by: req.session.username
    });
    
    apiResponse.success(res, { message: 'Benutzer erfolgreich gelöscht' });
  } catch (error) {
    logger.error('Fehler beim Löschen des Benutzers (Admin)', error);
    apiResponse.error(res, 'Fehler beim Löschen des Benutzers', 500);
  }
});

// ============================================================================
// API-VERSIONIERUNG REGISTRIERUNG
// ============================================================================

// Performance-Monitoring-Middleware aktivieren (VOR allen Routen)
// Wichtig: Muss vor API-Routen sein, damit alle Requests getrackt werden
app.use(performanceMonitoring);

// Admin-Router registrieren
app.use('/api/v1/admin', adminRouter);

// V1 API registrieren
app.use('/api/v1', apiV1);

// Statische Dateien (NACH API-Routen, damit API-Routen nicht von statischen Dateien abgefangen werden)
app.use(express.static('public'));

// Backward-Compatibility: Alte Endpunkte ohne Versionierung weiterhin unterstützen
// Diese werden in zukünftigen Versionen entfernt
// Redirect zu v1-Endpunkten
app.get('/api/slots', (req, res, next) => {
  logger.warn('Deprecated: /api/slots verwendet. Bitte verwenden Sie /api/v1/slots');
  req.url = '/api/v1/slots';
  next();
});

app.get('/api/machines', (req, res, next) => {
  logger.warn('Deprecated: /api/machines verwendet. Bitte verwenden Sie /api/v1/machines');
  req.url = '/api/v1/machines';
  next();
});

app.get('/api/bookings', (req, res, next) => {
  logger.warn('Deprecated: /api/bookings verwendet. Bitte verwenden Sie /api/v1/bookings');
  req.url = '/api/v1/bookings' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
  next();
});

app.post('/api/bookings', (req, res, next) => {
  logger.warn('Deprecated: POST /api/bookings verwendet. Bitte verwenden Sie POST /api/v1/bookings');
  req.url = '/api/v1/bookings';
  next();
});

app.delete('/api/bookings/:id', (req, res, next) => {
  logger.warn('Deprecated: DELETE /api/bookings/:id verwendet. Bitte verwenden Sie DELETE /api/v1/bookings/:id');
  req.url = `/api/v1/bookings/${req.params.id}`;
  next();
});

// ============================================================================
// ERROR-HANDLING & MIDDLEWARE
// ============================================================================

// Zentrale Error-Handling-Middleware für unerwartete Fehler
app.use((err, req, res, next) => {
  logger.error('Unerwarteter Fehler in Middleware', err, {
    method: req.method,
    path: req.path
  });
  apiResponse.error(res, 'Interner Serverfehler', 500);
});

// 404-Handler für unbekannte Routen
app.use((req, res) => {
  logger.warn('Endpoint nicht gefunden', {
    method: req.method,
    path: req.path
  });
  apiResponse.notFound(res, 'Endpoint');
});

// ============================================================================
// SERVER-START
// ============================================================================

// Server wird jetzt nach erfolgreicher Datenbank-Initialisierung gestartet
// Siehe createDatabaseConnection() Promise-Handler oben

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

/**
 * Graceful Shutdown-Handler
 * Behandelt SIGINT (Ctrl+C) und SIGTERM (z.B. von PM2, Docker)
 */
function gracefulShutdown(signal) {
  return () => {
    logger.info(`Signal ${signal} empfangen. Server wird heruntergefahren...`);
    isShuttingDown = true;
    
    // Warte auf laufende Requests (max. 30 Sekunden)
    const maxWaitTime = 30000;
    const startTime = Date.now();
    
    const checkAndShutdown = () => {
      const elapsed = Date.now() - startTime;
      
      if (activeRequests === 0 || elapsed >= maxWaitTime) {
        if (activeRequests > 0) {
          logger.warn(`${activeRequests} aktive Requests wurden abgebrochen`);
        }
        
        // Datenbank schließen
        if (db) {
          db.close((err) => {
            if (err) {
              logger.error('Fehler beim Schließen der Datenbankverbindung', err);
            } else {
              logger.info('Datenbankverbindung erfolgreich geschlossen');
            }
            
            // Alle Intervalle und Timeouts beenden
            logger.info('Server erfolgreich heruntergefahren');
            process.exit(0);
          });
        } else {
          logger.info('Server erfolgreich heruntergefahren (keine DB-Verbindung)');
          process.exit(0);
        }
      } else {
        logger.info(`Warte auf ${activeRequests} aktive Request(s)... (${Math.round(elapsed / 1000)}s)`);
        setTimeout(checkAndShutdown, 1000);
      }
    };
    
    checkAndShutdown();
  };
}

// Signal-Handler registrieren
process.on('SIGINT', gracefulShutdown('SIGINT'));
process.on('SIGTERM', gracefulShutdown('SIGTERM'));

// Unbehandelte Promise-Rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unbehandelte Promise-Rejection', reason, { promise });
});

// Unbehandelte Exceptions
process.on('uncaughtException', (error) => {
  logger.error('Unbehandelte Exception', error);
  // Graceful Shutdown auch bei unerwarteten Fehlern
  gracefulShutdown('uncaughtException')();
});


