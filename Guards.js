/**
 * Guard Monitoring System - Guard Management - CRUD operations for guards
 * Functions: addGuard, updateGuard, deleteGuard, getAllGuards, uploadGuardPhoto
 */

/**
 * Upload guard photo to Google Drive
 * @param {Object} fileData - File data with base64 content, filename, and mimeType
 * @param {string} guardId - Guard ID for folder organization
 * @returns {Object} Result with photo URL or error
 */
function uploadGuardPhoto(fileData, guardId) {
  try {
    Logger.log("Uploading photo for guard: " + guardId);

    // Get the photos folder
    const folder = DriveApp.getFolderById(CONFIG.PHOTO_FOLDER_ID);

    // Decode base64 content
    const contentType = fileData.mimeType || "image/jpeg";
    const base64Data = fileData.base64.split(",")[1] || fileData.base64; // Remove data:image/jpeg;base64, if present
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      contentType,
      fileData.filename
    );

    // Check if guard already has a photo and delete it
    const allFiles = folder.getFiles();
    while (allFiles.hasNext()) {
      const existingFile = allFiles.next();
      const fileName = existingFile.getName();
      // Check if filename starts with guardId
      if (fileName.indexOf(guardId + "_photo") === 0) {
        Logger.log("Deleting existing photo: " + fileName);
        existingFile.setTrashed(true);
      }
    }

    // Create new file with guard ID as prefix
    const filename = guardId + "_photo" + getFileExtension(fileData.filename);
    const file = folder.createFile(blob.setName(filename));

    // Set sharing to anyone with link can view
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Get the file ID and create a thumbnail URL (more reliable for display)
    const fileId = file.getId();
    const photoUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w400";

    Logger.log("Photo uploaded successfully. File ID: " + fileId);
    Logger.log("Photo URL: " + photoUrl);

    return {
      success: true,
      photoUrl: photoUrl,
      fileId: fileId,
      message: "Photo uploaded successfully",
    };
  } catch (error) {
    Logger.log("Error uploading photo: " + error.message);
    Logger.log("Error stack: " + error.stack);
    return {
      success: false,
      message: "Error uploading photo: " + error.message,
    };
  }
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} File extension with dot (e.g., '.jpg')
 */
function getFileExtension(filename) {
  const lastDot = filename.lastIndexOf(".");
  return lastDot > -1 ? filename.substring(lastDot) : ".jpg";
}

/**
 * Test function to verify photo folder access
 * Run this from Apps Script editor to test
 */
function testPhotoFolder() {
  try {
    const folder = DriveApp.getFolderById(CONFIG.PHOTO_FOLDER_ID);
    Logger.log("Photo folder found: " + folder.getName());
    Logger.log("Folder ID: " + folder.getId());

    // List existing files
    const files = folder.getFiles();
    let count = 0;
    while (files.hasNext()) {
      const file = files.next();
      Logger.log("File: " + file.getName() + " (ID: " + file.getId() + ")");
      count++;
    }
    Logger.log("Total files in folder: " + count);

    return {
      success: true,
      folderName: folder.getName(),
      fileCount: count,
    };
  } catch (error) {
    Logger.log("Error accessing photo folder: " + error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

function addGuard(guardData, username) {
  try {
    const ss = getSpreadsheet();
    let guardsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GUARDS);
    let documentsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DOCUMENTS);

    // Auto-create sheets if they don't exist
    if (!guardsSheet) {
      Logger.log("Guards sheet not found, creating it...");
      guardsSheet = createOrGetSheet(CONFIG.SHEET_NAMES.GUARDS, [
        "Guard ID",
        "First Name",
        "Middle Name",
        "Last Name",
        "Suffix",
        "Date of Birth",
        "Hired Date",
        "End of Contract Date",
        "Status",
        "Photo URL",
      ]);
    }

    if (!documentsSheet) {
      Logger.log("Documents sheet not found, creating it...");
      documentsSheet = createOrGetSheet(CONFIG.SHEET_NAMES.DOCUMENTS, [
        "Guard ID",
        "Guard Name",
        "License Number",
        "License Expiry",
        "National Police Clearance",
        "NBI Clearance",
        "Drug Test Validity",
        "Neuro Exam Validity",
      ]);
    }

    const guardId =
      "GRD" +
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyyMMddHHmmss"
      );

    // Format date of birth if provided
    let dateOfBirth = "";
    if (guardData.dateOfBirth) {
      const dob = new Date(guardData.dateOfBirth);
      dateOfBirth = Utilities.formatDate(
        dob,
        Session.getScriptTimeZone(),
        "MMM dd, yyyy"
      );
    }

    // Format hired date
    const hiredDate = Utilities.formatDate(
      new Date(guardData.hiredDate || new Date()),
      Session.getScriptTimeZone(),
      "MMM dd, yyyy"
    );

    // Format end of contract date if provided
    let endOfContractDate = "";
    if (guardData.endOfContractDate) {
      const eoc = new Date(guardData.endOfContractDate);
      endOfContractDate = Utilities.formatDate(
        eoc,
        Session.getScriptTimeZone(),
        "MMM dd, yyyy"
      );
    }

    // Convert name fields to uppercase
    const firstName = (guardData.firstName || "").toUpperCase();
    const middleName = (guardData.middleName || "").toUpperCase();
    const lastName = (guardData.lastName || "").toUpperCase();
    const suffix = (guardData.suffix || "").toUpperCase();

    // Handle photo upload if provided
    let photoUrl = "";
    if (guardData.photo && guardData.photo.base64) {
      const photoResult = uploadGuardPhoto(guardData.photo, guardId);
      if (photoResult.success) {
        photoUrl = photoResult.photoUrl;
      } else {
        Logger.log("Warning: Photo upload failed: " + photoResult.message);
      }
    }

    // Add guard personal information
    guardsSheet.appendRow([
      guardId,
      firstName,
      middleName,
      lastName,
      suffix,
      dateOfBirth,
      hiredDate,
      endOfContractDate,
      guardData.status || "Active",
      photoUrl,
    ]);

    // Format document validity dates
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      return Utilities.formatDate(
        d,
        Session.getScriptTimeZone(),
        "MMM dd, yyyy"
      );
    };

    // Build full name
    const fullName = [firstName, middleName, lastName, suffix]
      .filter(Boolean)
      .join(" ");

    // Add document validity information
    documentsSheet.appendRow([
      guardId,
      fullName,
      guardData.licenseNumber || "",
      formatDate(guardData.licenseExpiry),
      formatDate(guardData.policeClearance),
      formatDate(guardData.nbiClearance),
      formatDate(guardData.drugTestValidity),
      formatDate(guardData.neuroExamValidity),
    ]);

    // Add health records if provided
    if (guardData.height && guardData.weight) {
      let healthSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.HEALTH);

      // Create health sheet if it doesn't exist
      if (!healthSheet) {
        Logger.log("Health Records sheet not found, creating it...");
        healthSheet = createOrGetSheet(CONFIG.SHEET_NAMES.HEALTH, [
          "Guard ID",
          "Guard Name",
          "Date",
          "Height (cm)",
          "Weight (kg)",
          "BMI",
          "Status",
          "Notes",
        ]);
      }

      const heightCm = parseFloat(guardData.height);
      const weightKg = parseFloat(guardData.weight);
      const bmi = calculateBMI(heightCm, weightKg);
      const bmiStatus = getBMIStatus(bmi);
      const currentDate = Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "MMM dd, yyyy"
      );

      healthSheet.appendRow([
        guardId,
        fullName,
        currentDate,
        heightCm,
        weightKg,
        bmi,
        bmiStatus,
        guardData.healthNotes || "",
      ]);
    }

    // Log audit trail
    logAudit(
      username,
      "Add",
      "Guard",
      fullName,
      "Added new guard with ID: " + guardId
    );

    return {
      success: true,
      guardId: guardId,
      message: "Guard added successfully!",
    };
  } catch (error) {
    Logger.log("Error adding guard: " + error.message);
    return {
      success: false,
      message: "Error adding guard: " + error.message,
    };
  }
}

