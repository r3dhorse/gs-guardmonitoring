/**
 * Guard Monitoring System - Dashboard Statistics & Analytics
 * Functions: getDashboardStats, getTopViolationTypes, getTopGuardsViolations, getTopGuardsAccomplishments
 */

function getDashboardStats(month, year) {
  try {
    const ss = getSpreadsheet();
    const guardsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GUARDS);
    const documentsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DOCUMENTS);
    const performanceSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERFORMANCE);
    const healthSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.HEALTH);

    if (!guardsSheet || !documentsSheet) {
      return {
        totalGuards: 0,
        activeGuards: 0,
        expiredLicenses: 0,
        monthlyViolations: 0,
        monthlyAccomplishments: 0,
        bmiNormal: 0,
        bmiUnderweight: 0,
        bmiOverweight: 0,
        bmiObese: 0
      };
    }

    const guardsData = guardsSheet.getDataRange().getValues();
    const documentsData = documentsSheet.getDataRange().getValues();
    const healthData = healthSheet ? healthSheet.getDataRange().getValues() : [];

    let totalGuards = 0;
    let activeGuards = 0;
    let expiredLicenses = 0;
    let monthlyViolations = 0;
    let monthlyAccomplishments = 0;
    let bmiNormal = 0;
    let bmiUnderweight = 0;
    let bmiOverweight = 0;
    let bmiObese = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get month start and end dates (use parameters or current month/year)
    const now = new Date();
    const filterYear = year || now.getFullYear();

    let currentMonthStart, currentMonthEnd;

    if (month === null || month === undefined) {
      // All year view - from Jan 1 to Dec 31 of the year
      currentMonthStart = new Date(filterYear, 0, 1);
      currentMonthStart.setHours(0, 0, 0, 0);
      currentMonthEnd = new Date(filterYear, 11, 31);
      currentMonthEnd.setHours(23, 59, 59, 999);
    } else {
      // Specific month view
      const filterMonth = month;
      currentMonthStart = new Date(filterYear, filterMonth - 1, 1);
      currentMonthStart.setHours(0, 0, 0, 0);
      currentMonthEnd = new Date(filterYear, filterMonth, 0);
      currentMonthEnd.setHours(23, 59, 59, 999);
    }

    // Count guards by status
    for (let i = 1; i < guardsData.length; i++) {
      if (guardsData[i][0]) { // Guard ID exists
        totalGuards++;
        const status = guardsData[i][8] ? guardsData[i][8].toString() : '';
        if (status === 'Active') {
          activeGuards++;
        }
      }
    }

    // Count expired licenses for active guards only
    // Build a map of active guard IDs
    const activeGuardIds = new Set();
    for (let i = 1; i < guardsData.length; i++) {
      const guardId = guardsData[i][0] ? guardsData[i][0].toString() : '';
      const status = guardsData[i][8] ? guardsData[i][8].toString() : '';
      if (guardId && status === 'Active') {
        activeGuardIds.add(guardId);
      }
    }

    // Check documents for expired licenses (only for active guards)
    for (let i = 1; i < documentsData.length; i++) {
      const guardId = documentsData[i][0] ? documentsData[i][0].toString() : '';

      // Only check if guard is active
      if (activeGuardIds.has(guardId)) {
        const licenseExpiry = documentsData[i][3]; // License Expiry column

        if (licenseExpiry) {
          const expiryDate = licenseExpiry instanceof Date ? licenseExpiry : new Date(licenseExpiry);

          // Check if license is expired
          if (expiryDate < today) {
            expiredLicenses++;
          }
        }
      }
    }

    // Count monthly violations and accomplishments
    if (performanceSheet && performanceSheet.getLastRow() > 1) {
      const performanceData = performanceSheet.getDataRange().getValues();

      for (let i = 1; i < performanceData.length; i++) {
        const recordDate = performanceData[i][6]; // Date column
        const recordType = performanceData[i][3] ? performanceData[i][3].toString() : ''; // Type column

        if (recordDate) {
          const dateObj = recordDate instanceof Date ? recordDate : new Date(recordDate);

          // Check if date is within current month
          if (dateObj >= currentMonthStart && dateObj <= currentMonthEnd) {
            if (recordType === 'Violation') {
              monthlyViolations++;
            } else if (recordType === 'Accomplishment') {
              monthlyAccomplishments++;
            }
          }
        }
      }
    }

    // Count BMI status for active guards only
    // Create a map of health data by guardId
    const healthMap = {};
    for (let i = 1; i < healthData.length; i++) {
      const guardId = healthData[i][0] ? healthData[i][0].toString() : '';
      const bmi = healthData[i][5]; // BMI column
      if (guardId && bmi) {
        healthMap[guardId] = parseFloat(bmi);
      }
    }

    // Count BMI categories for active guards
    for (const guardId of activeGuardIds) {
      if (healthMap[guardId]) {
        const bmiValue = healthMap[guardId];

        // Categorize based on BMI ranges
        if (bmiValue > 18.5 && bmiValue <= 25) {
          bmiNormal++;
        } else if (bmiValue <= 18.5) {
          bmiUnderweight++; // Includes both underweight and severely underweight
        } else if (bmiValue > 25 && bmiValue <= 30) {
          bmiOverweight++;
        } else {
          bmiObese++; // BMI > 30
        }
      }
    }

    return {
      totalGuards: totalGuards,
      activeGuards: activeGuards,
      expiredLicenses: expiredLicenses,
      monthlyViolations: monthlyViolations,
      monthlyAccomplishments: monthlyAccomplishments,
      bmiNormal: bmiNormal,
      bmiUnderweight: bmiUnderweight,
      bmiOverweight: bmiOverweight,
      bmiObese: bmiObese
    };

  } catch (error) {
    Logger.log('Error getting dashboard stats: ' + error.message);
    return {
      totalGuards: 0,
      activeGuards: 0,
      expiredLicenses: 0,
      monthlyViolations: 0,
      monthlyAccomplishments: 0,
      bmiNormal: 0,
      bmiUnderweight: 0,
      bmiOverweight: 0,
      bmiObese: 0
    };
  }
}

