/**
 * Guard Monitoring System - Performance Records Management
 * Functions: addPerformanceRecord, updatePerformanceRecord, deletePerformanceRecord, getAllPerformanceRecords, uploadPDFToDrive
 */

function addPerformanceRecord(performanceData, username) {
  try {
    const ss = getSpreadsheet();
    let performanceSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERFORMANCE);

    // Auto-create sheet if it doesn't exist
    if (!performanceSheet) {
      Logger.log('Performance sheet not found, creating it...');
      performanceSheet = createOrGetSheet(CONFIG.SHEET_NAMES.PERFORMANCE, [
        'Record ID', 'Guard ID', 'Guard Name', 'Type', 'Type of Violation', 'Short Description', 'Date', 'Violation Sanction', 'PDF Link'
      ]);
    }

    // Generate unique Record ID
    const recordId = 'PERF' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');

    // Format date
    const date = performanceData.date ?
      Utilities.formatDate(new Date(performanceData.date), Session.getScriptTimeZone(), 'MMM dd, yyyy') : '';

    // Determine Type of Violation and Violation Sanction based on Type
    const typeOfViolation = performanceData.type === 'Violation' ? (performanceData.typeOfViolation || '') : 'N/A';
    const violationSanction = performanceData.type === 'Violation' ? (performanceData.violationSanction || '') : 'N/A';

    // Add performance record
    performanceSheet.appendRow([
      recordId,
      performanceData.guardId || '',
      performanceData.guardName || '',
      performanceData.type || '',
      typeOfViolation,
      performanceData.shortDescription || '',
      date,
      violationSanction,
      performanceData.pdfLink || ''
    ]);

    // Log audit trail
    const actionType = performanceData.type === 'Violation' ? 'Violation' : 'Accomplishment';
    logAudit(username, actionType, 'Performance Record', performanceData.guardName, actionType + ' added for guard');

    return {
      success: true,
      recordId: recordId,
      message: 'Performance record added successfully!'
    };
  } catch (error) {
    Logger.log('Error adding performance record: ' + error.message);
    return {
      success: false,
      message: 'Error adding performance record: ' + error.message
    };
  }
}

/**
 * Update a performance record
 * @param {string} recordId - Record ID to update
 * @param {Object} performanceData - Performance data
 * @param {string} username - Username performing the action
 * @returns {Object} Result object
 */
function updatePerformanceRecord(recordId, performanceData, username) {
  try {
    const ss = getSpreadsheet();
    const performanceSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERFORMANCE);

    if (!performanceSheet) {
      return {
        success: false,
        message: 'Performance sheet not found'
      };
    }

    // Find record row
    const data = performanceSheet.getDataRange().getValues();
    let recordRowIndex = -1;
    let guardName = '';
    let recordType = '';

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === recordId) {
        recordRowIndex = i + 1; // +1 because sheet rows are 1-indexed
        guardName = data[i][2] || ''; // Guard Name
        recordType = data[i][3] || ''; // Type (Violation/Accomplishment)
        break;
      }
    }

    if (recordRowIndex === -1) {
      return {
        success: false,
        message: 'Record not found'
      };
    }

    // Format date
    const date = performanceData.date ?
      Utilities.formatDate(new Date(performanceData.date), Session.getScriptTimeZone(), 'MMM dd, yyyy') : '';

    // Determine Type of Violation and Violation Sanction based on Type
    const typeOfViolation = performanceData.type === 'Violation' ? (performanceData.typeOfViolation || '') : 'N/A';
    const violationSanction = performanceData.type === 'Violation' ? (performanceData.violationSanction || '') : 'N/A';

    // Update record (keep Record ID, Guard ID, and Guard Name unchanged)
    performanceSheet.getRange(recordRowIndex, 4).setValue(performanceData.type || '');
    performanceSheet.getRange(recordRowIndex, 5).setValue(typeOfViolation);
    performanceSheet.getRange(recordRowIndex, 6).setValue(performanceData.shortDescription || '');
    performanceSheet.getRange(recordRowIndex, 7).setValue(date);
    performanceSheet.getRange(recordRowIndex, 8).setValue(violationSanction);
    performanceSheet.getRange(recordRowIndex, 9).setValue(performanceData.pdfLink || '');

    // Log audit trail
    const actionType = performanceData.type === 'Violation' ? 'Violation' : 'Accomplishment';
    logAudit(username, 'Update', actionType, guardName, 'Updated ' + actionType + ' record');

    return {
      success: true,
      message: 'Performance record updated successfully!'
    };
  } catch (error) {
    Logger.log('Error updating performance record: ' + error.message);
    return {
      success: false,
      message: 'Error updating record: ' + error.message
    };
  }
}

/**
 * Generate performance report
 */
