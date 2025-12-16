# Waschmaschinen-Buchungsapp - Projekt-Roadmap

## 🎯 Projektziel
Entwicklung einer einfachen Web-Anwendung zur Buchung von Waschmaschinen- und Trocknungs-Slots. Nutzer können feste Maschinen zu festen Zeitfenstern buchen.

---

## 🛠️ Tech-Stack
- **Backend:** Node.js, Express
- **Datenbank:** SQLite (lokal)
- **Frontend:** Vanilla HTML, CSS, JavaScript (keine Frameworks)
- **Architektur:** RESTful API + statisches Frontend

---

## 📋 Verbindliche Anforderungen

### Maschinen
- **Genau 3 Waschmaschinen** und **1 Trocknungsraum**
- Keine weiteren Maschinen-Typen

### Zeitfenster (Slots)
- **FIXE Slots** - werden **NICHT** in die Datenbank geschrieben
- Slots pro Tag:
  - 08:00–10:00
  - 10:00–12:00
  - 12:00–14:00
  - 14:00–16:00
  - 16:00–18:00
  - 18:00–20:00
- Kein weekly schedule, kein day_of_week, keine time_slots Tabelle

### Datenbank-Schema
- **machines**: `id`, `name`, `type`
- **bookings**: `id`, `machine_id`, `date`, `slot`, `user_name`
- **KEINE** E-Mail, kein Status, kein created_at

### Backend-API
- `GET /api/machines` - Liste aller Maschinen
- `GET /api/bookings?date=YYYY-MM-DD` - Buchungen für ein Datum
- `POST /api/bookings` - Neue Buchung erstellen
- `DELETE /api/bookings/:id` - Buchung löschen
- `GET /api/slots` - Liefert fixe Slots (optional)

---

## 📊 Aktueller Stand
- ✅ Express-Server vorhanden
- ✅ SQLite-Datenbank-Setup vorhanden
- ❌ Datenbank-Schema muss für Buchungen angepasst werden
- ❌ Frontend fehlt komplett
- ❌ Buchungs-Logik fehlt

---

## 🗺️ Roadmap - 2 Iterationen

---

## **ITERATION 1: Backend & Datenbank**
**Ziel:** Funktionsfähiges Backend mit Buchungs-API  
**Dauer:** 3-5 Tage  
**Priorität:** 🔴 Hoch

### **Task 1.1: Datenbank-Schema erstellen**
**Zugewiesen an:** Junior Developer  
**Komplexität:** Niedrig

**Beschreibung:**
- Datenbank-Schema gemäß Anforderungen erstellen
- Tabellen: `machines`, `bookings`
- Seed-Daten: 3 Waschmaschinen + 1 Trocknungsraum

**Technische Details:**
- `machines`: `id INTEGER PRIMARY KEY`, `name TEXT NOT NULL`, `type TEXT NOT NULL`
- `bookings`: `id INTEGER PRIMARY KEY`, `machine_id INTEGER`, `date TEXT NOT NULL`, `slot TEXT NOT NULL`, `user_name TEXT NOT NULL`
- Foreign Key: `machine_id` → `machines(id)`
- Seed-Daten: 3 Maschinen (type: "washer"), 1 Maschine (type: "dryer")

**Output:**
- Datenbank-Initialisierung in `server.js` (initDatabase-Funktion)
- Seed-Daten werden automatisch eingefügt

**Abnahmekriterien:**
- ✅ Tabellen `machines` und `bookings` werden korrekt erstellt
- ✅ Foreign Key funktioniert
- ✅ Seed-Daten enthalten genau 3 Waschmaschinen und 1 Trocknungsraum
- ✅ Datenbank kann ohne Fehler initialisiert werden
- ✅ Keine zusätzlichen Tabellen oder Spalten

---

### **Task 1.2: Slots-Konstante definieren**
**Zugewiesen an:** Junior Developer  
**Komplexität:** Niedrig

