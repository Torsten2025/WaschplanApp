# 🐛 Bugs in der Buchungslogik

**Erstellt:** 2025-12-16  
**Status:** Analyse abgeschlossen

---

## 📋 Vergleich: Dokument vs. Implementierung

### Regel 3: Tageslimiten pro Person

**Dokument:**
- Maximal 2 Waschmaschinen-Slots pro Person pro Tag
- Maximal 1 Trocknungsraum-Slot pro Person pro Tag

**Implementierung:**
- `MAX_WASHER_MACHINES_PER_DAY = 3` (Standard)
- Trocknungsräume: "Nur 1 Trockenraum insgesamt" (nicht pro Tag)

**BUG #1:** ❌ Waschmaschinen-Limit ist falsch
- **Aktuell:** 3 verschiedene Waschmaschinen pro Tag erlaubt
- **Sollte sein:** 2 Waschmaschinen-Slots pro Tag
- **Datei:** `server.js` Zeile ~3090

**BUG #2:** ❌ Trocknungsraum-Limit ist falsch
- **Aktuell:** Nur 1 Trockenraum insgesamt (nicht pro Tag)
- **Sollte sein:** Maximal 1 Trocknungsraum-Slot pro Tag
- **Datei:** `server.js` Zeile ~3211-3237

---

### Regel 5: Reihenfolge-Prinzip

**Dokument:**
- Eintragen → Waschen → erneut eintragen
- Verhinderung von Vorrats- oder Blockbuchungen

**Implementierung:**
- Prüft ob Waschmaschinen-Buchung existiert für Trocknungsraum
- Prüft ob Trocknungsraum-Slot nach Waschmaschinen-Slot beginnt

**BUG #3:** ⚠️ Reihenfolge-Prinzip nicht vollständig implementiert
- **Problem:** Es wird nur geprüft, ob eine Waschmaschinen-Buchung existiert, aber nicht ob sie bereits "abgeschlossen" ist
- **Sollte sein:** Trocknungsraum-Buchung nur möglich, wenn Waschmaschinen-Buchung bereits abgeschlossen ist (oder am selben Tag)
- **Datei:** `server.js` Zeile ~3239-3294

---

### Regel 7: Doppelbuchungen

**Dokument:**
- Eine Person darf nicht zwei Buchungen im gleichen Slot haben
- Auch nicht auf unterschiedlichen Maschinen
- Slot + Datum + Person müssen eindeutig sein

**Implementierung:**
- Prüft nur: Gleiche Maschine + Slot + Datum
- Kommentar: "Die Prüfung auf denselben Slot auf verschiedenen Maschinen wurde entfernt"

**BUG #4:** ❌ Doppelbuchungs-Prüfung unvollständig
- **Problem:** Es wird nicht geprüft, ob die Person denselben Slot auf verschiedenen Maschinen gebucht hat
- **Sollte sein:** Prüfung ob Person denselben Slot + Datum auf verschiedenen Maschinen hat
- **Datei:** `server.js` Zeile ~3637-3662

---

### Regel 3: Waschmaschinen-Limits (Details)

**Dokument:**
- Maximal 2 Waschmaschinen-Slots pro Person pro Tag
- Diese Limits gelten maschinenübergreifend

**Implementierung:**
- Prüft ob bereits ein Slot für diese Maschine gebucht ist (OK)
- Prüft ob alle Waschmaschinen-Buchungen denselben Slot haben (OK)
- Prüft ob bereits 3 verschiedene Waschmaschinen gebucht sind (BUG!)

**BUG #5:** ❌ Limit ist 3 statt 2
- **Aktuell:** `MAX_WASHER_MACHINES_PER_DAY = 3`
- **Sollte sein:** `MAX_WASHER_MACHINES_PER_DAY = 2`
- **Datei:** `server.js` Zeile ~3090

---

### Regel 3: Trocknungsraum-Limits (Details)

**Dokument:**
- Maximal 1 Trocknungsraum-Slot pro Person pro Tag

**Implementierung:**
- Prüft ob bereits ein Trockenraum insgesamt gebucht ist
- Erlaubt bis zu 3 aufeinanderfolgende Slots (Serie)

