/**
 * Unit-Tests für Validierungs-Middleware (validators.body, validators.query, validators.params)
 * 
 * Diese Tests prüfen die Middleware-Funktionen für Request-Validierung
 */

// Mock für Express Request/Response
function createMockRequest(body = {}, query = {}, params = {}) {
  return {
    body,
    query,
    params,
    validated: {}
  };
}

function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return res;
}

// Mock für logger
const logger = {
  warn: jest.fn()
};

// Mock für apiResponse
const apiResponse = {
  validationError: jest.fn((res, message, errors) => {
    res.status(400).json({
      success: false,
      error: message,
      errors: errors
    });
  })
};

// Validierungsfunktionen (vereinfacht für Tests)
function isValidDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return false;
  const trimmedDate = dateString.trim();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(trimmedDate)) return false;
  const date = new Date(trimmedDate + 'T00:00:00');
  if (isNaN(date.getTime())) return false;
  const [year, month, day] = trimmedDate.split('-').map(Number);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function isValidSlot(slot) {
  const TIME_SLOTS = [
    { start: '08:00', end: '10:00', label: '08:00-10:00' },
    { start: '10:00', end: '12:00', label: '10:00-12:00' },
    { start: '12:00', end: '14:00', label: '12:00-14:00' },
    { start: '14:00', end: '16:00', label: '14:00-16:00' },
    { start: '16:00', end: '18:00', label: '16:00-18:00' },
    { start: '18:00', end: '20:00', label: '18:00-20:00' }
  ];
  return TIME_SLOTS.some(s => s.label === slot);
}

