# 📋 Aufgabe: Senioren-Rolle & Validierungs-Bypass implementieren

**Zugewiesen an:** Junior Backend Entwickler  
**Priorität:** 🟡 MITTEL (Feature-Erweiterung)  
**Geschätzte Zeit:** 4-6 Stunden  
**Status:** ⏳ Offen

---

## 📋 Aufgaben-Übersicht

### 1. Senioren-Rolle in Datenbank unterstützen
### 2. Validierungs-Bypass für Senioren implementieren
### 3. Intelligente Konfliktlösung (automatische Slot-Alternative)
### 4. Logging für Senioren-Buchungen
### 5. Auto-Login-Endpunkt für Tablet

---

## 🎯 Aufgabe 1: Senioren-Rolle in Datenbank unterstützen

### Problem:
- Aktuell gibt es nur `admin` und `user` Rollen
- Neue Rolle `senior` muss unterstützt werden
- Datenbank-Schema unterstützt bereits TEXT für `role` (keine Migration nötig)

### Lösung:
- Prüfe ob `users.role` bereits `'senior'` unterstützt (TEXT-Feld)
- Falls nicht: Migration hinzufügen (unwahrscheinlich, da TEXT)

### Code-Stellen:
- `server.js` - `initDatabase()` (Zeile ~650-900)
- `users`-Tabelle: `role TEXT NOT NULL DEFAULT 'user'`

### Akzeptanzkriterien:
- [ ] `users.role` kann `'senior'` enthalten
- [ ] Standard-Rolle bleibt `'user'`
- [ ] Admin kann Senioren-Benutzer erstellen

---

## 🎯 Aufgabe 2: Validierungs-Bypass für Senioren implementieren

### Problem:
- Aktuell gibt es 10 Validierungsregeln für Buchungen
- Senioren sollen keine Fehlermeldungen sehen
- Aber: System muss konsistent bleiben (keine echten Konflikte)

### Lösung:
- Prüfe `user.role === 'senior'` vor Validierungen
- Wenn `senior`: Überspringe alle Validierungen, aber prüfe Doppelbuchungen im Hintergrund
- Bei Doppelbuchung: Automatisch nächsten freien Slot wählen

### Code-Stellen:
- `server.js` - `POST /api/v1/bookings` (Zeile ~2470-3100)

### Konkrete Änderungen:

#### 2.1 Rolle prüfen
```javascript
// Nach Zeile ~2519 (nach Maschine-Existenz-Prüfung)
const user = await getCurrentUser(req);
const isSenior = user && user.role === 'senior';

// Wenn nicht eingeloggt: user_name aus Request verwenden
// Wenn eingeloggt: user_name aus Session verwenden
const bookingUserName = user ? user.username : validatedUserName;
```

#### 2.2 Validierungen überspringen für Senioren
```javascript
// REGEL 6: Wochenend- und Sperrtage (Zeile ~2521-2569)
if (!isSenior) {
  // Normale Sonntag-Regel
  if (isBlockedDay && isWasher) {
    apiResponse.validationError(res, '...');
    return;
  }
} else {
  // Für Senioren: Automatisch auf nächsten Werktag verschieben
  if (isBlockedDay && isWasher) {
    // Finde nächsten Werktag
    let nextDate = new Date(bookingDate);
    nextDate.setDate(nextDate.getDate() + 1);
    while (BLOCKED_WEEKDAYS.includes(nextDate.getDay())) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    validatedDate = nextDate.toISOString().split('T')[0];
    logger.info('Senioren-Buchung: Sonntag automatisch auf Werktag verschoben', {
      original_date: req.body.date,
      new_date: validatedDate
    });
  }
}
```

#### 2.3 Tageslimiten überspringen (Zeile ~2580-2658)
```javascript
// REGEL 3: Tageslimiten pro Person
if (!isSenior) {
  // Normale Tageslimit-Prüfung
  if (isWasher && washerCount >= MAX_WASHER_SLOTS_PER_DAY) {
    apiResponse.validationError(res, '...');
    return;
  }
}
// Für Senioren: Keine Prüfung (unbegrenzt buchen)
```

