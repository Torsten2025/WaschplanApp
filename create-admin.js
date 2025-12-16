/**
 * Skript zum Erstellen/Zurücksetzen des Admin-Benutzers
 * 
 * Verwendung:
 * node create-admin.js
 * 
 * Erstellt oder setzt den Admin-Benutzer zurück:
 * - Username: admin
 * - Password: admin123
 * - Role: admin
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.db');
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Fehler beim Öffnen der Datenbank:', err.message);
    process.exit(1);
  }
  console.log('Datenbank verbunden.');
});

// Admin-Benutzer erstellen oder zurücksetzen
async function createOrResetAdmin() {
  return new Promise((resolve, reject) => {
    // Prüfe ob Admin bereits existiert
    db.get('SELECT id, username FROM users WHERE username = ?', [ADMIN_USERNAME], async (err, row) => {
      if (err) {
        console.error('Fehler beim Prüfen des Admin-Benutzers:', err.message);
        reject(err);
        return;
      }

      if (row) {
        // Admin existiert bereits - Passwort zurücksetzen
        console.log('Admin-Benutzer existiert bereits. Setze Passwort zurück...');
        
        try {
          const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
          
          db.run(
            'UPDATE users SET password_hash = ?, role = ? WHERE username = ?',
            [hash, 'admin', ADMIN_USERNAME],
            (err) => {
              if (err) {
                console.error('Fehler beim Zurücksetzen des Passworts:', err.message);
                reject(err);
              } else {
                console.log('✅ Admin-Passwort erfolgreich zurückgesetzt!');
                console.log(`   Username: ${ADMIN_USERNAME}`);
                console.log(`   Password: ${ADMIN_PASSWORD}`);
                resolve();
              }
            }
          );
        } catch (hashError) {
          console.error('Fehler beim Hashen des Passworts:', hashError.message);
          reject(hashError);
        }
      } else {
        // Admin existiert nicht - erstellen
        console.log('Admin-Benutzer existiert nicht. Erstelle neuen Admin...');
        
        try {
          const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
          
          db.run(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [ADMIN_USERNAME, hash, 'admin'],
            (err) => {
              if (err) {
                console.error('Fehler beim Erstellen des Admin-Benutzers:', err.message);
                reject(err);
              } else {
                console.log('✅ Admin-Benutzer erfolgreich erstellt!');
                console.log(`   Username: ${ADMIN_USERNAME}`);
                console.log(`   Password: ${ADMIN_PASSWORD}`);
                resolve();
              }
            }
          );
        } catch (hashError) {
          console.error('Fehler beim Hashen des Passworts:', hashError.message);
          reject(hashError);
        }
      }
    });
  });
}

// Hauptfunktion
async function main() {
  try {
    // Prüfe ob users-Tabelle existiert
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", async (err, row) => {
      if (err) {
        console.error('Fehler beim Prüfen der users-Tabelle:', err.message);
        db.close();
        process.exit(1);
      }

      if (!row) {
        console.log('⚠️  Die users-Tabelle existiert nicht. Erstelle sie jetzt...');
        
        // Erstelle users-Tabelle
        db.run(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )`, (err) => {
          if (err) {
            console.error('❌ Fehler beim Erstellen der users-Tabelle:', err.message);
            db.close();
            process.exit(1);
          } else {
            console.log('✅ users-Tabelle erfolgreich erstellt.');
            // Index erstellen
            db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)', (err) => {
              if (err) {
                console.warn('⚠️  Warnung: Index konnte nicht erstellt werden:', err.message);
              }
              // Weiter mit Admin-Erstellung
              createOrResetAdmin().then(() => {
                console.log('\n⚠️  WICHTIG: Bitte ändern Sie das Passwort nach dem ersten Login!');
                db.close();
              }).catch((error) => {
                console.error('Fehler:', error.message);
                db.close();
                process.exit(1);
              });
            });
          }
        });
        return;
      }

      await createOrResetAdmin();
      console.log('\n⚠️  WICHTIG: Bitte ändern Sie das Passwort nach dem ersten Login!');
      db.close();
    });
  } catch (error) {
    console.error('Fehler:', error.message);
    db.close();
    process.exit(1);
  }
}

main();

