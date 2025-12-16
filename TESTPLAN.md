# Testplan für WaschmaschinenApp

## Übersicht
Dieser Testplan beschreibt die Testschritte für die API-Endpunkte und die grundlegende Funktionalität der Anwendung.

---

## 1. Setup & Vorbereitung

### Testschritte:
1. **Server starten**
   - Terminal öffnen
   - `node server.js` ausführen
   - **Erwartetes Ergebnis:** Server läuft auf `http://localhost:3000`
   - **Erwartete Konsolenausgabe:** "CEO Copilot Server läuft auf http://localhost:3000" und "Datenbank verbunden."

2. **Datenbank prüfen**
   - Prüfen, ob `waschmaschine.db` erstellt wurde
   - **Erwartetes Ergebnis:** SQLite-Datenbankdatei existiert im Projektverzeichnis

---

## 2. API-Endpunkte: Aufgaben (Tasks)

### 2.1 GET /api/tasks - Alle Aufgaben abrufen

**Testschritte:**
1. GET-Request an `http://localhost:3000/api/tasks` senden
2. Response prüfen

**Erwartetes Ergebnis:**
- Status Code: 200
- Response: JSON-Array mit Aufgaben (kann leer sein `[]`)
- **RISIKO:** Endpunkt verwendet Tabelle `tasks`, die nicht im Schema erstellt wird!

### 2.2 POST /api/tasks - Neue Aufgabe erstellen

**Testschritte:**
1. POST-Request an `http://localhost:3000/api/tasks` senden
2. Body mit folgenden Feldern:
   ```json
   {
     "title": "Test-Aufgabe",
     "description": "Beschreibung",
     "priority": "high",
     "status": "pending",
     "due_date": "2024-12-31"
   }
   ```
3. Response prüfen

**Erwartetes Ergebnis:**
- Status Code: 200
- Response enthält: `id`, `title`, `description`, `priority`, `status`, `due_date`
- **RISIKO:** Tabelle `tasks` existiert möglicherweise nicht!

**Variationen testen:**
- Minimaler Request (nur `title`):
  ```json
  { "title": "Minimale Aufgabe" }
  ```
- Ohne optionale Felder (sollte Defaults verwenden)

### 2.3 PUT /api/tasks/:id - Aufgabe aktualisieren

**Testschritte:**
1. Zuerst eine Aufgabe erstellen (POST) und `id` notieren
2. PUT-Request an `http://localhost:3000/api/tasks/{id}` senden
3. Body mit aktualisierten Daten senden
4. Response prüfen

**Erwartetes Ergebnis:**
- Status Code: 200
- Response: `{ "message": "Aufgabe aktualisiert" }`
- GET-Request sollte aktualisierte Daten zurückgeben

**Fehlerfälle testen:**
- Ungültige ID (z.B. 99999)
- Fehlende Pflichtfelder

### 2.4 DELETE /api/tasks/:id - Aufgabe löschen

**Testschritte:**
1. Zuerst eine Aufgabe erstellen (POST) und `id` notieren
2. DELETE-Request an `http://localhost:3000/api/tasks/{id}` senden
3. Response prüfen
4. GET-Request ausführen, um zu prüfen, dass Aufgabe gelöscht wurde

**Erwartetes Ergebnis:**
- Status Code: 200
- Response: `{ "message": "Aufgabe gelöscht" }`
- GET-Request sollte die gelöschte Aufgabe nicht mehr enthalten

---

## 3. API-Endpunkte: Metriken (Metrics)

### 3.1 GET /api/metrics - Alle Metriken abrufen

**Testschritte:**
1. GET-Request an `http://localhost:3000/api/metrics` senden
2. Response prüfen

**Erwartetes Ergebnis:**
- Status Code: 200
- Response: JSON-Array mit Metriken (max. 20 Einträge, sortiert nach Datum DESC)
- **RISIKO:** Endpunkt verwendet Tabelle `metrics`, die nicht im Schema erstellt wird!

### 3.2 POST /api/metrics - Neue Metrik erstellen

**Testschritte:**
1. POST-Request an `http://localhost:3000/api/metrics` senden
2. Body:
   ```json
   {
     "name": "Wasserverbrauch",
     "value": 45.5,
     "target": 40.0,
     "unit": "Liter",
     "category": "Umwelt"
   }
   ```
3. Response prüfen

**Erwartetes Ergebnis:**
- Status Code: 200
- Response enthält: `id`, `name`, `value`, `target`, `unit`, `category`

---

## 4. API-Endpunkte: Notizen (Notes)

### 4.1 GET /api/notes - Alle Notizen abrufen

**Testschritte:**
1. GET-Request an `http://localhost:3000/api/notes` senden
2. Response prüfen

**Erwartetes Ergebnis:**
- Status Code: 200
- Response: JSON-Array mit Notizen (sortiert nach `updated_at` DESC)
- **RISIKO:** Endpunkt verwendet Tabelle `notes`, die nicht im Schema erstellt wird!

### 4.2 POST /api/notes - Neue Notiz erstellen

**Testschritte:**
1. POST-Request an `http://localhost:3000/api/notes` senden
2. Body:
   ```json
   {
     "title": "Meine Notiz",
     "content": "Inhalt der Notiz",
     "tags": "wichtig, todo"
   }
   ```
3. Response prüfen

**Erwartetes Ergebnis:**
- Status Code: 200
- Response enthält: `id`, `title`, `content`, `tags`

### 4.3 PUT /api/notes/:id - Notiz aktualisieren

**Testschritte:**
1. Notiz erstellen (POST) und `id` notieren
2. PUT-Request an `http://localhost:3000/api/notes/{id}` senden
3. Aktualisierte Daten senden
4. Prüfen, dass `updated_at` aktualisiert wurde