#### 2.4 Trocknungsraum-Voraussetzung (Zeile ~2664-2781)
```javascript
// Für Senioren: Automatisch Waschmaschinen-Buchung erstellen (falls nicht vorhanden)
if (isDryer && isSenior) {
  if (!isBlockedDay) {
    const washerBookingsSameDay = await dbHelper.all(/* ... */);
    if (washerBookingsSameDay.length === 0) {
      // Automatisch Waschmaschinen-Buchung im ersten Slot erstellen
      const firstWasher = await dbHelper.get(
        'SELECT * FROM machines WHERE type = ? LIMIT 1',
        ['washer']
      );
      if (firstWasher) {
        const firstSlot = TIME_SLOTS[0].label;
        // Prüfe ob Slot frei ist
        const existing = await dbHelper.get(
          'SELECT * FROM bookings WHERE machine_id = ? AND date = ? AND slot = ?',
          [firstWasher.id, validatedDate, firstSlot]
        );
        if (!existing) {
          // Erstelle automatisch Waschmaschinen-Buchung
          await dbHelper.run(
            'INSERT INTO bookings (machine_id, date, slot, user_name) VALUES (?, ?, ?, ?)',
            [firstWasher.id, validatedDate, firstSlot, bookingUserName]
          );
          logger.info('Senioren-Buchung: Automatisch Waschmaschinen-Buchung erstellt', {
            washer_id: firstWasher.id,
            date: validatedDate,
            slot: firstSlot
          });
        }
      }
    }
  }
}
```

#### 2.5 "1x im Voraus"-Regel überspringen (Zeile ~2931-3104)
```javascript
// REGEL: Nur eine zukünftige Buchung pro Person
if (!isSenior) {
  // Normale Vorausbuchungs-Prüfung
  if (isFutureBooking && hasFutureBooking) {
    apiResponse.validationError(res, '...');
    return;
  }
}
// Für Senioren: Keine Prüfung (mehrere zukünftige Buchungen möglich)
```

### Akzeptanzkriterien:
- [ ] Senioren-Benutzer können ohne Fehlermeldungen buchen
- [ ] Sonntag-Buchungen werden automatisch auf Werktag verschoben
- [ ] Tageslimiten werden ignoriert
- [ ] "1x im Voraus"-Regel wird ignoriert
- [ ] Trocknungsraum-Buchungen erstellen automatisch Waschmaschinen-Buchung (falls nötig)

---

## 🎯 Aufgabe 3: Intelligente Konfliktlösung (Doppelbuchungen)

### Problem:
- Doppelbuchungen müssen verhindert werden (auch für Senioren)
- Aber: Keine Fehlermeldungen für Senioren
- Lösung: Automatisch nächsten freien Slot wählen

### Lösung:
- Prüfe Doppelbuchung im Hintergrund
- Wenn Doppelbuchung: Finde nächsten freien Slot (gleiche Maschine, gleiches Datum)
- Erstelle Buchung im nächsten freien Slot

### Code-Stellen:
- `server.js` - `POST /api/v1/bookings` (nach Zeile ~3104, vor INSERT)

### Konkrete Implementierung:

```javascript
// Prüfe Doppelbuchung (auch für Senioren)
const existingBooking = await dbHelper.get(
  'SELECT * FROM bookings WHERE machine_id = ? AND date = ? AND slot = ?',
  [validatedMachineId, validatedDate, validatedSlot]
);

if (existingBooking) {
  if (isSenior) {
    // Für Senioren: Automatisch nächsten freien Slot wählen
    const currentSlotIndex = TIME_SLOTS.findIndex(s => s.label === validatedSlot);
    let nextSlotIndex = currentSlotIndex + 1;
    let foundSlot = null;
    
    // Suche nächsten freien Slot (gleiche Maschine, gleiches Datum)
    while (nextSlotIndex < TIME_SLOTS.length && !foundSlot) {
      const nextSlot = TIME_SLOTS[nextSlotIndex].label;
      const nextBooking = await dbHelper.get(
        'SELECT * FROM bookings WHERE machine_id = ? AND date = ? AND slot = ?',
        [validatedMachineId, validatedDate, nextSlot]
      );
      if (!nextBooking) {
        foundSlot = nextSlot;
      }
      nextSlotIndex++;
    }
    
    if (foundSlot) {
      validatedSlot = foundSlot;
      logger.info('Senioren-Buchung: Doppelbuchung automatisch aufgelöst', {
        original_slot: req.body.slot,
        new_slot: foundSlot,
        machine_id: validatedMachineId,
        date: validatedDate
      });
    } else {
      // Kein freier Slot gefunden: Verschiebe auf nächsten Tag
      let nextDate = new Date(validatedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      validatedDate = nextDate.toISOString().split('T')[0];
      validatedSlot = TIME_SLOTS[0].label; // Erster Slot des nächsten Tages
      logger.info('Senioren-Buchung: Kein freier Slot gefunden, auf nächsten Tag verschoben', {
        original_date: req.body.date,
        original_slot: req.body.slot,
        new_date: validatedDate,
        new_slot: validatedSlot
      });
    }
  } else {
    // Für normale Benutzer: Fehlermeldung
    apiResponse.conflict(res, 'Dieser Slot ist bereits gebucht');
    return;
  }
}
```