/**
 * Updates an existing guard's information
 * @param {string} guardId - Guard ID
 * @param {Object} guardData - Guard data object
 * @param {string} username - Username performing the action
 * @returns {Object} Result object
 */
function updateGuard(guardId, guardData, username) {
  try {
    const ss = getSpreadsheet();
    const guardsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GUARDS);
    const documentsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DOCUMENTS);

    if (!guardsSheet || !documentsSheet) {
      return {
        success: false,
        message: "Required sheets not found",
      };
    }

    // Find guard row in Guards sheet
    const guardsData = guardsSheet.getDataRange().getValues();
    let guardRowIndex = -1;

    for (let i = 1; i < guardsData.length; i++) {
      if (guardsData[i][0] === guardId) {
        guardRowIndex = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }

    if (guardRowIndex === -1) {
      return {
        success: false,
        message: "Guard not found",
      };
    }

    // Format dates
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      return Utilities.formatDate(
        d,
        Session.getScriptTimeZone(),
        "MMM dd, yyyy"
      );
    };

    const dateOfBirth = formatDate(guardData.dateOfBirth);
    const hiredDate = formatDate(guardData.hiredDate);
    const endOfContractDate = formatDate(guardData.endOfContractDate);

    // Convert name fields to uppercase
    const firstName = (guardData.firstName || "").toUpperCase();
    const middleName = (guardData.middleName || "").toUpperCase();
    const lastName = (guardData.lastName || "").toUpperCase();
    const suffix = (guardData.suffix || "").toUpperCase();

    // Handle photo upload if provided
    let photoUrl = guardsData[guardRowIndex - 1][9] || ""; // Keep existing photo URL
    if (guardData.photo && guardData.photo.base64) {
      const photoResult = uploadGuardPhoto(guardData.photo, guardId);
      if (photoResult.success) {
        photoUrl = photoResult.photoUrl;
      } else {
        Logger.log("Warning: Photo upload failed: " + photoResult.message);
      }
    }

    // Update Guards sheet
    guardsSheet.getRange(guardRowIndex, 2).setValue(firstName);
    guardsSheet.getRange(guardRowIndex, 3).setValue(middleName);
    guardsSheet.getRange(guardRowIndex, 4).setValue(lastName);
    guardsSheet.getRange(guardRowIndex, 5).setValue(suffix);
    guardsSheet.getRange(guardRowIndex, 6).setValue(dateOfBirth);
    guardsSheet.getRange(guardRowIndex, 7).setValue(hiredDate);
    guardsSheet.getRange(guardRowIndex, 8).setValue(endOfContractDate);
    guardsSheet
      .getRange(guardRowIndex, 9)
      .setValue(guardData.status || "Active");
    guardsSheet.getRange(guardRowIndex, 10).setValue(photoUrl);

    // Find and update document row
    const documentsData = documentsSheet.getDataRange().getValues();
    let documentRowIndex = -1;

    for (let i = 1; i < documentsData.length; i++) {
      if (documentsData[i][0] === guardId) {
        documentRowIndex = i + 1;
        break;
      }
    }

    // Build full name (using uppercase variables)
    const fullName = [firstName, middleName, lastName, suffix]
      .filter(Boolean)
      .join(" ");

    if (documentRowIndex !== -1) {
      // Update existing document row
      documentsSheet.getRange(documentRowIndex, 2).setValue(fullName);
      documentsSheet
        .getRange(documentRowIndex, 3)
        .setValue(guardData.licenseNumber || "");
      documentsSheet
        .getRange(documentRowIndex, 4)
        .setValue(formatDate(guardData.licenseExpiry));
      documentsSheet
        .getRange(documentRowIndex, 5)
        .setValue(formatDate(guardData.policeClearance));
      documentsSheet
        .getRange(documentRowIndex, 6)
        .setValue(formatDate(guardData.nbiClearance));
      documentsSheet
        .getRange(documentRowIndex, 7)
        .setValue(formatDate(guardData.drugTestValidity));
      documentsSheet
        .getRange(documentRowIndex, 8)
        .setValue(formatDate(guardData.neuroExamValidity));
    } else {
      // Create new document row if it doesn't exist
      documentsSheet.appendRow([
        guardId,
        fullName,
        guardData.licenseNumber || "",
        formatDate(guardData.licenseExpiry),
        formatDate(guardData.policeClearance),
        formatDate(guardData.nbiClearance),
        formatDate(guardData.drugTestValidity),
        formatDate(guardData.neuroExamValidity),
      ]);
    }

    // Update or create health records if provided
    if (guardData.height && guardData.weight) {
      let healthSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.HEALTH);

      if (!healthSheet) {
        healthSheet = createOrGetSheet(CONFIG.SHEET_NAMES.HEALTH, [
          "Guard ID",
          "Guard Name",
          "Date",
          "Height (cm)",
          "Weight (kg)",
          "BMI",
          "Status",
          "Notes",
        ]);
      }

      const heightCm = parseFloat(guardData.height);
      const weightKg = parseFloat(guardData.weight);
      const bmi = calculateBMI(heightCm, weightKg);
      const bmiStatus = getBMIStatus(bmi);
      const currentDate = Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "MMM dd, yyyy"
      );

      // Find existing health record for this guard
      const healthData = healthSheet.getDataRange().getValues();
      let healthRowIndex = -1;

      for (let i = 1; i < healthData.length; i++) {
        if (healthData[i][0] === guardId) {
          healthRowIndex = i + 1;
          break;
        }
      }

      if (healthRowIndex !== -1) {
        // Update existing health record
        healthSheet.getRange(healthRowIndex, 2).setValue(fullName);
        healthSheet.getRange(healthRowIndex, 3).setValue(currentDate);
        healthSheet.getRange(healthRowIndex, 4).setValue(heightCm);
        healthSheet.getRange(healthRowIndex, 5).setValue(weightKg);
        healthSheet.getRange(healthRowIndex, 6).setValue(bmi);
        healthSheet.getRange(healthRowIndex, 7).setValue(bmiStatus);
        healthSheet
          .getRange(healthRowIndex, 8)
          .setValue(guardData.healthNotes || "");
      } else {
        // Create new health record
        healthSheet.appendRow([
          guardId,
          fullName,
          currentDate,
          heightCm,
          weightKg,
          bmi,
          bmiStatus,
          guardData.healthNotes || "",
        ]);
      }
    }

    // Log audit trail
    logAudit(
      username,
      "Update",
      "Guard",
      fullName,
      "Updated guard information"
    );

    return {
      success: true,
      message: "Guard updated successfully!",
    };
  } catch (error) {
    Logger.log("Error updating guard: " + error.message);
    return {
      success: false,
      message: "Error updating guard: " + error.message,
    };
  }
}

