/**
 * Guard Monitoring System - Setup & Initialization
 * Functions: setupSheets, resetDatabase
 */

/**
 * Setup all required sheets with default data
 * Creates all 9 sheets and populates with default admin user and violation data
 * @returns {Object} Result object with success status and message
 */
function setupSheets() {
  try {
    Logger.log('=== SETUP SHEETS STARTED ===');
    const ss = getSpreadsheet();
    Logger.log('Spreadsheet obtained: ' + ss.getName() + ' (ID: ' + ss.getId() + ')');

    // Create Users sheet
    Logger.log('Creating Users sheet...');
    const usersSheet = createOrGetSheet(CONFIG.SHEET_NAMES.USERS, [
      'User ID', 'Username', 'Password', 'Full Name', 'Role', 'Status', 'Created Date', 'Failed Attempts', 'Last Failed', 'Locked Until', 'Password History', 'Force Password Change'
    ]);
    Logger.log('Users sheet created/retrieved');

    // Add default admin user if sheet is empty
    if (usersSheet.getLastRow() === 1) {
      const defaultPassword = hashPassword('ChangeMe2025!'); // Stronger default password
      usersSheet.appendRow([
        'USR001',
        'admin',
        defaultPassword,
        'System Administrator',
        'Admin',
        'Active',
        new Date(),
        0, // Failed Attempts
        '', // Last Failed
        '', // Locked Until
        JSON.stringify([defaultPassword]), // Password History
        'TRUE' // Force Password Change on first login
      ]);
      Logger.log('Default admin user created with password: ChangeMe2025! (MUST BE CHANGED ON FIRST LOGIN)');
    }

    // Create Guards sheet
    createOrGetSheet(CONFIG.SHEET_NAMES.GUARDS, [
      'Guard ID', 'First Name', 'Middle Name', 'Last Name', 'Suffix',
      'Date of Birth', 'Hired Date', 'End of Contract Date', 'Status', 'Photo URL'
    ]);

    // Create Documents sheet
    createOrGetSheet(CONFIG.SHEET_NAMES.DOCUMENTS, [
      'Guard ID', 'Guard Name', 'License Number', 'License Expiry',
      'National Police Clearance', 'NBI Clearance', 'Drug Test Validity', 'Neuro Exam Validity'
    ]);

    // Create Licenses sheet
    createOrGetSheet(CONFIG.SHEET_NAMES.LICENSES, [
      'Guard ID', 'Guard Name', 'License Type', 'License Number', 'Issue Date', 'Expiry Date', 'Status'
    ]);

    // Create Performance sheet
    createOrGetSheet(CONFIG.SHEET_NAMES.PERFORMANCE, [
      'Record ID', 'Guard ID', 'Guard Name', 'Type', 'Type of Violation', 'Short Description', 'Date', 'Violation Sanction', 'PDF Link'
    ]);

    // Create Health Records sheet
    createOrGetSheet(CONFIG.SHEET_NAMES.HEALTH, [
      'Guard ID', 'Guard Name', 'Date', 'Height (cm)', 'Weight (kg)', 'BMI', 'Status', 'Notes'
    ]);

    // Create Violation Types sheet
    const violationTypesSheet = createOrGetSheet(CONFIG.SHEET_NAMES.VIOLATION_TYPES, [
      'Violation ID', 'Violation Name', 'Description', 'Created Date'
    ]);

    // Add default violation types if sheet is empty
    if (violationTypesSheet.getLastRow() === 1) {
      const defaultViolations = [
        ['VT001', 'Late Arrival', 'Arriving late to assigned shift', new Date()],
        ['VT002', 'Absence Without Leave', 'Not reporting to duty without prior notice', new Date()],
        ['VT003', 'Sleeping on Duty', 'Found sleeping during assigned shift', new Date()],
        ['VT004', 'Improper Uniform', 'Not wearing complete or proper uniform', new Date()],
        ['VT005', 'Insubordination', 'Refusing to follow lawful orders', new Date()]
      ];
      violationTypesSheet.getRange(2, 1, defaultViolations.length, defaultViolations[0].length).setValues(defaultViolations);
    }

    // Create Violation Sanctions sheet
    const violationSanctionsSheet = createOrGetSheet(CONFIG.SHEET_NAMES.VIOLATION_SANCTIONS, [
      'Sanction ID', 'Sanction Name', 'Description', 'Created Date'
    ]);

    // Add default sanctions if sheet is empty
    if (violationSanctionsSheet.getLastRow() === 1) {
      const defaultSanctions = [
        ['VS001', 'Verbal Warning', 'Formal verbal warning documented in record', new Date()],
        ['VS002', 'Written Warning', 'Written warning letter placed in personnel file', new Date()],
        ['VS003', 'Suspension (1 Day)', 'One day suspension without pay', new Date()],
        ['VS004', 'Suspension (3 Days)', 'Three days suspension without pay', new Date()],
        ['VS005', 'Termination', 'Employment termination and return to agency', new Date()]
      ];
      violationSanctionsSheet.getRange(2, 1, defaultSanctions.length, defaultSanctions[0].length).setValues(defaultSanctions);
    }

    // Create Audit Trail sheet
    createOrGetSheet(CONFIG.SHEET_NAMES.AUDIT_TRAIL, [
      'Audit ID', 'Timestamp', 'Username', 'Action', 'Target Type', 'Target Name', 'Details'
    ]);

    Logger.log('=== SETUP SHEETS COMPLETED SUCCESSFULLY ===');

    // Try to show alert if in spreadsheet context, otherwise return message
    try {
      SpreadsheetApp.getUi().alert('Setup Complete!', 'All sheets have been created successfully.\n\nDefault login:\nUsername: admin\nPassword: ChangeMe2025!\n\n⚠️ You must change this password on first login.', SpreadsheetApp.getUi().ButtonSet.OK);
    } catch (e) {
      // Not in UI context, return success message
      Logger.log('Returning success message (web app context)');
      return {
        success: true,
        message: 'Setup complete! All sheets created successfully. Default login: admin / ChangeMe2025!'
      };
    }

    return {
      success: true,
      message: 'Setup complete! All sheets created successfully.'
    };

  } catch (error) {
    Logger.log('=== SETUP SHEETS FAILED ===');
    Logger.log('Error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return {
      success: false,
      message: 'Setup failed: ' + error.message
    };
  }
}

