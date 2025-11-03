/**
 * Guard Monitoring System - Main Entry Points
 * Functions: doGet, onOpen, onInstall, autoInitialize, showDashboard, showAddGuardDialog
 */

/**
 * Auto-initialize database if Users sheet doesn't exist
 * @returns {boolean} True if initialization was performed
 */
function autoInitialize() {
  try {
    const ss = getSpreadsheet();
    const usersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.USERS);

    if (!usersSheet) {
      Logger.log('Users sheet not found. Running initial setup...');
      setupSheets();
      return true;
    }
    return false;
  } catch (error) {
    Logger.log('Auto-initialize error: ' + error.message);
    return false;
  }
}

/**
 * Serves the web app landing page with security headers
 * @returns {HtmlOutput} The HTML output for the web app
 */
function doGet() {
  // Auto-initialize database on first access
  autoInitialize();

  const output = HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Guard Monitoring System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  // Add Content Security Policy for XSS protection
  // Note: Google Apps Script has limitations on CSP implementation
  // This provides baseline protection for external resources
  output.addMetaTag('viewport', 'width=device-width, initial-scale=1.0');

  return output;
}

/**
 * Runs when add-on is installed
 * @param {Object} e - Event object
 */
function onInstall(e) {
  onOpen(e);
  // Auto-run setup on installation
  setupSheets();
}

/**
 * Creates the main menu when spreadsheet opens
 * @param {Object} e - Event object
 */
function onOpen(e) {
  // Auto-initialize if needed
  autoInitialize();

  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Guard Monitoring')
    .addItem('Show Dashboard', 'showDashboard')
    .addItem('Add New Guard', 'showAddGuardDialog')
    .addItem('Check License Expiry', 'checkLicenseExpiry')
    .addItem('Generate Report', 'generateReport')
    .addSeparator()
    .addItem('Clear All Data', 'clearAllDataWithConfirmation')
    .addSeparator()
    .addItem('Setup System', 'setupSheets')
    .addToUi();
}

/**
 * Shows the landing page dashboard in a modal dialog
 */
function showDashboard() {
  const html = HtmlService.createHtmlOutputFromFile('index')
    .setWidth(900)
    .setHeight(700)
    .setTitle('Guard Monitoring System');
  SpreadsheetApp.getUi().showModalDialog(html, 'Guard Monitoring System');
}

/**
 * Shows Add Guard dialog (for spreadsheet menu)
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
        font-size: 13px;
        box-sizing: border-box;
      }
      button {
        background: #006341;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        margin-top: 10px;
      }
      button:hover {
        background: #004d31;
      }
      .success {
        color: green;
        margin-top: 10px;
      }
      .error {
        color: red;
        margin-top: 10px;
      }
    </style>

    <h3 style="color: #006341;">Add New Guard</h3>
    <form id="guardForm">
      <div class="form-group">
        <label>First Name *</label>
        <input type="text" id="firstName" required>
      </div>
      <div class="form-group">
        <label>Middle Name</label>
        <input type="text" id="middleName">
      </div>
      <div class="form-group">
        <label>Last Name *</label>
        <input type="text" id="lastName" required>
      </div>
      <div class="form-group">
        <label>Suffix</label>
        <input type="text" id="suffix" placeholder="Jr., Sr., III, etc.">
      </div>
      <div class="form-group">
        <label>Date of Birth *</label>
        <input type="date" id="dateOfBirth" required>
      </div>
      <div class="form-group">
        <label>Hired Date *</label>
        <input type="date" id="hiredDate" required>
      </div>
      <div class="form-group">
        <label>End of Contract Date</label>
        <input type="date" id="endOfContractDate">
      </div>
      <div class="form-group">
        <label>Status *</label>
        <select id="status" required>
          <option value="">Select Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
        </select>
      </div>

      <h4 style="color: #006341; margin-top: 20px;">Document Information</h4>
      <div class="form-group">
        <label>License Number *</label>
        <input type="text" id="licenseNumber" required>
      </div>
      <div class="form-group">
        <label>License Expiry *</label>
        <input type="date" id="licenseExpiry" required>
      </div>
      <div class="form-group">
        <label>Police Clearance Expiry *</label>
        <input type="date" id="policeClearanceExpiry" required>
      </div>
      <div class="form-group">
        <label>NBI Clearance Expiry *</label>
        <input type="date" id="nbiClearanceExpiry" required>
      </div>
      <div class="form-group">
        <label>Drug Test Validity *</label>
        <input type="date" id="drugTestValidity" required>
      </div>
      <div class="form-group">
        <label>Neuro Exam Validity *</label>
        <input type="date" id="neuroExamValidity" required>
      </div>

      <button type="submit">Add Guard</button>
      <div id="message"></div>
    </form>

    <script>
      document.getElementById('guardForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const guardData = {
          firstName: document.getElementById('firstName').value,
          middleName: document.getElementById('middleName').value,
          lastName: document.getElementById('lastName').value,
          suffix: document.getElementById('suffix').value,
          dateOfBirth: document.getElementById('dateOfBirth').value,
          hiredDate: document.getElementById('hiredDate').value,
          endOfContractDate: document.getElementById('endOfContractDate').value,
          status: document.getElementById('status').value,
          licenseNumber: document.getElementById('licenseNumber').value,
          licenseExpiry: document.getElementById('licenseExpiry').value,
          policeClearanceExpiry: document.getElementById('policeClearanceExpiry').value,
          nbiClearanceExpiry: document.getElementById('nbiClearanceExpiry').value,
          drugTestValidity: document.getElementById('drugTestValidity').value,
          neuroExamValidity: document.getElementById('neuroExamValidity').value
        };

        google.script.run
          .withSuccessHandler(function(result) {
            const msg = document.getElementById('message');
            if (result.success) {
              msg.innerHTML = '<div class="success">' + result.message + '</div>';
              document.getElementById('guardForm').reset();
            } else {
              msg.innerHTML = '<div class="error">' + result.message + '</div>';
            }
          })
          .withFailureHandler(function(error) {
            document.getElementById('message').innerHTML = '<div class="error">Error: ' + error.message + '</div>';
          })
          .addGuard(guardData, 'admin');
      });
    </script>
  `)
    .setWidth(500)
    .setHeight(650);

  SpreadsheetApp.getUi().showModalDialog(html, 'Add New Guard');
}
