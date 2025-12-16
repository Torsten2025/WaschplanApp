# 💾 Render Persistenz - Was Sie brauchen

## 📋 Kurze Antwort

**Für Ihre Waschmaschinen-App:**
- ✅ **Free Tier:** Funktioniert, aber **Datenbank geht bei jedem Deployment verloren**
- ✅ **Starter Plan ($7/Monat):** **Persistenz empfohlen** - Datenbank bleibt erhalten

---

## 🔍 Was ist Persistenz?

**Persistente Datenträger** = Speicher, der auch nach Neustarts/Deployments erhalten bleibt.

**Ohne Persistenz:**
- ❌ Datenbank wird bei jedem Deployment gelöscht
- ❌ Alle Buchungen gehen verloren
- ❌ Admin-Benutzer muss neu erstellt werden

**Mit Persistenz:**
- ✅ Datenbank bleibt erhalten
- ✅ Alle Buchungen bleiben gespeichert
- ✅ Keine Datenverluste bei Deployments

---

## 💰 Render-Instanztypen

### Free Tier (0 €/Monat)
- **RAM:** 512MB
- **CPU:** 0.1 CPU
- **Persistenz:** ❌ **NICHT verfügbar**
- **Einschränkungen:**
  - App schläft nach 15 Min Inaktivität
  - Keine SSH-Zugriff
  - Keine Skalierung
  - **Keine persistenten Datenträger**

### Starter Plan ($7/Monat)
- **RAM:** 512MB
- **CPU:** 0.5 CPU
- **Persistenz:** ✅ **VERFÜGBAR**
- **Vorteile:**
  - ✅ App läuft immer (kein Schlafmodus)
  - ✅ SSH-Zugriff
  - ✅ **Persistente Datenträger unterstützt**
  - ✅ Skalierung möglich

---

## 🎯 Was brauchen Sie für Ihre App?

### Option 1: Free Tier (für Tests)
**Geeignet für:**
- ✅ Erste Tests
- ✅ Entwicklung
- ✅ Demo/Prototyp

**Nachteile:**
- ❌ Datenbank geht bei jedem Deployment verloren
- ❌ App schläft nach 15 Min Inaktivität
- ❌ Alle Buchungen müssen neu erstellt werden

**Empfehlung:** Nur für erste Tests, nicht für Produktion!

### Option 2: Starter Plan mit Persistenz (empfohlen)
**Geeignet für:**
- ✅ Produktion
- ✅ Echte Nutzung
- ✅ Daten müssen erhalten bleiben

**Vorteile:**
- ✅ Datenbank bleibt erhalten
- ✅ App läuft immer
- ✅ Keine Datenverluste

**Kosten:** $7/Monat (~6,50€/Monat)

---

## 🔧 Persistenz konfigurieren (Starter Plan)

### Schritt 1: Persistent Disk erstellen
1. In Render Dashboard → Ihre App
2. "Disks" Tab
3. "Create Disk"
4. **Name:** `waschmaschine-db`
5. **Size:** 1GB (ausreichend für SQLite)
6. **Mount Path:** `/var/data`

### Schritt 2: Environment-Variable setzen
```
DATABASE_PATH=/var/data/waschmaschine.db
```

### Schritt 3: App neu deployen
- Datenbank wird jetzt im persistenten Datenträger gespeichert
- Bleibt auch nach Deployments erhalten

---

## 📊 Vergleich: Mit vs. Ohne Persistenz

### Ohne Persistenz (Free Tier)
```
Deployment 1 → Datenbank erstellt → Buchungen gespeichert
Deployment 2 → Datenbank gelöscht → Alle Buchungen weg ❌
Deployment 3 → Datenbank neu erstellt → Wieder leer ❌
```

### Mit Persistenz (Starter Plan)
```
Deployment 1 → Datenbank erstellt → Buchungen gespeichert
Deployment 2 → Datenbank bleibt → Alle Buchungen bleiben ✅
Deployment 3 → Datenbank bleibt → Alle Buchungen bleiben ✅
```

---

## 💡 Empfehlung

### Für Entwicklung/Test:
- ✅ **Free Tier** verwenden
- ⚠️ Akzeptieren, dass Daten verloren gehen
- ⚠️ Für echte Tests nicht geeignet

### Für Produktion:
- ✅ **Starter Plan ($7/Monat)** verwenden
- ✅ **Persistent Disk** konfigurieren
- ✅ `DATABASE_PATH=/var/data/waschmaschine.db` setzen
- ✅ Daten bleiben erhalten

---

## 🚀 Schnellstart: Starter Plan mit Persistenz

### 1. Starter Plan wählen
- Bei Service-Erstellung: "Starter" Plan auswählen ($7/Monat)

### 2. Persistent Disk erstellen
1. Dashboard → Ihre App → "Disks" Tab
2. "Create Disk"
3. Name: `waschmaschine-db`
4. Size: 1GB
5. Mount Path: `/var/data`

### 3. Environment-Variable setzen
```
DATABASE_PATH=/var/data/waschmaschine.db
```

### 4. App deployen
- Fertig! Datenbank bleibt jetzt erhalten

---

## 📝 Code-Anpassung

Ihre App unterstützt bereits `DATABASE_PATH`:

```javascript
const databasePath = process.env.DATABASE_PATH || './waschmaschine.db';
```

**Sie müssen nichts am Code ändern!** Nur die Environment-Variable setzen.

---

## ❓ FAQ

### Brauche ich Persistenz?
**Ja, wenn:**
- ✅ Daten erhalten bleiben sollen
- ✅ App in Produktion läuft
- ✅ Buchungen nicht verloren gehen sollen

**Nein, wenn:**
- ✅ Nur Tests/Entwicklung
- ✅ Datenverlust ist akzeptabel
- ✅ Kosten sparen wollen

### Kann ich später upgraden?
**Ja!** Sie können jederzeit:
- Free Tier → Starter Plan upgraden
- Persistent Disk später hinzufügen
- Datenbank migrieren (Backup/Restore)

### Was kostet Persistenz?
- **Starter Plan:** $7/Monat (inkl. Persistenz)
- **Persistent Disk:** Inklusive im Starter Plan
- **Zusätzliche Kosten:** Keine (bis zu bestimmter Größe)

---

## ✅ Checkliste

### Free Tier (ohne Persistenz):
- [ ] App deployen
- [ ] Testen
- [ ] ⚠️ Akzeptieren, dass Daten verloren gehen

### Starter Plan (mit Persistenz):
- [ ] Starter Plan wählen ($7/Monat)
- [ ] Persistent Disk erstellen (1GB, `/var/data`)
- [ ] `DATABASE_PATH=/var/data/waschmaschine.db` setzen
- [ ] App deployen
- [ ] ✅ Daten bleiben erhalten!

---

## 🎯 Fazit

**Für Ihre Waschmaschinen-App:**
- **Free Tier:** Nur für erste Tests
- **Starter Plan mit Persistenz:** **Empfohlen für Produktion**

**Kosten:** $7/Monat (~6,50€/Monat) für:
- ✅ Persistente Datenbank
- ✅ App läuft immer (kein Schlafmodus)
- ✅ SSH-Zugriff
- ✅ Skalierung möglich

**Ohne Persistenz:** Daten gehen bei jedem Deployment verloren - nicht für Produktion geeignet!

