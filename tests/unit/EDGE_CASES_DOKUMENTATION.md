# Edge-Cases Dokumentation - Unit-Tests

## Übersicht

Diese Dokumentation listet alle getesteten Edge-Cases in den Unit-Tests auf.

---

## isValidSlot() - Edge-Cases

### ✅ Getestete Edge-Cases

1. **Alle verfügbaren Slots**
   - Testet alle 6 verfügbaren Slots (08:00-10:00 bis 18:00-20:00)
   - Verifiziert, dass jeder Slot akzeptiert wird

2. **Case-Sensitivity**
   - Slots mit Leerzeichen werden abgelehnt
   - Führende/nachgestellte Leerzeichen werden nicht akzeptiert

3. **Ungültige Werte**
   - Nicht existierende Slots (07:00-09:00, 21:00-23:00)
   - Leere Strings
   - null/undefined

---

## isValidDate() - Edge-Cases

### ✅ Getestete Edge-Cases

1. **Schaltjahre**
   - 29. Februar in Schaltjahren wird korrekt validiert
   - 29. Februar in Nicht-Schaltjahren wird abgelehnt

2. **Ungültige Monate**
   - Monat 0 wird abgelehnt
   - Monat 13 wird abgelehnt

3. **Ungültige Tage**
   - Tag 0 wird abgelehnt
   - Tag 32 wird abgelehnt
   - 31. April wird abgelehnt (April hat nur 30 Tage)

4. **Format-Validierung**
   - Führende Nullen erforderlich (2024-01-01 ✅, 2024-1-1 ❌)
   - Whitespace wird getrimmt (' 2024-12-31 ' ✅)

5. **Grenzfälle**
   - Heute um Mitternacht wird akzeptiert
   - Heute um 23:59:59 wird akzeptiert
   - Gestern wird abgelehnt
   - Sehr weit in der Zukunft (2099-12-31) wird akzeptiert

6. **Datentyp-Validierung**
   - Zahlen werden abgelehnt
   - Date-Objekte werden abgelehnt
   - Objekte/Arrays werden abgelehnt
   - Booleans werden abgelehnt

---

## validateAndTrimString() - Edge-Cases

### ✅ Getestete Edge-Cases

1. **Sehr lange Strings**
   - Strings mit 1000+ Zeichen werden akzeptiert

2. **Whitespace-Varianten**
   - Tabs (\t) werden getrimmt
   - Newlines (\n) werden getrimmt
   - Carriage Returns (\r) werden getrimmt
   - Non-breaking Spaces (\u00A0) werden getrimmt

