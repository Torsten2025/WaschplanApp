# 📋 Implementierungsplan: Buchungsregeln

**Stand:** 15.12.2025  
**Status:** ⏳ In Bearbeitung

---

## ✅ Bereits implementierte Regeln

### 1. Zeitliche Struktur ✅
- ✅ 6 fixe Slots pro Tag
- ✅ Slots sind zeitlich fix (08:00-10:00, 10:00-12:00, etc.)
- ✅ Buchungen sind slotbasiert

### 2. Maschinenstruktur ✅
- ✅ 3 Waschmaschinen + 1 Trocknungsraum vorhanden
- ✅ Jede Buchung bezieht sich auf eine Maschine
- ✅ Parallele Buchungen auf verschiedenen Maschinen möglich

### 7. Doppelbuchungen (teilweise) ✅
- ✅ Gleiche Maschine + Slot + Datum = nicht erlaubt
- ⚠️ **FEHLT:** Gleicher Slot + Datum + Person auf unterschiedlichen Maschinen = nicht erlaubt

### 8. Löschregeln ✅
- ✅ Person kann eigene Buchungen löschen
- ✅ Admin kann alle Buchungen löschen

### 9. Validierungsprinzip ✅
- ✅ Alle Regeln serverseitig geprüft

### 10. Fehlerverhalten ✅
- ✅ Klare Fehlermeldungen bei Regelverstößen

---

## ❌ Zu implementierende Regeln

### Regel 3: Tageslimiten pro Person
**Priorität:** 🔴 HOCH

**Anforderungen:**
- Max. 2 Waschmaschinen-Slots pro Person pro Tag
- Max. 1 Trocknungsraum-Slot pro Person pro Tag
- Maschinenübergreifend (nicht pro Maschine, sondern gesamt)

**Implementierung:**
```javascript
// In server.js POST /api/v1/bookings
// Nach Validierung der Maschine, vor Doppelbuchungs-Prüfung

// 1. Maschinentyp ermitteln
const machine = await dbHelper.get('SELECT * FROM machines WHERE id = ?', [validatedMachineId]);
const isWasher = machine.type === 'washer';
const isDryer = machine.type === 'dryer';

// 2. Bestehende Buchungen des Benutzers für dieses Datum zählen
const userBookingsToday = await dbHelper.all(
  `SELECT m.type 
   FROM bookings b
   INNER JOIN machines m ON b.machine_id = m.id
   WHERE b.user_name = ? AND b.date = ?`,
  [validatedUserName, validatedDate]
);

// 3. Zähle Waschmaschinen- und Trocknungsraum-Buchungen
let washerCount = 0;
let dryerCount = 0;

for (const booking of userBookingsToday) {
  if (booking.type === 'washer') {
    washerCount++;
  } else if (booking.type === 'dryer') {
    dryerCount++;
  }
}

// 4. Prüfe Limits
if (isWasher && washerCount >= 2) {
  apiResponse.validationError(res, 
    `Sie haben bereits 2 Waschmaschinen-Slots für ${validatedDate} gebucht. Maximum: 2 Slots pro Tag.`
  );
  return;
}

if (isDryer && dryerCount >= 1) {
  apiResponse.validationError(res, 
    `Sie haben bereits 1 Trocknungsraum-Slot für ${validatedDate} gebucht. Maximum: 1 Slot pro Tag.`
  );
  return;
}
```

**Code-Stelle:** `server.js` Zeile ~2430 (nach Maschinen-Validierung, vor Doppelbuchungs-Prüfung)

**Test-Szenarien:**
- [ ] Person bucht 2 Waschmaschinen-Slots → OK
- [ ] Person versucht 3. Waschmaschinen-Slot → Fehler
- [ ] Person bucht 1 Trocknungsraum-Slot → OK
- [ ] Person versucht 2. Trocknungsraum-Slot → Fehler
- [ ] Person bucht 2 Waschmaschinen + 1 Trocknungsraum → OK

---

### Regel 4: Vorausbuchungsregel
**Priorität:** 🔴 HOCH

**Anforderungen:**
- Max. 1 Buchung in der Zukunft pro Person
- Gilt für alle Maschinenarten gemeinsam
- Erst nach Ablauf oder Löschung darf erneut gebucht werden

