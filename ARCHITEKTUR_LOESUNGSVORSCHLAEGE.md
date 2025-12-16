# 🔧 Architektur-Lösungsvorschläge - Detaillierte Implementierung

**Erstellt am:** [Aktuelles Datum]  
**Erstellt von:** Senior Product Architect  
**Status:** Konkrete Lösungsvorschläge mit Code-Beispielen

---

## 📋 Übersicht

Dieses Dokument enthält **detaillierte, umsetzbare Lösungsvorschläge** für die identifizierten Architektur-Probleme mit vollständigen Code-Beispielen.

---

## 🔴 PROBLEM 1: API-Versionierung - Inkonsistente Monitoring-Endpunkte

### Problem-Beschreibung

**Aktueller Zustand:**
- Monitoring-Endpunkte verwenden unterschiedliche Versionierung:
  - `/api/monitoring/metrics` (ohne Versionierung) - Zeile 1870
  - `/api/monitoring/health` (ohne Versionierung) - Zeile 1954
  - `/api/v1/monitoring/events` (mit Versionierung) - Zeile 2049
- Frontend verwendet `/api/monitoring` in `monitoring-dashboard.js:6`

**Auswirkung:**
- Inkonsistente API-Struktur
- Monitoring-Dashboard könnte bei API-Änderungen brechen
- Verwirrung über korrekte Endpunkte

---

### Lösung: Monitoring-Endpunkte auf `/api/v1/monitoring` umstellen

#### Schritt 1: Backend-Endpunkte verschieben

**Datei:** `server.js`

**Aktueller Code (Zeile 1870-1949):**
```javascript
app.get('/api/monitoring/metrics', async (req, res) => {
  // ... Metriken-Logik ...
});
```

**Neuer Code:**
```javascript
// In apiV1 Router verschieben (nach Zeile 1637, nach /health)
apiV1.get('/monitoring/metrics', async (req, res) => {
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
        slowRequests: metrics.performance.slowRequests.slice(-10)
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
```

**Aktueller Code (Zeile 1954-2044):**
```javascript
app.get('/api/monitoring/health', async (req, res) => {
  // ... Health-Check-Logik ...
});
```

**Neuer Code:**
```javascript
// In apiV1 Router verschieben (nach /monitoring/metrics)
apiV1.get('/monitoring/health', async (req, res) => {
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
    
    if (metrics.system.memory.current > 500) {
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
```

#### Schritt 2: Alte Endpunkte als Deprecated markieren (Backward-Compatibility)

**Datei:** `server.js` (nach Zeile 3403, bei den anderen deprecated Endpunkten)

**Code hinzufügen:**
```javascript
// Deprecated: Monitoring-Endpunkte ohne Versionierung
app.get('/api/monitoring/metrics', (req, res, next) => {
  logger.warn('Deprecated: /api/monitoring/metrics verwendet. Bitte verwenden Sie /api/v1/monitoring/metrics');
  req.url = '/api/v1/monitoring/metrics';
  next();
});

app.get('/api/monitoring/health', (req, res, next) => {
  logger.warn('Deprecated: /api/monitoring/health verwendet. Bitte verwenden Sie /api/v1/monitoring/health');
  req.url = '/api/v1/monitoring/health';
  next();
});
```

#### Schritt 3: Frontend aktualisieren

**Datei:** `public/js/monitoring-dashboard.js:6`

**Aktueller Code:**
```javascript
const API_BASE = '/api/monitoring';
```

**Neuer Code:**
```javascript
const API_BASE = '/api/v1/monitoring';
```

---

### Abnahmekriterien

- ✅ Neue Endpunkte funktionieren: `/api/v1/monitoring/metrics` und `/api/v1/monitoring/health`
- ✅ Alte Endpunkte funktionieren weiterhin (mit Deprecation-Warnung)
- ✅ Frontend verwendet neue Endpunkte
- ✅ Keine Breaking Changes für bestehende Clients

---

## 🔴 PROBLEM 2: Middleware-Reihenfolge - Performance-Monitoring

### Problem-Beschreibung

**Aktueller Zustand:**
- Performance-Monitoring wird auf Zeile 3364 aktiviert
- Router werden auf Zeile 3367-3370 registriert
- **Status:** ✅ **KORREKT** - Middleware wird vor Router-Registrierung aktiviert

**Hinweis:** Das Problem wurde bereits behoben. Die Reihenfolge ist korrekt:
1. Performance-Monitoring aktiviert (Zeile 3364)
2. Router registriert (Zeile 3367-3370)

