# 📋 Buchungsregeln - Implementierungsstatus

**Stand:** 15.12.2025  
**Status:** ⏳ In Bearbeitung

---

## ✅ Bereits implementierte Regeln

### 1. Pflichtfelder-Validierung
- ✅ `machine_id` muss vorhanden und eine positive Zahl sein
- ✅ `date` muss vorhanden sein (Format: YYYY-MM-DD)
- ✅ `slot` muss vorhanden und nicht leer sein
- ✅ `user_name` muss vorhanden und nicht leer sein
- ✅ `user_name` darf maximal 100 Zeichen lang sein

### 2. Datum-Validierung
- ✅ Datum muss Format YYYY-MM-DD haben
- ✅ Datum muss gültig sein (z.B. nicht 2024-13-45)
- ✅ Datum darf nicht in Vergangenheit liegen
- ✅ Frontend setzt automatisch auf heute, wenn Datum in Vergangenheit

### 3. Slot-Validierung
- ✅ Slot muss ein gültiger Zeit-Slot sein
- ✅ Gültige Slots: `08:00-10:00`, `10:00-12:00`, `12:00-14:00`, `14:00-16:00`, `16:00-18:00`, `18:00-20:00`

### 4. Maschinen-Validierung
- ✅ Maschine muss existieren (404 wenn nicht gefunden)

### 5. Doppelbuchungs-Prüfung
- ✅ Gleiche Maschine + gleicher Slot + gleiches Datum = nicht erlaubt
- ✅ UNIQUE Index in Datenbank vorhanden
- ✅ 409 Conflict bei Doppelbuchung

---

## 🔴 Fehlende / Zu implementierende Regeln

### 1. Maximale Buchungen pro Benutzer
**Regel:** Ein Benutzer darf maximal X Buchungen pro Tag haben

**Implementierung:**
```javascript
// In server.js POST /api/v1/bookings
const userBookingsToday = await dbHelper.all(
  'SELECT COUNT(*) as count FROM bookings WHERE user_name = ? AND date = ?',
  [validatedUserName, validatedDate]
);

const MAX_BOOKINGS_PER_USER_PER_DAY = 2; // Konfigurierbar
if (userBookingsToday[0].count >= MAX_BOOKINGS_PER_USER_PER_DAY) {
  apiResponse.validationError(res, `Sie haben bereits ${MAX_BOOKINGS_PER_USER_PER_DAY} Buchungen für dieses Datum.`);
  return;
}
```

**Status:** ⏳ Nicht implementiert

---

### 2. Maximale Vorlaufzeit
**Regel:** Buchungen können nur X Tage im Voraus gemacht werden (z.B. max. 30 Tage)

**Implementierung:**
```javascript
// In server.js isValidDate() oder POST /api/v1/bookings
const MAX_ADVANCE_DAYS = 30;
const maxDate = new Date();
maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
maxDate.setHours(23, 59, 59, 999);

if (date > maxDate) {
  apiResponse.validationError(res, `Buchungen können nur bis zu ${MAX_ADVANCE_DAYS} Tage im Voraus gemacht werden.`);
  return;
}
```

**Status:** ⏳ Nicht implementiert

---

### 3. Mindestvorlaufzeit
**Regel:** Buchungen müssen mindestens X Stunden/Tage im Voraus gemacht werden (z.B. mindestens 2 Stunden)

**Implementierung:**
```javascript
// In server.js POST /api/v1/bookings
const MIN_ADVANCE_HOURS = 2;
const bookingDateTime = new Date(`${validatedDate}T${slotStart}`);
const now = new Date();
const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

if (hoursUntilBooking < MIN_ADVANCE_HOURS) {
  apiResponse.validationError(res, `Buchungen müssen mindestens ${MIN_ADVANCE_HOURS} Stunden im Voraus gemacht werden.`);
  return;
}
```

**Status:** ⏳ Nicht implementiert

---

### 4. Überlappende Slots verhindern
**Regel:** Ein Benutzer kann nicht zwei überlappende Slots buchen (z.B. nicht 08:00-10:00 und 09:00-11:00)

**Implementierung:**
```javascript
// In server.js POST /api/v1/bookings
// Prüfe ob Benutzer bereits einen überlappenden Slot gebucht hat
const userBookingsSameDay = await dbHelper.all(
  'SELECT slot FROM bookings WHERE user_name = ? AND date = ?',
  [validatedUserName, validatedDate]
);

const requestedSlot = TIME_SLOTS.find(s => s.label === validatedSlot);
if (requestedSlot) {
  for (const booking of userBookingsSameDay) {
    const bookedSlot = TIME_SLOTS.find(s => s.label === booking.slot);
    if (bookedSlot && slotsOverlap(requestedSlot, bookedSlot)) {
      apiResponse.conflict(res, 'Sie haben bereits einen überlappenden Slot für dieses Datum gebucht.');
      return;
    }
  }
}

function slotsOverlap(slot1, slot2) {
  return (slot1.start < slot2.end && slot1.end > slot2.start);
}
```