/**
 * Debug function to check raw sheet data
 */
function debugSheetData() {
  Logger.log("=== DEBUG SHEET DATA START ===");

  try {
    Logger.log("Step 1: Getting spreadsheet with ID: " + CONFIG.SPREADSHEET_ID);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    Logger.log("Step 2: Got spreadsheet: " + ss.getName());
    const spreadsheetName = ss.getName();

    Logger.log("Step 3: Getting all sheets");
    const allSheets = ss.getSheets();
    const sheetNames = [];
    for (let i = 0; i < allSheets.length; i++) {
      sheetNames.push(allSheets[i].getName());
    }

    Logger.log("Total sheets: " + allSheets.length);
    Logger.log("Sheet names: " + sheetNames.join(", "));

    Logger.log("Step 4: Looking for Guards sheet");
    const guardsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GUARDS);

    if (!guardsSheet) {
      Logger.log("Guards sheet NOT FOUND");
      const result = {
        success: false,
        error: "Guards sheet not found",
        spreadsheetName: spreadsheetName,
        totalSheets: allSheets.length,
        availableSheets: sheetNames,
      };
      Logger.log("Returning: " + JSON.stringify(result));
      return result;
    }

    Logger.log("Step 5: Getting sheet dimensions");
    const lastRow = guardsSheet.getLastRow();
    const lastCol = guardsSheet.getLastColumn();

    Logger.log("Last row: " + lastRow + ", Last col: " + lastCol);

    if (lastRow === 0 || lastCol === 0) {
      const result = {
        success: false,
        spreadsheetName: spreadsheetName,
        sheetName: CONFIG.SHEET_NAMES.GUARDS,
        lastRow: lastRow,
        lastColumn: lastCol,
        message: "Sheet exists but is empty",
      };
      Logger.log("Returning: " + JSON.stringify(result));
      return result;
    }

    if (lastRow === 1) {
      const result = {
        success: false,
        spreadsheetName: spreadsheetName,
        sheetName: CONFIG.SHEET_NAMES.GUARDS,
        lastRow: lastRow,
        lastColumn: lastCol,
        message: "Only header row exists, no data",
      };
      Logger.log("Returning: " + JSON.stringify(result));
      return result;
    }

    Logger.log("Step 6: Reading data");
    const data = guardsSheet.getRange(1, 1, lastRow, lastCol).getValues();

    Logger.log("Data rows retrieved: " + data.length);

    // Convert Date objects to strings for serialization
    const cleanData = [];
    for (let i = 0; i < data.length; i++) {
      const row = [];
      for (let j = 0; j < data[i].length; j++) {
        const cell = data[i][j];
        if (cell instanceof Date) {
          row.push(cell.toString());
        } else {
          row.push(cell);
        }
      }
      cleanData.push(row);
    }

    const result = {
      success: true,
      spreadsheetName: spreadsheetName,
      sheetName: CONFIG.SHEET_NAMES.GUARDS,
      lastRow: lastRow,
      lastColumn: lastCol,
      totalRows: cleanData.length,
      headersString: cleanData[0].join(" | "),
      firstDataRowString:
        cleanData.length > 1 ? cleanData[1].join(" | ") : "No data",
      totalDataRows: cleanData.length - 1,
      allData: cleanData,
    };

    Logger.log("Returning success result");
    return result;
  } catch (error) {
    Logger.log("ERROR: " + error.message);
    Logger.log("Stack: " + error.stack);

    const result = {
      success: false,
      error: error.message,
      errorType: error.name,
      spreadsheetId: CONFIG.SPREADSHEET_ID,
    };

    Logger.log("Returning error result: " + JSON.stringify(result));
    return result;
  }
}