**BUG #6:** ❌ Limit ist "insgesamt" statt "pro Tag"
- **Aktuell:** Nur 1 Trockenraum insgesamt (über alle Tage)
- **Sollte sein:** Maximal 1 Trocknungsraum-Slot pro Tag
- **Datei:** `server.js` Zeile ~3211-3237

**Hinweis:** Die Serie-Regel (bis zu 3 aufeinanderfolgende Slots) könnte korrekt sein, wenn sie als "1 Buchung" zählt.

---

## 🔧 Zu behebende Bugs

### Priorität 1 (Kritisch - Regeln verletzt)

1. **BUG #1:** Waschmaschinen-Limit von 3 auf 2 ändern
2. **BUG #2:** Trocknungsraum-Limit von "insgesamt" auf "pro Tag" ändern
3. **BUG #4:** Doppelbuchungs-Prüfung für verschiedene Maschinen hinzufügen

### Priorität 2 (Wichtig - Logik verbessern)

4. **BUG #3:** Reihenfolge-Prinzip vollständig implementieren

---

## 📝 Detaillierte Bug-Beschreibungen

### BUG #1: Waschmaschinen-Limit falsch

**Aktueller Code:**
```javascript
const MAX_WASHER_MACHINES_PER_DAY = parseInt(process.env.MAX_WASHER_MACHINES_PER_DAY) || 3;
```

**Sollte sein:**
```javascript
const MAX_WASHER_MACHINES_PER_DAY = parseInt(process.env.MAX_WASHER_MACHINES_PER_DAY) || 2;
```

**Auswirkung:**
- Benutzer können 3 Waschmaschinen pro Tag buchen statt 2
- Verletzt Regel 3

---

### BUG #2: Trocknungsraum-Limit falsch

**Aktueller Code:**
```javascript
// Prüfe alle Trockenräume-Buchungen der Person (auch andere Tage)
const allDryerBookings = await dbHelper.all(
  `SELECT b.date, b.slot, b.machine_id, m.name as machine_name
   FROM bookings b
   INNER JOIN machines m ON b.machine_id = m.id
   WHERE b.user_name = ? AND (m.type = 'dryer' OR m.type = 'tumbler')
   ORDER BY b.date ASC, b.slot ASC`,
  [validatedUserName]
);
```

**Sollte sein:**
```javascript
// Prüfe nur Trockenräume-Buchungen für DIESEN Tag
const dryerBookingsToday = await dbHelper.all(
  `SELECT b.date, b.slot, b.machine_id, m.name as machine_name
   FROM bookings b
   INNER JOIN machines m ON b.machine_id = m.id
   WHERE b.user_name = ? AND b.date = ? AND (m.type = 'dryer' OR m.type = 'tumbler')
   ORDER BY b.slot ASC`,
  [validatedUserName, validatedDate]
);
```

**Auswirkung:**
- Benutzer können nur 1 Trockenraum insgesamt buchen (über alle Tage)
- Sollte sein: 1 Trockenraum pro Tag

---

### BUG #4: Doppelbuchungs-Prüfung fehlt

**Aktueller Code:**
```javascript
// HINWEIS: Die Prüfung auf denselben Slot auf verschiedenen Maschinen wurde entfernt.
```

**Sollte sein:**
```javascript
// Prüfe ob Person denselben Slot + Datum auf verschiedenen Maschinen hat
const existingBookingSameSlot = await dbHelper.get(
  'SELECT * FROM bookings WHERE user_name = ? AND date = ? AND slot = ? AND machine_id != ?',
  [validatedUserName, validatedDate, validatedSlot, validatedMachineId]
);

if (existingBookingSameSlot) {
  apiResponse.validationError(res, 
    'Sie haben bereits eine Buchung für diesen Slot und dieses Datum auf einer anderen Maschine. ' +
    'Eine Person darf nicht zwei Buchungen im gleichen Slot haben, auch nicht auf unterschiedlichen Maschinen.'
  );
  return;
}
```

**Auswirkung:**
- Benutzer können denselben Slot auf verschiedenen Maschinen buchen
- Verletzt Regel 7

---

## 🎯 Fix-Plan

1. **MAX_WASHER_MACHINES_PER_DAY auf 2 ändern**
2. **Trocknungsraum-Limit auf "pro Tag" ändern**
3. **Doppelbuchungs-Prüfung hinzufügen**
4. **Tests durchführen**

---

**Status:** Bereit für Fixes

