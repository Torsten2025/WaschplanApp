# 🚀 Sofort-Aufgaben für verfügbare Agenten

## 🔵 Junior Backend Entwickler - Sofort startbar

### Aufgabe 1: Datenbank-Backup & Wiederherstellung
**Priorität:** 🟡 Mittel  
**Geschätzte Dauer:** 2-3 Stunden  
**Status:** 📋 Bereit zum Start

**Beschreibung:**
- Backup-Funktionalität für SQLite-Datenbank implementieren
- Wiederherstellungs-Funktion
- Optional: Automatische Backups

**Konkrete Tasks:**
- [ ] Backup-Endpunkt erstellen: `POST /api/admin/backup`
- [ ] Wiederherstellungs-Endpunkt: `POST /api/admin/restore`
- [ ] Backup-Dateien in `backups/` Verzeichnis speichern
- [ ] Backup-Dateinamen mit Timestamp versehen
- [ ] Validierung: Nur gültige Backup-Dateien wiederherstellen

**Output:**
- Backup-Funktionalität in `server.js`
- `backups/` Verzeichnis wird erstellt
- API-Endpunkte für Backup/Restore

**Abnahmekriterien:**
- ✅ Backup kann erstellt werden
- ✅ Backup kann wiederhergestellt werden
- ✅ Backup-Dateien sind korrekt formatiert
- ✅ Fehlerbehandlung funktioniert

---

### Aufgabe 2: Datenbank-Statistiken-Endpunkt
**Priorität:** 🟢 Niedrig  
**Geschätzte Dauer:** 1-2 Stunden  
**Status:** 📋 Bereit zum Start

**Beschreibung:**
- Statistiken-Endpunkt für Dashboard
- Anzahl Buchungen, Maschinen, etc.
- Optional: Buchungen pro Tag/Maschine

**Konkrete Tasks:**
- [ ] `GET /api/statistics` Endpunkt erstellen
- [ ] Statistiken berechnen:
  - Gesamtanzahl Buchungen
  - Buchungen pro Maschine
  - Buchungen pro Tag (letzte 7 Tage)
  - Meist gebuchte Maschine
- [ ] Response mit strukturierten Daten

**Output:**
- Statistiken-Endpunkt
- JSON-Response mit allen Statistiken

**Abnahmekriterien:**
- ✅ Endpunkt liefert korrekte Statistiken
- ✅ Performance ist akzeptabel (< 500ms)
- ✅ Response ist strukturiert

---

### Aufgabe 3: Datenbank-Migrations-System
**Priorität:** 🟢 Niedrig  
**Geschätzte Dauer:** 2-3 Stunden  
**Status:** 📋 Bereit zum Start

**Beschreibung:**
- Einfaches Migrations-System für Schema-Änderungen
- Versions-Tracking in Datenbank
- Migrations-Dateien in `migrations/` Verzeichnis

**Konkrete Tasks:**
- [ ] Migrations-Tabelle erstellen: `schema_migrations`
- [ ] Migrations-Verzeichnis erstellen
- [ ] Migrations-Loader implementieren
- [ ] Migrations in Reihenfolge ausführen
- [ ] Versions-Tracking

**Output:**
- Migrations-System
- Beispiel-Migration
- Dokumentation

**Abnahmekriterien:**
- ✅ Migrations können ausgeführt werden
- ✅ Versions-Tracking funktioniert
- ✅ Migrations sind rückwärts-kompatibel

---

### Aufgabe 4: Rate-Limiting implementieren
**Priorität:** 🟡 Mittel  
**Geschätzte Dauer:** 1-2 Stunden  
**Status:** 📋 Bereit zum Start

**Beschreibung:**
- Rate-Limiting für API-Endpunkte
- Verhindert Missbrauch
- Konfigurierbare Limits

**Konkrete Tasks:**
- [ ] Rate-Limiting-Middleware erstellen
- [ ] Limits pro Endpunkt konfigurieren:
  - GET-Endpunkte: 100 Requests/Minute
  - POST-Endpunkte: 20 Requests/Minute
  - DELETE-Endpunkte: 10 Requests/Minute