**Implementierung:**
```javascript
// In server.js POST /api/v1/bookings
// Nach Tageslimiten-Prüfung, vor Doppelbuchungs-Prüfung

// 1. Heute ermitteln
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = today.toISOString().split('T')[0];

// 2. Prüfe ob Buchung in der Zukunft liegt
const bookingDate = new Date(validatedDate + 'T00:00:00');
const isFutureBooking = bookingDate > today;

if (isFutureBooking) {
  // 3. Prüfe ob Person bereits eine zukünftige Buchung hat
  const futureBookings = await dbHelper.all(
    `SELECT b.id, b.date, b.slot, m.name as machine_name, m.type
     FROM bookings b
     INNER JOIN machines m ON b.machine_id = m.id
     WHERE b.user_name = ? AND b.date > ?`,
    [validatedUserName, todayStr]
  );

  if (futureBookings.length > 0) {
    const nextBooking = futureBookings[0];
    apiResponse.validationError(res, 
      `Sie haben bereits eine zukünftige Buchung: ${nextBooking.machine_name} am ${nextBooking.date} (${nextBooking.slot}). ` +
      `Sie können erst nach Ablauf oder Löschung dieser Buchung eine neue erstellen.`
    );
    return;
  }
}
```

**Code-Stelle:** `server.js` Zeile ~2430 (nach Tageslimiten-Prüfung, vor Doppelbuchungs-Prüfung)

**Test-Szenarien:**
- [ ] Person bucht für heute → OK (auch wenn bereits zukünftige Buchung existiert)
- [ ] Person bucht für morgen → OK (wenn keine zukünftige Buchung existiert)
- [ ] Person versucht 2. zukünftige Buchung → Fehler
- [ ] Person löscht zukünftige Buchung → kann neue erstellen
- [ ] Person hat Buchung für heute → kann weitere für heute buchen

---

### Regel 6: Wochenend- und Sperrtage
**Priorität:** 🔴 HOCH

**Anforderungen:**
- Sonntag komplett gesperrt
- Keine Buchungen an Sonntagen
- Keine Admin-Overrides

**Implementierung:**
```javascript
// In server.js POST /api/v1/bookings
// Nach Datum-Validierung, vor Tageslimiten-Prüfung

// 1. Wochentag ermitteln (0 = Sonntag, 6 = Samstag)
const bookingDate = new Date(validatedDate + 'T00:00:00');
const dayOfWeek = bookingDate.getDay();

// 2. Sonntag prüfen
if (dayOfWeek === 0) {
  apiResponse.validationError(res, 
    'Buchungen sind an Sonntagen nicht möglich. Bitte wählen Sie einen anderen Tag.'
  );
  return;
}

// Optional: Konfigurierbare Sperrtage
const BLOCKED_WEEKDAYS = process.env.BLOCKED_WEEKDAYS 
  ? process.env.BLOCKED_WEEKDAYS.split(',').map(d => parseInt(d.trim()))
  : [0]; // Standard: Sonntag

if (BLOCKED_WEEKDAYS.includes(dayOfWeek)) {
  const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  apiResponse.validationError(res, 
    `Buchungen sind an ${dayNames[dayOfWeek]}en nicht möglich. Bitte wählen Sie einen anderen Tag.`
  );
  return;
}
```

**Code-Stelle:** `server.js` Zeile ~2410 (nach Datum-Validierung)

**Test-Szenarien:**
- [ ] Person versucht Buchung für Sonntag → Fehler
- [ ] Person bucht für Montag-Samstag → OK
- [ ] Admin versucht Buchung für Sonntag → Fehler (kein Override)

---

### Regel 7: Doppelbuchungen (Erweiterung)
**Priorität:** 🟡 MITTEL

**Anforderungen:**
- Person darf nicht zwei Buchungen im gleichen Slot haben
- Auch nicht auf unterschiedlichen Maschinen
- Slot + Datum + Person müssen eindeutig sein

**Aktueller Stand:**
- ✅ Gleiche Maschine + Slot + Datum = nicht erlaubt
- ❌ Gleicher Slot + Datum + Person auf unterschiedlichen Maschinen = noch erlaubt

**Implementierung:**
```javascript
// In server.js POST /api/v1/bookings
// Ersetze aktuelle Doppelbuchungs-Prüfung

// Aktuelle Prüfung (nur gleiche Maschine):
const existingBookingSameMachine = await dbHelper.get(
  'SELECT * FROM bookings WHERE machine_id = ? AND date = ? AND slot = ?',
  [validatedMachineId, validatedDate, validatedSlot]
);

if (existingBookingSameMachine) {
  apiResponse.conflict(res, 'Dieser Slot ist bereits für diese Maschine und dieses Datum gebucht.');
  return;
}

// NEUE Prüfung: Gleicher Slot + Datum + Person (maschinenübergreifend)
const existingBookingSamePerson = await dbHelper.get(
  'SELECT * FROM bookings WHERE user_name = ? AND date = ? AND slot = ?',
  [validatedUserName, validatedDate, validatedSlot]
);

if (existingBookingSamePerson) {
  const existingMachine = await dbHelper.get(
    'SELECT name FROM machines WHERE id = ?',
    [existingBookingSamePerson.machine_id]
  );
  apiResponse.conflict(res, 
    `Sie haben bereits eine Buchung für ${validatedSlot} am ${validatedDate} (${existingMachine.name}). ` +
    `Sie können nicht denselben Slot auf einer anderen Maschine buchen.`
  );
  return;
}
```