**Keine Änderung erforderlich.**

---

## 🔴 PROBLEM 3: Session-Speicherung - FileStore-Konfiguration

### Problem-Beschreibung

**Aktueller Zustand:**
- Session-Pfad ist hardcodiert: `path.join(__dirname, 'sessions')`
- Nicht konfigurierbar über Environment-Variable
- Keine automatische Bereinigung alter Sessions

**Auswirkung:**
- Session-Dateien werden im Projekt-Verzeichnis gespeichert
- Bei Deployment könnten Sessions verloren gehen
- Alte Sessions werden nicht automatisch gelöscht

---

### Lösung: Session-Speicherung optimieren

#### Schritt 1: Session-Pfad konfigurierbar machen

**Datei:** `server.js:153-162`

**Aktueller Code:**
```javascript
const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!existsSync(SESSIONS_DIR)) {
  fs.mkdir(SESSIONS_DIR, { recursive: true }).catch(err => {
    logger.error('Fehler beim Erstellen des Sessions-Verzeichnisses', err);
  });
}
```

**Neuer Code:**
```javascript
// Session-Verzeichnis konfigurierbar über Environment-Variable
const SESSIONS_DIR = process.env.SESSIONS_DIR || path.join(__dirname, 'sessions');

// Verzeichnis erstellen falls nicht vorhanden
if (!existsSync(SESSIONS_DIR)) {
  fs.mkdir(SESSIONS_DIR, { recursive: true }).catch(err => {
    logger.error('Fehler beim Erstellen des Sessions-Verzeichnisses', err);
  });
}

logger.info('Session-Verzeichnis konfiguriert', { path: SESSIONS_DIR });
```

#### Schritt 2: Automatische Bereinigung alter Sessions

**Datei:** `server.js:160-177`

**Aktueller Code:**
```javascript
app.use(session({
  store: new FileStore({
    path: SESSIONS_DIR,
    ttl: 86400, // 24 Stunden in Sekunden
    retries: 1,
    logFn: (message) => {
      logger.debug(`Session-File-Store: ${message}`);
    }
  }),
  // ...
}));
```

**Neuer Code:**
```javascript
// Session-Store mit automatischer Bereinigung
const sessionStore = new FileStore({
  path: SESSIONS_DIR,
  ttl: 86400, // 24 Stunden in Sekunden
  retries: 1,
  // Automatische Bereinigung: Alle 6 Stunden
  reapInterval: 6 * 60 * 60 * 1000, // 6 Stunden in Millisekunden
  logFn: (message) => {
    logger.debug(`Session-File-Store: ${message}`);
  }
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'waschmaschine-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS in Produktion
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
  }
}));

// Manuelle Bereinigung alter Sessions beim Start (optional)
setInterval(async () => {
  try {
    const files = await fs.readdir(SESSIONS_DIR);
    const now = Date.now();
    let cleaned = 0;
    
    for (const file of files) {
      if (file.startsWith('sess_')) {
        const filePath = path.join(SESSIONS_DIR, file);
        const stats = await fs.stat(filePath);
        // Lösche Sessions älter als 48 Stunden (2x TTL)
        if (now - stats.mtime.getTime() > 48 * 60 * 60 * 1000) {
          await fs.unlink(filePath);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Session-Bereinigung: ${cleaned} alte Sessions gelöscht`);
    }
  } catch (error) {
    logger.error('Fehler bei Session-Bereinigung', error);
  }
}, 24 * 60 * 60 * 1000); // Alle 24 Stunden
```

#### Schritt 3: Environment-Variable dokumentieren

**Datei:** `README.md` oder `.env.example` (neu erstellen)

**Hinzufügen:**
```bash
# Session-Verzeichnis (optional)
# Standard: ./sessions
SESSIONS_DIR=./sessions

