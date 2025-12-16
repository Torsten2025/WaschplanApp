# Monitoring-Dashboard Dokumentation

## Übersicht

Das Monitoring-Dashboard bietet eine umfassende Übersicht über die Performance und Gesundheit der Waschmaschinen-App.

**URL:** `http://localhost:3000/monitoring.html`

## Features

### 1. System-Status
- **Status-Anzeige:** Gesund / Beeinträchtigt / Fehler
- **Uptime:** Server-Laufzeit
- **Gesamt Requests:** Anzahl aller Requests seit Start
- **Fehlerrate:** Prozentuale Fehlerrate mit visueller Anzeige
- **Durchschnittliche Antwortzeit:** Mit P50, P95, P99 Perzentilen
- **Speicherverbrauch:** Aktueller und Peak-Verbrauch mit Progress-Bar

### 2. Request-Statistiken
- **Nach Methode:** GET, POST, DELETE Aufteilung
- **Nach Status:** 2xx, 3xx, 4xx, 5xx Aufteilung
- **Top 10 Endpoints:** Meist genutzte Endpoints mit Statistiken

### 3. Datenbank-Performance
- **Gesamt Queries:** Anzahl aller Datenbankabfragen
- **Fehlerrate:** Prozentuale Fehlerrate
- **Langsame Queries:** Anzahl und Rate von Queries > 100ms
- **Durchschnittliche Query-Zeit:** Mit P50, P95 Perzentilen

### 4. API-Statistiken
- **Buchungen:** Erstellt, gelöscht, Fehler
- **Authentifizierung:** Logins, Logouts, Fehler

### 5. Letzte Stunde
- **Requests:** Anzahl in der letzten Stunde
- **Fehler:** Anzahl und Rate
- **Durchschnittliche Antwortzeit**

### 6. Langsame Requests
- **Tabelle:** Alle Requests > 1000ms
- **Details:** Zeitpunkt, Methode, Endpoint, Status, Dauer

## Auto-Refresh

Das Dashboard unterstützt automatische Aktualisierung:

- **Toggle:** Auto-Refresh ein/aus
- **Interval:** 5 Sekunden, 10 Sekunden, 30 Sekunden, 1 Minute
- **Manuell:** Refresh-Button für sofortige Aktualisierung

## Status-Indikatoren

### System-Status
- 🟢 **Gesund:** Fehlerrate < 5%, Antwortzeit < 1000ms, Speicher < 80%
- 🟡 **Beeinträchtigt:** Fehlerrate 5-10%, Antwortzeit 1000-2000ms, Speicher 80-90%
- 🔴 **Fehler:** Fehlerrate > 10%, Antwortzeit > 2000ms, Speicher > 90%

### Progress-Bars
- **Grün:** Normal
- **Gelb:** Warnung
- **Rot:** Kritisch

## API-Endpunkt

**GET** `/api/monitoring/metrics`

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "requests": {
      "total": 1000,
      "byMethod": { "GET": 800, "POST": 150, "DELETE": 50 },
      "byStatus": { "200": 950, "400": 30, "500": 20 },
      "errors": 50,
      "errorRate": "5.00%",
      "topEndpoints": [...]
    },
    "performance": {
      "responseTime": {
        "avg": 50,
        "min": 10,
        "max": 500,
        "percentiles": { "p50": 45, "p95": 200, "p99": 400 }
      },
      "dbQueryTime": {...},
      "slowRequests": [...]
    },
    "system": {...},
    "database": {...},
    "api": {...},
    "lastHour": {...},
    "uptime": {...}
  }
}
```

## Verwendung

1. **Dashboard öffnen:** `http://localhost:3000/monitoring.html`
2. **Auto-Refresh aktivieren:** Checkbox aktivieren
3. **Interval wählen:** Dropdown-Menü
4. **Manuell aktualisieren:** Refresh-Button klicken

## Navigation

Das Dashboard ist über die Navigation in allen Bereichen erreichbar:
- **Buchungen:** `/`
- **Admin:** `/admin.html`
- **Monitoring:** `/monitoring.html`

## Technische Details

- **Framework:** Vanilla JavaScript
- **Styling:** CSS mit Grid-Layout
- **API:** RESTful Endpoint
- **Auto-Refresh:** setInterval-basiert
- **Error-Handling:** Try-Catch mit visueller Fehleranzeige

## Erweiterungen

Mögliche zukünftige Erweiterungen:
- Grafische Charts (Chart.js, D3.js)
- Historische Daten
- Alerts/Notifications
- Export-Funktion
- Filterung nach Zeitraum