**Code-Stelle:** `server.js` Zeile ~2431 (aktuelle Doppelbuchungs-Prüfung erweitern)

**Test-Szenarien:**
- [ ] Person bucht Maschine 1, Slot 08:00-10:00 → OK
- [ ] Person versucht Maschine 2, Slot 08:00-10:00 (gleiches Datum) → Fehler
- [ ] Person bucht Maschine 1, Slot 10:00-12:00 → OK (anderer Slot)

---

## 📊 Implementierungsreihenfolge

### Phase 1: Kritische Regeln (SOFORT)
1. ✅ **Regel 6:** Wochenend- und Sperrtage (einfach, schnell)
2. ✅ **Regel 3:** Tageslimiten pro Person (wichtig für Fairness)
3. ✅ **Regel 4:** Vorausbuchungsregel (wichtig für Reihenfolge-Prinzip)

### Phase 2: Erweiterte Regeln (NACH Phase 1)
4. ✅ **Regel 7:** Doppelbuchungen erweitern (maschinenübergreifend)

---

## 🔧 Konfiguration

**Environment-Variablen für `.env`:**
```env
# Buchungsregeln
MAX_WASHER_SLOTS_PER_DAY=2
MAX_DRYER_SLOTS_PER_DAY=1
MAX_FUTURE_BOOKINGS_PER_USER=1
BLOCKED_WEEKDAYS=0  # 0=Sonntag, 1=Montag, etc. (kommagetrennt)
```

---

## 📝 Code-Änderungen Übersicht

### `server.js` - POST /api/v1/bookings

**Aktuelle Reihenfolge der Validierungen:**
1. Pflichtfelder-Validierung ✅
2. Datum-Validierung ✅
3. Slot-Validierung ✅
4. Maschinen-Validierung ✅
5. **NEU:** Wochenend-Prüfung ⏳
6. **NEU:** Tageslimiten-Prüfung ⏳
7. **NEU:** Vorausbuchungs-Prüfung ⏳
8. Doppelbuchungs-Prüfung ✅ (erweitern)
9. Buchung erstellen ✅

---

## ✅ Abnahmekriterien

### Regel 3: Tageslimiten
- [ ] Max. 2 Waschmaschinen-Slots pro Tag werden durchgesetzt
- [ ] Max. 1 Trocknungsraum-Slot pro Tag wird durchgesetzt
- [ ] Fehlermeldung ist klar und verständlich

### Regel 4: Vorausbuchungsregel
- [ ] Max. 1 zukünftige Buchung wird durchgesetzt
- [ ] Buchungen für heute sind weiterhin möglich
- [ ] Nach Löschung kann erneut gebucht werden
- [ ] Fehlermeldung zeigt bestehende Buchung an

### Regel 6: Wochenend-Sperre
- [ ] Sonntag ist komplett gesperrt
- [ ] Keine Buchungen an Sonntagen möglich
- [ ] Admin kann nicht umgehen

### Regel 7: Doppelbuchungen erweitert
- [ ] Gleicher Slot + Datum + Person auf verschiedenen Maschinen wird verhindert
- [ ] Fehlermeldung zeigt bestehende Buchung an

---

## 🧪 Test-Plan

### Unit-Tests
- [ ] Test: Tageslimiten werden korrekt geprüft
- [ ] Test: Vorausbuchungsregel wird korrekt geprüft
- [ ] Test: Sonntag wird korrekt gesperrt
- [ ] Test: Doppelbuchungen maschinenübergreifend werden verhindert

### Integration-Tests
- [ ] Test: Komplette Buchungs-Flow mit allen Regeln
- [ ] Test: Fehlermeldungen sind korrekt
- [ ] Test: Edge-Cases (z.B. Buchung für heute + zukünftige Buchung)

### Manuelle Tests
- [ ] Test: Alle Regeln im Browser testen
- [ ] Test: Fehlermeldungen sind verständlich
- [ ] Test: Admin kann nicht umgehen

---

**Nächste Schritte:**
1. Implementierung starten mit Phase 1 (Regeln 6, 3, 4)
2. Tests durchführen
3. Dokumentation aktualisieren

