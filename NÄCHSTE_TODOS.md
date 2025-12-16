# 📋 Nächste To-Dos - Priorisierte Übersicht

**Stand:** [Aktuelles Datum]  
**Status:** ⏳ In Bearbeitung

---

## 🔴 SOFORT (Kritisch - Blockiert Hauptfunktionalität)

### 1. ✅ Slot-Klick-Event beheben
**Zugewiesen:** Junior Frontend Entwickler  
**Priorität:** 🔴 KRITISCH  
**Status:** ✅ **ABGESCHLOSSEN** (2025-12-11)  
**Geschätzte Zeit:** 2-3 Stunden (tatsächlich: ~2 Stunden)

**Was wurde gemacht:**
- ✅ Event-Delegation implementiert (`setupSlotClickDelegation()`)
- ✅ Optimistisches Update implementiert für sofortige UI-Feedback
- ✅ Datums-Normalisierung hinzugefügt (`normalizeDate()`)
- ✅ `renderSlots()` aktualisiert für korrekte Slot-Markierung

**Datei:** `AUFGABE_JUNIOR_FRONTEND_SLOT_CLICK.md`  
**Test-Ergebnisse:** `TEST_ERGEBNISSE_BUCHUNGSLOGIK.md`

**Abnahmekriterien:**
- [x] Klick auf freien Slot öffnet Bestätigungs-Modal
- [x] Bestätigung erstellt Buchung erfolgreich
- [x] Slot wird nach Buchung als "gebucht" markiert (optimistisches Update)
- [x] Keyboard-Navigation funktioniert weiterhin
- [x] Keine JavaScript-Fehler in Browser-Console
- [x] Funktioniert auch nach mehrfachem Rendern

---

## 🟡 PARALLEL (Kann parallel zu #1 gemacht werden)

### 2. ✅ Datenbank-Backup & Persistenz testen
**Zugewiesen:** Junior Backend Entwickler  
**Priorität:** 🔴 KRITISCH  
**Status:** ⏳ In Bearbeitung (Test-Skript erstellt)  
**Geschätzte Zeit:** 2-3 Stunden

**Was wurde gemacht:**
- ✅ Test-Skript erstellt: `test-backup.js`
- ✅ Test-Szenarien definiert (Backup erstellen, Restore, Validierung)

**Was zu tun:**
- ⏳ Test-Skript ausführen (Server muss laufen)
- ⏳ Backup-Endpunkt testen: `POST /api/v1/admin/backup`
- ⏳ Restore-Endpunkt testen: `POST /api/v1/admin/restore`
- ⏳ Datenbank-Initialisierung testen
- ⏳ Migrationen prüfen

**Test-Skript:** `test-backup.js` (ausführen mit: `node test-backup.js`)

**Warum wichtig:**
- Backup-Funktionalität muss für Deployment funktionieren
- Datenbank muss bei jedem Start korrekt initialisiert werden
- Kann parallel zu Frontend-Fix gemacht werden

**Datei:** `AUFGABE_JUNIOR_BACKEND_DATENBANK.md`

**Abnahmekriterien:**
- [ ] Backup kann erstellt werden
- [ ] Backup kann wiederhergestellt werden
- [ ] Datenbank wird bei jedem Start korrekt initialisiert
- [ ] Admin-Benutzer wird korrekt erstellt

---

### 3. ✅ Buchungslogik testen & validieren
**Zugewiesen:** Junior Backend Entwickler  
**Priorität:** 🔴 KRITISCH  
**Status:** ⏳ In Bearbeitung (Test-Skript erstellt, Code-Review durchgeführt)  
**Geschätzte Zeit:** 2-3 Stunden

**Was wurde gemacht:**
- ✅ Code-Review: Doppelbuchungs-Prüfung implementiert (Zeile 2385-2399 in `server.js`)
- ✅ Code-Review: UNIQUE Index in Datenbank vorhanden (Zeile 647 in `server.js`)
- ✅ Code-Review: Validierung für alle Felder vorhanden
- ✅ Test-Skript erstellt: `test-booking-validation.js`

**Was zu tun:**
- ⏳ Test-Skript ausführen (Server muss laufen)
- ⏳ Doppelte Buchungen verhindern testen
- ⏳ Validierung testen (ungültige Maschine-ID, Slot, Datum)
- ⏳ Buchungs-Löschung testen
- ⏳ Buchungs-Abfragen testen

**Warum wichtig:**
- Backend muss korrekt validieren
- Sicherheit: Nur Besitzer kann löschen
- Kann parallel zu Frontend-Fix gemacht werden