/**
 * Get all guards with their documents
 */
function getAllGuards() {
  try {
    const ss = getSpreadsheet();
    const guardsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GUARDS);
    const documentsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DOCUMENTS);
    const healthSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.HEALTH);

    // If sheets don't exist, return empty array
    if (!guardsSheet) {
      Logger.log("Guards sheet not found");
      return [];
    }

    if (!documentsSheet) {
      Logger.log("Documents sheet not found");
      return [];
    }

    // Check if there's any data beyond headers
    const guardsLastRow = guardsSheet.getLastRow();

    if (guardsLastRow <= 1) {
      return [];
    }

    const guardsData = guardsSheet.getDataRange().getValues();
    const documentsData = documentsSheet.getDataRange().getValues();
    const healthData = healthSheet
      ? healthSheet.getDataRange().getValues()
      : [];

    const guards = [];
    const timezone = Session.getScriptTimeZone();

    // Optimized date formatter with simple string conversion
    const formatDate = (value) => {
      if (!value) return "";
      if (value instanceof Date) {
        // Fast date formatting using native JS methods
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const d = new Date(value.getTime());
        return (
          months[d.getMonth()] +
          " " +
          String(d.getDate()).padStart(2, "0") +
          ", " +
          d.getFullYear()
        );
      }
      return value.toString();
    };

    // Create a map of documents by guardId for O(1) lookup
    const documentsMap = {};
    for (let i = 1; i < documentsData.length; i++) {
      const guardId = documentsData[i][0];
      if (guardId) {
        const gid = guardId.toString();
        documentsMap[gid] = {
          licenseNumber: documentsData[i][2]
            ? documentsData[i][2].toString()
            : "",
          licenseExpiry: formatDate(documentsData[i][3]),
          policeClearance: formatDate(documentsData[i][4]),
          nbiClearance: formatDate(documentsData[i][5]),
          drugTestValidity: formatDate(documentsData[i][6]),
          neuroExamValidity: formatDate(documentsData[i][7]),
        };
      }
    }

    // Create a map of health records by guardId for O(1) lookup
    const healthMap = {};
    for (let i = 1; i < healthData.length; i++) {
      const guardId = healthData[i][0];
      if (guardId) {
        const gid = guardId.toString();
        healthMap[gid] = {
          height: healthData[i][3] || "",
          weight: healthData[i][4] || "",
          bmi: healthData[i][5] || "",
          status: healthData[i][6] || "",
          notes: healthData[i][7] || "",
          date: formatDate(healthData[i][2]),
        };
      }
    }

    // Skip header row (index 0) and build guards array
    for (let i = 1; i < guardsData.length; i++) {
      const row = guardsData[i];
      const guardId = row[0] ? row[0].toString() : "";

      // Convert old Google Drive URLs to thumbnail URLs (more reliable for display)
      let photoUrl = row[9] ? row[9].toString() : "";
      if (photoUrl) {
        try {
          Logger.log("Original photo URL for guard " + guardId + ": " + photoUrl);

          let fileId = null;

          // Extract file ID from various Google Drive URL formats
          if (photoUrl.indexOf("/file/d/") > -1) {
            // Format: https://drive.google.com/file/d/FILE_ID/view...
            const parts = photoUrl.split("/file/d/");
            if (parts.length > 1) {
              fileId = parts[1].split("/")[0];
            }
          } else if (photoUrl.indexOf("/open?id=") > -1) {
            // Format: https://drive.google.com/open?id=FILE_ID
            const parts = photoUrl.split("/open?id=");
            if (parts.length > 1) {
              fileId = parts[1].split("&")[0];
            }
          } else if (photoUrl.indexOf("id=") > -1) {
            // Format: https://drive.google.com/uc?export=view&id=FILE_ID
            const parts = photoUrl.split("id=");
            if (parts.length > 1) {
              fileId = parts[1].split("&")[0];
            }
          }

          // Convert to thumbnail URL if we extracted a file ID
          if (fileId) {
            // Use thumbnail URL which is more reliable for embedded images
            photoUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w400";
            Logger.log("Converted to thumbnail URL: " + photoUrl);
          } else {
            Logger.log("Could not extract file ID, keeping original URL");
          }
        } catch (error) {
          Logger.log("Error converting photo URL for guard " + guardId + ": " + error.message);
          // Keep original URL if conversion fails
        }
      }

      const guard = {
        guardId: guardId,
        firstName: row[1] ? row[1].toString() : "",
        middleName: row[2] ? row[2].toString() : "",
        lastName: row[3] ? row[3].toString() : "",
        suffix: row[4] ? row[4].toString() : "",
        dateOfBirth: formatDate(row[5]),
        hiredDate: formatDate(row[6]),
        endOfContractDate: formatDate(row[7]),
        status: row[8] ? row[8].toString() : "Active",
        photoUrl: photoUrl,
        documents: documentsMap[guardId] || null,
        health: healthMap[guardId] || null,
      };

      guards.push(guard);
    }

    return guards;
  } catch (error) {
    Logger.log("Error getting guards: " + error.message);
    return [];
  }
}

/**
 * Delete a guard and their associated documents
 * @param {string} guardId - Guard ID to delete
 * @param {string} username - Username performing the action
 * @returns {Object} Result object
 */