**Beschreibung:**
- Feste Slots als Konstante im Backend definieren
- Slots: 08:00-10:00, 10:00-12:00, 12:00-14:00, 14:00-16:00, 16:00-18:00, 18:00-20:00
- Optional: GET `/api/slots` Endpunkt implementieren

**Technische Details:**
- Slots als Array von Objekten: `{ start: "08:00", end: "10:00", label: "08:00-10:00" }`
- Slots werden NICHT in Datenbank gespeichert

**Output:**
- Slots-Konstante in `server.js`
- Optional: GET `/api/slots` Endpunkt

**Abnahmekriterien:**
- ✅ Slots sind als Konstante definiert
- ✅ Alle 6 Slots sind vorhanden
- ✅ Optional: GET `/api/slots` liefert alle Slots als JSON

---

### **Task 1.3: Backend-API - Maschinen**
**Zugewiesen an:** Junior Developer  
**Komplexität:** Niedrig

**Beschreibung:**
- GET `/api/machines` Endpunkt implementieren
- Liefert alle Maschinen aus der Datenbank

**Output:**
- API-Endpunkt in `server.js`
- JSON-Response mit allen Maschinen

**Abnahmekriterien:**
- ✅ GET `/api/machines` liefert alle 4 Maschinen
- ✅ Response ist korrektes JSON
- ✅ Fehlerbehandlung bei DB-Fehlern (Status 500)

---

### **Task 1.4: Backend-API - Buchungen abrufen**
**Zugewiesen an:** Junior Developer  
**Komplexität:** Mittel

**Beschreibung:**
- GET `/api/bookings?date=YYYY-MM-DD` Endpunkt implementieren
- Liefert alle Buchungen für ein bestimmtes Datum
- Query-Parameter `date` ist erforderlich

**Output:**
- API-Endpunkt in `server.js`
- JSON-Response mit Buchungen für das Datum

**Abnahmekriterien:**
- ✅ Endpunkt funktioniert mit Datum-Parameter
- ✅ Liefert nur Buchungen für das angegebene Datum
- ✅ Fehlender oder ungültiger Datum-Parameter wird behandelt (Status 400)
- ✅ Response ist korrektes JSON-Array

---

### **Task 1.5: Backend-API - Buchung erstellen**
**Zugewiesen an:** Senior Developer  
**Komplexität:** Hoch

**Beschreibung:**
- POST `/api/bookings` Endpunkt implementieren
- Request Body: `{ machine_id, date, slot, user_name }`
- **Kritische Validierung:**
  - Maschine existiert
  - Slot ist gültig (einer der 6 fixen Slots)
  - Datum ist gültig (Format YYYY-MM-DD, nicht in Vergangenheit)
  - **Doppelbuchung verhindern:** Maschine + Datum + Slot darf nicht bereits existieren

**Output:**
- API-Endpunkt in `server.js`
- Validierungs-Logik
- Fehlerbehandlung

**Abnahmekriterien:**
- ✅ Doppelbuchungen werden verhindert (Status 409 Conflict)
- ✅ Alle Validierungen funktionieren (ungültige Daten → Status 400)
- ✅ Erfolgreiche Buchung wird gespeichert (Status 201)
- ✅ Response enthält die erstellte Buchung mit ID

---

### **Task 1.6: Backend-API - Buchung löschen**
**Zugewiesen an:** Junior Developer  
**Komplexität:** Niedrig

**Beschreibung:**
- DELETE `/api/bookings/:id` Endpunkt implementieren
- Löscht eine Buchung anhand der ID

**Output:**
- API-Endpunkt in `server.js`
- Fehlerbehandlung für nicht existierende IDs

**Abnahmekriterien:**
- ✅ Buchung wird erfolgreich gelöscht (Status 200)
- ✅ Nicht existierende ID wird behandelt (Status 404)
- ✅ Response enthält Bestätigungs-Message