**Erwartetes Ergebnis:**
- Status Code: 200
- Response: `{ "message": "Notiz aktualisiert" }`

### 4.4 DELETE /api/notes/:id - Notiz löschen

**Testschritte:**
1. Notiz erstellen (POST) und `id` notieren
2. DELETE-Request an `http://localhost:3000/api/notes/{id}` senden
3. Prüfen, dass Notiz gelöscht wurde

**Erwartetes Ergebnis:**
- Status Code: 200
- Response: `{ "message": "Notiz gelöscht" }`

---

## 5. API-Endpunkte: Entscheidungen (Decisions)

### 5.1 GET /api/decisions - Alle Entscheidungen abrufen

**Testschritte:**
1. GET-Request an `http://localhost:3000/api/decisions` senden
2. Response prüfen

**Erwartetes Ergebnis:**
- Status Code: 200
- Response: JSON-Array mit Entscheidungen (sortiert nach `created_at` DESC)
- **RISIKO:** Endpunkt verwendet Tabelle `decisions`, die nicht im Schema erstellt wird!

### 5.2 POST /api/decisions - Neue Entscheidung erstellen

**Testschritte:**
1. POST-Request an `http://localhost:3000/api/decisions` senden
2. Body:
   ```json
   {
     "title": "Entscheidung XYZ",
     "description": "Beschreibung",
     "status": "pending",
     "impact": "hoch"
   }
   ```
3. Response prüfen

**Erwartetes Ergebnis:**
- Status Code: 200
- Response enthält: `id`, `title`, `description`, `status`, `impact`

### 5.3 PUT /api/decisions/:id - Entscheidung aktualisieren

**Testschritte:**
1. Entscheidung erstellen (POST) und `id` notieren
2. PUT-Request an `http://localhost:3000/api/decisions/{id}` senden
3. Aktualisierte Daten senden

**Erwartetes Ergebnis:**
- Status Code: 200
- Response: `{ "message": "Entscheidung aktualisiert" }`

---

## 6. Dashboard-Statistiken

### 6.1 GET /api/dashboard - Dashboard-Daten abrufen

**Testschritte:**
1. GET-Request an `http://localhost:3000/api/dashboard` senden
2. Response prüfen

**Erwartetes Ergebnis:**
- Status Code: 200
- Response enthält:
  - `pendingTasks`: Anzahl ausstehender Aufgaben
  - `completedTasks`: Anzahl erledigter Aufgaben
  - `pendingDecisions`: Anzahl ausstehender Entscheidungen
  - `totalNotes`: Gesamtanzahl Notizen
- **RISIKO:** Verwendet Tabellen, die möglicherweise nicht existieren!

---

## 7. Fehlerbehandlung

### 7.1 Ungültige Endpunkte

**Testschritte:**
1. GET-Request an `http://localhost:3000/api/ungueltig` senden

**Erwartetes Ergebnis:**
- Status Code: 404 (Not Found)

### 7.2 Ungültige Daten

**Testschritte:**
1. POST-Request mit fehlenden Pflichtfeldern senden
2. POST-Request mit ungültigen Datentypen senden

**Erwartetes Ergebnis:**
- Status Code: 500 (Internal Server Error) oder 400 (Bad Request)
- Fehlermeldung im Response

### 7.3 Datenbankfehler simulieren

**Testschritte:**
1. Datenbankdatei löschen oder beschädigen
2. API-Request senden

**Erwartetes Ergebnis:**
- Status Code: 500
- Fehlermeldung im Response

---

## 8. CORS & Middleware

### 8.1 CORS-Prüfung

**Testschritte:**
1. Request von anderem Origin senden (z.B. Browser-Konsole)
2. Response-Header prüfen

**Erwartetes Ergebnis:**
- CORS-Header vorhanden
- Request erfolgreich

### 8.2 JSON-Parsing

**Testschritte:**
1. POST-Request mit gültigem JSON senden
2. POST-Request mit ungültigem JSON senden

**Erwartetes Ergebnis:**
- Gültiges JSON wird verarbeitet
- Ungültiges JSON führt zu Fehler

---

## 9. Server-Shutdown

### 9.1 Graceful Shutdown

**Testschritte:**
1. Server läuft
2. `Ctrl+C` drücken (SIGINT)
3. Konsolenausgabe prüfen

**Erwartetes Ergebnis:**
- Konsolenausgabe: "Datenbankverbindung geschlossen."
- Server beendet sich sauber

---

## Test-Tools

### Empfohlene Tools:
- **Postman** oder **Insomnia** für API-Tests
- **curl** für Kommandozeilen-Tests
- **Browser-Entwicklertools** für Frontend-Tests (wenn vorhanden)

### Beispiel curl-Befehle:

```bash
# GET alle Aufgaben
curl http://localhost:3000/api/tasks

# POST neue Aufgabe
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","priority":"high"}'

# PUT Aufgabe aktualisieren
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Geändert","priority":"low","status":"completed"}'

# DELETE Aufgabe
curl -X DELETE http://localhost:3000/api/tasks/1
```

---

## Bekannte Probleme & Risiken

⚠️ **KRITISCH:** Die Datenbank-Schema-Initialisierung erstellt Tabellen (`wash_cycles`, `wash_programs`, `statistics`), die von keinem API-Endpunkt verwendet werden.

⚠️ **KRITISCH:** Die API-Endpunkte verwenden Tabellen (`tasks`, `metrics`, `notes`, `decisions`), die nie im Schema erstellt werden!

⚠️ **WARNUNG:** Kein Frontend vorhanden - UI-Verhalten kann nicht getestet werden.

⚠️ **WARNUNG:** Inkonsistenz zwischen Projektname "WaschmaschinenApp" und tatsächlichem Code (CEO Copilot / Task-Management).

