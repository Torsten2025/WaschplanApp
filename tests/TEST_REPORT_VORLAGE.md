# Test-Report Vorlage

## Test-Session Informationen

**Datum:** _______________  
**Tester:** _______________  
**Version:** _______________  
**Umgebung:** ⬜ Development / ⬜ Staging / ⬜ Production

---

## Test-Ergebnisse

### Unit-Tests

**Ausgeführt:** `npm run test:unit`

**Ergebnis:**
- ⬜ Alle Tests bestanden
- ⬜ Einige Tests fehlgeschlagen
- ⬜ Alle Tests fehlgeschlagen

**Anzahl Tests:** _______________  
**Bestanden:** _______________  
**Fehlgeschlagen:** _______________

**Fehlgeschlagene Tests:**
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

---

### Integration-Tests

**Ausgeführt:** `npm run test:integration`

**Ergebnis:**
- ⬜ Alle Tests bestanden
- ⬜ Einige Tests fehlgeschlagen
- ⬜ Alle Tests fehlgeschlagen

**Anzahl Tests:** _______________  
**Bestanden:** _______________  
**Fehlgeschlagen:** _______________

**Fehlgeschlagene Tests:**
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

---

## Coverage-Report

**Ausgeführt:** `npm run test:coverage`

### Coverage-Ergebnisse

| Datei | Statements | Branches | Functions | Lines |
|-------|------------|----------|-----------|-------|
| server.js | ___% | ___% | ___% | ___% |
| api.js | ___% | ___% | ___% | ___% |
| app.js | ___% | ___% | ___% | ___% |

### Gesamt-Coverage

- **Statements:** ___% (Ziel: 60%+)
- **Branches:** ___% (Ziel: 60%+)
- **Functions:** ___% (Ziel: 60%+)
- **Lines:** ___% (Ziel: 60%+)

**Status:** ⬜ Ziel erreicht / ⬜ Ziel nicht erreicht

---

## Getestete Features

### API-Endpunkte

- [ ] GET /api/v1/machines
- [ ] GET /api/v1/slots
- [ ] GET /api/v1/bookings (mit date)
- [ ] GET /api/v1/bookings/week
- [ ] GET /api/v1/bookings/month
- [ ] POST /api/v1/bookings
- [ ] DELETE /api/v1/bookings/:id

### Validierungsfunktionen

- [ ] isValidSlot()
- [ ] isValidDate()
- [ ] validateAndTrimString()
- [ ] validateInteger()

---

## Gefundene Probleme

### Kritische Probleme

1. **Problem:** _________________________________________________
   **Test:** _________________________________________________
   **Beschreibung:** _________________________________________________

2. **Problem:** _________________________________________________
   **Test:** _________________________________________________
   **Beschreibung:** _________________________________________________

### Mittlere Probleme

1. **Problem:** _________________________________________________
   **Test:** _________________________________________________
   **Beschreibung:** _________________________________________________

### Niedrige Probleme

1. **Problem:** _________________________________________________
   **Test:** _________________________________________________
   **Beschreibung:** _________________________________________________

---

## Empfehlungen

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

---

## Nächste Schritte

- [ ] Kritische Probleme beheben
- [ ] Coverage verbessern
- [ ] Fehlende Tests hinzufügen
- [ ] Tests in CI/CD integrieren

---

## Sign-off

**Tester:** _______________  
**Datum:** _______________  
**Status:** ⬜ Bestanden / ⬜ Mit Auflagen / ⬜ Fehlgeschlagen