---

## **ITERATION 2: Frontend - Minimalversion**
**Ziel:** Funktionsfähiges Frontend für Buchungen  
**Dauer:** 5-7 Tage  
**Priorität:** 🔴 Hoch

### **Task 2.1: HTML-Struktur**
**Zugewiesen an:** Junior Developer  
**Komplexität:** Niedrig

**Beschreibung:**
- HTML-Grundstruktur für eine einzige Seite
- Elemente: Datum-Auswahl, Name-Eingabe, Maschinen-Anzeige, Slots-Anzeige
- Basis-Layout mit CSS

**Output:**
- `public/index.html` - Hauptseite
- `public/css/style.css` - Basis-Styling

**Abnahmekriterien:**
- ✅ Alle notwendigen HTML-Elemente sind vorhanden
- ✅ Layout ist strukturiert und übersichtlich
- ✅ Responsive Design (Mobile + Desktop)

---

### **Task 2.2: JavaScript - API-Integration**
**Zugewiesen an:** Senior Developer  
**Komplexität:** Mittel

**Beschreibung:**
- JavaScript-Funktionen für API-Calls
- Funktionen: `fetchMachines()`, `fetchBookings(date)`, `createBooking(data)`, `deleteBooking(id)`
- Error-Handling und einfache Fehlermeldungen

**Output:**
- `public/js/api.js` - API-Helper-Funktionen
- Slots-Konstante (identisch mit Backend)

**Abnahmekriterien:**
- ✅ Alle API-Calls funktionieren
- ✅ Fehler werden behandelt und angezeigt
- ✅ Slots-Konstante ist identisch mit Backend

---

### **Task 2.3: Maschinen anzeigen**
**Zugewiesen an:** Junior Developer  
**Komplexität:** Niedrig

**Beschreibung:**
- Maschinen aus API laden und anzeigen
- Anzeige: Name und Typ (Waschmaschine/Trocknungsraum)
- Maschinen werden beim Laden der Seite angezeigt

**Output:**
- Maschinen werden dynamisch geladen und angezeigt

**Abnahmekriterien:**
- ✅ Alle 4 Maschinen werden angezeigt
- ✅ Typ wird korrekt dargestellt
- ✅ Maschinen werden beim Seiten-Load geladen

---

### **Task 2.4: Slots anzeigen und Buchungen visualisieren**
**Zugewiesen an:** Senior Developer  
**Komplexität:** Mittel

**Beschreibung:**
- Für jede Maschine alle 6 Slots anzeigen
- Belegte Slots visuell markieren (z.B. rot/grau)
- Freie Slots sind buchbar
- Slots werden aktualisiert basierend auf gewähltem Datum
- Buchungen für das gewählte Datum werden geladen und angezeigt

**Output:**
- Slot-Grid für jede Maschine
- Visuelle Unterscheidung: frei/belegt
- Dynamische Aktualisierung bei Datum-Änderung

**Abnahmekriterien:**
- ✅ Alle 6 Slots werden für jede Maschine angezeigt
- ✅ Belegte Slots sind klar erkennbar
- ✅ Slots werden aktualisiert wenn Datum geändert wird
- ✅ Buchungen werden korrekt den Slots zugeordnet

---

### **Task 2.5: Buchung erstellen**
**Zugewiesen an:** Senior Developer  
**Komplexität:** Mittel

**Beschreibung:**
- Buchungsformular: Datum, Name, Maschine, Slot
- Validierung im Frontend (Name nicht leer, Datum nicht in Vergangenheit)
- Klick auf freien Slot öffnet Buchung (oder direkt buchen)
- API-Call zum Erstellen der Buchung
- Erfolgs-/Fehlermeldung anzeigen
- Nach erfolgreicher Buchung: Slots aktualisieren

**Output:**
- Funktionsfähige Buchungs-Funktion
- Validierung und Error-Handling
- Feedback für Nutzer