/**
 * Get top 5 violation types for specified month
 * @param {number} month - Month filter (1-12), defaults to current month
 * @param {number} year - Year filter, defaults to current year
 * @returns {Array} Array of violation type objects with counts
 */
function getTopViolationTypes(month, year) {
  try {
    const ss = getSpreadsheet();
    const performanceSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERFORMANCE);

    if (!performanceSheet || performanceSheet.getLastRow() <= 1) {
      return [];
    }

    // Get month start and end dates (use parameters or current month/year)
    const now = new Date();
    const filterYear = year || now.getFullYear();

    let currentMonthStart, currentMonthEnd;

    if (month === null || month === undefined) {
      // All year view - from Jan 1 to Dec 31 of the year
      currentMonthStart = new Date(filterYear, 0, 1);
      currentMonthStart.setHours(0, 0, 0, 0);
      currentMonthEnd = new Date(filterYear, 11, 31);
      currentMonthEnd.setHours(23, 59, 59, 999);
    } else {
      // Specific month view
      const filterMonth = month;
      currentMonthStart = new Date(filterYear, filterMonth - 1, 1);
      currentMonthStart.setHours(0, 0, 0, 0);
      currentMonthEnd = new Date(filterYear, filterMonth, 0);
      currentMonthEnd.setHours(23, 59, 59, 999);
    }

    const performanceData = performanceSheet.getDataRange().getValues();
    const violationCounts = {};

    // Count violation types for current month
    for (let i = 1; i < performanceData.length; i++) {
      const recordDate = performanceData[i][6]; // Date column
      const recordType = performanceData[i][3] ? performanceData[i][3].toString() : ''; // Type column
      const violationType = performanceData[i][4] ? performanceData[i][4].toString() : ''; // Type of Violation column

      if (recordDate && recordType === 'Violation' && violationType && violationType !== 'N/A') {
        const dateObj = recordDate instanceof Date ? recordDate : new Date(recordDate);

        // Check if date is within current month
        if (dateObj >= currentMonthStart && dateObj <= currentMonthEnd) {
          if (violationCounts[violationType]) {
            violationCounts[violationType]++;
          } else {
            violationCounts[violationType] = 1;
          }
        }
      }
    }

    // Convert to array and sort by count descending
    const violationArray = Object.keys(violationCounts).map(key => ({
      violationType: key,
      count: violationCounts[key]
    }));

    violationArray.sort((a, b) => b.count - a.count);

    // Return top 5
    return violationArray.slice(0, 5);

  } catch (error) {
    Logger.log('Error getting top violation types: ' + error.message);
    return [];
  }
}

/**
 * Get top 5 guards with most violations for specified month
 * @param {number} month - Month filter (1-12), defaults to current month
 * @param {number} year - Year filter, defaults to current year
 * @returns {Array} Array of guard objects with violation counts
 */