3. **Sonderzeichen**
   - Strings mit Sonderzeichen (@#$%) werden akzeptiert
   - Strings mit Newlines werden akzeptiert

4. **Unicode**
   - Deutsche Umlaute (äöü) werden akzeptiert
   - Chinesische Zeichen werden akzeptiert

5. **Führende/nachgestellte Leerzeichen**
   - Werden korrekt getrimmt

---

## validateInteger() - Edge-Cases

### ✅ Getestete Edge-Cases

1. **Sehr große Zahlen**
   - Number.MAX_SAFE_INTEGER wird akzeptiert
   - Number.MAX_SAFE_INTEGER + 1 wird abgelehnt (nicht mehr sicher)

2. **String-Formatierung**
   - Strings mit Whitespace werden getrimmt ('  5  ' → 5)
   - Hexadezimale Strings werden abgelehnt ('0xFF')
   - Wissenschaftliche Notation wird abgelehnt ('1e2', '1.5e2')

3. **Führende Nullen**
   - '007' wird zu 7 normalisiert
   - '000' wird abgelehnt (0 ist nicht erlaubt)

4. **Negative Zahlen**
   - '-5' wird abgelehnt
   - '+5' wird abgelehnt

5. **Leere Strings**
   - '   ' (nur Whitespace) wird abgelehnt

6. **Zahl-Formate**
   - String-Zahlen ('1', '100') werden akzeptiert
   - Number-Objekte (1, 100) werden akzeptiert
   - Number-Objekte (new Number(5)) werden akzeptiert

---

## commonValidators - Edge-Cases

### ✅ Getestete Edge-Cases

1. **date-Validator**
   - Gültige Daten geben `true` zurück
   - Ungültige Daten geben Fehlermeldung-String zurück
   - Fehlermeldung enthält hilfreiche Informationen

2. **slot-Validator**
   - Gültige Slots geben `true` zurück
   - Ungültige Slots geben Fehlermeldung-String zurück
   - Fehlermeldung listet alle verfügbaren Slots auf

3. **string-Validator**
   - Verwendet fieldName in Fehlermeldungen
   - Leere Strings geben Fehlermeldung zurück
   - null/undefined geben Fehlermeldung zurück

4. **integer-Validator**
   - Verwendet fieldName in Fehlermeldungen
   - 0 gibt Fehlermeldung zurück
   - Negative Zahlen geben Fehlermeldung zurück

5. **normalizeString**
   - Konvertiert non-Strings zu Strings
   - null → 'null'
   - undefined → 'undefined'
   - NaN → 'NaN'

6. **normalizeInteger**
   - Ungültige Werte werden zu NaN
   - '12.5' wird zu 12 geparst (nicht 12.5)

---

## validators.body/query/params - Edge-Cases

### ✅ Getestete Edge-Cases

1. **Pflichtfelder**
   - Fehlende Pflichtfelder werden abgelehnt
   - Mehrere fehlende Pflichtfelder werden alle gemeldet

2. **Optionale Felder**
   - Fehlende optionale Felder werden übersprungen
   - Optionale Felder mit Werten werden validiert

3. **Typ-Validierung**
   - Falsche Typen werden abgelehnt
   - String-Typ erfordert String-Wert
   - Integer-Typ erfordert Integer-Wert

4. **Custom-Validator**
   - Custom-Validator werden aufgerufen
   - Validator kann `true` oder Fehlermeldung zurückgeben

5. **Normalisierung**
   - Werte werden normalisiert wenn normalize-Funktion vorhanden
   - Whitespace wird getrimmt

6. **Mehrere Fehler**
   - Alle Fehler werden gesammelt
   - Alle Fehler werden in Response zurückgegeben

---

## Coverage-Statistik

### Vorher (ursprüngliche Tests)
- **Tests:** ~15 Test-Cases
- **Edge-Cases:** ~10 Edge-Cases
- **Coverage:** ~50-60%

### Nachher (erweiterte Tests)
- **Tests:** ~80+ Test-Cases
- **Edge-Cases:** ~60+ Edge-Cases
- **Coverage:** ~80-90% (erwartet)

---

## Neue Test-Dateien

1. **tests/unit/validation.test.js** (erweitert)
   - Mehr Edge-Cases für isValidSlot
   - Mehr Edge-Cases für isValidDate
   - Mehr Edge-Cases für validateAndTrimString
   - Mehr Edge-Cases für validateInteger

2. **tests/unit/commonValidators.test.js** (neu)
   - Tests für alle commonValidators
   - date, slot, string, integer Validatoren
   - normalizeString, normalizeInteger Funktionen

3. **tests/unit/validators.test.js** (neu)
   - Tests für validators.body
   - Tests für validators.query
   - Tests für validators.params
   - Edge-Cases für Middleware

---

## Ausführen der Tests

```bash
# Alle Unit-Tests
npm run test:unit

# Nur Validierungs-Tests
npm test -- validation.test.js

# Nur commonValidators-Tests
npm test -- commonValidators.test.js

# Nur validators-Tests
npm test -- validators.test.js

# Mit Coverage
npm run test:coverage
```

---

## Nächste Schritte

- [ ] Performance-Tests für Edge-Cases
- [ ] Integration-Tests für Edge-Cases
- [ ] Dokumentation der gefundenen Bugs
- [ ] Code-Review der Edge-Case-Behandlung

---

**Erstellt:** $(date)  
**Aktualisiert:** $(date)  
**Tester:** Junior QA Team

