# Analyse: Vergleich Dokumente vs. Implementierung

## 📋 Zusammenfassung der Dokumente

### Dokument 1: "Nutzung der Waschküche / Kein Waschen am Sonntag"
- **Betriebszeiten:** NICHT vor 07:00 Uhr und NICHT nach 21:00 Uhr (09:00 PM)
- **Sonntag & Feiertage:** KEIN Waschen erlaubt (Trocknungsräume scheinen erlaubt)
- **Buchungsprinzip:** "eintragen – waschen – eintragen – waschen" = nur EINE zukünftige Buchung
- **Spontane Nutzung:** Freie Slots können spontan genutzt werden, aber NICHT reserviert werden

### Dokument 2: "Waschküchenordnung"
- **Prinzip:** "eintragen – waschen – eintragen – waschen" (für Waschmaschinen)
- **Für Tumbler/Trocknungsräume:** "eintragen – trocknen – eintragen – trocknen"
- **Verfügbarkeit:** Waschküche maximal einen Tag; Trocknungsräume bis 7 Uhr am nächsten Tag
- **Betriebszeiten:** Waschen nicht erlaubt vor 7 Uhr und nach 22 Uhr (10 PM)
- **Sonntag & Feiertage:** Waschküche darf NICHT benutzt werden
- **Wichtig:** Auch wenn nur eine Maschine oder nur Trocknen benutzt wird, muss ein Eintrag im Waschplan sein

### Dokument 3: "WASCHPLAN Dezember 2025"
- **Zeitslots:** 7-12 Uhr, 12-17 Uhr, 17-21 Uhr
- **Maschinen:**
  - 3 Waschmaschinen
  - 1 Tumbler (Tumbler 1)
  - 3 Trocknungsräume (Trocknungsraum 1, 2, 3)
  - 1 Tumbler 2
- **Regel (rot markiert):** "BITTE NUR 1x IM VORAUS EINTRAGEN !!! EINTRAGEN -> WASCHEN -> EINTRAGEN"
- **Sonntage:** Waschmaschinen leer/gestrichen, aber Trocknungsräume können gebucht werden

---

## 🔍 Vergleich: Dokumente vs. Aktuelle Implementierung

### ✅ KORREKT implementiert

#### 1. Zeitslots
- **Dokumente:** 7-12 Uhr, 12-17 Uhr, 17-21 Uhr
- **Code:** `07:00-12:00`, `12:00-17:00`, `17:00-21:00` ✅
- **Status:** ✅ **KORREKT**

#### 2. Vorausbuchungsregel ("eintragen -> waschen -> eintragen")
- **Dokumente:** Nur 1 zukünftige Buchung erlaubt
- **Code:** Regel 4 implementiert - prüft ob bereits zukünftige Buchung existiert ✅
- **Status:** ✅ **KORREKT**

#### 3. Sonntag-Regel
- **Dokumente:** Kein Waschen am Sonntag, Trocknungsräume erlaubt
- **Code:** Regel 6 blockiert Waschmaschinen am Sonntag, erlaubt Trocknungsräume ✅
- **Status:** ✅ **KORREKT**

#### 4. Trocknungsraum-Serien
- **Dokumente:** Nicht explizit erwähnt, aber im Waschplan sichtbar
- **Code:** Bis zu 3 aufeinanderfolgende Slots erlaubt ✅
- **Status:** ✅ **KORREKT**

#### 5. Trocknungsraum-Voraussetzung (Wasch-Buchung)
- **Dokumente:** Nicht explizit, aber logisch aus "eintragen -> waschen -> eintragen"
- **Code:** Regel prüft Wasch-Buchung am gleichen Tag (außer Sonntag) ✅
- **Status:** ✅ **KORREKT**

---

### ❌ FEHLT oder FALSCH implementiert

#### 1. Maschinenanzahl - KRITISCH
- **Dokumente (Waschplan):**
  - 3 Waschmaschinen ✅
  - 1 Tumbler (Tumbler 1) ❌
  - 3 Trocknungsräume ❌
  - 1 Tumbler 2 ❌
  - **Total: 8 Maschinen**