function getTopGuardsViolations(month, year) {
  try {
    const ss = getSpreadsheet();
    const performanceSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERFORMANCE);

    if (!performanceSheet || performanceSheet.getLastRow() <= 1) {
      return [];
    }

    // Get month start and end dates (use parameters or current month/year)
    const now = new Date();
    const filterYear = year || now.getFullYear();

    let currentMonthStart, currentMonthEnd;

    if (month === null || month === undefined) {
      // All year view - from Jan 1 to Dec 31 of the year
      currentMonthStart = new Date(filterYear, 0, 1);
      currentMonthStart.setHours(0, 0, 0, 0);
      currentMonthEnd = new Date(filterYear, 11, 31);
      currentMonthEnd.setHours(23, 59, 59, 999);
    } else {
      // Specific month view
      const filterMonth = month;
      currentMonthStart = new Date(filterYear, filterMonth - 1, 1);
      currentMonthStart.setHours(0, 0, 0, 0);
      currentMonthEnd = new Date(filterYear, filterMonth, 0);
      currentMonthEnd.setHours(23, 59, 59, 999);
    }

    const performanceData = performanceSheet.getDataRange().getValues();
    const violationCounts = {};

    // Count violations per guard for current month
    for (let i = 1; i < performanceData.length; i++) {
      const recordDate = performanceData[i][6]; // Date column
      const recordType = performanceData[i][3] ? performanceData[i][3].toString() : ''; // Type column
      const guardName = performanceData[i][2] ? performanceData[i][2].toString() : ''; // Guard Name column

      if (recordDate && recordType === 'Violation' && guardName) {
        const dateObj = recordDate instanceof Date ? recordDate : new Date(recordDate);

        // Check if date is within current month
        if (dateObj >= currentMonthStart && dateObj <= currentMonthEnd) {
          if (violationCounts[guardName]) {
            violationCounts[guardName]++;
          } else {
            violationCounts[guardName] = 1;
          }
        }
      }
    }

    // Convert to array and sort by count descending
    const violationArray = Object.keys(violationCounts).map(key => ({
      guardName: key,
      count: violationCounts[key]
    }));

    violationArray.sort((a, b) => b.count - a.count);

    // Return top 5
    return violationArray.slice(0, 5);

  } catch (error) {
    Logger.log('Error getting top guards violations: ' + error.message);
    return [];
  }
}

/**
 * Test function to create sample audit entries
 */
function testAuditTrail() {
  try {
    // Create 5 sample audit entries
    logAudit('admin', 'Add', 'Guard', 'John Doe', 'Added new guard with ID: GRD20250103120000');
    Utilities.sleep(100);
    logAudit('admin', 'Update', 'Guard', 'Jane Smith', 'Updated guard information');
    Utilities.sleep(100);
    logAudit('admin', 'Violation', 'Performance Record', 'Mike Johnson', 'Violation added for guard');
    Utilities.sleep(100);
    logAudit('admin', 'Accomplishment', 'Performance Record', 'Sarah Williams', 'Accomplishment added for guard');
    Utilities.sleep(100);
    logAudit('admin', 'Delete', 'Guard', 'Tom Brown', 'Deleted guard with ID: GRD20250103110000');

    return {
      success: true,
      message: 'Created 5 sample audit entries successfully!'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error: ' + error.message
    };
  }
}

/**
 * Simple test function to verify client-server communication
 */
function testConnection() {
  return {
    success: true,
    message: 'Connection working!',
    timestamp: new Date().toString()
  };
}

/**
 * Check sheet status - returns info about Guards, Documents, and Performance sheets
 */