function validateAndTrimString(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateInteger(value) {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

// Validators-Middleware (vereinfacht für Tests)
const validators = {
  body: (schema) => {
    return (req, res, next) => {
      const errors = [];
      const validated = {};
      
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];
        
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} ist ein Pflichtfeld`);
          continue;
        }
        
        if (!rules.required && (value === undefined || value === null || value === '')) {
          continue;
        }
        
        if (rules.type) {
          if (rules.type === 'string' && typeof value !== 'string') {
            errors.push(`${field} muss ein String sein`);
            continue;
          }
          if (rules.type === 'integer' && !Number.isInteger(Number(value))) {
            errors.push(`${field} muss eine ganze Zahl sein`);
            continue;
          }
          if (rules.type === 'date' && typeof value !== 'string') {
            errors.push(`${field} muss ein Datum (String) sein`);
            continue;
          }
        }
        
        if (rules.validator) {
          const validationResult = rules.validator(value, field);
          if (validationResult !== true && validationResult !== null) {
            if (typeof validationResult === 'string') {
              errors.push(validationResult);
            } else {
              errors.push(`${field} ist ungültig`);
            }
            continue;
          }
        }
        
        if (rules.normalize) {
          validated[field] = rules.normalize(value);
        } else {
          validated[field] = value;
        }
      }
      
      if (errors.length > 0) {
        logger.warn('Validierungsfehler', { errors, body: req.body });
        apiResponse.validationError(res, 'Validierungsfehler', errors);
        return;
      }
      
      req.validated = validated;
      next();
    };
  },
  
  query: (schema) => {
    return (req, res, next) => {
      const errors = [];
      const validated = {};
      
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.query[field];
        
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`Query-Parameter ${field} ist erforderlich`);
          continue;
        }
        
        if (!rules.required && (value === undefined || value === null || value === '')) {
          continue;
        }
        
        if (rules.validator) {
          const validationResult = rules.validator(value, field);
          if (validationResult !== true && validationResult !== null) {
            if (typeof validationResult === 'string') {
              errors.push(validationResult);
            } else {
              errors.push(`Query-Parameter ${field} ist ungültig`);
            }
            continue;
          }
        }
        
        validated[field] = rules.normalize ? rules.normalize(value) : value;
      }
      
      if (errors.length > 0) {
        logger.warn('Query-Validierungsfehler', { errors, query: req.query });
        apiResponse.validationError(res, 'Query-Validierungsfehler', errors);
        return;
      }
      
      req.validated = validated;
      next();
    };
  },
  
  params: (schema) => {
    return (req, res, next) => {
      const errors = [];
      const validated = {};
      
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.params[field];
        
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`URL-Parameter ${field} ist erforderlich`);
          continue;
        }
        
        if (!rules.required && (value === undefined || value === null || value === '')) {
          continue;
        }
        
        if (rules.validator) {
          const validationResult = rules.validator(value, field);
          if (validationResult !== true && validationResult !== null) {
            if (typeof validationResult === 'string') {
              errors.push(validationResult);
            } else {
              errors.push(`URL-Parameter ${field} ist ungültig`);
            }
            continue;
          }
        }
        
        validated[field] = rules.normalize ? rules.normalize(value) : value;
      }
      
      if (errors.length > 0) {
        logger.warn('Params-Validierungsfehler', { errors, params: req.params });
        apiResponse.validationError(res, 'Params-Validierungsfehler', errors);
        return;
      }
      
      req.validated = validated;
      next();
    };
  }
};

describe('validators.body', () => {
  test('sollte gültige Daten akzeptieren', () => {
    const req = createMockRequest({ name: 'Test', age: 25 });
    const res = createMockResponse();
    const next = jest.fn();
    
    const middleware = validators.body({
      name: { required: true, type: 'string' },
      age: { required: false, type: 'integer' }
    });
    
    middleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.validated).toHaveProperty('name', 'Test');
    expect(req.validated).toHaveProperty('age', 25);
  });

  test('sollte fehlende Pflichtfelder ablehnen', () => {
    const req = createMockRequest({ age: 25 });
    const res = createMockResponse();
    const next = jest.fn();
    
    const middleware = validators.body({
      name: { required: true, type: 'string' },
      age: { required: false, type: 'integer' }
    });
    
    middleware(req, res, next);
    
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(apiResponse.validationError).toHaveBeenCalled();
  });

  test('sollte Typ-Validierung durchführen', () => {
    const req = createMockRequest({ name: 123 });
    const res = createMockResponse();
    const next = jest.fn();
    
    const middleware = validators.body({
      name: { required: true, type: 'string' }
    });
    
    middleware(req, res, next);
    
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('sollte Custom-Validator verwenden', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const req = createMockRequest({ date: dateStr });
    const res = createMockResponse();
    const next = jest.fn();
    
    const middleware = validators.body({
      date: {
        required: true,
        validator: (value) => isValidDate(value) ? true : 'Ungültiges Datum'
      }
    });
    
    middleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.validated).toHaveProperty('date', dateStr);
  });

  test('sollte Normalisierung durchführen', () => {
    const req = createMockRequest({ name: '  test  ' });
    const res = createMockResponse();
    const next = jest.fn();
    
    const middleware = validators.body({
      name: {
        required: true,
        normalize: (value) => typeof value === 'string' ? value.trim() : String(value)
      }
    });
    
    middleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.validated.name).toBe('test');
  });

  test('sollte optionale Felder überspringen', () => {
    const req = createMockRequest({ name: 'Test' });
    const res = createMockResponse();
    const next = jest.fn();
    
    const middleware = validators.body({
      name: { required: true, type: 'string' },
      optional: { required: false, type: 'string' }
    });
    
    middleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.validated).not.toHaveProperty('optional');
  });

  test('sollte mehrere Fehler sammeln', () => {
    const req = createMockRequest({});
    const res = createMockResponse();
    const next = jest.fn();
    
    const middleware = validators.body({
      name: { required: true, type: 'string' },
      age: { required: true, type: 'integer' }
    });
    
    middleware(req, res, next);
    
    expect(next).not.toHaveBeenCalled();
    expect(apiResponse.validationError).toHaveBeenCalledWith(
      expect.anything(),
      'Validierungsfehler',
      expect.arrayContaining([
        expect.stringContaining('name'),
        expect.stringContaining('age')
      ])
    );
  });
});

describe('validators.query', () => {
  test('sollte gültige Query-Parameter akzeptieren', () => {
    // Verwende ein zukünftiges Datum
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const req = createMockRequest({}, { date: dateStr });
    const res = createMockResponse();
    const next = jest.fn();
    
    const middleware = validators.query({
      date: {
        required: true,
        validator: (value) => isValidDate(value) ? true : 'Ungültiges Datum'
      }
    });
    
    middleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.validated).toHaveProperty('date', dateStr);
  });

  test('sollte fehlende Query-Parameter ablehnen', () => {
    const req = createMockRequest({}, {});
    const res = createMockResponse();
    const next = jest.fn();
    
    const middleware = validators.query({
      date: { required: true }
    });
    
    middleware(req, res, next);
    
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validators.params', () => {
  test('sollte gültige URL-Parameter akzeptieren', () => {
    const req = createMockRequest({}, {}, { id: '5' });
    const res = createMockResponse();
    const next = jest.fn();
    
    const middleware = validators.params({
      id: {
        required: true,
        validator: (value) => validateInteger(value) ? true : 'Ungültige ID'
      }
    });
    
    middleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.validated).toHaveProperty('id', '5');
  });

  test('sollte fehlende URL-Parameter ablehnen', () => {
    const req = createMockRequest({}, {}, {});
    const res = createMockResponse();
    const next = jest.fn();
    
    const middleware = validators.params({
      id: { required: true }
    });
    
    middleware(req, res, next);
    
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