function generateReport() {
  const guardsSheet = getSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.GUARDS);
  const performanceSheet = getSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.PERFORMANCE);

  const guardCount = guardsSheet.getLastRow() - 1;
  const performanceRecords = performanceSheet.getLastRow() - 1;

  const message = `Guard Monitoring System Report

Total Guards: ${guardCount}
Total Performance Records: ${performanceRecords}

Report generated on: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')}`;

  SpreadsheetApp.getUi().alert('System Report', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Delete a performance record
 * @param {string} recordId - Record ID to delete
 * @param {string} username - Username of the user performing the action
 * @returns {Object} Result object
 */
function deletePerformanceRecord(recordId, username) {
  try {
    const ss = getSpreadsheet();
    const performanceSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERFORMANCE);

    if (!performanceSheet) {
      return {
        success: false,
        message: 'Performance sheet not found'
      };
    }

    // Find and delete record
    const performanceData = performanceSheet.getDataRange().getValues();
    let recordRowIndex = -1;
    let guardName = '';
    let recordType = '';

    for (let i = 1; i < performanceData.length; i++) {
      if (performanceData[i][0] === recordId) {
        recordRowIndex = i + 1; // +1 because sheet rows are 1-indexed
        guardName = performanceData[i][2] || ''; // Guard Name
        recordType = performanceData[i][3] || ''; // Type (Violation/Accomplishment)
        break;
      }
    }

    if (recordRowIndex === -1) {
      return {
        success: false,
        message: 'Record not found'
      };
    }

    // Delete record row
    performanceSheet.deleteRow(recordRowIndex);

    // Log audit trail
    logAudit(username, 'Delete', recordType, guardName, 'Deleted ' + recordType + ' record');

    return {
      success: true,
      message: 'Performance record deleted successfully'
    };

  } catch (error) {
    Logger.log('Error deleting performance record: ' + error.message);
    return {
      success: false,
      message: 'Error deleting record: ' + error.message
    };
  }
}

/**
 * Get all performance records
 * @returns {Array} Array of performance records
 */
function getAllPerformanceRecords() {
  try {
    const ss = getSpreadsheet();
    const performanceSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERFORMANCE);

    // If sheet doesn't exist, return empty array
    if (!performanceSheet) {
      Logger.log('Performance sheet not found');
      return [];
    }

    // Check if there's any data beyond headers
    const performanceLastRow = performanceSheet.getLastRow();

    if (performanceLastRow <= 1) {
      return [];
    }

    const performanceData = performanceSheet.getDataRange().getValues();
    const records = [];
    const timezone = Session.getScriptTimeZone();

    // Optimized date formatter
    const formatDate = (value) => {
      if (!value) return '';
      if (value instanceof Date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const d = new Date(value.getTime());
        return months[d.getMonth()] + ' ' +
               String(d.getDate()).padStart(2, '0') + ', ' +
               d.getFullYear();
      }
      return value.toString();
    };

    // Parse date for sorting
    const parseDate = (dateStr) => {
      if (!dateStr) return new Date(0);
      if (dateStr instanceof Date) return dateStr;
      // Try to parse the date string
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? new Date(0) : parsed;
    };

    // Skip header row (index 0) and build records array
    for (let i = 1; i < performanceData.length; i++) {
      const row = performanceData[i];

      const record = {
        recordId: row[0] ? row[0].toString() : '',
        guardId: row[1] ? row[1].toString() : '',
        guardName: row[2] ? row[2].toString() : '',
        type: row[3] ? row[3].toString() : '',
        typeOfViolation: row[4] ? row[4].toString() : '',
        shortDescription: row[5] ? row[5].toString() : '',
        date: formatDate(row[6]),
        dateRaw: row[6], // Keep raw date for sorting
        violationSanction: row[7] ? row[7].toString() : '',
        pdfLink: row[8] ? row[8].toString() : ''
      };

      records.push(record);
    }

    // Sort by date descending (newest first)
    records.sort((a, b) => {
      const dateA = parseDate(a.dateRaw);
      const dateB = parseDate(b.dateRaw);
      return dateB - dateA; // Descending order
    });

    // Remove dateRaw from final output
    records.forEach(record => delete record.dateRaw);

    return records;
  } catch (error) {
    Logger.log('Error getting performance records: ' + error.message);
    return [];
  }
}

/**
 * Upload PDF file to Google Drive
 * @param {Object} fileData - File data object with content, mimeType, filename
 * @returns {Object} Result with file URL
 */
function uploadPDFToDrive(fileData) {
  try {
    // Get folder from CONFIG
    const folder = DriveApp.getFolderById(CONFIG.GOOGLE_DRIVE_FOLDER_ID);

    // Decode base64 content
    const base64Data = fileData.content.split(',')[1]; // Remove data:application/pdf;base64, prefix
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), fileData.mimeType, fileData.filename);

    // Create file in folder
    const file = folder.createFile(blob);

    // Set sharing permissions to anyone with the link can view
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      success: true,
      fileUrl: file.getUrl(),
      fileId: file.getId(),
      message: 'File uploaded successfully'
    };
  } catch (error) {
    Logger.log('Error uploading PDF: ' + error.message);
    return {
      success: false,
      message: 'Error uploading file: ' + error.message
    };
  }
}

