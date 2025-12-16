# Manuelle Test-Suite - WaschmaschinenApp

## Übersicht
Diese Test-Suite enthält alle manuellen Test-Cases für die Waschmaschinen-Buchungsapp. Jeder Test-Case beschreibt die Schritte, erwartete Ergebnisse und mögliche Probleme.

**Test-Datum:** _______________  
**Tester:** _______________  
**Browser:** _______________  
**Version:** 1.0.0

---

## Test-Kategorien

1. [Setup & Installation](#1-setup--installation)
2. [API-Endpunkte](#2-api-endpunkte)
3. [Frontend-Funktionalität](#3-frontend-funktionalität)
4. [Fehlerbehandlung](#4-fehlerbehandlung)
5. [Browser-Kompatibilität](#5-browser-kompatibilität)
6. [Performance & Usability](#6-performance--usability)

---

## 1. Setup & Installation

### TC-001: Server starten

**Priorität:** 🔴 Hoch  
**Kategorie:** Setup

**Voraussetzungen:**
- Node.js installiert (Version 14+)
- npm installiert
- Projekt-Abhängigkeiten installiert (`npm install`)

**Testschritte:**
1. Terminal/PowerShell im Projektverzeichnis öffnen
2. Befehl `npm start` oder `node server.js` ausführen
3. Konsolenausgabe beobachten

**Erwartetes Ergebnis:**
- ✅ Server startet ohne Fehler
- ✅ Konsolenausgabe: "Waschmaschinen-Buchungsapp Server läuft auf http://localhost:3000"
- ✅ Konsolenausgabe: "Datenbank verbunden."
- ✅ Server läuft auf Port 3000

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-002: Datenbank-Initialisierung

**Priorität:** 🔴 Hoch  
**Kategorie:** Setup

**Voraussetzungen:**
- Server läuft

**Testschritte:**
1. Prüfen, ob Datei `waschmaschine.db` im Projektverzeichnis erstellt wurde
2. Prüfen, ob Konsolenausgabe "Maschine eingefügt: ..." für Seed-Daten erscheint

**Erwartetes Ergebnis:**
- ✅ Datenbankdatei `waschmaschine.db` existiert
- ✅ Seed-Daten wurden eingefügt (4 Maschinen: 3 Waschmaschinen, 1 Trocknungsraum)
- ✅ Tabellen `machines` und `bookings` wurden erstellt

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-003: Frontend-Zugriff

**Priorität:** 🔴 Hoch  
**Kategorie:** Setup

**Voraussetzungen:**
- Server läuft

**Testschritte:**
1. Browser öffnen
2. URL `http://localhost:3000` aufrufen
3. Seite prüfen

**Erwartetes Ergebnis:**
- ✅ Seite lädt ohne Fehler
- ✅ Keine 404-Fehler in der Browser-Konsole
- ✅ UI-Elemente sind sichtbar (Kalender, Maschinen-Liste, etc.)

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

## 2. API-Endpunkte

### TC-101: GET /api/machines - Maschinen abrufen

**Priorität:** 🔴 Hoch  
**Kategorie:** API

**Voraussetzungen:**
- Server läuft

**Testschritte:**
1. GET-Request an `http://localhost:3000/api/machines` senden
   - Mit Browser: URL direkt aufrufen
   - Mit curl: `curl http://localhost:3000/api/machines`
   - Mit Postman: GET-Request erstellen
2. Response prüfen

**Erwartetes Ergebnis:**
- ✅ Status Code: 200
- ✅ Content-Type: application/json
- ✅ Response hat Struktur: `{ "success": true, "data": [...] }`
- ✅ `data` ist ein Array mit mindestens 4 Maschinen (Seed-Daten)
- ✅ Jede Maschine hat Felder: `id`, `name`, `type`
- ✅ Maschinen sind sortiert nach `id` (ORDER BY id)

**Beispiel-Response:**
```json
[
  {"id": 1, "name": "Waschmaschine 1", "type": "washer"},
  {"id": 2, "name": "Waschmaschine 2", "type": "washer"},
  {"id": 3, "name": "Waschmaschine 3", "type": "washer"},
  {"id": 4, "name": "Trocknungsraum 1", "type": "dryer"}
]
```

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-102: GET /api/slots - Zeit-Slots abrufen

**Priorität:** 🔴 Hoch  
**Kategorie:** API

**Voraussetzungen:**
- Server läuft

**Testschritte:**
1. GET-Request an `http://localhost:3000/api/slots` senden
2. Response prüfen

**Erwartetes Ergebnis:**
- ✅ Status Code: 200
- ✅ Response hat Struktur: `{ "success": true, "data": [...] }`
- ✅ `data` ist ein Array mit genau 6 Slots
- ✅ Jeder Slot hat Felder: `start`, `end`, `label`
- ✅ Slots: 08:00-10:00, 10:00-12:00, 12:00-14:00, 14:00-16:00, 16:00-18:00, 18:00-20:00

**Beispiel-Response:**
```json
[
  {"start": "08:00", "end": "10:00", "label": "08:00-10:00"},
  {"start": "10:00", "end": "12:00", "label": "10:00-12:00"},
  ...
]
```

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-103: GET /api/bookings - Buchungen abrufen (ohne Datum)

**Priorität:** 🔴 Hoch  
**Kategorie:** API - Fehlerbehandlung

**Voraussetzungen:**
- Server läuft

**Testschritte:**
1. GET-Request an `http://localhost:3000/api/bookings` senden (ohne `date` Parameter)

**Erwartetes Ergebnis:**
- ✅ Status Code: 400 (Bad Request)
- ✅ Response hat Struktur: `{ "success": false, "error": "...", "type": "validation_error" }`
- ✅ Response enthält Fehlermeldung: "Datum-Parameter (date) ist erforderlich. Format: YYYY-MM-DD"

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-104: GET /api/bookings - Buchungen abrufen (mit gültigem Datum)

**Priorität:** 🔴 Hoch  
**Kategorie:** API

**Voraussetzungen:**
- Server läuft
- Heutiges oder zukünftiges Datum verwenden (Format: YYYY-MM-DD)

**Testschritte:**
1. GET-Request an `http://localhost:3000/api/bookings?date=2024-12-31` senden
   - Datum durch heutiges Datum ersetzen
2. Response prüfen

**Erwartetes Ergebnis:**
- ✅ Status Code: 200
- ✅ Response hat Struktur: `{ "success": true, "data": [...] }`
- ✅ `data` ist ein JSON-Array (kann leer sein `[]`)
- ✅ Wenn Buchungen vorhanden, enthalten sie Felder: `id`, `machine_id`, `date`, `slot`, `user_name`, `machine_name`, `machine_type`
- ✅ Buchungen sind sortiert nach `slot` und `machine_name`

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-105: GET /api/bookings - Buchungen abrufen (ungültiges Datum)

**Priorität:** 🟡 Mittel  
**Kategorie:** API - Validierung

**Testschritte:**
1. GET-Request mit ungültigem Datum senden:
   - `?date=2024-13-45` (ungültiges Datum)
   - `?date=2023-01-01` (Vergangenheit)
   - `?date=invalid` (kein Datum)
   - `?date=2024-02-30` (ungültiger Tag)

**Erwartetes Ergebnis:**
- ✅ Status Code: 400 (Bad Request)
- ✅ Response hat Struktur: `{ "success": false, "error": "...", "type": "validation_error" }`
- ✅ Fehlermeldung: "Ungültiges Datum. Format: YYYY-MM-DD, Datum muss gültig sein und darf nicht in der Vergangenheit liegen."

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-106: POST /api/bookings - Buchung erstellen (erfolgreich)

**Priorität:** 🔴 Hoch  
**Kategorie:** API

**Voraussetzungen:**
- Server läuft
- Maschine mit ID 1 existiert (aus Seed-Daten)

**Testschritte:**
1. POST-Request an `http://localhost:3000/api/bookings` senden
2. Request Body:
```json
{
  "machine_id": 1,
  "date": "2024-12-31",
  "slot": "08:00-10:00",
  "user_name": "Test-Benutzer"
}
```
3. Datum durch heutiges oder zukünftiges Datum ersetzen
4. Response prüfen

**Erwartetes Ergebnis:**
- ✅ Status Code: 201 (Created)
- ✅ Response hat Struktur: `{ "success": true, "data": { ... } }`
- ✅ `data` enthält erstellte Buchung mit allen Feldern
- ✅ Response enthält `machine_name` und `machine_type` (JOIN)
- ✅ Buchung wurde in Datenbank gespeichert (mit GET prüfen)

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-107: POST /api/bookings - Buchung erstellen (fehlende Felder)

**Priorität:** 🟡 Mittel  
**Kategorie:** API - Validierung

**Testschritte:**
1. POST-Request ohne `machine_id` senden
2. POST-Request ohne `date` senden
3. POST-Request ohne `slot` senden
4. POST-Request ohne `user_name` senden

**Erwartetes Ergebnis:**
- ✅ Status Code: 400 (Bad Request)
- ✅ Response hat Struktur: `{ "success": false, "error": "...", "type": "validation_error" }`
- ✅ Fehlermeldung: "Alle Felder sind erforderlich: machine_id (positive Zahl), date (YYYY-MM-DD), slot, user_name (nicht leer)"

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-108: POST /api/bookings - Buchung erstellen (ungültige Maschine)

**Priorität:** 🟡 Mittel  
**Kategorie:** API - Validierung

**Testschritte:**
1. POST-Request mit nicht existierender `machine_id` senden (z.B. 99999)

**Erwartetes Ergebnis:**
- ✅ Status Code: 404 (Not Found)
- ✅ Response hat Struktur: `{ "success": false, "error": "Maschine nicht gefunden" }`

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-109: POST /api/bookings - Buchung erstellen (Doppelbuchung)

**Priorität:** 🔴 Hoch  
**Kategorie:** API - Geschäftslogik

**Voraussetzungen:**
- Eine Buchung für Maschine 1, Datum X, Slot "08:00-10:00" existiert bereits

**Testschritte:**
1. POST-Request mit identischen Daten senden (gleiche Maschine, Datum, Slot)

**Erwartetes Ergebnis:**
- ✅ Status Code: 409 (Conflict)
- ✅ Response hat Struktur: `{ "success": false, "error": "...", "type": "conflict" }`
- ✅ Fehlermeldung: "Dieser Slot ist bereits für diese Maschine und dieses Datum gebucht."

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-110: DELETE /api/bookings/:id - Buchung löschen (erfolgreich)

**Priorität:** 🔴 Hoch  
**Kategorie:** API

**Voraussetzungen:**
- Eine Buchung existiert (ID notieren)

**Testschritte:**
1. DELETE-Request an `http://localhost:3000/api/bookings/{id}` senden
2. ID durch tatsächliche Buchungs-ID ersetzen
3. Response prüfen
4. GET-Request ausführen, um zu prüfen, dass Buchung gelöscht wurde

**Erwartetes Ergebnis:**
- ✅ Status Code: 200
- ✅ Response hat Struktur: `{ "success": true, "data": { "message": "Buchung erfolgreich gelöscht" } }`
- ✅ Buchung existiert nicht mehr (GET-Request bestätigt)

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-111: DELETE /api/bookings/:id - Buchung löschen (nicht gefunden)

**Priorität:** 🟡 Mittel  
**Kategorie:** API - Fehlerbehandlung

**Testschritte:**
1. DELETE-Request mit nicht existierender ID senden (z.B. 99999)

**Erwartetes Ergebnis:**
- ✅ Status Code: 404 (Not Found)
- ✅ Response hat Struktur: `{ "success": false, "error": "Buchung nicht gefunden" }`

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-112: DELETE /api/bookings/:id - Buchung löschen (ungültige ID)

**Priorität:** 🟡 Mittel  
**Kategorie:** API - Validierung

**Testschritte:**
1. DELETE-Request mit ungültiger ID senden:
   - `abc` (keine Zahl)
   - `0` (nicht positiv)
   - `-1` (negativ)

**Erwartetes Ergebnis:**
- ✅ Status Code: 400 (Bad Request)
- ✅ Response hat Struktur: `{ "success": false, "error": "...", "type": "validation_error" }`
- ✅ Fehlermeldung: "Ungültige Buchungs-ID. ID muss eine positive Zahl sein."

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-113: 404-Handler - Unbekannter Endpunkt

**Priorität:** 🟡 Mittel  
**Kategorie:** API - Fehlerbehandlung

**Testschritte:**
1. GET-Request an `http://localhost:3000/api/ungueltig` senden

**Erwartetes Ergebnis:**
- ✅ Status Code: 404 (Not Found)
- ✅ Response hat Struktur: `{ "success": false, "error": "Endpoint nicht gefunden" }`

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

## 3. Frontend-Funktionalität

### TC-201: Seite lädt und initialisiert

**Priorität:** 🔴 Hoch  
**Kategorie:** Frontend

**Voraussetzungen:**
- Server läuft
- Browser geöffnet

**Testschritte:**
1. URL `http://localhost:3000` aufrufen
2. Browser-Entwicklertools öffnen (F12)
3. Console-Tab prüfen
4. Network-Tab prüfen

**Erwartetes Ergebnis:**
- ✅ Seite lädt ohne Fehler
- ✅ Keine JavaScript-Fehler in der Konsole
- ✅ API-Requests werden ausgeführt:
  - GET /api/machines
  - GET /api/slots
  - GET /api/bookings?date=...
- ✅ UI-Elemente sind sichtbar und funktionsfähig

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-202: Maschinen werden angezeigt

**Priorität:** 🔴 Hoch  
**Kategorie:** Frontend

**Voraussetzungen:**
- Seite geladen

**Testschritte:**
1. Maschinen-Liste auf der Seite prüfen
2. Anzahl und Namen der Maschinen prüfen

**Erwartetes Ergebnis:**
- ✅ Mindestens 4 Maschinen werden angezeigt
- ✅ Maschinen-Namen sind korrekt
- ✅ Maschinen-Typen werden unterschieden (Waschmaschine vs. Trocknungsraum)

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-203: Zeit-Slots werden angezeigt

**Priorität:** 🔴 Hoch  
**Kategorie:** Frontend

**Voraussetzungen:**
- Seite geladen

**Testschritte:**
1. Zeit-Slots auf der Seite prüfen
2. Anzahl und Format der Slots prüfen

**Erwartetes Ergebnis:**
- ✅ 6 Zeit-Slots werden angezeigt
- ✅ Slots haben Format "HH:MM-HH:MM"
- ✅ Slots sind korrekt sortiert

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-204: Buchung erstellen (UI)

**Priorität:** 🔴 Hoch  
**Kategorie:** Frontend

**Voraussetzungen:**
- Seite geladen
- Benutzername eingegeben (falls erforderlich)

**Testschritte:**
1. Datum auswählen (heute oder später)
2. Maschine auswählen
3. Zeit-Slot auswählen
4. Benutzername eingeben (falls Feld vorhanden)
5. "Buchen" oder ähnlichen Button klicken
6. Erfolgsmeldung prüfen
7. Buchung in der Liste prüfen

**Erwartetes Ergebnis:**
- ✅ Buchung wird erfolgreich erstellt
- ✅ Erfolgsmeldung wird angezeigt
- ✅ Buchung erscheint in der Buchungsliste
- ✅ Buchung hat korrekte Daten (Maschine, Datum, Slot, Benutzer)

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-205: Buchung löschen (UI)

**Priorität:** 🔴 Hoch  
**Kategorie:** Frontend

**Voraussetzungen:**
- Mindestens eine Buchung existiert

**Testschritte:**
1. "Löschen"-Button bei einer Buchung klicken
2. Bestätigung prüfen (falls vorhanden)
3. Buchung wird gelöscht
4. Buchung verschwindet aus der Liste

**Erwartetes Ergebnis:**
- ✅ Buchung wird erfolgreich gelöscht
- ✅ Buchung verschwindet aus der Liste
- ✅ Erfolgsmeldung wird angezeigt (optional)

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-206: Datum ändern

**Priorität:** 🔴 Hoch  
**Kategorie:** Frontend

**Voraussetzungen:**
- Seite geladen

**Testschritte:**
1. Datum im Datum-Feld ändern
2. Buchungen für neues Datum werden geladen
3. Buchungsliste aktualisiert sich

**Erwartetes Ergebnis:**
- ✅ Buchungen für neues Datum werden geladen
- ✅ Buchungsliste aktualisiert sich korrekt
- ✅ Keine Fehler in der Konsole

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-207: Validierung im Frontend

**Priorität:** 🟡 Mittel  
**Kategorie:** Frontend - Validierung

**Testschritte:**
1. Versuch, Buchung ohne Maschine zu erstellen
2. Versuch, Buchung ohne Slot zu erstellen
3. Versuch, Buchung ohne Benutzername zu erstellen
4. Versuch, Buchung mit vergangenem Datum zu erstellen

**Erwartetes Ergebnis:**
- ✅ Validierungsfehler werden angezeigt
- ✅ Buchung wird nicht erstellt
- ✅ Fehlermeldungen sind benutzerfreundlich

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

## 4. Fehlerbehandlung

### TC-301: Server nicht erreichbar

**Priorität:** 🟡 Mittel  
**Kategorie:** Fehlerbehandlung

**Testschritte:**
1. Server stoppen
2. Frontend-Seite neu laden
3. API-Request wird ausgeführt

**Erwartetes Ergebnis:**
- ✅ Fehlermeldung wird dem Benutzer angezeigt
- ✅ Keine unhandled Exceptions
- ✅ App stürzt nicht ab

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-302: Ungültige API-Response

**Priorität:** 🟡 Mittel  
**Kategorie:** Fehlerbehandlung

**Testschritte:**
1. API gibt 500-Fehler zurück (simuliert durch Server-Änderung)
2. Frontend verarbeitet Fehler

**Erwartetes Ergebnis:**
- ✅ Fehlermeldung wird angezeigt
- ✅ App bleibt funktionsfähig

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

## 5. Browser-Kompatibilität

### TC-401: Google Chrome

**Priorität:** 🔴 Hoch  
**Kategorie:** Browser-Kompatibilität

**Testschritte:**
1. App in Google Chrome öffnen
2. Alle Hauptfunktionen testen:
   - Maschinen anzeigen
   - Buchung erstellen
   - Buchung löschen
   - Datum ändern

**Erwartetes Ergebnis:**
- ✅ Alle Funktionen funktionieren korrekt
- ✅ Keine JavaScript-Fehler
- ✅ UI ist korrekt dargestellt

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Chrome-Version:** _______________

**Bemerkungen:**
_________________________________________________

---

### TC-402: Mozilla Firefox

**Priorität:** 🔴 Hoch  
**Kategorie:** Browser-Kompatibilität

**Testschritte:**
1. App in Mozilla Firefox öffnen
2. Alle Hauptfunktionen testen

**Erwartetes Ergebnis:**
- ✅ Alle Funktionen funktionieren korrekt
- ✅ Keine JavaScript-Fehler
- ✅ UI ist korrekt dargestellt

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Firefox-Version:** _______________

**Bemerkungen:**
_________________________________________________

---

### TC-403: Safari

**Priorität:** 🟡 Mittel  
**Kategorie:** Browser-Kompatibilität

**Testschritte:**
1. App in Safari öffnen
2. Alle Hauptfunktionen testen

**Erwartetes Ergebnis:**
- ✅ Alle Funktionen funktionieren korrekt
- ✅ Keine JavaScript-Fehler
- ✅ UI ist korrekt dargestellt

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Safari-Version:** _______________

**Bemerkungen:**
_________________________________________________

---

### TC-404: Mobile Browser (Chrome Mobile)

**Priorität:** 🟡 Mittel  
**Kategorie:** Browser-Kompatibilität - Mobile

**Testschritte:**
1. App auf mobilem Gerät öffnen (Chrome Mobile)
2. Responsive Design prüfen
3. Touch-Interaktionen testen
4. Alle Hauptfunktionen testen

**Erwartetes Ergebnis:**
- ✅ UI ist responsive und gut lesbar
- ✅ Touch-Interaktionen funktionieren
- ✅ Alle Funktionen sind nutzbar

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Gerät:** _______________  
**Browser-Version:** _______________

**Bemerkungen:**
_________________________________________________

---

### TC-405: Mobile Browser (Safari Mobile)

**Priorität:** 🟡 Mittel  
**Kategorie:** Browser-Kompatibilität - Mobile

**Testschritte:**
1. App auf iOS-Gerät öffnen (Safari Mobile)
2. Responsive Design prüfen
3. Touch-Interaktionen testen

**Erwartetes Ergebnis:**
- ✅ UI ist responsive und gut lesbar
- ✅ Touch-Interaktionen funktionieren
- ✅ Alle Funktionen sind nutzbar

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Gerät:** _______________  
**iOS-Version:** _______________

**Bemerkungen:**
_________________________________________________

---

## 6. Performance & Usability

### TC-501: Ladezeiten

**Priorität:** 🟡 Mittel  
**Kategorie:** Performance

**Testschritte:**
1. Browser-Entwicklertools öffnen
2. Network-Tab öffnen
3. Seite neu laden
4. Ladezeiten messen

**Erwartetes Ergebnis:**
- ✅ Initiale Ladezeit < 2 Sekunden
- ✅ API-Requests < 500ms
- ✅ Keine langen Blocking-Requests

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

### TC-502: Benutzerfreundlichkeit

**Priorität:** 🟡 Mittel  
**Kategorie:** Usability

**Testschritte:**
1. App als neuer Benutzer verwenden
2. Intuitivität prüfen
3. Fehlermeldungen prüfen

**Erwartetes Ergebnis:**
- ✅ App ist intuitiv bedienbar
- ✅ Fehlermeldungen sind verständlich
- ✅ Workflow ist logisch

**Tatsächliches Ergebnis:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen / ⬜ Übersprungen

**Bemerkungen:**
_________________________________________________

---

## Test-Zusammenfassung

**Gesamtanzahl Tests:** _______________  
**Bestanden:** _______________  
**Fehlgeschlagen:** _______________  
**Übersprungen:** _______________

**Kritische Fehler:** _______________  
**Mittlere Fehler:** _______________  
**Niedrige Fehler:** _______________

**Test-Dauer:** _______________

**Allgemeine Bemerkungen:**
_________________________________________________
_________________________________________________
_________________________________________________

**Tester:** _______________  
**Datum:** _______________

