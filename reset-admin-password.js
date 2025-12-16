/**
 * Skript zum Zurücksetzen des Admin-Passworts
 * Führt das Passwort auf "admin123" zurück
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'waschmaschine.db');
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

async function resetAdminPassword() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Fehler beim Öffnen der Datenbank:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Datenbank geöffnet:', DB_PATH);
    });

    // Prüfe ob Admin existiert
    db.get('SELECT id, username FROM users WHERE username = ?', [ADMIN_USERNAME], async (err, row) => {
      if (err) {
        console.error('❌ Fehler beim Prüfen des Admin-Benutzers:', err.message);
        db.close();
        reject(err);
        return;
      }

      try {
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        
        if (row) {
          // Admin existiert - Passwort zurücksetzen
          db.run(
            'UPDATE users SET password_hash = ?, role = ? WHERE username = ?',
            [hash, 'admin', ADMIN_USERNAME],
            (err) => {
              db.close();
              if (err) {
                console.error('❌ Fehler beim Zurücksetzen des Admin-Passworts:', err.message);
                reject(err);
                return;
              }
              
              console.log('✅ Admin-Passwort erfolgreich zurückgesetzt!');
              console.log(`   Benutzername: ${ADMIN_USERNAME}`);
              console.log(`   Passwort: ${ADMIN_PASSWORD}`);
              resolve();
            }
          );
        } else {
          // Admin existiert nicht - erstellen
          db.run(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [ADMIN_USERNAME, hash, 'admin'],
            (err) => {
              db.close();
              if (err) {
                console.error('❌ Fehler beim Erstellen des Admin-Benutzers:', err.message);
                reject(err);
                return;
              }
              
              console.log('✅ Admin-Benutzer erfolgreich erstellt!');
              console.log(`   Benutzername: ${ADMIN_USERNAME}`);
              console.log(`   Passwort: ${ADMIN_PASSWORD}`);
              resolve();
            }
          );
        }
      } catch (hashError) {
        db.close();
        console.error('❌ Fehler beim Hashen des Passworts:', hashError.message);
        reject(hashError);
      }
    });
  });
}

// Skript ausführen
resetAdminPassword()
  .then(() => {
    console.log('\n✅ Fertig! Du kannst dich jetzt mit admin / admin123 anmelden.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fehler:', error.message);
    process.exit(1);
  });

