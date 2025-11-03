/**
 * Guard Monitoring System - Audit Trail & Activity Logging
 * Functions: logAudit, getRecentActivity, testAuditTrail, archiveOldAuditLogs
 */

function logAudit(username, action, targetType, targetName, details) {
  try {
    const ss = getSpreadsheet();
    let auditSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.AUDIT_TRAIL);

    // Auto-create sheet if it doesn't exist
    if (!auditSheet) {
      auditSheet = createOrGetSheet(CONFIG.SHEET_NAMES.AUDIT_TRAIL, [
        'Audit ID', 'Timestamp', 'Username', 'Action', 'Target Type', 'Target Name', 'Details'
      ]);
    }

    // Generate unique Audit ID
    const auditId = 'AUD' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');

    // Get current timestamp
    const timestamp = new Date();

    // Append audit entry
    auditSheet.appendRow([
      auditId,
      timestamp,
      username || 'System',
      action,
      targetType,
      targetName,
      details || ''
    ]);

    Logger.log('Audit logged: ' + action + ' - ' + targetType + ' - ' + targetName);
  } catch (error) {
    Logger.log('Error logging audit: ' + error.message);
    // Don't throw error - audit logging should not break main functionality
  }
}

/**
 * Get recent activity from audit trail
 * @param {number} limit - Maximum number of activities to return
 * @returns {Array} Array of recent activities
 */
function getRecentActivity(limit) {
  try {
    const ss = getSpreadsheet();
    const auditSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.AUDIT_TRAIL);

    Logger.log('Getting recent activity - Sheet exists: ' + (!!auditSheet));

    if (!auditSheet) {
      Logger.log('Audit Trail sheet not found');
      return [];
    }

    const lastRow = auditSheet.getLastRow();
    Logger.log('Audit Trail last row: ' + lastRow);

    if (lastRow <= 1) {
      Logger.log('No audit data found (only header or empty)');
      return [];
    }

    const data = auditSheet.getDataRange().getValues();
    const activities = [];

    // Skip header row (index 0) and build activities array
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Format timestamp
      let timestampFormatted = '';
      if (row[1]) {
        try {
          const ts = row[1] instanceof Date ? row[1] : new Date(row[1]);
          timestampFormatted = Utilities.formatDate(ts, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm:ss');
        } catch (e) {
          timestampFormatted = row[1].toString();
        }
      }

      activities.push({
        auditId: row[0] ? row[0].toString() : '',
        timestamp: row[1], // Keep as Date object for sorting
        timestampFormatted: timestampFormatted,
        username: row[2] ? row[2].toString() : '',
        action: row[3] ? row[3].toString() : '',
        targetType: row[4] ? row[4].toString() : '',
        targetName: row[5] ? row[5].toString() : '',
        details: row[6] ? row[6].toString() : ''
      });
    }

    Logger.log('Total activities found: ' + activities.length);

    // Sort by timestamp descending (newest first)
    activities.sort((a, b) => {
      const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return dateB - dateA;
    });

    // Limit results
    const maxLimit = limit || 10;
    const result = activities.slice(0, maxLimit);
    Logger.log('Returning ' + result.length + ' activities');
    return result;

  } catch (error) {
    Logger.log('Error getting recent activity: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return [];
  }
}

/**
 * Archive old audit logs older than retention period
 * Should be run periodically (e.g., weekly trigger)
 * @returns {Object} Result with archived count
 */
function archiveOldAuditLogs() {
  try {
    const ss = getSpreadsheet();
    const auditSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.AUDIT_TRAIL);

    if (!auditSheet) {
      return { success: false, message: 'Audit Trail sheet not found' };
    }

    const data = auditSheet.getDataRange().getValues();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CONFIG.AUDIT.RETENTION_DAYS);

    let archivedCount = 0;
    let rowsToDelete = [];

    // Find rows older than retention period (skip header)
    for (let i = data.length - 1; i >= 1; i--) {
      const timestamp = data[i][1]; // Timestamp column
      if (timestamp instanceof Date && timestamp < cutoffDate) {
        rowsToDelete.push(i + 1); // +1 for 1-based indexing
      }
    }

    // Archive to a separate sheet before deletion
    if (rowsToDelete.length > 0) {
      const archiveSheetName = 'Audit Archive ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
      let archiveSheet = ss.getSheetByName(archiveSheetName);

      if (!archiveSheet) {
        archiveSheet = createOrGetSheet(archiveSheetName, [
          'Audit ID', 'Timestamp', 'Username', 'Action', 'Target Type', 'Target Name', 'Details'
        ]);
      }

      // Copy old records to archive
      for (let i = 0; i < rowsToDelete.length; i++) {
        const rowIndex = rowsToDelete[i];
        archiveSheet.appendRow(data[rowIndex - 1]);
      }

      // Delete old records from main audit trail (delete from bottom to top)
      for (let i = 0; i < rowsToDelete.length; i++) {
        auditSheet.deleteRow(rowsToDelete[i]);
      }

      archivedCount = rowsToDelete.length;
    }

    Logger.log('Archived ' + archivedCount + ' audit log entries');
    return {
      success: true,
      archivedCount: archivedCount,
      message: 'Archived ' + archivedCount + ' old audit log entries'
    };

  } catch (error) {
    Logger.log('Error archiving audit logs: ' + error.message);
    return {
      success: false,
      message: 'Error archiving audit logs: ' + error.message
    };
  }
}

/**
 * Clear all data rows while preserving headers
 */
function clearAllData() {
  try {
    const ss = getSpreadsheet();
    const sheetNames = [
      CONFIG.SHEET_NAMES.USERS,
      CONFIG.SHEET_NAMES.GUARDS,
      CONFIG.SHEET_NAMES.DOCUMENTS,
      CONFIG.SHEET_NAMES.LICENSES,
      CONFIG.SHEET_NAMES.PERFORMANCE,
      CONFIG.SHEET_NAMES.HEALTH,
      CONFIG.SHEET_NAMES.VIOLATION_TYPES,
      CONFIG.SHEET_NAMES.VIOLATION_SANCTIONS
    ];

    let clearedSheets = [];

    sheetNames.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          // Delete all rows except header (row 1)
          sheet.deleteRows(2, lastRow - 1);
          clearedSheets.push(sheetName);
        }
      }
    });

    // Re-add default admin user to Users sheet
    const usersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.USERS);
    if (usersSheet && usersSheet.getLastRow() === 1) {
      usersSheet.appendRow([
        'USR001',
        'admin',
        hashPassword('admin123'), // Hash the default password
        'System Administrator',
        'Admin',
        'Active',
        new Date()
      ]);
    }

    return {
      success: true,
      message: 'All data cleared successfully. Cleared sheets: ' + clearedSheets.join(', '),
      clearedCount: clearedSheets.length
    };

  } catch (error) {
    return {
      success: false,
      message: 'Error clearing data: ' + error.message
    };
  }
}

/**
 * Clear all data with confirmation dialog
 */
function clearAllDataWithConfirmation() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Clear All Data',
    'This will delete all records (guards, documents, performance records, etc.) but keep the sheet structure and headers.\n\nThe default admin user will be preserved.\n\nAre you sure you want to continue?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    const result = clearAllData();
    if (result.success) {
      ui.alert('Success', result.message, ui.ButtonSet.OK);
    } else {
      ui.alert('Error', result.message, ui.ButtonSet.OK);
    }
  }
}