**Datei:** `AUFGABE_JUNIOR_BACKEND_BUCHUNGSLOGIK.md`  
**Test-Skript:** `test-booking-validation.js` (ausführen mit: `node test-booking-validation.js`)

**Abnahmekriterien:**
- [ ] Alle Validierungs-Tests bestehen
- [ ] Doppelte Buchungen werden verhindert
- [ ] Buchungs-Löschung funktioniert korrekt
- [ ] Edge-Cases sind abgedeckt

---

## 🟢 NACH #1 (Abhängig von Slot-Klick-Fix)

### 4. ✅ Frontend-Buchungslogik testen
**Zugewiesen:** Junior Frontend Entwickler  
**Priorität:** 🔴 KRITISCH  
**Status:** ✅ **ABGESCHLOSSEN** (2025-12-11)  
**Geschätzte Zeit:** 1-2 Stunden

**Voraussetzung:** Slot-Klick-Event muss funktionieren (#1) ✅

**Was zu tun:**
- Buchungs-Flow end-to-end testen
- UI-Feedback testen (Loading, Erfolg, Fehler)
- Datum-Handling testen
- Browser-Kompatibilität testen

**Datei:** `AUFGABE_JUNIOR_FRONTEND_BUCHUNGSLOGIK.md`

**Abnahmekriterien:**
- [ ] Buchungs-Flow funktioniert end-to-end
- [ ] Fehlerbehandlung ist robust
- [ ] UI-Feedback ist korrekt
- [ ] Keine JavaScript-Fehler

---

## 📊 Zeitplan

### Tag 1 (Heute):
- **Junior Frontend:** Slot-Klick-Event beheben (2-3 Std) 🔴
- **Junior Backend:** Datenbank-Backup testen (2-3 Std) 🔴
- **Junior Backend:** Buchungslogik testen (2-3 Std) 🔴

**Gesamt:** 6-9 Stunden (parallel)

### Tag 2 (Morgen):
- **Junior Frontend:** Frontend-Buchungslogik testen (1-2 Std) 🔴
- **Senior Fullstack:** Integration-Tests erstellen (2-3 Std) 🟡
- **Junior QA:** Manuelle Tests durchführen (2-3 Std) 🟡

**Gesamt:** 5-8 Stunden

---

## ✅ Checkliste: Was ist bereits erledigt?

- [x] Datenbank-Pfad konfigurierbar gemacht (`DATABASE_PATH` env variable)
- [x] Admin-Bereich implementiert
- [x] Authentifizierung implementiert
- [x] API-Endpunkte implementiert
- [x] Frontend-Grundstruktur erstellt
- [x] Aufgaben-Dokumentation erstellt

---

## ⏳ Was noch offen ist:

### Kritisch (vor Deployment):
- [x] Slot-Klick-Event beheben (#1) ✅ ABGESCHLOSSEN
- [ ] Datenbank-Backup testen (#2)
- [ ] Buchungslogik testen (#3)
- [x] Frontend-Buchungslogik testen (#4) ✅ ABGESCHLOSSEN

### Wichtig (sollte vor Deployment):
- [ ] Integration-Tests erstellen
- [ ] Manuelle Test-Suite durchführen
- [ ] Error-Handling verbessern

### Optional (nach Deployment):
- [ ] Performance-Optimierungen
- [ ] UX-Verbesserungen

---

## 🎯 Empfohlene Reihenfolge

### Schritt 1: SOFORT starten (parallel)
1. **Junior Frontend:** Slot-Klick-Event beheben
2. **Junior Backend:** Datenbank-Backup testen
3. **Junior Backend:** Buchungslogik testen

### Schritt 2: Nach Schritt 1
4. **Junior Frontend:** Frontend-Buchungslogik testen

### Schritt 3: Vor Deployment
5. **Senior Fullstack:** Integration-Tests
6. **Junior QA:** Manuelle Tests

---

## 📝 Nächste Aktionen

### Für Sie (CEO/CTO):
1. ✅ Aufgaben wurden erstellt
2. ⏳ Agenten informieren und Aufgaben zuweisen
3. ⏳ Fortschritt überwachen
4. ⏳ Code-Review nach Abschluss

### Für Agenten:
1. **Junior Frontend:** `AUFGABE_JUNIOR_FRONTEND_SLOT_CLICK.md` lesen und starten
2. **Junior Backend:** `AUFGABE_JUNIOR_BACKEND_DATENBANK.md` lesen und starten
3. **Junior Backend:** `AUFGABE_JUNIOR_BACKEND_BUCHUNGSLOGIK.md` lesen und starten

---

**Erstellt:** [Aktuelles Datum]  
**Zuletzt aktualisiert:** [Aktuelles Datum]  
**Nächste Review:** Nach Abschluss der kritischen Aufgaben