- [ ] Rate-Limit-Headers in Response
- [ ] Fehler-Response bei Limit-Überschreitung

**Output:**
- Rate-Limiting-Middleware
- Konfigurierbare Limits
- Rate-Limit-Headers

**Abnahmekriterien:**
- ✅ Rate-Limiting funktioniert
- ✅ Limits sind konfigurierbar
- ✅ Headers werden korrekt gesetzt

---

## 🟣 Junior Frontend Entwickler - Sofort startbar

### Aufgabe 1: Keyboard-Navigation verbessern
**Priorität:** 🟡 Mittel  
**Geschätzte Dauer:** 2-3 Stunden  
**Status:** 📋 Bereit zum Start

**Beschreibung:**
- Vollständige Keyboard-Navigation
- Tab-Order optimieren
- Accessible Slots (ARIA-Labels)
- Keyboard-Shortcuts

**Konkrete Tasks:**
- [ ] Tab-Order durch alle Elemente
- [ ] Enter/Space für Slot-Buchung
- [ ] Escape zum Schließen von Dialogen
- [ ] Arrow-Keys für Slot-Navigation
- [ ] ARIA-Labels für alle interaktiven Elemente
- [ ] Focus-States sichtbar machen

**Output:**
- Verbesserte Keyboard-Navigation
- ARIA-Labels implementiert
- Focus-States in CSS

**Abnahmekriterien:**
- ✅ App ist vollständig per Tastatur bedienbar
- ✅ Tab-Order ist logisch
- ✅ ARIA-Labels vorhanden
- ✅ Focus-States sichtbar

---

### Aufgabe 2: Offline-Modus implementieren
**Priorität:** 🟡 Mittel  
**Geschätzte Dauer:** 3-4 Stunden  
**Status:** 📋 Bereit zum Start

**Beschreibung:**
- Service Worker für Offline-Funktionalität
- Cache-Strategie
- Offline-Anzeige
- Queue für Offline-Buchungen

**Konkrete Tasks:**
- [ ] Service Worker erstellen (`public/sw.js`)
- [ ] Cache-Strategie implementieren (Cache First für statische Dateien)
- [ ] Offline-Erkennung
- [ ] Offline-Banner anzeigen
- [ ] Queue für Buchungen wenn offline
- [ ] Sync wenn wieder online

**Output:**
- Service Worker
- Offline-Funktionalität
- Queue-System

**Abnahmekriterien:**
- ✅ App funktioniert offline (lesen)
- ✅ Buchungen werden gequeued wenn offline
- ✅ Sync funktioniert wenn online
- ✅ Offline-Status wird angezeigt

---

### Aufgabe 3: Dark Mode implementieren
**Priorität:** 🟢 Niedrig  
**Geschätzte Dauer:** 2-3 Stunden  
**Status:** 📋 Bereit zum Start

**Beschreibung:**
- Dark Mode Toggle
- System-Präferenz erkennen
- Theme in LocalStorage speichern
- Smooth Transitions

**Konkrete Tasks:**
- [ ] Dark Mode CSS-Variablen definieren
- [ ] Theme-Toggle-Button im Header
- [ ] System-Präferenz erkennen (`prefers-color-scheme`)
- [ ] Theme in LocalStorage speichern
- [ ] Smooth Transitions zwischen Themes
- [ ] Alle Komponenten für Dark Mode anpassen

**Output:**
- Dark Mode implementiert
- Theme-Toggle
- Smooth Transitions

**Abnahmekriterien:**
- ✅ Dark Mode funktioniert
- ✅ Theme wird gespeichert
- ✅ System-Präferenz wird erkannt
- ✅ Alle Komponenten unterstützen Dark Mode

---

### Aufgabe 4: Druck-optimierte Ansicht
**Priorität:** 🟢 Niedrig  
**Geschätzte Dauer:** 1-2 Stunden  
**Status:** 📋 Bereit zum Start

