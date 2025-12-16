/**
 * Unit-Tests für commonValidators
 * Testet die vordefinierten Validatoren für häufige Fälle
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

// Validierungsfunktionen (aus server.js)
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

// commonValidators (aus server.js)
const commonValidators = {
  date: (value) => {
    if (!isValidDate(value)) {
      return 'Ungültiges Datum. Format: YYYY-MM-DD, Datum muss gültig sein und darf nicht in der Vergangenheit liegen.';
    }
    return true;
  },
  
  slot: (value) => {
    if (!isValidSlot(value)) {
      return `Ungültiger Slot. Gültige Slots: ${TIME_SLOTS.map(s => s.label).join(', ')}`;
    }
    return true;
  },
  
  string: (value, fieldName) => {
    const trimmed = validateAndTrimString(value, fieldName);
    if (!trimmed) {
      return `${fieldName} muss ein nicht-leerer String sein`;
    }
    return true;
  },
  
  integer: (value, fieldName) => {
    const validated = validateInteger(value, fieldName);
    if (!validated) {
      return `${fieldName} muss eine positive ganze Zahl sein`;
    }
    return true;
  },
  
  normalizeString: (value) => {
    return typeof value === 'string' ? value.trim() : String(value);
  },
  
  normalizeInteger: (value) => {
    return validateInteger(value) || parseInt(value, 10);
  }
};

describe('commonValidators', () => {
  describe('date', () => {
    test('sollte gültige Daten akzeptieren', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      expect(commonValidators.date(dateStr)).toBe(true);
    });

    test('sollte ungültige Daten ablehnen', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      
      const result = commonValidators.date(dateStr);
      expect(typeof result).toBe('string');
      expect(result).toContain('Ungültiges Datum');
    });

    test('sollte falsche Formate ablehnen', () => {
      expect(typeof commonValidators.date('invalid')).toBe('string');
      expect(typeof commonValidators.date('2024-13-45')).toBe('string');
      expect(typeof commonValidators.date('')).toBe('string');
      expect(typeof commonValidators.date(null)).toBe('string');
    });
  });

  describe('slot', () => {
    test('sollte gültige Slots akzeptieren', () => {
      expect(commonValidators.slot('08:00-10:00')).toBe(true);
      expect(commonValidators.slot('18:00-20:00')).toBe(true);
    });

    test('sollte ungültige Slots ablehnen', () => {
      const result = commonValidators.slot('invalid');
      expect(typeof result).toBe('string');
      expect(result).toContain('Ungültiger Slot');
      expect(result).toContain('Gültige Slots');
    });

    test('sollte alle verfügbaren Slots in Fehlermeldung auflisten', () => {
      const result = commonValidators.slot('invalid');
      TIME_SLOTS.forEach(slot => {
        expect(result).toContain(slot.label);
      });
    });
  });

  describe('string', () => {
    test('sollte gültige Strings akzeptieren', () => {
      expect(commonValidators.string('test', 'fieldName')).toBe(true);
      expect(commonValidators.string('  test  ', 'fieldName')).toBe(true);
    });

    test('sollte leere Strings ablehnen', () => {
      const result = commonValidators.string('', 'fieldName');
      expect(typeof result).toBe('string');
      expect(result).toContain('fieldName');
      expect(result).toContain('nicht-leerer String');
    });

    test('sollte null/undefined ablehnen', () => {
      expect(typeof commonValidators.string(null, 'fieldName')).toBe('string');
      expect(typeof commonValidators.string(undefined, 'fieldName')).toBe('string');
    });

    test('sollte non-String-Werte ablehnen', () => {
      expect(typeof commonValidators.string(123, 'fieldName')).toBe('string');
      expect(typeof commonValidators.string({}, 'fieldName')).toBe('string');
    });

    test('sollte fieldName in Fehlermeldung verwenden', () => {
      const result = commonValidators.string('', 'user_name');
      expect(result).toContain('user_name');
    });
  });

  describe('integer', () => {
    test('sollte gültige Integers akzeptieren', () => {
      expect(commonValidators.integer(1, 'fieldName')).toBe(true);
      expect(commonValidators.integer('5', 'fieldName')).toBe(true);
      expect(commonValidators.integer(100, 'fieldName')).toBe(true);
    });

    test('sollte ungültige Werte ablehnen', () => {
      const result1 = commonValidators.integer(0, 'fieldName');
      expect(typeof result1).toBe('string');
      expect(result1).toContain('fieldName');
      
      const result2 = commonValidators.integer(-1, 'fieldName');
      expect(typeof result2).toBe('string');
      
      const result3 = commonValidators.integer('abc', 'fieldName');
      expect(typeof result3).toBe('string');
    });

    test('sollte fieldName in Fehlermeldung verwenden', () => {
      const result = commonValidators.integer(0, 'machine_id');
      expect(result).toContain('machine_id');
      expect(result).toContain('positive ganze Zahl');
    });
  });

  describe('normalizeString', () => {
    test('sollte Strings trimmen', () => {
      expect(commonValidators.normalizeString('  test  ')).toBe('test');
      expect(commonValidators.normalizeString('test')).toBe('test');
    });

    test('sollte non-Strings zu String konvertieren', () => {
      expect(commonValidators.normalizeString(123)).toBe('123');
      expect(commonValidators.normalizeString(true)).toBe('true');
      expect(commonValidators.normalizeString(null)).toBe('null');
      expect(commonValidators.normalizeString(undefined)).toBe('undefined');
    });

    test('sollte Edge-Cases behandeln', () => {
      expect(commonValidators.normalizeString('')).toBe('');
      expect(commonValidators.normalizeString('   ')).toBe('');
      expect(commonValidators.normalizeString(0)).toBe('0');
      expect(commonValidators.normalizeString(NaN)).toBe('NaN');
    });
  });

  describe('normalizeInteger', () => {
    test('sollte gültige Integers normalisieren', () => {
      expect(commonValidators.normalizeInteger(5)).toBe(5);
      expect(commonValidators.normalizeInteger('10')).toBe(10);
      expect(commonValidators.normalizeInteger('  5  ')).toBe(5);
    });

    test('sollte ungültige Werte zu NaN konvertieren', () => {
      expect(commonValidators.normalizeInteger('abc')).toBeNaN();
      expect(commonValidators.normalizeInteger(null)).toBeNaN();
      expect(commonValidators.normalizeInteger(undefined)).toBeNaN();
    });

    test('sollte Edge-Cases behandeln', () => {
      // normalizeInteger verwendet validateInteger || parseInt
      // validateInteger(0) gibt null zurück, dann wird parseInt(0) = 0 verwendet
      // Daher gibt es 0 zurück, nicht NaN
      expect(commonValidators.normalizeInteger(0)).toBe(0);
      // validateInteger(-1) gibt null zurück, dann wird parseInt(-1) = -1 verwendet
      // Daher gibt es -1 zurück, nicht NaN
      expect(commonValidators.normalizeInteger(-1)).toBe(-1);
      expect(commonValidators.normalizeInteger('12.5')).toBe(12); // Wird zu 12 geparst
    });
  });
});