/**
 * Reset Database - Drop all sheets and rebuild from scratch
 * WARNING: This will delete ALL data in the database
 * Use this function to get a fresh start with clean sheets
 * @returns {Object} Result object with success status, message, and counts
 */
function resetDatabase() {
  try {
    Logger.log('=== RESET DATABASE STARTED ===');
    Logger.log('WARNING: This will delete all existing data!');

    const ss = getSpreadsheet();
    Logger.log('Spreadsheet obtained: ' + ss.getName() + ' (ID: ' + ss.getId() + ')');

    // Get all sheet names from CONFIG
    const sheetNames = Object.values(CONFIG.SHEET_NAMES);
    Logger.log('Sheets to delete: ' + sheetNames.join(', '));

    // Delete each sheet if it exists
    let deletedCount = 0;
    for (const sheetName of sheetNames) {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        ss.deleteSheet(sheet);
        Logger.log(`Deleted sheet: ${sheetName}`);
        deletedCount++;
      } else {
        Logger.log(`Sheet not found (skipped): ${sheetName}`);
      }
    }

    Logger.log(`Total sheets deleted: ${deletedCount}`);
    Logger.log('=== ALL SHEETS DELETED ===');

    // Rebuild all sheets using setupSheets
    Logger.log('Rebuilding sheets...');
    const setupResult = setupSheets();

    if (setupResult.success) {
      Logger.log('=== RESET DATABASE COMPLETED SUCCESSFULLY ===');

      // Try to show alert if in spreadsheet context
      try {
        SpreadsheetApp.getUi().alert(
          'Database Reset Complete!',
          `All sheets have been deleted and rebuilt.\n\nSheets deleted: ${deletedCount}\nSheets created: ${sheetNames.length}\n\nDefault login:\nUsername: admin\nPassword: ChangeMe2025!\n\n⚠️ You must change this password on first login.`,
          SpreadsheetApp.getUi().ButtonSet.OK
        );
      } catch (e) {
        Logger.log('Returning success message (web app context)');
      }

      return {
        success: true,
        message: `Database reset complete! ${deletedCount} sheets deleted and ${sheetNames.length} sheets recreated. Default login: admin / ChangeMe2025!`,
        deletedCount: deletedCount,
        createdCount: sheetNames.length
      };
    } else {
      throw new Error('Failed to rebuild sheets: ' + setupResult.message);
    }

  } catch (error) {
    Logger.log('=== RESET DATABASE FAILED ===');
    Logger.log('Error: ' + error.message);
    Logger.log('Stack: ' + error.stack);

    // Try to show error alert
    try {
      SpreadsheetApp.getUi().alert(
        'Reset Failed!',
        'Error: ' + error.message,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } catch (e) {
      Logger.log('Cannot show UI alert (web app context)');
    }

    return {
      success: false,
      message: 'Reset failed: ' + error.message
    };
  }
}