### Akzeptanzkriterien:
- [ ] Doppelbuchungen werden automatisch aufgelöst (nächster freier Slot)
- [ ] Wenn kein freier Slot: Automatisch auf nächsten Tag verschieben
- [ ] Alle automatischen Änderungen werden geloggt
- [ ] Normale Benutzer erhalten weiterhin Fehlermeldungen

---

## 🎯 Aufgabe 4: Logging für Senioren-Buchungen

### Problem:
- Senioren-Buchungen müssen nachverfolgbar sein
- Admin soll sehen, welche Buchungen von Senioren erstellt wurden

### Lösung:
- Logge alle Senioren-Buchungen mit Flag `is_senior_booking: true`
- Optional: Neues Feld in `bookings`-Tabelle: `is_senior_booking INTEGER DEFAULT 0`

### Code-Stellen:
- `server.js` - `POST /api/v1/bookings` (nach INSERT)

### Konkrete Implementierung:

#### Option A: In `bookings`-Tabelle speichern (empfohlen)
```javascript
// Migration: Neues Feld hinzufügen
await dbHelper.run(`
  ALTER TABLE bookings 
  ADD COLUMN is_senior_booking INTEGER DEFAULT 0
`);

// Beim Erstellen der Buchung:
await dbHelper.run(
  'INSERT INTO bookings (machine_id, date, slot, user_name, is_senior_booking) VALUES (?, ?, ?, ?, ?)',
  [validatedMachineId, validatedDate, validatedSlot, bookingUserName, isSenior ? 1 : 0]
);
```

#### Option B: Nur im Log (einfacher, aber weniger nachverfolgbar)
```javascript
// Beim Erstellen der Buchung:
logger.info('Buchung erstellt', {
  booking_id: result.lastID,
  machine_id: validatedMachineId,
  date: validatedDate,
  slot: validatedSlot,
  user_name: bookingUserName,
  is_senior_booking: isSenior
});
```

**Empfehlung:** Option A (in Datenbank speichern)

### Akzeptanzkriterien:
- [ ] Alle Senioren-Buchungen werden markiert
- [ ] Admin kann Senioren-Buchungen filtern
- [ ] Logs enthalten `is_senior_booking` Flag

---

## 🎯 Aufgabe 5: Auto-Login-Endpunkt für Tablet

### Problem:
- Tablet soll automatisch eingeloggt sein (kein Login-Dialog)
- Sicherheit: Nur für Senioren-Ansicht, nicht für Admin

### Lösung:
- Neuer Endpunkt: `POST /api/v1/auth/auto-login-senior`
- Prüft ob Auto-Login erlaubt ist (z.B. über IP oder Konfiguration)
- Loggt automatisch als Senioren-Benutzer ein

### Code-Stellen:
- `server.js` - Neue Route nach `/api/v1/auth/login`

### Konkrete Implementierung:

