# Admin-Bereich Dokumentation

## Übersicht

Der Admin-Bereich ermöglicht Administratoren die vollständige Verwaltung der Waschmaschinen-App:
- Buchungen verwalten und löschen
- Maschinen hinzufügen, bearbeiten und löschen
- Benutzer anlegen und verwalten

## Zugriff

**URL:** `http://localhost:3000/admin.html`

**Standard-Login:**
- Benutzername: `admin`
- Passwort: `admin123`

⚠️ **WICHTIG:** Bitte ändern Sie das Admin-Passwort nach dem ersten Login!

## Features

### 1. Buchungen verwalten

**Funktionen:**
- Alle Buchungen anzeigen
- Nach Datum filtern
- Buchungen löschen (auch fremde)

**Endpunkte:**
- `GET /api/v1/admin/bookings` - Alle Buchungen abrufen
- `GET /api/v1/admin/bookings?date=YYYY-MM-DD` - Buchungen für ein Datum
- `DELETE /api/v1/admin/bookings/:id` - Buchung löschen

### 2. Maschinen verwalten

**Funktionen:**
- Maschinen anzeigen
- Neue Maschinen hinzufügen (Waschmaschinen oder Trocknungsräume)
- Maschinen bearbeiten
- Maschinen löschen (nur wenn keine Buchungen vorhanden)

**Endpunkte:**
- `GET /api/v1/admin/machines` - Alle Maschinen
- `POST /api/v1/admin/machines` - Neue Maschine erstellen
- `PUT /api/v1/admin/machines/:id` - Maschine aktualisieren
- `DELETE /api/v1/admin/machines/:id` - Maschine löschen

**Maschinen-Typen:**
- `washer` - Waschmaschine
- `dryer` - Trocknungsraum

### 3. Benutzer verwalten

**Funktionen:**
- Alle Benutzer anzeigen
- Neue Benutzer anlegen (Admin oder normaler Benutzer)
- Benutzer bearbeiten (Username, Passwort, Rolle)
- Benutzer löschen

**Endpunkte:**
- `GET /api/v1/admin/users` - Alle Benutzer
- `POST /api/v1/admin/users` - Neuen Benutzer erstellen
- `PUT /api/v1/admin/users/:id` - Benutzer aktualisieren
- `DELETE /api/v1/admin/users/:id` - Benutzer löschen

**Rollen:**
- `admin` - Administrator (voller Zugriff)
- `user` - Normaler Benutzer (nur Buchungen)

**Sicherheitsregeln:**
- Der letzte Admin kann nicht gelöscht werden
- Der letzte Admin kann nicht zu einem normalen Benutzer gemacht werden
- Man kann sich nicht selbst löschen

## Authentifizierung

### Login
```javascript
POST /api/v1/auth/login
Body: { username, password }
Response: { success: true, data: { id, username, role } }
```

### Logout
```javascript
POST /api/v1/auth/logout
Response: { success: true, data: { message: "..." } }
```

### Session prüfen
```javascript
GET /api/v1/auth/session
Response: { success: true, data: { id, username, role } }
```

## Datenbank-Schema

### users-Tabelle
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
)
```

## Sicherheit

### Passwort-Hashing
- Passwörter werden mit bcrypt gehasht (10 Runden)
- Passwörter werden niemals im Klartext gespeichert

### Session-Management
- Sessions werden serverseitig gespeichert
- Session-Cookies sind httpOnly (XSS-Schutz)
- Sessions laufen nach 24 Stunden ab

### Autorisierung
- Alle Admin-Endpunkte erfordern Admin-Rolle
- Middleware prüft Session und Rolle

## Verwendung

### 1. Erster Login
1. Öffnen Sie `http://localhost:3000/admin.html`
2. Login mit `admin` / `admin123`
3. Passwort sofort ändern!

### 2. Neue Maschine hinzufügen
1. Tab "Maschinen" öffnen
2. "+ Neue Maschine" klicken
3. Name und Typ eingeben
4. Speichern

### 3. Neuen Benutzer anlegen
1. Tab "Benutzer" öffnen
2. "+ Neuer Benutzer" klicken
3. Benutzername, Passwort und Rolle eingeben
4. Speichern

### 4. Buchung löschen
1. Tab "Buchungen" öffnen
2. Bei gewünschter Buchung "Löschen" klicken
3. Bestätigen

## API-Beispiele

### Maschine erstellen
```bash
curl -X POST http://localhost:3000/api/v1/admin/machines \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Waschmaschine 4",
    "type": "washer"
  }'
```

### Benutzer erstellen
```bash
curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "username": "max",
    "password": "geheim123",
    "role": "user"
  }'
```

## Fehlerbehandlung

Alle Admin-Endpunkte geben strukturierte Fehlerantworten:
- `401` - Nicht authentifiziert
- `403` - Keine Admin-Rechte
- `404` - Ressource nicht gefunden
- `409` - Konflikt (z.B. Benutzer existiert bereits)

## Nächste Schritte

1. **Passwort ändern:** Standard-Admin-Passwort ändern
2. **Weitere Admins:** Weitere Admin-Benutzer anlegen
3. **Benutzer anlegen:** Normale Benutzer für die App anlegen