# Session-Secret (ERFORDERLICH in Produktion)
SESSION_SECRET=your-secret-key-here
```

---

### Abnahmekriterien

- ✅ Session-Pfad ist über Environment-Variable konfigurierbar
- ✅ Alte Sessions werden automatisch bereinigt
- ✅ Dokumentation vorhanden
- ✅ Keine Breaking Changes

---

## 🔴 PROBLEM 4: Code-Organisation - Monolithische Dateien

### Problem-Beschreibung

**Aktueller Zustand:**
- `server.js` hat über 3500 Zeilen
- Alle Backend-Logik in einer Datei
- Schwer zu warten und zu testen

**Auswirkung:**
- Schwer zu navigieren
- Merge-Konflikte wahrscheinlicher
- Schwerer zu testen

---

### Lösung: Code-Modularisierung (Langfristig)

#### Schritt 1: Verzeichnisstruktur erstellen

**Neue Struktur:**
```
server.js (nur Setup und Middleware)
├── routes/
│   ├── api.js (API-Routen)
│   ├── admin.js (Admin-Routen)
│   └── monitoring.js (Monitoring-Routen)
├── middleware/
│   ├── auth.js (Authentifizierung)
│   ├── validation.js (Validierung)
│   └── performance.js (Performance-Monitoring)
├── db/
│   ├── connection.js (Datenbank-Verbindung)
│   ├── helpers.js (DB-Helper)
│   └── repositories/
│       ├── MachineRepository.js
│       ├── BookingRepository.js
│       └── UserRepository.js
├── utils/
│   ├── logger.js (Logging)
│   ├── validators.js (Validierungs-Funktionen)
│   └── metrics.js (Metriken)
└── config/
    └── session.js (Session-Konfiguration)
