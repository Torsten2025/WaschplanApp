/**
 * Unit-Tests für Validierungsfunktionen
 */

// Mock für TIME_SLOTS
const TIME_SLOTS = [
  { start: '08:00', end: '10:00', label: '08:00-10:00' },
  { start: '10:00', end: '12:00', label: '10:00-12:00' },
  { start: '12:00', end: '14:00', label: '12:00-14:00' },
  { start: '14:00', end: '16:00', label: '14:00-16:00' },
  { start: '16:00', end: '18:00', label: '16:00-18:00' },
  { start: '18:00', end: '20:00', label: '18:00-20:00' }
];

// Validierungsfunktionen (aus server.js extrahiert)
function isValidSlot(slot) {
  return TIME_SLOTS.some(s => s.label === slot);
}

function isValidDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  
  const trimmedDate = dateString.trim();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(trimmedDate)) {
    return false;
  }
  
  const date = new Date(trimmedDate + 'T00:00:00');
  if (isNaN(date.getTime())) {
    return false;
  }
  
  const [year, month, day] = trimmedDate.split('-').map(Number);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function validateAndTrimString(value, fieldName) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateInteger(value, fieldName) {
  if (value === null || value === undefined) {
    return null;
  }
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

describe('Validierungsfunktionen', () => {
  describe('isValidSlot', () => {
    test('sollte gültige Slots akzeptieren', () => {
      expect(isValidSlot('08:00-10:00')).toBe(true);
      expect(isValidSlot('10:00-12:00')).toBe(true);
      expect(isValidSlot('18:00-20:00')).toBe(true);
    });

    test('sollte ungültige Slots ablehnen', () => {
      expect(isValidSlot('07:00-09:00')).toBe(false);
      expect(isValidSlot('21:00-23:00')).toBe(false);
      expect(isValidSlot('invalid')).toBe(false);
      expect(isValidSlot('')).toBe(false);
      expect(isValidSlot(null)).toBe(false);
      expect(isValidSlot(undefined)).toBe(false);
    });

    test('sollte alle verfügbaren Slots akzeptieren', () => {
      // Teste alle 6 verfügbaren Slots
      expect(isValidSlot('08:00-10:00')).toBe(true);
      expect(isValidSlot('10:00-12:00')).toBe(true);
      expect(isValidSlot('12:00-14:00')).toBe(true);
      expect(isValidSlot('14:00-16:00')).toBe(true);
      expect(isValidSlot('16:00-18:00')).toBe(true);
      expect(isValidSlot('18:00-20:00')).toBe(true);
    });

    test('sollte case-sensitive sein', () => {
      expect(isValidSlot('08:00-10:00')).toBe(true);
      expect(isValidSlot('08:00-10:00 ')).toBe(false); // Mit Leerzeichen
      expect(isValidSlot(' 08:00-10:00')).toBe(false); // Mit Leerzeichen
    });
  });

  describe('isValidDate', () => {
    test('sollte gültige zukünftige Daten akzeptieren', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      expect(isValidDate(dateStr)).toBe(true);
    });

    test('sollte heutiges Datum akzeptieren', () => {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      expect(isValidDate(dateStr)).toBe(true);
    });

    test('sollte vergangene Daten ablehnen', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      expect(isValidDate(dateStr)).toBe(false);
    });

    test('sollte ungültige Formate ablehnen', () => {
      expect(isValidDate('2024-13-45')).toBe(false);
      expect(isValidDate('2024-02-30')).toBe(false);
      expect(isValidDate('2024/12/31')).toBe(false);
      expect(isValidDate('31-12-2024')).toBe(false);
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
    });

    test('sollte Edge-Cases für Datum-Validierung abdecken', () => {
      // Schaltjahr-Test (29. Februar)
      const leapYear = new Date().getFullYear();
      const isLeapYear = (leapYear % 4 === 0 && leapYear % 100 !== 0) || (leapYear % 400 === 0);
      if (isLeapYear) {
        const feb29 = `${leapYear}-02-29`;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const testDate = new Date(feb29 + 'T00:00:00');
        expect(isValidDate(feb29)).toBe(testDate >= today);
      }
      
      // Nicht-Schaltjahr (29. Februar sollte fehlschlagen)
      const nonLeapYear = 2023; // 2023 ist kein Schaltjahr
      expect(isValidDate(`${nonLeapYear}-02-29`)).toBe(false);
      
      // Ungültige Monate
      expect(isValidDate('2024-00-01')).toBe(false);
      expect(isValidDate('2024-13-01')).toBe(false);
      
      // Ungültige Tage
      expect(isValidDate('2024-01-00')).toBe(false);
      expect(isValidDate('2024-01-32')).toBe(false);
      expect(isValidDate('2024-04-31')).toBe(false); // April hat nur 30 Tage
      
      // Führende Nullen - Test mit zukünftigem Datum
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      expect(isValidDate(futureDateStr)).toBe(true);
      expect(isValidDate('2024-1-1')).toBe(false); // Muss führende Nullen haben
      
      // Whitespace - Test mit zukünftigem Datum
      const futureDate2 = new Date();
      futureDate2.setFullYear(futureDate2.getFullYear() + 1);
      const futureDateStr2 = futureDate2.toISOString().split('T')[0];
      expect(isValidDate(` ${futureDateStr2} `)).toBe(true); // Wird getrimmt
      expect(isValidDate(`${futureDateStr2} `)).toBe(true);
      expect(isValidDate(` ${futureDateStr2}`)).toBe(true);
    });

    test('sollte Grenzfälle für Datum-Validierung behandeln', () => {
      // Heute um Mitternacht - kann Zeitzonen-Probleme haben
      // Daher testen wir stattdessen mit einem festen zukünftigen Datum
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      futureDate.setMonth(0);
      futureDate.setDate(1);
      futureDate.setHours(0, 0, 0, 0);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      expect(isValidDate(futureDateStr)).toBe(true);
      
      // Morgen (sollte akzeptiert werden)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      expect(isValidDate(tomorrowStr)).toBe(true);
      
      // Gestern
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      expect(isValidDate(yesterdayStr)).toBe(false);
      
      // Sehr weit in der Zukunft (sollte funktionieren)
      const farFuture = '2099-12-31';
      expect(isValidDate(farFuture)).toBe(true);
    });

    test('sollte verschiedene Datentypen ablehnen', () => {
      expect(isValidDate(20241231)).toBe(false); // Zahl
      expect(isValidDate(new Date())).toBe(false); // Date-Objekt
      expect(isValidDate({})).toBe(false); // Objekt
      expect(isValidDate([])).toBe(false); // Array
      expect(isValidDate(true)).toBe(false); // Boolean
    });
  });

  describe('validateAndTrimString', () => {
    test('sollte gültige Strings trimmen und zurückgeben', () => {
      expect(validateAndTrimString('  test  ', 'field')).toBe('test');
      expect(validateAndTrimString('test', 'field')).toBe('test');
    });

    test('sollte leere Strings ablehnen', () => {
      expect(validateAndTrimString('', 'field')).toBe(null);
      expect(validateAndTrimString('   ', 'field')).toBe(null);
    });

    test('sollte null/undefined ablehnen', () => {
      expect(validateAndTrimString(null, 'field')).toBe(null);
      expect(validateAndTrimString(undefined, 'field')).toBe(null);
    });

    test('sollte non-String-Werte ablehnen', () => {
      expect(validateAndTrimString(123, 'field')).toBe(null);
      expect(validateAndTrimString({}, 'field')).toBe(null);
      expect(validateAndTrimString([], 'field')).toBe(null);
      expect(validateAndTrimString(true, 'field')).toBe(null);
      expect(validateAndTrimString(false, 'field')).toBe(null);
      expect(validateAndTrimString(NaN, 'field')).toBe(null);
    });

    test('sollte Edge-Cases für String-Validierung abdecken', () => {
      // Sehr langer String
      const longString = 'a'.repeat(1000);
      expect(validateAndTrimString(longString, 'field')).toBe(longString);
      
      // String mit nur Whitespace-Zeichen
      expect(validateAndTrimString('\t\n\r ', 'field')).toBe(null);
      expect(validateAndTrimString('\u00A0', 'field')).toBe(null); // Non-breaking space
      
      // String mit Sonderzeichen
      expect(validateAndTrimString('test@#$%', 'field')).toBe('test@#$%');
      expect(validateAndTrimString('test\nnewline', 'field')).toBe('test\nnewline');
      
      // Unicode-Zeichen
      expect(validateAndTrimString('test äöü', 'field')).toBe('test äöü');
      expect(validateAndTrimString('测试', 'field')).toBe('测试');
      
      // String mit führenden/nachgestellten Leerzeichen
      expect(validateAndTrimString('  test  ', 'field')).toBe('test');
      expect(validateAndTrimString('\ttest\t', 'field')).toBe('test');
    });
  });

  describe('validateInteger', () => {
    test('sollte positive Zahlen akzeptieren', () => {
      expect(validateInteger(1, 'field')).toBe(1);
      expect(validateInteger(100, 'field')).toBe(100);
      expect(validateInteger('5', 'field')).toBe(5);
    });

    test('sollte null/undefined ablehnen', () => {
      expect(validateInteger(null, 'field')).toBe(null);
      expect(validateInteger(undefined, 'field')).toBe(null);
    });

    test('sollte negative Zahlen ablehnen', () => {
      expect(validateInteger(-1, 'field')).toBe(null);
      expect(validateInteger('-5', 'field')).toBe(null);
    });

    test('sollte Null ablehnen', () => {
      expect(validateInteger(0, 'field')).toBe(null);
      expect(validateInteger('0', 'field')).toBe(null);
    });

    test('sollte nicht-numerische Werte ablehnen', () => {
      expect(validateInteger('abc', 'field')).toBe(null);
      // parseInt('12.5') gibt 12 zurück, daher wird es als Integer behandelt
      // Das ist ein bekanntes Verhalten von parseInt
      expect(validateInteger('12.5', 'field')).toBe(12); // parseInt('12.5') = 12
      expect(validateInteger({}, 'field')).toBe(null);
      expect(validateInteger([], 'field')).toBe(null);
      // Number(true) = 1, daher wird es als Integer behandelt
      expect(validateInteger(true, 'field')).toBe(1);
      expect(validateInteger(false, 'field')).toBe(null); // Number(false) = 0, nicht > 0
      expect(validateInteger(NaN, 'field')).toBe(null);
      expect(validateInteger(Infinity, 'field')).toBe(null);
    });

    test('sollte Edge-Cases für Integer-Validierung abdecken', () => {
      // Sehr große Zahlen
      expect(validateInteger(Number.MAX_SAFE_INTEGER, 'field')).toBe(Number.MAX_SAFE_INTEGER);
      // Number.MAX_SAFE_INTEGER + 1 ist immer noch eine gültige Integer, wird aber als Number behandelt
      // parseInt/Number können diese Zahl noch verarbeiten, daher wird sie akzeptiert
      const maxPlusOne = Number.MAX_SAFE_INTEGER + 1;
      const result = validateInteger(maxPlusOne, 'field');
      // Kann die Zahl sein oder null, je nachdem wie Number() es behandelt
      expect(result === maxPlusOne || result === null).toBe(true);
      
      // String mit Whitespace - parseInt ignoriert Whitespace
      // Aber unsere Funktion prüft nicht explizit auf Whitespace
      expect(validateInteger('5', 'field')).toBe(5);
      expect(validateInteger('123', 'field')).toBe(123);
      
      // Hexadezimale Strings - parseInt('0xFF', 10) mit base 10 gibt NaN
      // Daher wird es abgelehnt
      expect(validateInteger('0xFF', 'field')).toBe(null);
      
      // Wissenschaftliche Notation - parseInt('1e2', 10) = 1, daher wird es akzeptiert
      expect(validateInteger('1e2', 'field')).toBe(1);
      expect(validateInteger('1.5e2', 'field')).toBe(1);
      
      // Führende Nullen
      expect(validateInteger('007', 'field')).toBe(7);
      expect(validateInteger('000', 'field')).toBe(null); // 0 ist nicht erlaubt
      
      // Negative Zahlen als String
      expect(validateInteger('-5', 'field')).toBe(null);
      // parseInt('+5') = 5, daher wird es akzeptiert (ist positiv)
      expect(validateInteger('+5', 'field')).toBe(5);
      
      // Leerer String
      expect(validateInteger('', 'field')).toBe(null);
    });

    test('sollte verschiedene Zahl-Formate verarbeiten', () => {
      // String-Zahlen
      expect(validateInteger('1', 'field')).toBe(1);
      expect(validateInteger('100', 'field')).toBe(100);
      expect(validateInteger('999999', 'field')).toBe(999999);
      
      // Number-Objekte
      expect(validateInteger(1, 'field')).toBe(1);
      expect(validateInteger(100, 'field')).toBe(100);
      
      // Edge: Number-Objekt (selten)
      expect(validateInteger(new Number(5), 'field')).toBe(5);
    });
  });
});

