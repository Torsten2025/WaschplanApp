# ✅ Pre-Deployment Checkliste - Was sollte vorher gemacht werden?

**Datum:** [Aktuelles Datum]  
**Empfehlung:** 🟡 **Teilweise optimieren** (15-20 Minuten)

---

## 📊 Aktueller Status

### ✅ Was bereits funktioniert:
- ✅ Health-Check Endpoints vorhanden (`/api/health`, `/api/v1/health`)
- ✅ Port-Konfiguration korrekt (`process.env.PORT`)
- ✅ Environment-Variablen unterstützt
- ✅ CORS konfigurierbar
- ✅ Session-Management implementiert
- ✅ Error-Handling vorhanden
- ✅ Logging implementiert

### ⚠️ Was noch optimiert werden sollte:

---

## 🎯 Empfehlung: Diese 3 Dinge vorher machen

### 1. 🔴 KRITISCH: Datenbank-Pfad konfigurierbar machen (5 Min)

**Warum:**  
- Render Free Tier löscht Dateien bei jedem Deployment
- Mit Persistent Disk (Starter Plan) brauchen wir konfigurierbaren Pfad
- **Ohne das:** Datenbank geht bei jedem Deployment verloren (Free Tier)

**Aufwand:** 5 Minuten  
**Priorität:** 🔴 HOCH

**Was zu tun:**
```javascript
// Aktuell: Hardcodiert
const db = new sqlite3.Database('database.db', ...);

// Sollte sein: Konfigurierbar
const DB_PATH = process.env.DATABASE_PATH || './database.db';
const db = new sqlite3.Database(DB_PATH, ...);
```

---

### 2. 🟡 WICHTIG: Slot-Klick-Event Problem (in Arbeit)

**Status:** Junior Frontend arbeitet daran  
**Problem:** Benutzer können keine Slots buchen (Klick funktioniert nicht)

**Optionen:**
- **A) Warten** bis Junior fertig ist (empfohlen für Production)
- **B) Jetzt deployen** und später fixen (für Tests OK)

**Aufwand:** 2-3 Stunden (Junior Frontend)  
**Priorität:** 🟡 MITTEL (kritisch für Funktionalität, aber nicht für Deployment)

**Empfehlung:**  
- ✅ Für **Tests:** Jetzt deployen, später fixen
- ⚠️ Für **Production:** Warten bis fix fertig ist

---

### 3. 🟢 OPTIONAL: Session-Store optimieren (5 Min)

**Warum:**  
- File-Store funktioniert, aber Memory-Store ist einfacher für Render
- Oder: Redis (besser für Production)

**Aufwand:** 5 Minuten  
**Priorität:** 🟢 NIEDRIG (kann auch nach Deployment gemacht werden)

**Was zu tun:**
- File-Store auf Memory-Store umstellen (einfacher)
- Oder: Redis einrichten (besser, aber mehr Aufwand)

---

## 📋 Meine Empfehlung

### Option A: Schnell deployen (für Tests) ⚡

**Zeit:** 5 Minuten  
**Was zu tun:**
1. ✅ Datenbank-Pfad konfigurierbar machen (5 Min)
2. ✅ Deployen
3. ⚠️ Slot-Klick-Event später fixen (Junior Frontend)

**Vorteile:**
- ✅ Schnell online
- ✅ Kann sofort getestet werden
- ✅ Deployment-Prozess wird getestet

**Nachteile:**
- ⚠️ Buchungs-Funktion funktioniert noch nicht (kritisch!)

---

### Option B: Vollständig optimieren (für Production) 🎯

**Zeit:** 2-3 Stunden  
**Was zu tun:**
1. ✅ Datenbank-Pfad konfigurierbar machen (5 Min)
2. ⏳ Warten bis Slot-Klick-Event fix fertig ist (2-3 Std)
3. ✅ Session-Store optimieren (5 Min, optional)
4. ✅ Deployen

**Vorteile:**
- ✅ Vollständig funktionsfähig
- ✅ Production-ready
- ✅ Keine kritischen Bugs

**Nachteile:**
- ⏳ Dauert länger
- ⏳ Muss auf Junior Frontend warten

---

## 🎯 Meine konkrete Empfehlung

### Für Sie jetzt:

**1. Datenbank-Pfad konfigurierbar machen** ✅  
**Zeit:** 5 Minuten  
**Grund:** Wichtig für Render, besonders wenn Sie später Persistent Disk nutzen wollen

**2. Slot-Klick-Event Problem prüfen** ⚠️  
**Frage:** Ist der Junior Frontend schon fertig?  
- ✅ **Falls ja:** Perfekt, dann deployen
- ⏳ **Falls nein:** Entscheiden Sie:
  - **Tests:** Jetzt deployen, später fixen
  - **Production:** Warten bis fix fertig

**3. Session-Store** 🟢  
**Empfehlung:** Kann nach Deployment gemacht werden (nicht kritisch)

---

## 🔧 Was ich jetzt machen kann

### Sofort (5 Minuten):

1. ✅ **Datenbank-Pfad konfigurierbar machen**
   - Code anpassen
   - Environment-Variable dokumentieren
   - Funktioniert mit Persistent Disk

2. ✅ **Health-Check optimieren** (falls nötig)
   - Bereits vorhanden, aber könnte optimiert werden

### Optional (später):

3. 🟢 **Session-Store optimieren**
   - Memory-Store oder Redis
   - Kann auch nach Deployment gemacht werden

---

## 📝 Zusammenfassung

**Soll ich die Datenbank-Pfad-Anpassung jetzt machen?** ✅

**Empfehlung:**
- ✅ **JA:** Datenbank-Pfad konfigurierbar machen (5 Min)
- ⚠️ **Slot-Klick-Event:** Prüfen ob Junior fertig ist
- 🟢 **Session-Store:** Kann später gemacht werden

**Dann können Sie:**
- ✅ Sofort deployen (auch wenn Slot-Klick noch nicht funktioniert)
- ✅ Oder warten bis Slot-Klick fix fertig ist

---

## 🚀 Nächste Schritte

**Option 1: Jetzt optimieren (empfohlen)**
1. Ich mache Datenbank-Pfad konfigurierbar (5 Min)
2. Sie prüfen Slot-Klick-Status
3. Deployen

**Option 2: Direkt deployen**
1. Deployen wie es ist
2. Später optimieren

**Was möchten Sie?** 🤔

