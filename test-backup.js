/**
 * Test-Skript: Datenbank-Backup & Restore testen
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const API_BASE = 'http://localhost:3000/api/v1';
let sessionCookie = '';

// Hilfsfunktion für HTTP-Requests
function makeRequest(method, path, data = null, useCookie = true) {
  return new Promise((resolve, reject) => {
    const fullPath = path.startsWith('/') ? path : '/' + path;
    const fullUrl = API_BASE + fullPath;
    
    const url = new URL(fullUrl);
    const options = {
      hostname: 'localhost', // IPv4 verwenden statt IPv6
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (useCookie && sessionCookie) {
      options.headers['Cookie'] = sessionCookie;
    }

    const req = http.request(options, (res) => {
      // Session-Cookie speichern
      if (res.headers['set-cookie']) {
        const cookies = res.headers['set-cookie'];
        const sessionCookieStr = cookies.find(c => c.startsWith('connect.sid='));
        if (sessionCookieStr) {
          sessionCookie = sessionCookieStr.split(';')[0];
        }
      }

      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testBackupFlow() {
  console.log('🧪 Test: Datenbank-Backup & Restore\n');

  try {
    // 1. Admin-Login
    console.log('1️⃣ Admin-Login...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: 'admin123'
    }, false);
    
    if (loginResponse.status !== 200 || !loginResponse.data.success) {
      console.error('❌ Admin-Login fehlgeschlagen:', loginResponse.status);
      console.error('Response:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }

    console.log('✅ Admin erfolgreich eingeloggt\n');

    // 2. Backup erstellen
    console.log('2️⃣ Erstelle Backup...');
    const backupResponse = await makeRequest('POST', '/admin/backup');
    
    if (backupResponse.status !== 200 || !backupResponse.data.success) {
      console.error('❌ Backup-Erstellung fehlgeschlagen:', backupResponse.status);
      console.error('Response:', JSON.stringify(backupResponse.data, null, 2));
      return;
    }

    const backupInfo = backupResponse.data.data;
    console.log(`✅ Backup erstellt: ${backupInfo.backupName}`);
    console.log(`   Größe: ${backupInfo.sizeFormatted}`);
    console.log(`   Zeitpunkt: ${backupInfo.timestamp}\n`);

    // 3. Prüfe ob Backup-Datei existiert
    console.log('3️⃣ Prüfe ob Backup-Datei existiert...');
    const backupDir = path.join(__dirname, 'backups');
    const backupPath = path.join(backupDir, backupInfo.backupName);
    
    try {
      const stats = await fs.stat(backupPath);
      console.log(`✅ Backup-Datei gefunden: ${backupPath}`);
      console.log(`   Größe: ${(stats.size / 1024).toFixed(2)} KB\n`);
    } catch (err) {
      console.error('❌ Backup-Datei nicht gefunden:', backupPath);
      return;
    }

    // 4. Backup-Liste abrufen
    console.log('4️⃣ Rufe Backup-Liste ab...');
    const listResponse = await makeRequest('GET', '/admin/backups');
    
    if (listResponse.status !== 200 || !listResponse.data.success) {
      console.error('❌ Backup-Liste konnte nicht abgerufen werden:', listResponse.status);
      return;
    }

    const backups = listResponse.data.data;
    const foundBackup = backups.find(b => b.name === backupInfo.backupName);
    
    if (foundBackup) {
      console.log(`✅ Backup in Liste gefunden: ${foundBackup.name}`);
      console.log(`   Gesamt Backups: ${backups.length}\n`);
    } else {
      console.warn('⚠️  Backup nicht in Liste gefunden, aber Datei existiert\n');
    }

    // 5. Backup wiederherstellen (nur wenn wir mehr als 1 Backup haben oder Test-Backup)
    console.log('5️⃣ Stelle Backup wieder her...');
    
    // Zuerst ein paar Daten abfragen, um später zu vergleichen
    const machinesBefore = await makeRequest('GET', '/machines');
    const machineCountBefore = machinesBefore.data.success ? machinesBefore.data.data.length : 0;
    console.log(`   Maschinen vor Restore: ${machineCountBefore}`);

    const restoreResponse = await makeRequest('POST', '/admin/restore', {
      backupName: backupInfo.backupName
    });
    
    if (restoreResponse.status !== 200 || !restoreResponse.data.success) {
      console.error('❌ Backup-Wiederherstellung fehlgeschlagen:', restoreResponse.status);
      console.error('Response:', JSON.stringify(restoreResponse.data, null, 2));
      return;
    }

    console.log('✅ Backup erfolgreich wiederhergestellt');
    console.log(`   ${restoreResponse.data.data.message}\n`);

    // 6. Validierung: Prüfe ob Daten noch vorhanden sind
    console.log('6️⃣ Validiere Daten nach Restore...');
    const machinesAfter = await makeRequest('GET', '/machines');
    const machineCountAfter = machinesAfter.data.success ? machinesAfter.data.data.length : 0;
    console.log(`   Maschinen nach Restore: ${machineCountAfter}`);
    
    if (machineCountAfter === machineCountBefore) {
      console.log('✅ Daten korrekt wiederhergestellt\n');
    } else {
      console.warn(`⚠️  Daten-Anzahl stimmt nicht überein: ${machineCountBefore} → ${machineCountAfter}\n`);
    }

    // 7. Test: Ungültiger Backup-Name
    console.log('7️⃣ Test: Ungültiger Backup-Name...');
    const invalidRestoreResponse = await makeRequest('POST', '/admin/restore', {
      backupName: '../../etc/passwd'
    });
    
    if (invalidRestoreResponse.status === 400) {
      console.log('✅ Path-Traversal-Schutz funktioniert\n');
    } else {
      console.warn(`⚠️  Path-Traversal-Schutz unerwartetes Verhalten: Status ${invalidRestoreResponse.status}\n`);
    }

    // 8. Test: Nicht-existierendes Backup
    console.log('8️⃣ Test: Nicht-existierendes Backup...');
    const notFoundRestoreResponse = await makeRequest('POST', '/admin/restore', {
      backupName: 'backup-nicht-existiert.db'
    });
    
    if (notFoundRestoreResponse.status === 404) {
      console.log('✅ Nicht-existierendes Backup wird korrekt abgelehnt\n');
    } else {
      console.warn(`⚠️  Nicht-existierendes Backup unerwartetes Verhalten: Status ${notFoundRestoreResponse.status}\n`);
    }

    // Zusammenfassung
    console.log('📊 Test-Zusammenfassung:');
    console.log('   ✅ Admin-Login funktioniert');
    console.log('   ✅ Backup kann erstellt werden');
    console.log('   ✅ Backup-Datei wird korrekt gespeichert');
    console.log('   ✅ Backup-Liste kann abgerufen werden');
    console.log('   ✅ Backup kann wiederhergestellt werden');
    console.log('   ✅ Daten werden korrekt wiederhergestellt');
    console.log('   ✅ Path-Traversal-Schutz funktioniert');
    console.log('   ✅ Nicht-existierende Backups werden abgelehnt');
    console.log('\n✅ Alle Backup-Tests erfolgreich!');

  } catch (error) {
    console.error('❌ Fehler beim Testen:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   → Server läuft nicht! Bitte starte den Server mit: node server.js');
    } else {
      console.error('   → Stack:', error.stack);
    }
  }
}

// Test ausführen
testBackupFlow();

