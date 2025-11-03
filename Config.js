/**
 * Guard Monitoring System - Configuration
 * Contains all system configuration constants
 */

const CONFIG = {
  SPREADSHEET_ID: '1Xn8m1xGA5iHY2FhTdjjA_lkBdXnIRg6eyqH52cOf07E',
  GOOGLE_DRIVE_FOLDER_ID: '1fpB9sm0v3QN817plGXeDN_7DAmn662nY',
  PHOTO_FOLDER_ID: '1yx8ZJZDrA971MVkopsR2eQsZmJPReu_X',

  SHEET_NAMES: {
    GUARDS: 'Guards',
    DOCUMENTS: 'Documents',
    LICENSES: 'Licenses',
    PERFORMANCE: 'Performance',
    HEALTH: 'Health Records',
    USERS: 'Users',
    VIOLATION_TYPES: 'Violation Types',
    VIOLATION_SANCTIONS: 'Violation Sanctions',
    AUDIT_TRAIL: 'Audit Trail'
  },

  COLORS: {
    GREEN: '#006341',
    ACCENT: '#81d742',
    WHITE: '#FFFFFF'
  },

  VALIDATION: {
    MAX_STRING_LENGTH: 255,
    MAX_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 500,
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15,
    PASSWORD_HISTORY_COUNT: 5,
    SESSION_TIMEOUT_MINUTES: 360  // 6 hours
  },

  ALERTS: {
    LICENSE_EXPIRY_DAYS: 30,
    DOCUMENT_EXPIRY_DAYS: 30
  },

  AUDIT: {
    RETENTION_DAYS: 365
  },

  SECURITY: {
    FORCE_PASSWORD_CHANGE_ON_FIRST_LOGIN: true
  }
};