**Status:** ⏳ Nicht implementiert

---

### 5. Buchungen nur für bestimmte Wochentage
**Regel:** Buchungen nur für bestimmte Wochentage erlauben (z.B. nur Mo-Fr, nicht Wochenende)

**Implementierung:**
```javascript
// In server.js POST /api/v1/bookings
const ALLOWED_WEEKDAYS = [1, 2, 3, 4, 5]; // Mo-Fr (0=Sonntag, 6=Samstag)
const bookingDate = new Date(validatedDate + 'T00:00:00');
const dayOfWeek = bookingDate.getDay();

if (!ALLOWED_WEEKDAYS.includes(dayOfWeek)) {
  apiResponse.validationError(res, 'Buchungen sind nur von Montag bis Freitag möglich.');
  return;
}
```

**Status:** ⏳ Nicht implementiert

---

### 6. Maximale Anzahl aktiver Buchungen
**Regel:** Ein Benutzer darf maximal X aktive Buchungen haben (unabhängig vom Datum)

**Implementierung:**
```javascript
// In server.js POST /api/v1/bookings
const MAX_ACTIVE_BOOKINGS = 5;
const today = new Date().toISOString().split('T')[0];

const activeBookings = await dbHelper.get(
  'SELECT COUNT(*) as count FROM bookings WHERE user_name = ? AND date >= ?',
  [validatedUserName, today]
);

if (activeBookings.count >= MAX_ACTIVE_BOOKINGS) {
  apiResponse.validationError(res, `Sie haben bereits ${MAX_ACTIVE_BOOKINGS} aktive Buchungen. Bitte löschen Sie eine Buchung, bevor Sie eine neue erstellen.`);
  return;
}
```

**Status:** ⏳ Nicht implementiert

---

### 7. Buchungszeitfenster (z.B. nur während Öffnungszeiten)
**Regel:** Buchungen können nur zu bestimmten Zeiten gemacht werden (z.B. nur während Öffnungszeiten)

**Implementierung:**
```javascript
// In server.js POST /api/v1/bookings
const BOOKING_HOURS_START = 8; // 8 Uhr
const BOOKING_HOURS_END = 18; // 18 Uhr
const now = new Date();
const currentHour = now.getHours();

if (currentHour < BOOKING_HOURS_START || currentHour >= BOOKING_HOURS_END) {
  apiResponse.validationError(res, `Buchungen können nur zwischen ${BOOKING_HOURS_START}:00 und ${BOOKING_HOURS_END}:00 Uhr gemacht werden.`);
  return;
}
```

**Status:** ⏳ Nicht implementiert

---

## 📝 Empfohlene Implementierungsreihenfolge

### Phase 1: Grundlegende Regeln (WICHTIG)
1. ✅ Maximale Buchungen pro Benutzer pro Tag
2. ✅ Maximale Vorlaufzeit (z.B. 30 Tage)
3. ✅ Überlappende Slots verhindern

### Phase 2: Erweiterte Regeln (WICHTIG)
4. ✅ Mindestvorlaufzeit (z.B. 2 Stunden)
5. ✅ Maximale Anzahl aktiver Buchungen

### Phase 3: Optionale Regeln (NICHT KRITISCH)
6. ⚠️ Buchungen nur für bestimmte Wochentage
7. ⚠️ Buchungszeitfenster

---

## 🔧 Konfiguration

Alle Regeln sollten über Environment-Variablen konfigurierbar sein:

```env
# Buchungsregeln
MAX_BOOKINGS_PER_USER_PER_DAY=2
MAX_ADVANCE_DAYS=30
MIN_ADVANCE_HOURS=2
MAX_ACTIVE_BOOKINGS=5
ALLOWED_WEEKDAYS=1,2,3,4,5
BOOKING_HOURS_START=8
BOOKING_HOURS_END=18
```

---

## 📊 Test-Szenarien

Für jede neue Regel sollten Test-Szenarien erstellt werden:

1. **Test:** Regel wird korrekt angewendet
2. **Test:** Fehlermeldung ist aussagekräftig
3. **Test:** Edge-Cases werden abgedeckt
4. **Test:** Frontend zeigt Fehler korrekt an

---

**Nächste Schritte:**
1. Welche Regeln sollen implementiert werden?
2. Welche Werte sollen für die Limits verwendet werden?
3. Sollen die Regeln konfigurierbar sein?