function checkSheetStatus() {
  try {
    const ss = getSpreadsheet();
    const guardsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GUARDS);
    const documentsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DOCUMENTS);
    const performanceSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERFORMANCE);

    // Get all sheet names in the spreadsheet
    const allSheets = ss.getSheets().map(sheet => sheet.getName());

    return {
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      configuredId: CONFIG.SPREADSHEET_ID,
      allSheets: allSheets,
      guards: {
        exists: !!guardsSheet,
        rows: guardsSheet ? guardsSheet.getLastRow() : 0,
        dataRows: guardsSheet ? Math.max(0, guardsSheet.getLastRow() - 1) : 0
      },
      documents: {
        exists: !!documentsSheet,
        rows: documentsSheet ? documentsSheet.getLastRow() : 0,
        dataRows: documentsSheet ? Math.max(0, documentsSheet.getLastRow() - 1) : 0
      },
      performance: {
        exists: !!performanceSheet,
        rows: performanceSheet ? performanceSheet.getLastRow() : 0,
        dataRows: performanceSheet ? Math.max(0, performanceSheet.getLastRow() - 1) : 0
      }
    };
  } catch (error) {
    return {
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Authenticate user credentials with rate limiting and account lockout
 */
function authenticateUser(username, password) {
  try {
    const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.USERS);

    if (!sheet) {
      return { success: false, message: 'System error. Please contact administrator.' };
    }

    // Input validation
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return { success: false, message: 'Invalid credentials' };
    }

    if (username.length > 50 || password.length > 128) {
      return { success: false, message: 'Invalid credentials' };
    }

    const data = sheet.getDataRange().getValues();
    const now = new Date();

    // Skip header row, start from row 1
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const storedUsername = row[1]; // Username column

      if (storedUsername === username) {
        const rowIndex = i + 1;
        const storedPasswordHash = row[2];
        const fullName = row[3];
        const role = row[4];
        const status = row[5];
        const failedAttempts = row[7] || 0;
        const lockedUntil = row[9] ? new Date(row[9]) : null;

        // Check account status
        if (status !== 'Active') {
          return { success: false, message: 'Account is inactive. Please contact administrator.' };
        }

        // Check account lockout
        if (lockedUntil && now < lockedUntil) {
          const minutesLeft = Math.ceil((lockedUntil - now) / 60000);
          return {
            success: false,
            message: `Account locked due to multiple failed login attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`
          };
        }

        // Verify password
        if (verifyPassword(password, storedPasswordHash)) {
          // Successful login - Reset failed attempts
          sheet.getRange(rowIndex, 8).setValue(0);
          sheet.getRange(rowIndex, 9).setValue('');
          sheet.getRange(rowIndex, 10).setValue('');

          // Check if password change is required
          const forcePasswordChange = row[11] === 'TRUE' || row[11] === true;

          // Generate session and CSRF tokens
          const sessionToken = generateSessionToken(storedUsername);
          const csrfToken = generateCsrfToken(storedUsername);

          return {
            success: true,
            message: 'Login successful!',
            user: {
              username: storedUsername,
              fullName: fullName,
              role: role
            },
            sessionToken: sessionToken,
            csrfToken: csrfToken,
            forcePasswordChange: forcePasswordChange
          };
        } else {
          // Failed login - Increment failed attempts
          const newFailedAttempts = failedAttempts + 1;
          sheet.getRange(rowIndex, 8).setValue(newFailedAttempts);
          sheet.getRange(rowIndex, 9).setValue(now);

          // Lock account after max attempts
          if (newFailedAttempts >= CONFIG.VALIDATION.MAX_LOGIN_ATTEMPTS) {
            const lockUntil = new Date(now.getTime() + CONFIG.VALIDATION.LOCKOUT_DURATION_MINUTES * 60000);
            sheet.getRange(rowIndex, 10).setValue(lockUntil);
            return {
              success: false,
              message: `Account locked due to multiple failed login attempts. Try again in ${CONFIG.VALIDATION.LOCKOUT_DURATION_MINUTES} minutes.`
            };
          }

          const attemptsLeft = CONFIG.VALIDATION.MAX_LOGIN_ATTEMPTS - newFailedAttempts;
          return {
            success: false,
            message: `Invalid credentials. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`
          };
        }
      }
    }

    // Username not found - Use generic message to prevent user enumeration
    return { success: false, message: 'Invalid credentials' };
  } catch (error) {
    Logger.log('Authentication error: ' + error.message);
    return { success: false, message: 'Authentication failed. Please try again.' };
  }
}

/**
 * Show dialog to add new guard
 */