```

#### Schritt 2: Beispiel-Modul: `routes/monitoring.js`

**Datei:** `routes/monitoring.js` (NEU)

```javascript
const express = require('express');
const router = express.Router();
const { updateSystemMetrics, metrics, calculateAverage, calculatePercentiles, formatUptime } = require('../utils/metrics');
const { apiResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * GET /monitoring/metrics
 * Gibt alle gesammelten Metriken zurück
 */
router.get('/metrics', async (req, res) => {
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
        slowRequests: metrics.performance.slowRequests.slice(-10)
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
 * GET /monitoring/health
 * Erweiterter Health-Check mit Metriken
 */
router.get('/health', async (req, res) => {
  try {
    updateSystemMetrics();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      uptimeFormatted: formatUptime(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: require('../../package.json').version
    };
    
    // Datenbank-Health-Check
    const dbHelper = require('../db/helpers');
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
    
    // Warnungen
    const warnings = [];
    if (metrics.requests.errors > 0 && metrics.requests.total > 100) {
      const errorRate = (metrics.requests.errors / metrics.requests.total) * 100;
      if (errorRate > 5) {
        warnings.push(`Hohe Fehlerrate: ${errorRate.toFixed(2)}%`);
        health.status = 'degraded';
      }
    }
    
    if (metrics.system.memory.current > 500) {
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

module.exports = router;
```

#### Schritt 3: `server.js` vereinfachen

**Datei:** `server.js` (vereinfacht)

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');

// Middleware importieren
const { setupMiddleware } = require('./middleware/setup');
const { performanceMonitoring } = require('./middleware/performance');
const { requireAuth, requireAdmin } = require('./middleware/auth');

// Router importieren
const apiV1Router = require('./routes/api');
const adminRouter = require('./routes/admin');
const monitoringRouter = require('./routes/monitoring');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware einrichten
setupMiddleware(app);

// Performance-Monitoring (vor allen Routen)
app.use(performanceMonitoring);

// API-Router registrieren
app.use('/api/v1', apiV1Router);
app.use('/api/v1/admin', requireAuth, requireAdmin, adminRouter);
app.use('/api/v1/monitoring', monitoringRouter);

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
```

**Hinweis:** Dies ist eine **langfristige Refaktorierung** und sollte schrittweise erfolgen.

---

### Abnahmekriterien

- ✅ Code ist in Module aufgeteilt
- ✅ Jedes Modul hat eine klare Verantwortlichkeit
- ✅ Tests funktionieren weiterhin
- ✅ Keine Breaking Changes für API

---

## 🔴 PROBLEM 5: Fehlende Abstraktion - Datenbank-Helper

### Problem-Beschreibung

**Aktueller Zustand:**
- `dbHelper` existiert, aber direkte SQL-Queries in Endpunkten
- Keine Repository-Pattern
- SQL-Logik überall verteilt

---

### Lösung: Repository-Pattern einführen

#### Schritt 1: Beispiel-Repository: `db/repositories/BookingRepository.js`

**Datei:** `db/repositories/BookingRepository.js` (NEU)

```javascript
const dbHelper = require('../helpers');
const logger = require('../../utils/logger');

class BookingRepository {
  /**
   * Findet alle Buchungen für ein Datum
   * @param {string} date - Datum im Format YYYY-MM-DD
   * @returns {Promise<Array>} Array von Buchungen
   */
  async findByDate(date) {
    return await dbHelper.all(`
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
    `, [date]);
  }
  
  /**
   * Findet alle Buchungen für eine Woche
   * @param {string} startDate - Startdatum (Montag)
   * @param {string} endDate - Enddatum (Freitag)
   * @returns {Promise<Array>} Array von Buchungen
   */
  async findByDateRange(startDate, endDate) {
    return await dbHelper.all(`
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
    `, [startDate, endDate]);
  }
  
  /**
   * Findet eine Buchung nach ID
   * @param {number} id - Buchungs-ID
   * @returns {Promise<Object|null>} Buchung oder null
   */
  async findById(id) {
    return await dbHelper.get(`
      SELECT 
        b.*,
        m.name as machine_name,
        m.type as machine_type
      FROM bookings b
      INNER JOIN machines m ON b.machine_id = m.id
      WHERE b.id = ?
    `, [id]);
  }
  
  /**
   * Erstellt eine neue Buchung
   * @param {Object} booking - Buchungsdaten
   * @returns {Promise<Object>} Erstellte Buchung
   */
  async create(booking) {
    const result = await dbHelper.run(
      'INSERT INTO bookings (machine_id, date, slot, user_name) VALUES (?, ?, ?, ?)',
      [booking.machine_id, booking.date, booking.slot, booking.user_name]
    );
    
    return await this.findById(result.lastID);
  }
  
  /**
   * Löscht eine Buchung
   * @param {number} id - Buchungs-ID
   * @returns {Promise<boolean>} true wenn gelöscht
   */
  async delete(id) {
    const result = await dbHelper.run('DELETE FROM bookings WHERE id = ?', [id]);
    return result.changes > 0;
  }
  
  /**
   * Prüft ob Buchung existiert (für Doppelbuchung-Check)
   * @param {number} machineId - Maschinen-ID
   * @param {string} date - Datum
   * @param {string} slot - Slot
   * @returns {Promise<boolean>} true wenn existiert
   */
  async exists(machineId, date, slot) {
    const booking = await dbHelper.get(
      'SELECT id FROM bookings WHERE machine_id = ? AND date = ? AND slot = ?',
      [machineId, date, slot]
    );
    return !!booking;
  }
}

module.exports = new BookingRepository();
```

#### Schritt 2: Endpunkt vereinfachen

**Datei:** `routes/api.js` (Beispiel)

**Aktueller Code:**
```javascript
apiV1.get('/bookings', async (req, res) => {
  // Direkte SQL-Query hier
  const bookings = await dbHelper.all(`SELECT ...`, [...]);
});
```

**Neuer Code:**
```javascript
const bookingRepository = require('../db/repositories/BookingRepository');

apiV1.get('/bookings', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      apiResponse.validationError(res, 'Datum-Parameter ist erforderlich');
      return;
    }
    
    const bookings = await bookingRepository.findByDate(date);
    apiResponse.success(res, bookings);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Buchungen', error);
    apiResponse.error(res, 'Fehler beim Abrufen der Buchungen', 500);
  }
});
```

---

### Abnahmekriterien

- ✅ Alle Datenbank-Zugriffe über Repositories
- ✅ Keine direkten SQL-Queries in Endpunkten
- ✅ Repositories sind testbar (Mock-fähig)
- ✅ Code-Duplikation reduziert

---

## 📋 Implementierungs-Priorisierung

### Sofort (diese Woche):
1. ✅ **Problem 1:** API-Versionierung vereinheitlichen (1-2 Stunden)
2. ✅ **Problem 3:** Session-Speicherung optimieren (1-2 Stunden)

### Nächste Woche:
3. ✅ **Problem 4:** Code-Modularisierung beginnen (schrittweise)

### Langfristig (1-2 Monate):
4. ✅ **Problem 5:** Repository-Pattern einführen (schrittweise)

---

## ✅ Checkliste

### Junior Backend Entwickler:
- [ ] Problem 1: Monitoring-Endpunkte auf `/api/v1/monitoring` umstellen
- [ ] Problem 3: Session-Speicherung optimieren

### Senior Fullstack Developer:
- [ ] Problem 4: Code-Modularisierung (langfristig)
- [ ] Problem 5: Repository-Pattern (langfristig)

---

*Erstellt am: [Datum]*  
*Zuletzt aktualisiert: [Datum]*