function deleteGuard(guardId, username) {
  try {
    // Check admin permission
    if (!hasAdminPermission(username)) {
      return {
        success: false,
        message: "Permission denied. Admin access required.",
      };
    }

    const ss = getSpreadsheet();
    const guardsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GUARDS);
    const documentsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DOCUMENTS);

    if (!guardsSheet || !documentsSheet) {
      return {
        success: false,
        message: "System error. Please contact administrator.",
      };
    }

    // Find and delete guard from Guards sheet
    const guardsData = guardsSheet.getDataRange().getValues();
    let guardRowIndex = -1;
    let guardName = "";

    for (let i = 1; i < guardsData.length; i++) {
      if (guardsData[i][0] === guardId) {
        guardRowIndex = i + 1; // +1 because sheet rows are 1-indexed
        // Build full name for audit
        guardName = [
          guardsData[i][1], // firstName
          guardsData[i][2], // middleName
          guardsData[i][3], // lastName
          guardsData[i][4], // suffix
        ]
          .filter(Boolean)
          .join(" ");
        break;
      }
    }

    if (guardRowIndex === -1) {
      return {
        success: false,
        message: "Guard not found",
      };
    }

    // Delete guard row
    guardsSheet.deleteRow(guardRowIndex);

    // Find and delete documents row
    const documentsData = documentsSheet.getDataRange().getValues();
    let documentRowIndex = -1;

    for (let i = 1; i < documentsData.length; i++) {
      if (documentsData[i][0] === guardId) {
        documentRowIndex = i + 1;
        break;
      }
    }

    if (documentRowIndex !== -1) {
      documentsSheet.deleteRow(documentRowIndex);
    }

    // Log audit trail
    logAudit(
      username,
      "Delete",
      "Guard",
      guardName,
      "Deleted guard with ID: " + guardId
    );

    return {
      success: true,
      message: "Guard deleted successfully",
    };
  } catch (error) {
    Logger.log("Error deleting guard: " + error.message);
    return {
      success: false,
      message: "Error deleting guard: " + error.message,
    };
  }
}

/**
 * Get all violation types
 */
function getViolationTypes() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.VIOLATION_TYPES);

    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    const lastRow = sheet.getLastRow();
    // Get only first 3 columns (ID, Name, Description) - skip Created Date column
    const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();

    // Use map for better performance and filter out empty rows
    const violationTypes = data
      .filter((row) => row[0]) // Filter out rows with empty ID
      .map((row) => ({
        id: row[0] ? String(row[0]).trim() : "",
        name: row[1] ? String(row[1]).trim() : "",
        description: row[2] ? String(row[2]).trim() : "",
      }));

    return violationTypes;
  } catch (error) {
    Logger.log("Error getting violation types: " + error.message);
    Logger.log("Stack trace: " + error.stack);
    return [];
  }
}

/**
 * Get all violation sanctions
 */
function getViolationSanctions() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.VIOLATION_SANCTIONS);

    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    const lastRow = sheet.getLastRow();
    // Get only first 3 columns (ID, Name, Description) - skip Created Date column
    const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();

    // Use map for better performance and filter out empty rows
    const sanctions = data
      .filter((row) => row[0]) // Filter out rows with empty ID
      .map((row) => ({
        id: row[0] ? String(row[0]).trim() : "",
        name: row[1] ? String(row[1]).trim() : "",
        description: row[2] ? String(row[2]).trim() : "",
      }));

    return sanctions;
  } catch (error) {
    Logger.log("Error getting violation sanctions: " + error.message);
    Logger.log("Stack trace: " + error.stack);
    return [];
  }
}

/**
 * Add a new violation type
 */