function showAddGuardDialog() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
        background: #f5f5f5;
      }
      .form-group {
        margin-bottom: 12px;
      }
      label {
        display: block;
        font-weight: 600;
        margin-bottom: 4px;
        color: #006341;
        font-size: 13px;
      }
      input, select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
        font-size: 14px;
      }
      input:focus, select:focus {
        outline: none;
        border-color: #81d742;
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      button {
        background: #81d742;
        color: #006341;
        padding: 12px 24px;
        border: none;
        cursor: pointer;
        font-weight: bold;
        border-radius: 4px;
        width: 100%;
        font-size: 14px;
        margin-top: 10px;
      }
      button:hover { background: #6bc92b; }
      h3 {
        margin-top: 0;
        color: #006341;
      }
    </style>
    <h3>Add New Guard</h3>

    <div class="form-group">
      <label>First Name *</label>
      <input type="text" id="firstName" required>
    </div>

    <div class="row">
      <div class="form-group">
        <label>Middle Name</label>
        <input type="text" id="middleName">
      </div>
      <div class="form-group">
        <label>Last Name *</label>
        <input type="text" id="lastName" required>
      </div>
    </div>

    <div class="form-group">
      <label>Suffix (Jr., Sr., III, etc.)</label>
      <input type="text" id="suffix" placeholder="Optional">
    </div>

    <div class="form-group">
      <label>Date of Birth *</label>
      <input type="date" id="dateOfBirth" required>
    </div>

    <div class="row">
      <div class="form-group">
        <label>Hired Date *</label>
        <input type="date" id="hiredDate" required>
      </div>
      <div class="form-group">
        <label>End of Contract Date</label>
        <input type="date" id="endOfContractDate">
      </div>
    </div>

    <div class="form-group">
      <label>Status *</label>
      <select id="status" required>
        <option value="Active">Active</option>
        <option value="Return To Agency">Return To Agency</option>
        <option value="Banned">Banned</option>
      </select>
    </div>

    <button onclick="submitGuard()">Add Guard</button>

    <script>
      // Set default hired date to today
      document.getElementById('hiredDate').valueAsDate = new Date();

      function submitGuard() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const dateOfBirth = document.getElementById('dateOfBirth').value;
        const hiredDate = document.getElementById('hiredDate').value;

        if (!firstName || !lastName || !dateOfBirth || !hiredDate) {
          alert('Please fill in all required fields (marked with *)');
          return;
        }

        const guardData = {
          firstName: firstName,
          middleName: document.getElementById('middleName').value.trim(),
          lastName: lastName,
          suffix: document.getElementById('suffix').value.trim(),
          dateOfBirth: dateOfBirth,
          hiredDate: hiredDate,
          endOfContractDate: document.getElementById('endOfContractDate').value,
          status: document.getElementById('status').value
        };

        google.script.run.withSuccessHandler(onSuccess).addGuard(guardData);
      }

      function onSuccess(guardId) {
        alert('Guard added successfully! ID: ' + guardId);
        google.script.host.close();
      }
    </script>
  `)
    .setWidth(500)
    .setHeight(650);

  SpreadsheetApp.getUi().showModalDialog(html, 'Add New Guard');
}

/**
 * Get top 5 guards with most accomplishments for specified month
 * @param {number} month - Month filter (1-12), null for all year
 * @param {number} year - Year filter, defaults to current year
 * @returns {Array} Array of guards with accomplishment counts
 */
function getTopGuardsAccomplishments(month, year) {
  try {
    const ss = getSpreadsheet();
    const performanceSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERFORMANCE);

    if (!performanceSheet || performanceSheet.getLastRow() <= 1) {
      return [];
    }

    // Get month start and end dates (use parameters or current month/year)
    const now = new Date();
    const filterYear = year || now.getFullYear();

    let currentMonthStart, currentMonthEnd;

    if (month === null || month === undefined) {
      // All year view - from Jan 1 to Dec 31 of the year
      currentMonthStart = new Date(filterYear, 0, 1);
      currentMonthStart.setHours(0, 0, 0, 0);
      currentMonthEnd = new Date(filterYear, 11, 31);
      currentMonthEnd.setHours(23, 59, 59, 999);
    } else {
      // Specific month view
      const filterMonth = month;
      currentMonthStart = new Date(filterYear, filterMonth - 1, 1);
      currentMonthStart.setHours(0, 0, 0, 0);
      currentMonthEnd = new Date(filterYear, filterMonth, 0);
      currentMonthEnd.setHours(23, 59, 59, 999);
    }

    const performanceData = performanceSheet.getDataRange().getValues();
    const accomplishmentCounts = {};

    // Count accomplishments per guard for current month
    for (let i = 1; i < performanceData.length; i++) {
      const recordDate = performanceData[i][6]; // Date column
      const recordType = performanceData[i][3] ? performanceData[i][3].toString() : ''; // Type column
      const guardName = performanceData[i][2] ? performanceData[i][2].toString() : ''; // Guard Name column

      if (recordDate && recordType === 'Accomplishment' && guardName) {
        const dateObj = recordDate instanceof Date ? recordDate : new Date(recordDate);

        // Check if date is within current month
        if (dateObj >= currentMonthStart && dateObj <= currentMonthEnd) {
          if (accomplishmentCounts[guardName]) {
            accomplishmentCounts[guardName]++;
          } else {
            accomplishmentCounts[guardName] = 1;
          }
        }
      }
    }

    // Convert to array and sort by count descending
    const accomplishmentArray = Object.keys(accomplishmentCounts).map(key => ({
      guardName: key,
      count: accomplishmentCounts[key]
    }));

    accomplishmentArray.sort((a, b) => b.count - a.count);

    // Return top 5
    return accomplishmentArray.slice(0, 5);

  } catch (error) {
    Logger.log('Error getting top guards accomplishments: ' + error.message);
    return [];
  }
}