- **Code (server.js Zeile 813-817):**
  ```javascript
  const seedMachines = [
    { name: 'Waschmaschine 1', type: 'washer' },
    { name: 'Waschmaschine 2', type: 'washer' },
    { name: 'Waschmaschine 3', type: 'washer' },
    { name: 'Trocknungsraum 1', type: 'dryer' }  // ❌ Nur 1 Trocknungsraum
  ];
  ```
  - **Total: 4 Maschinen**
- **Problem:** 
  - ❌ Fehlen: 2 weitere Trocknungsräume (Trocknungsraum 2, 3)
  - ❌ Fehlen: 2 Tumbler (Tumbler 1, Tumbler 2)
- **Status:** ❌ **KRITISCH - MUSS GEFIXT WERDEN**

#### 2. Maschinentypen - UNKLAR
- **Dokumente:** 
  - Waschmaschinen (type: 'washer')
  - Tumbler (separate Maschinen)
  - Trocknungsräume (type: 'dryer')
- **Code:** 
  - Nur `'washer'` und `'dryer'`
  - Kein Typ für Tumbler
- **Problem:**
  - ❌ Tumbler werden nicht als separater Typ behandelt
  - ❌ Unklar: Sollen Tumbler wie Trocknungsräume behandelt werden?
- **Status:** ❌ **MUSS GEFIXT WERDEN**

#### 3. Betriebszeiten-Validierung - FEHLT
- **Dokumente:**
  - Dokument 1: Nicht vor 07:00 und nicht nach 21:00
  - Dokument 2: Nicht vor 7 Uhr und nicht nach 22 Uhr
- **Code:**
  - Slots selbst sind korrekt (07:00-21:00)
  - ❌ Keine zusätzliche Validierung, die verhindert, dass Buchungen außerhalb der Betriebszeiten gemacht werden
  - ❌ Keine Prüfung ob Slot-Zeiten innerhalb der Betriebszeiten liegen
- **Status:** ⚠️ **WENIGER KRITISCH** (Slots selbst sind korrekt, aber explizite Validierung fehlt)

#### 4. Spontane Nutzung ohne Reservierung - NICHT IMPLEMENTIERT
- **Dokumente:** "Freie Slots können spontan genutzt werden, aber NICHT reserviert werden"
- **Code:**
  - ❌ Keine Logik für "spontane Nutzung"
  - ❌ Alle Buchungen werden als Reservierungen behandelt
- **Status:** ⚠️ **UNKLAR** - Vielleicht nicht nötig, wenn man einfach einen freien Slot buchen kann?

#### 5. Trocknungsräume bis 7 Uhr nächsten Tag - NICHT IMPLEMENTIERT
- **Dokumente:** "Trocknungsräume sind verfügbar bis 7 Uhr am nächsten Tag"
- **Code:**
  - ❌ Keine spezielle Logik für Trocknungsräume, die über Mitternacht hinausgehen
  - ❌ Slots enden um 21:00, keine Erweiterung bis 07:00 nächsten Tag
- **Status:** ⚠️ **UNKLAR** - Vielleicht nicht nötig, wenn Slots fest sind?

---

## 🎯 Priorisierte To-Do-Liste

### 🔴 KRITISCH (Muss sofort gefixt werden)

1. **Maschinenanzahl korrigieren**
   - ✅ 3 Waschmaschinen (bereits korrekt)
   - ❌ 3 Trocknungsräume hinzufügen (aktuell nur 1)
   - ❌ 2 Tumbler hinzufügen (aktuell 0)
   - **Aktion:** Seed-Daten in `server.js` erweitern

2. **Maschinentyp für Tumbler definieren**
   - Entscheidung nötig: Sollen Tumbler wie Trocknungsräume behandelt werden?
   - Oder eigener Typ `'tumbler'`?
   - **Aktion:** Typ definieren und Logik anpassen

### 🟡 WICHTIG (Sollte gefixt werden)

