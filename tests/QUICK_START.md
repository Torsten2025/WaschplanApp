# Quick Start - Automatisierte Tests

## 🚀 Schnellstart (5 Minuten)

### 1. Dependencies installieren
```bash
npm install
```

### 2. Tests ausführen
```bash
npm test
```

**Fertig!** ✅

---

## 📊 Test-Ergebnisse verstehen

### ✅ Erfolgreich
```
✓ sollte gültige Slots akzeptieren
```
→ Alles OK, keine Aktion erforderlich

### ❌ Fehlgeschlagen
```
✕ sollte ungültige Slots ablehnen
  Expected: false
  Received: true
```
→ Code hat einen Fehler, muss behoben werden

---

## 🎯 Wichtige Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `npm test` | Alle Tests ausführen |
| `npm run test:unit` | Nur Unit-Tests |
| `npm run test:integration` | Nur Integration-Tests |
| `npm run test:coverage` | Mit Coverage-Report |
| `npm run test:watch` | Watch-Mode (auto-reload) |

---

## 📁 Test-Dateien

- `tests/unit/validation.test.js` - Unit-Tests
- `tests/integration/api.test.js` - API-Tests
- `tests/performance/load.test.js` - Performance-Tests

---

## 🐛 Problem?

**"Cannot find module 'jest'"**
```bash
npm install
```

**Tests schlagen fehl?**
- Fehlermeldung lesen
- Code prüfen
- Team fragen

---

## 📚 Mehr Informationen

- **Detaillierte Anleitung:** `tests/JUNIOR_QA_ANLEITUNG.md`
- **Vollständige Dokumentation:** `tests/README.md`

---

**Viel Erfolg! 🎉**