**Beschreibung:**
- Print-Stylesheet erstellen
- Übersichtliche Druck-Ansicht
- Nur relevante Informationen drucken

**Konkrete Tasks:**
- [ ] `@media print` Styles in CSS
- [ ] Navigation und Buttons ausblenden
- [ ] Buchungen übersichtlich darstellen
- [ ] Datum und Maschinen-Info prominent
- [ ] Page-Breaks optimieren

**Output:**
- Print-Stylesheet
- Druck-optimierte Ansicht

**Abnahmekriterien:**
- ✅ Druck-Ansicht ist übersichtlich
- ✅ Nur relevante Infos werden gedruckt
- ✅ Layout ist druck-optimiert

---

### Aufgabe 5: Toast-Notifications verbessern
**Priorität:** 🟢 Niedrig  
**Geschätzte Dauer:** 1-2 Stunden  
**Status:** 📋 Bereit zum Start

**Beschreibung:**
- Statt einfacher Messages: Toast-Notifications
- Animierte Ein-/Ausblenden
- Position: Top-Right
- Auto-Close mit Progress-Bar

**Konkrete Tasks:**
- [ ] Toast-Komponente erstellen
- [ ] Animierte Ein-/Ausblenden
- [ ] Position: Top-Right
- [ ] Progress-Bar für Auto-Close
- [ ] Verschiedene Toast-Typen (Success, Error, Info, Warning)
- [ ] Stacking bei mehreren Toasts

**Output:**
- Toast-Notification-System
- Animierte Toasts
- Progress-Bars

**Abnahmekriterien:**
- ✅ Toasts sind animiert
- ✅ Auto-Close funktioniert
- ✅ Stacking funktioniert
- ✅ Verschiedene Typen vorhanden

---

### Aufgabe 6: Maschinen-Filter & Suche
**Priorität:** 🟡 Mittel  
**Geschätzte Dauer:** 2-3 Stunden  
**Status:** 📋 Bereit zum Start

**Beschreibung:**
- Filter nach Maschinen-Typ (Waschmaschine/Trockner)
- Suche nach Maschinen-Name
- Filter-Status in URL speichern (optional)

**Konkrete Tasks:**
- [ ] Filter-UI erstellen (Checkboxen für Typen)
- [ ] Suchfeld für Maschinen-Name
- [ ] Filter-Logik implementieren
- [ ] Gefilterte Maschinen anzeigen
- [ ] Filter-Reset-Button
- [ ] Optional: Filter in URL-Parameter

**Output:**
- Filter- und Such-Funktionalität
- Filter-UI
- Filter-Logik

**Abnahmekriterien:**
- ✅ Filter funktioniert
- ✅ Suche funktioniert
- ✅ Filter können zurückgesetzt werden
- ✅ UI ist intuitiv

---

## 📊 Priorisierung

### Sofort starten (🟡 Mittel):
1. **Junior Backend:** Rate-Limiting implementieren
2. **Junior Frontend:** Keyboard-Navigation verbessern
3. **Junior Frontend:** Offline-Modus implementieren

### Kurzfristig (🟢 Niedrig):
4. **Junior Backend:** Datenbank-Backup & Wiederherstellung
5. **Junior Backend:** Datenbank-Statistiken-Endpunkt
6. **Junior Frontend:** Dark Mode implementieren
7. **Junior Frontend:** Maschinen-Filter & Suche
8. **Junior Frontend:** Toast-Notifications verbessern
9. **Junior Frontend:** Druck-optimierte Ansicht

### Langfristig:
10. **Junior Backend:** Datenbank-Migrations-System

---

## 🎯 Empfehlung

**Junior Backend sollte starten mit:**
- Rate-Limiting (wichtig für Sicherheit, schnell umsetzbar)

**Junior Frontend sollte starten mit:**
- Keyboard-Navigation (wichtig für Accessibility, sofort umsetzbar)
- Oder: Offline-Modus (wenn mehr Zeit verfügbar)

---

*Aufgaben erstellt am: [Datum]*  
*Alle Aufgaben sind sofort startbar und unabhängig von anderen Ergebnissen*