```javascript
// Auto-Login für Senioren-Tablet
apiV1.post('/auth/auto-login-senior', async (req, res) => {
  try {
    // Prüfe ob Auto-Login erlaubt ist (z.B. über Konfiguration)
    const AUTO_LOGIN_ENABLED = process.env.AUTO_LOGIN_SENIOR_ENABLED === 'true';
    const AUTO_LOGIN_USERNAME = process.env.AUTO_LOGIN_SENIOR_USERNAME || 'Waschkueche';
    
    if (!AUTO_LOGIN_ENABLED) {
      logger.warn('Auto-Login für Senioren nicht aktiviert');
      apiResponse.error(res, 'Auto-Login nicht aktiviert', 403);
      return;
    }
    
    // Finde Senioren-Benutzer
    const user = await dbHelper.get(
      'SELECT * FROM users WHERE username = ? AND role = ?',
      [AUTO_LOGIN_USERNAME, 'senior']
    );
    
    if (!user) {
      logger.warn('Senioren-Benutzer für Auto-Login nicht gefunden', { username: AUTO_LOGIN_USERNAME });
      apiResponse.error(res, 'Senioren-Benutzer nicht gefunden', 404);
      return;
    }
    
    // Erstelle Session
    if (!req.session) {
      logger.error('KRITISCH: req.session ist undefined!');
      apiResponse.error(res, 'Session-Fehler', 500);
      return;
    }
    
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    
    // Session speichern
    req.session.save((err) => {
      if (err) {
        logger.error('Fehler beim Speichern der Session', err);
        apiResponse.error(res, 'Fehler beim Erstellen der Session', 500);
        return;
      }
      
      logger.info('Auto-Login für Senioren erfolgreich', {
        userId: user.id,
        username: user.username,
        sessionId: req.sessionID
      });
      
      apiResponse.success(res, {
        id: user.id,
        username: user.username,
        role: user.role
      });
    });
  } catch (error) {
    logger.error('Fehler beim Auto-Login für Senioren', error);
    apiResponse.error(res, 'Fehler beim Auto-Login', 500);
  }
});
```

### Umgebungsvariablen (.env):
```env
AUTO_LOGIN_SENIOR_ENABLED=true
AUTO_LOGIN_SENIOR_USERNAME=Waschkueche
```

### Akzeptanzkriterien:
- [ ] Auto-Login-Endpunkt funktioniert
- [ ] Nur aktiviert wenn `AUTO_LOGIN_SENIOR_ENABLED=true`
- [ ] Loggt automatisch als konfigurierter Senioren-Benutzer ein
- [ ] Session wird korrekt erstellt

---

## 📝 Test-Plan

### Manuelle Tests:
1. **Senioren-Benutzer erstellen:**
   ```bash
   # Über Admin-Panel: Neuer Benutzer "Waschkueche" mit Rolle "senior"
   ```

2. **Buchung als Senioren-Benutzer erstellen:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/bookings \
     -H "Content-Type: application/json" \
     -H "Cookie: connect.sid=..." \
     -d '{
       "machine_id": 1,
       "date": "2024-12-25",
       "slot": "07:00-12:00",
       "user_name": "Waschkueche"
     }'
   ```

3. **Doppelbuchung testen:**
   - Erstelle Buchung für Maschine 1, Datum 2024-12-25, Slot 07:00-12:00
   - Erstelle gleiche Buchung nochmal → Sollte automatisch auf nächsten Slot verschoben werden

4. **Sonntag-Buchung testen:**
   - Erstelle Buchung für Sonntag → Sollte automatisch auf Montag verschoben werden

5. **Auto-Login testen:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/auto-login-senior
   ```

### Unit-Tests:
- [ ] Test: Senioren-Benutzer kann ohne Fehlermeldungen buchen
- [ ] Test: Doppelbuchung wird automatisch aufgelöst
- [ ] Test: Sonntag-Buchung wird automatisch verschoben
- [ ] Test: Tageslimiten werden ignoriert
- [ ] Test: "1x im Voraus"-Regel wird ignoriert
- [ ] Test: Auto-Login funktioniert

---

## ✅ Akzeptanzkriterien (Gesamt)

- [ ] Senioren-Rolle wird unterstützt
- [ ] Alle Validierungen werden für Senioren übersprungen
- [ ] Doppelbuchungen werden automatisch aufgelöst
- [ ] Senioren-Buchungen werden geloggt/markiert
- [ ] Auto-Login-Endpunkt funktioniert
- [ ] Normale Benutzer haben weiterhin alle Validierungen
- [ ] Alle Änderungen sind getestet

---

## 📚 Referenzen

- `server.js` - Zeile ~2470-3100 (POST /api/v1/bookings)
- `server.js` - Zeile ~1494-1579 (POST /api/v1/auth/login)
- `ADMIN_DOKUMENTATION.md` - Benutzer-Verwaltung

---

**Ende der Aufgabe**