3. **Betriebszeiten-Validierung**
   - Explizite Prüfung: Slots müssen innerhalb 07:00-21:00 (oder 22:00) liegen
   - **Aktion:** Validierung in Buchungslogik hinzufügen

### 🟢 OPTIONAL (Kann später geklärt werden)

4. **Spontane Nutzung**
   - Klärung nötig: Was bedeutet "spontane Nutzung ohne Reservierung"?
   - Vielleicht nicht nötig, wenn man einfach buchen kann?

5. **Trocknungsräume bis 7 Uhr nächsten Tag**
   - Klärung nötig: Wie soll das mit festen Slots funktionieren?
   - Vielleicht nicht nötig, wenn Slots fest sind?

---

## 📝 Empfohlene Änderungen

### Änderung 1: Maschinen-Seed-Daten erweitern

**Datei:** `server.js` (ca. Zeile 813-817)

**Aktuell:**
```javascript
const seedMachines = [
  { name: 'Waschmaschine 1', type: 'washer' },
  { name: 'Waschmaschine 2', type: 'washer' },
  { name: 'Waschmaschine 3', type: 'washer' },
  { name: 'Trocknungsraum 1', type: 'dryer' }
];
```

**Sollte sein:**
```javascript
const seedMachines = [
  { name: 'Waschmaschine 1', type: 'washer' },
  { name: 'Waschmaschine 2', type: 'washer' },
  { name: 'Waschmaschine 3', type: 'washer' },
  { name: 'Trocknungsraum 1', type: 'dryer' },
  { name: 'Trocknungsraum 2', type: 'dryer' },
  { name: 'Trocknungsraum 3', type: 'dryer' },
  { name: 'Tumbler 1', type: 'tumbler' },  // ODER type: 'dryer'?
  { name: 'Tumbler 2', type: 'tumbler' }   // ODER type: 'dryer'?
];
```

**⚠️ FRAGE:** Sollen Tumbler wie Trocknungsräume behandelt werden (`type: 'dryer'`) oder als eigener Typ (`type: 'tumbler'`)?

### Änderung 2: Betriebszeiten-Validierung hinzufügen

**Datei:** `server.js` (in der Buchungsvalidierung)

**Hinzufügen:**
```javascript
// REGEL: Betriebszeiten-Prüfung
const OPERATING_HOURS_START = '07:00';
const OPERATING_HOURS_END = '21:00'; // ODER '22:00'?

// Prüfe ob Slot innerhalb Betriebszeiten liegt
const slotStart = TIME_SLOTS.find(s => s.label === validatedSlot)?.start;
if (slotStart && (slotStart < OPERATING_HOURS_START || slotStart >= OPERATING_HOURS_END)) {
  apiResponse.validationError(res, 
    `Buchungen sind nur zwischen ${OPERATING_HOURS_START} und ${OPERATING_HOURS_END} möglich.`
  );
  return;
}
```

---

## ❓ Offene Fragen

1. **Tumbler-Typ:** Sollen Tumbler wie Trocknungsräume behandelt werden oder als eigener Typ?
2. **Betriebszeiten:** 21:00 oder 22:00 als Endzeit? (Dokumente widersprechen sich)
3. **Spontane Nutzung:** Was bedeutet das genau? Soll es implementiert werden?
4. **Trocknungsräume bis 7 Uhr:** Wie soll das mit festen Slots funktionieren?

---

## ✅ Zusammenfassung

**Korrekt implementiert:**
- ✅ Zeitslots (07:00-12:00, 12:00-17:00, 17:00-21:00)
- ✅ Vorausbuchungsregel (1 zukünftige Buchung)
- ✅ Sonntag-Regel (kein Waschen, Trocknungsräume erlaubt)
- ✅ Trocknungsraum-Serien (bis 3 Slots)
- ✅ Trocknungsraum-Voraussetzung (Wasch-Buchung)

**Muss gefixt werden:**
- ❌ Maschinenanzahl (fehlen 2 Trocknungsräume + 2 Tumbler)
- ❌ Maschinentyp für Tumbler definieren
- ⚠️ Betriebszeiten-Validierung (optional, aber empfohlen)