function addViolationType(name, description) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.VIOLATION_TYPES);

    if (!sheet) {
      return { success: false, message: "Violation Types sheet not found" };
    }

    // Generate ID
    const lastRow = sheet.getLastRow();
    const newId = "VT" + String(lastRow).padStart(3, "0");

    sheet.appendRow([newId, name, description, new Date()]);

    return {
      success: true,
      message: "Violation type added successfully",
      id: newId,
    };
  } catch (error) {
    Logger.log("Error adding violation type: " + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Add a new violation sanction
 */
function addViolationSanction(name, description) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.VIOLATION_SANCTIONS);

    if (!sheet) {
      return { success: false, message: "Violation Sanctions sheet not found" };
    }

    // Generate ID
    const lastRow = sheet.getLastRow();
    const newId = "VS" + String(lastRow).padStart(3, "0");

    sheet.appendRow([newId, name, description, new Date()]);

    return { success: true, message: "Sanction added successfully", id: newId };
  } catch (error) {
    Logger.log("Error adding sanction: " + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Update a violation type
 */
function updateViolationType(violationId, name, description) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.VIOLATION_TYPES);

    if (!sheet) {
      return { success: false, message: "Violation Types sheet not found" };
    }

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === violationId) {
        sheet.getRange(i + 1, 2).setValue(name);
        sheet.getRange(i + 1, 3).setValue(description);
        return {
          success: true,
          message: "Violation type updated successfully",
        };
      }
    }

    return { success: false, message: "Violation type not found" };
  } catch (error) {
    Logger.log("Error updating violation type: " + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Update a violation sanction
 */
function updateViolationSanction(sanctionId, name, description) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.VIOLATION_SANCTIONS);

    if (!sheet) {
      return { success: false, message: "Violation Sanctions sheet not found" };
    }

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sanctionId) {
        sheet.getRange(i + 1, 2).setValue(name);
        sheet.getRange(i + 1, 3).setValue(description);
        return { success: true, message: "Sanction updated successfully" };
      }
    }

    return { success: false, message: "Sanction not found" };
  } catch (error) {
    Logger.log("Error updating sanction: " + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Delete a violation type
 */
function deleteViolationType(violationId) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.VIOLATION_TYPES);

    if (!sheet) {
      return { success: false, message: "Violation Types sheet not found" };
    }

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === violationId) {
        sheet.deleteRow(i + 1);
        return {
          success: true,
          message: "Violation type deleted successfully",
        };
      }
    }

    return { success: false, message: "Violation type not found" };
  } catch (error) {
    Logger.log("Error deleting violation type: " + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Delete a violation sanction
 */
function deleteViolationSanction(sanctionId) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.VIOLATION_SANCTIONS);

    if (!sheet) {
      return { success: false, message: "Violation Sanctions sheet not found" };
    }

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sanctionId) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Sanction deleted successfully" };
      }
    }

    return { success: false, message: "Sanction not found" };
  } catch (error) {
    Logger.log("Error deleting sanction: " + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Check for expiring licenses using configurable alert window
 */
function checkLicenseExpiry() {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.LICENSES);
  const data = sheet.getDataRange().getValues();
  const today = new Date();
  const alertDaysFromNow = new Date(
    today.getTime() + CONFIG.ALERTS.LICENSE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  let expiringLicenses = [];

  for (let i = 1; i < data.length; i++) {
    const expiryDate = new Date(data[i][5]);

    if (expiryDate <= alertDaysFromNow && expiryDate >= today) {
      expiringLicenses.push({
        guardName: data[i][1],
        licenseType: data[i][2],
        expiryDate: Utilities.formatDate(
          expiryDate,
          Session.getScriptTimeZone(),
          "yyyy-MM-dd"
        ),
      });
    }
  }

  if (expiringLicenses.length > 0) {
    let message =
      "The following licenses are expiring within " +
      CONFIG.ALERTS.LICENSE_EXPIRY_DAYS +
      " days:\n\n";
    expiringLicenses.forEach((license) => {
      message += `${license.guardName} - ${license.licenseType} (Expires: ${license.expiryDate})\n`;
    });
    SpreadsheetApp.getUi().alert(
      "License Expiry Alert",
      message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    SpreadsheetApp.getUi().alert(
      "License Check",
      "No licenses expiring in the next 30 days.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Calculate BMI
 */
function calculateBMI(heightCm, weightKg) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

/**
 * Get BMI status based on Philippine/Asian-Pacific standards
 */
function getBMIStatus(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 23) return "Normal";
  if (bmi < 25) return "Overweight";
  if (bmi < 30) return "Obese Class I";
  return "Obese Class II";
}

/**
 * Generate 200 sample guard records for testing
 */
function generateSampleGuards() {
  try {
    const ss = getSpreadsheet();
    const guardsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GUARDS);
    const documentsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DOCUMENTS);
    let healthSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.HEALTH);

    if (!guardsSheet || !documentsSheet) {
      throw new Error(
        "Guards or Documents sheet not found. Run setupSheets() first."
      );
    }

    // Create Health Records sheet if it doesn't exist
    if (!healthSheet) {
      healthSheet = createOrGetSheet(CONFIG.SHEET_NAMES.HEALTH, [
        "Guard ID",
        "Guard Name",
        "Date",
        "Height (cm)",
        "Weight (kg)",
        "BMI",
        "Status",
        "Notes",
      ]);
    }

    // Sample data arrays
    const firstNames = [
      "Juan",
      "Maria",
      "Jose",
      "Ana",
      "Pedro",
      "Rosa",
      "Miguel",
      "Carmen",
      "Antonio",
      "Sofia",
      "Carlos",
      "Isabella",
      "Luis",
      "Elena",
      "Diego",
      "Lucia",
      "Fernando",
      "Victoria",
      "Rafael",
      "Gabriela",
      "Roberto",
      "Camila",
      "Manuel",
      "Valentina",
      "Jorge",
      "Natalia",
      "Ricardo",
      "Andrea",
      "Alejandro",
      "Paula",
    ];

    const middleNames = [
      "Santos",
      "Cruz",
      "Reyes",
      "Ramos",
      "Flores",
      "Torres",
      "Rivera",
      "Gomez",
      "Morales",
      "Castro",
      "Garcia",
      "Martinez",
      "Rodriguez",
      "Lopez",
      "Gonzalez",
      "Perez",
      "Sanchez",
      "Ramirez",
      "Diaz",
      "Fernandez",
    ];

    const lastNames = [
      "Dela Cruz",
      "Santos",
      "Reyes",
      "Bautista",
      "Garcia",
      "Mendoza",
      "Fernandez",
      "Torres",
      "Gonzales",
      "Ramos",
      "Flores",
      "Rivera",
      "Castro",
      "Gomez",
      "Morales",
      "Aquino",
      "Villanueva",
      "Santiago",
      "Lopez",
      "Martinez",
    ];

    const suffixes = ["", "", "", "", "Jr.", "Sr.", "III", "", "", ""]; // Mostly empty
    const statuses = [
      "Active",
      "Active",
      "Active",
      "Active",
      "Active",
      "Return To Agency",
      "Banned",
    ];

    const guardRows = [];
    const documentRows = [];
    const healthRows = [];

    Logger.log("Generating 200 sample guards...");

    for (let i = 0; i < 200; i++) {
      const guardId =
        "GRD" +
        Utilities.formatDate(
          new Date(Date.now() - (200 - i) * 3600000),
          Session.getScriptTimeZone(),
          "yyyyMMddHHmmss"
        );

      // Random personal info
      const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)];
      const middleName =
        middleNames[Math.floor(Math.random() * middleNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      // Random dates
      const dobYear = 1975 + Math.floor(Math.random() * 25); // Born between 1975-2000
      const dobMonth = Math.floor(Math.random() * 12);
      const dobDay = 1 + Math.floor(Math.random() * 28);
      const dob = new Date(dobYear, dobMonth, dobDay);
      const dobStr = Utilities.formatDate(
        dob,
        Session.getScriptTimeZone(),
        "MMM dd, yyyy"
      );

      // Hired date (last 5 years)
      const hiredYear = 2019 + Math.floor(Math.random() * 6);
      const hiredMonth = Math.floor(Math.random() * 12);
      const hiredDay = 1 + Math.floor(Math.random() * 28);
      const hiredDate = new Date(hiredYear, hiredMonth, hiredDay);
      const hiredDateStr = Utilities.formatDate(
        hiredDate,
        Session.getScriptTimeZone(),
        "MMM dd, yyyy"
      );

      // End of contract (50% chance of having one)
      let endOfContract = "";
      if (Math.random() > 0.5) {
        const endYear = 2025 + Math.floor(Math.random() * 3);
        const endMonth = Math.floor(Math.random() * 12);
        const endDay = 1 + Math.floor(Math.random() * 28);
        const endDate = new Date(endYear, endMonth, endDay);
        endOfContract = Utilities.formatDate(
          endDate,
          Session.getScriptTimeZone(),
          "MMM dd, yyyy"
        );
      }

      // Add guard row
      guardRows.push([
        guardId,
        firstName,
        middleName,
        lastName,
        suffix,
        dobStr,
        hiredDateStr,
        endOfContract,
        status,
      ]);

      // Full name for documents
      const fullName = [firstName, middleName, lastName, suffix]
        .filter(Boolean)
        .join(" ");

      // License number
      const licenseNumber =
        "LIC-" + (100000 + Math.floor(Math.random() * 900000));

      // Document expiry dates - varied to create Good/Nearly Expire/Expired statuses
      const randomDays = Math.floor(Math.random() * 365) - 180; // -180 to +185 days from today

      const licenseExpiry = new Date(
        Date.now() + randomDays * 24 * 60 * 60 * 1000
      );
      const policeClearance = new Date(
        Date.now() +
          (randomDays + Math.floor(Math.random() * 90)) * 24 * 60 * 60 * 1000
      );
      const nbiClearance = new Date(
        Date.now() +
          (randomDays - Math.floor(Math.random() * 60)) * 24 * 60 * 60 * 1000
      );
      const drugTest = new Date(
        Date.now() +
          (randomDays + Math.floor(Math.random() * 120)) * 24 * 60 * 60 * 1000
      );
      const neuroExam = new Date(
        Date.now() +
          (randomDays - Math.floor(Math.random() * 90)) * 24 * 60 * 60 * 1000
      );

      const formatDate = (date) =>
        Utilities.formatDate(date, Session.getScriptTimeZone(), "MMM dd, yyyy");

      // Add document row
      documentRows.push([
        guardId,
        fullName,
        licenseNumber,
        formatDate(licenseExpiry),
        formatDate(policeClearance),
        formatDate(nbiClearance),
        formatDate(drugTest),
        formatDate(neuroExam),
      ]);

      // Generate health records (90% of guards have health data)
      if (Math.random() > 0.1) {
        // Realistic Filipino height range: 155cm - 180cm
        const heightCm = 155 + Math.floor(Math.random() * 25);

        // Realistic weight range: 50kg - 90kg
        const weightKg = 50 + Math.floor(Math.random() * 40);

        // Calculate BMI
        const bmi = calculateBMI(heightCm, weightKg);
        const bmiStatus = getBMIStatus(bmi);

        // Health notes (30% chance of having notes)
        const healthNotes =
          Math.random() > 0.7
            ? [
                "Regular checkup completed",
                "Cleared for duty",
                "No medical concerns",
                "Fit for active duty",
                "Good physical condition",
              ][Math.floor(Math.random() * 5)]
            : "";

        const currentDate = Utilities.formatDate(
          new Date(),
          Session.getScriptTimeZone(),
          "MMM dd, yyyy"
        );

        // Add health record row
        healthRows.push([
          guardId,
          fullName,
          currentDate,
          heightCm,
          weightKg,
          bmi,
          bmiStatus,
          healthNotes,
        ]);
      }

      // Log progress every 50 records
      if ((i + 1) % 50 === 0) {
        Logger.log(`Generated ${i + 1} guards...`);
      }
    }

    // Batch insert all guards at once (much faster than individual inserts)
    Logger.log("Inserting guards into sheet...");
    guardsSheet
      .getRange(
        guardsSheet.getLastRow() + 1,
        1,
        guardRows.length,
        guardRows[0].length
      )
      .setValues(guardRows);

    Logger.log("Inserting documents into sheet...");
    documentsSheet
      .getRange(
        documentsSheet.getLastRow() + 1,
        1,
        documentRows.length,
        documentRows[0].length
      )
      .setValues(documentRows);

    Logger.log("Inserting health records into sheet...");
    if (healthRows.length > 0) {
      healthSheet
        .getRange(
          healthSheet.getLastRow() + 1,
          1,
          healthRows.length,
          healthRows[0].length
        )
        .setValues(healthRows);
    }

    Logger.log(
      `Done! Successfully generated 200 sample guards with ${healthRows.length} health records.`
    );

    return {
      success: true,
      message: `200 sample guards created successfully with ${healthRows.length} health records!`,
      count: 200,
      healthRecords: healthRows.length,
    };
  } catch (error) {
    Logger.log("Error generating sample guards: " + error.message);
    return {
      success: false,
      message: "Error: " + error.message,
    };
  }
}

/**
 * Generate 2000 sample performance records (violations and accomplishments)
 */
function generateSamplePerformance() {
  try {
    const ss = getSpreadsheet();
    const performanceSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERFORMANCE);
    const guardsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GUARDS);
    const violationTypesSheet = ss.getSheetByName(
      CONFIG.SHEET_NAMES.VIOLATION_TYPES
    );
    const sanctionsSheet = ss.getSheetByName(
      CONFIG.SHEET_NAMES.VIOLATION_SANCTIONS
    );

    if (!performanceSheet || !guardsSheet) {
      throw new Error(
        "Performance or Guards sheet not found. Run setupSheets() first."
      );
    }

    // Get all active guards
    const guardsData = guardsSheet.getDataRange().getValues();
    const activeGuards = [];

    for (let i = 1; i < guardsData.length; i++) {
      if (guardsData[i][8] === "Active") {
        // Status column
        const guardId = guardsData[i][0];
        const guardName = [
          guardsData[i][1], // firstName
          guardsData[i][2], // middleName
          guardsData[i][3], // lastName
          guardsData[i][4], // suffix
        ]
          .filter(Boolean)
          .join(" ");

        activeGuards.push({ id: guardId, name: guardName });
      }
    }

    if (activeGuards.length === 0) {
      throw new Error("No active guards found. Generate sample guards first.");
    }

    // Get violation types
    const violationTypes = [];
    if (violationTypesSheet && violationTypesSheet.getLastRow() > 1) {
      const violationData = violationTypesSheet
        .getRange(2, 1, violationTypesSheet.getLastRow() - 1, 2)
        .getValues();
      for (let i = 0; i < violationData.length; i++) {
        if (violationData[i][0]) {
          violationTypes.push(violationData[i][1]); // Violation name
        }
      }
    }

    // Default violation types if none exist
    if (violationTypes.length === 0) {
      violationTypes.push(
        "Late Arrival",
        "Unauthorized Absence",
        "Sleeping on Duty",
        "Improper Uniform",
        "Failure to Report Incident",
        "Negligence",
        "Insubordination",
        "Use of Mobile Phone on Duty",
        "Abandonment of Post",
        "Poor Conduct"
      );
    }

    // Get sanctions
    const sanctions = [];
    if (sanctionsSheet && sanctionsSheet.getLastRow() > 1) {
      const sanctionData = sanctionsSheet
        .getRange(2, 1, sanctionsSheet.getLastRow() - 1, 2)
        .getValues();
      for (let i = 0; i < sanctionData.length; i++) {
        if (sanctionData[i][0]) {
          sanctions.push(sanctionData[i][1]); // Sanction name
        }
      }
    }

    // Default sanctions if none exist
    if (sanctions.length === 0) {
      sanctions.push(
        "Verbal Warning",
        "Written Warning",
        "Suspension (1 day)",
        "Suspension (3 days)",
        "Suspension (7 days)",
        "Final Warning",
        "Termination"
      );
    }

    // Sample accomplishment descriptions
    const accomplishments = [
      "Prevented unauthorized entry",
      "Detected security breach",
      "Assisted in emergency situation",
      "Excellent customer service",
      "Identified suspicious activity",
      "Successfully handled conflict",
      "Maintained perfect attendance",
      "Received commendation from client",
      "Completed additional training",
      "Demonstrated leadership",
      "Quick response to incident",
      "Property recovery",
      "First aid assistance",
      "Fire safety response",
      "Outstanding performance",
      "Team coordination excellence",
      "Professional conduct commendation",
      "Initiative and proactivity",
      "Problem-solving excellence",
      "Client appreciation",
    ];

    const performanceRows = [];

    Logger.log("Generating 2000 sample performance records...");

    // Generate records over the past 12 months
    const today = new Date();
    const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 2000; i++) {
      // Random guard
      const guard =
        activeGuards[Math.floor(Math.random() * activeGuards.length)];

      // 30% accomplishments, 70% violations (realistic ratio)
      const isAccomplishment = Math.random() < 0.3;
      const type = isAccomplishment ? "Accomplishment" : "Violation";

      // Random date within past year
      const randomTime =
        oneYearAgo.getTime() +
        Math.random() * (today.getTime() - oneYearAgo.getTime());
      const recordDate = Utilities.formatDate(
        new Date(randomTime),
        Session.getScriptTimeZone(),
        "MMM dd, yyyy"
      );

      // Generate record ID
      const recordId =
        "PRF" +
        Utilities.formatDate(
          new Date(Date.now() - (2000 - i) * 1000),
          Session.getScriptTimeZone(),
          "yyyyMMddHHmmss"
        );

      let violationType = "";
      let description = "";
      let sanction = "";

      if (isAccomplishment) {
        description =
          accomplishments[Math.floor(Math.random() * accomplishments.length)];
      } else {
        violationType =
          violationTypes[Math.floor(Math.random() * violationTypes.length)];

        // Generate description based on violation type
        const descriptionTemplates = [
          `Failed to comply with ${violationType.toLowerCase()} policy`,
          `Reported incident of ${violationType.toLowerCase()}`,
          `Multiple instances of ${violationType.toLowerCase()}`,
          `Documented case of ${violationType.toLowerCase()}`,
          `Witnessed engaging in ${violationType.toLowerCase()}`,
        ];

        description =
          descriptionTemplates[
            Math.floor(Math.random() * descriptionTemplates.length)
          ];
        sanction = sanctions[Math.floor(Math.random() * sanctions.length)];
      }

      // Add performance record row
      performanceRows.push([
        recordId,
        guard.id,
        guard.name,
        type,
        violationType,
        description,
        recordDate,
        sanction,
        "", // PDF Link - empty for sample data
      ]);

      // Log progress every 200 records
      if ((i + 1) % 200 === 0) {
        Logger.log(`Generated ${i + 1} performance records...`);
      }
    }

    // Sort by date descending (most recent first)
    performanceRows.sort((a, b) => {
      const dateA = new Date(a[6]);
      const dateB = new Date(b[6]);
      return dateB - dateA;
    });

    // Batch insert all records at once (much faster than individual inserts)
    Logger.log("Inserting performance records into sheet...");
    performanceSheet
      .getRange(
        performanceSheet.getLastRow() + 1,
        1,
        performanceRows.length,
        performanceRows[0].length
      )
      .setValues(performanceRows);

    // Count violations vs accomplishments
    const violationCount = performanceRows.filter(
      (row) => row[3] === "Violation"
    ).length;
    const accomplishmentCount = performanceRows.filter(
      (row) => row[3] === "Accomplishment"
    ).length;

    Logger.log(
      `Done! Successfully generated 2000 performance records (${violationCount} violations, ${accomplishmentCount} accomplishments).`
    );

    return {
      success: true,
      message: `2000 performance records created successfully! (${violationCount} violations, ${accomplishmentCount} accomplishments)`,
      count: 2000,
      violations: violationCount,
      accomplishments: accomplishmentCount,
    };
  } catch (error) {
    Logger.log("Error generating sample performance records: " + error.message);
    return {
      success: false,
      message: "Error: " + error.message,
    };
  }
}