**Abnahmekriterien:**
- ✅ Buchung kann erfolgreich erstellt werden
- ✅ Validierung funktioniert
- ✅ Erfolgs-/Fehlermeldungen werden angezeigt
- ✅ Slots werden nach Buchung aktualisiert
- ✅ Doppelbuchungen werden verhindert (Backend + Frontend-Feedback)

---

### **Task 2.6: Buchung löschen**
**Zugewiesen an:** Junior Developer  
**Komplexität:** Niedrig

**Beschreibung:**
- Möglichkeit, eigene Buchungen zu löschen
- Button/Icon bei belegten Slots (wenn Name übereinstimmt)
- Bestätigungs-Dialog vor Löschung
- API-Call zum Löschen
- Slots nach Löschung aktualisieren

**Output:**
- Lösch-Funktion für Buchungen
- Bestätigungs-Dialog

**Abnahmekriterien:**
- ✅ Buchungen können gelöscht werden
- ✅ Bestätigungs-Dialog funktioniert
- ✅ Slots werden nach Löschung aktualisiert
- ✅ Nur eigene Buchungen können gelöscht werden (Name-Vergleich)

---

### **Task 2.7: UX-Verbesserungen**
**Zugewiesen an:** Junior Developer  
**Komplexität:** Niedrig

**Beschreibung:**
- Loading-States während API-Calls
- Verbesserte Fehlermeldungen
- Datum-Formatierung (z.B. "Heute", "Morgen")
- Name in LocalStorage speichern (optional)

**Output:**
- Verbesserte User Experience
- Konsistente Fehlerbehandlung

**Abnahmekriterien:**
- ✅ Loading-Indikatoren werden angezeigt
- ✅ Fehlermeldungen sind verständlich
- ✅ Optional: Name wird gespeichert und automatisch geladen

---

## 📋 Qualitätskriterien pro Iteration

### **Definition of Done (DoD):**
- ✅ Alle Tasks der Iteration abgeschlossen
- ✅ Code funktioniert ohne kritische Bugs
- ✅ Frontend und Backend kommunizieren korrekt
- ✅ Keine Console-Errors im Browser
- ✅ Doppelbuchungen sind unmöglich

### **Qualitätskontrolle:**
- **Code-Review:** Jeder Task wird von Senior Developer reviewt
- **Testing:** Manuelle Tests aller Features
- **Browser-Kompatibilität:** Funktioniert in Chrome, Firefox, Safari

---

## 🎯 Erfolgs-Metriken

- **Funktionalität:** Nutzer können erfolgreich Slots buchen
- **Zuverlässigkeit:** Keine Doppelbuchungen möglich
- **Usability:** Intuitive Bedienung ohne Anleitung
- **Performance:** Seiten laden < 1 Sekunde
- **Stabilität:** Keine kritischen Bugs

---

## 📝 Nächste Schritte

**Sofort starten mit ITERATION 1:**
1. Junior Developer: Datenbank-Schema erstellen (Task 1.1)
2. Junior Developer: Slots-Konstante definieren (Task 1.2)
3. Junior Developer: Maschinen-API implementieren (Task 1.3)
4. Junior Developer: Buchungen abrufen (Task 1.4)
5. Senior Developer: Buchung erstellen (Task 1.5)
6. Junior Developer: Buchung löschen (Task 1.6)

**Entscheidungen getroffen:**
- ✅ Tech-Stack: Node.js, Express, SQLite, Vanilla JS
- ✅ Keine Frameworks
- ✅ Genau 3 Waschmaschinen + 1 Trocknungsraum
- ✅ 6 fixe Slots pro Tag (08:00-20:00)
- ✅ Vereinfachtes Datenmodell (keine Email, kein Status)

---

*Roadmap erstellt am: [Datum]*  
*Letzte Aktualisierung: [Datum]*
