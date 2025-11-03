/**
 * Guard Monitoring System - Utility Functions
 * Common utility functions used across the system
 */

/**
 * Get the spreadsheet instance
 * Works with both container-bound and standalone contexts
 */
function getSpreadsheet() {
  try {
    // Try to get active spreadsheet first (works for container-bound scripts)
    const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSpreadsheet) {
      Logger.log('Using active spreadsheet: ' + activeSpreadsheet.getId());
      return activeSpreadsheet;
    }
  } catch (e) {
    Logger.log('No active spreadsheet, using ID from CONFIG');
  }

  // Fall back to opening by ID (works for standalone scripts and web apps)
  Logger.log('Opening spreadsheet by ID: ' + CONFIG.SPREADSHEET_ID);
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

/**
 * Helper function to create or get existing sheet
 */
function createOrGetSheet(sheetName, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);

    // Set headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setBackground(CONFIG.COLORS.GREEN);
    headerRange.setFontColor(CONFIG.COLORS.WHITE);
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');

    // Freeze header row
    sheet.setFrozenRows(1);

    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  return sheet;
}

/**
 * Generate unique ID using UUID for guaranteed uniqueness
 * @param {string} prefix - ID prefix
 * @param {Sheet} sheet - Sheet to check for uniqueness (optional, for backwards compatibility)
 * @returns {string} Unique ID
 */
function generateUniqueId(prefix, sheet) {
  // Use UUID for guaranteed uniqueness - no collision risk
  const uuid = Utilities.getUuid().replace(/-/g, '').substring(0, 20).toUpperCase();
  return prefix + uuid;
}

/**
 * Format date helper
 */
function formatDateString(dateValue) {
  if (!dateValue) return '';
  if (dateValue instanceof Date) {
    return Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'MMM dd, yyyy');
  }
  const date = new Date(dateValue);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM dd, yyyy');
}
