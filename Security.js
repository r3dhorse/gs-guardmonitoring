/**
 * Guard Monitoring System - Security & Authentication
 * Password hashing, validation, session management, and CSRF protection
 */

/**
 * Sanitize input to prevent injection attacks
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>\"\']/g, '').substring(0, CONFIG.VALIDATION.MAX_STRING_LENGTH);
}

/**
 * Validate string length
 * @param {string} str - Input string
 * @param {string} fieldName - Field name for error message
 * @param {number} maxLength - Maximum allowed length
 * @returns {Object} Validation result
 */
function validateStringLength(str, fieldName, maxLength) {
  if (!str) return { valid: true };
  if (str.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} exceeds maximum length of ${maxLength} characters`
    };
  }
  return { valid: true };
}

/**
 * Validate and parse date
 * @param {string|Date} dateInput - Date input
 * @param {string} fieldName - Field name for error message
 * @returns {Object} Validation result with parsed date
 */
function validateDate(dateInput, fieldName) {
  if (!dateInput) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (isNaN(date.getTime())) {
    return { valid: false, error: `Invalid ${fieldName} format` };
  }

  const minDate = new Date('1900-01-01');
  const maxDate = new Date('2100-12-31');
  if (date < minDate || date > maxDate) {
    return { valid: false, error: `${fieldName} out of valid range` };
  }

  return {
    valid: true,
    date: date,
    formatted: Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM dd, yyyy')
  };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function validatePassword(password) {
  if (!password || password.length < CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} characters`
    };
  }

  if (password.length > CONFIG.VALIDATION.MAX_PASSWORD_LENGTH) {
    return { valid: false, error: 'Password too long' };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!(hasUpper && hasLower && hasNumber)) {
    return {
      valid: false,
      error: 'Password must contain uppercase, lowercase, and number'
    };
  }

  return { valid: true };
}

/**
 * Check if user has admin permission
 * @param {string} username - Username to check
 * @returns {boolean} True if user is admin
 */
function hasAdminPermission(username) {
  try {
    const usersSheet = getSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.USERS);
    if (!usersSheet) return false;

    const data = usersSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === username && data[i][4] === 'Admin') {
        return true;
      }
    }
    return false;
  } catch (error) {
    Logger.log('Error checking admin permission: ' + error.message);
    return false;
  }
}

/**
 * Hash a password using SHA-256
 * @param {string} password - Plain text password
 * @return {string} Hashed password
 */
function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  let hashString = '';
  for (let i = 0; i < rawHash.length; i++) {
    const byte = rawHash[i];
    if (byte < 0) {
      hashString += String.fromCharCode(byte + 256);
    } else {
      hashString += String.fromCharCode(byte);
    }
  }
  return Utilities.base64Encode(hashString);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Stored password hash
 * @return {boolean} True if password matches hash
 */
function verifyPassword(password, hash) {
  const computedHash = hashPassword(password);
  return computedHash === hash;
}

/**
 * Generate CSRF token for form protection
 * @param {string} username - Username to associate token with
 * @returns {string} CSRF token
 */
function generateCsrfToken(username) {
  try {
    const token = Utilities.getUuid();
    const cache = CacheService.getUserCache();
    cache.put('csrf_token_' + username, token, 3600); // 1 hour expiry
    return token;
  } catch (error) {
    Logger.log('Error generating CSRF token: ' + error.message);
    return '';
  }
}

/**
 * Validate CSRF token
 * @param {string} username - Username associated with token
 * @param {string} token - Token to validate
 * @returns {boolean} True if token is valid
 */
function validateCsrfToken(username, token) {
  try {
    if (!token || !username) return false;
    const cache = CacheService.getUserCache();
    const storedToken = cache.get('csrf_token_' + username);
    return token === storedToken;
  } catch (error) {
    Logger.log('Error validating CSRF token: ' + error.message);
    return false;
  }
}

/**
 * Generate session token for authenticated user
 * @param {string} username - Username
 * @returns {string} Session token
 */
function generateSessionToken(username) {
  try {
    const token = Utilities.getUuid();
    const cache = CacheService.getUserCache();
    const sessionData = JSON.stringify({
      username: username,
      created: new Date().toISOString()
    });
    cache.put('session_' + token, sessionData, CONFIG.VALIDATION.SESSION_TIMEOUT_MINUTES * 60);
    return token;
  } catch (error) {
    Logger.log('Error generating session token: ' + error.message);
    return '';
  }
}

/**
 * Validate session token and return username
 * @param {string} token - Session token
 * @returns {Object} Session data or null
 */
function validateSessionToken(token) {
  try {
    if (!token) return null;
    const cache = CacheService.getUserCache();
    const sessionData = cache.get('session_' + token);
    if (!sessionData) return null;
    return JSON.parse(sessionData);
  } catch (error) {
    Logger.log('Error validating session token: ' + error.message);
    return null;
  }
}

/**
 * Invalidate session token (logout)
 * @param {string} token - Session token to invalidate
 */
function invalidateSessionToken(token) {
  try {
    if (!token) return;
    const cache = CacheService.getUserCache();
    cache.remove('session_' + token);
  } catch (error) {
    Logger.log('Error invalidating session token: ' + error.message);
  }
}
