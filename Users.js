/**
 * Guard Monitoring System - User Management & Authentication
 * Functions: authenticateUser, changePassword, getAllUsers, addUser, updateUser, deleteUser, getUserByUsername
 */

// TODO: Extract authenticateUser function

function changePassword(username, currentPassword, newPassword) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.USERS);
    if (!sheet) {
      return { success: false, message: 'Users sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    let storedPasswordHash = '';

    // Find the user row
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === username) {
        rowIndex = i + 1;
        storedPasswordHash = data[i][2];
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, message: 'User not found' };
    }

    // Verify current password
    if (!verifyPassword(currentPassword, storedPasswordHash)) {
      return { success: false, message: 'Current password is incorrect' };
    }

    // Validate new password
    const pwdValidation = validatePassword(newPassword);
    if (!pwdValidation.valid) {
      return { success: false, message: pwdValidation.error };
    }

    // Hash and check password history
    const hashedNewPassword = hashPassword(newPassword);
    const passwordHistory = data[rowIndex - 1][10] || '[]'; // Column 11: Password History
    let history = [];
    try {
      history = JSON.parse(passwordHistory);
    } catch (e) {
      history = [];
    }

    // Check if password was used recently
    if (history.includes(hashedNewPassword)) {
      return {
        success: false,
        message: 'Password was used recently. Please choose a different password.'
      };
    }

    // Update password
    sheet.getRange(rowIndex, 3).setValue(hashedNewPassword);

    // Update password history (keep last 5 passwords)
    history.unshift(hashedNewPassword);
    if (history.length > CONFIG.VALIDATION.PASSWORD_HISTORY_COUNT) {
      history = history.slice(0, CONFIG.VALIDATION.PASSWORD_HISTORY_COUNT);
    }
    sheet.getRange(rowIndex, 11).setValue(JSON.stringify(history));

    // Clear force password change flag
    sheet.getRange(rowIndex, 12).setValue('FALSE');

    Logger.log('Password changed successfully for user: ' + username);
    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    Logger.log('Error in changePassword: ' + error.message);
    return { success: false, message: 'Error changing password: ' + error.message };
  }
}

/**
 * Get all users from the Users sheet
 * @returns {Array} Array of user objects
 */
function getAllUsers() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.USERS);
    if (!sheet) {
      Logger.log('Users sheet not found');
      return [];
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      Logger.log('No users found in sheet');
      return [];
    }

    const headers = data[0];
    const users = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip empty rows
      if (!row[0] || row[0].toString().trim() === '') {
        continue;
      }

      // Format created date
      let createdDate = '';
      try {
        if (row[6]) {
          if (row[6] instanceof Date) {
            createdDate = Utilities.formatDate(row[6], Session.getScriptTimeZone(), 'MMM dd, yyyy');
          } else {
            createdDate = row[6].toString();
          }
        }
      } catch (e) {
        createdDate = 'N/A';
      }

      const user = {
        userId: row[0].toString(),
        username: row[1].toString(),
        password: row[2].toString(),
        fullName: row[3].toString(),
        role: row[4].toString(),
        status: row[5].toString(),
        createdDate: createdDate
      };
      users.push(user);
    }

    Logger.log('Retrieved ' + users.length + ' users');
    return users;
  } catch (error) {
    Logger.log('Error in getAllUsers: ' + error.message);
    throw new Error('Failed to retrieve users: ' + error.message);
  }
}

/**
 * Add a new user
 * @param {Object} userData - User data object
 * @param {string} currentUsername - Username of admin adding the user
 * @returns {Object} Result object
 */
function addUser(userData, currentUsername) {
  try {
    // Check admin permission
    if (!hasAdminPermission(currentUsername)) {
      return {
        success: false,
        message: 'Permission denied. Admin access required.'
      };
    }

    // Validate input
    if (!userData || typeof userData !== 'object') {
      return { success: false, message: 'Invalid user data' };
    }

    if (!userData.username || !userData.password || !userData.fullName || !userData.role) {
      return { success: false, message: 'Missing required fields' };
    }

    // Validate password strength
    const pwdValidation = validatePassword(userData.password);
    if (!pwdValidation.valid) {
      return { success: false, message: pwdValidation.error };
    }

    // Sanitize inputs
    userData.username = sanitizeInput(userData.username);
    userData.fullName = sanitizeInput(userData.fullName);

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.USERS);
    if (!sheet) {
      return { success: false, message: 'System error. Please contact administrator.' };
    }

    // Check if username already exists
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1].toLowerCase() === userData.username.toLowerCase()) {
        return { success: false, message: 'Username already exists' };
      }
    }

    // Generate User ID
    const userId = 'USR' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');

    // Get current date
    const createdDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMM dd, yyyy');

    // Hash the password before storing
    const hashedPassword = hashPassword(userData.password);

    // Append new user
    sheet.appendRow([
      userId,
      userData.username,
      hashedPassword,
      userData.fullName,
      userData.role,
      userData.status,
      createdDate
    ]);

    Logger.log('User added successfully: ' + userId);
    return { success: true, userId: userId, message: 'User added successfully' };
  } catch (error) {
    Logger.log('Error in addUser: ' + error.message);
    return { success: false, message: 'Error adding user: ' + error.message };
  }
}

/**
 * Update an existing user
 * @param {Object} userData - User data object with userId
 * @returns {Object} Result object
 */
function updateUser(userData) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.USERS);
    if (!sheet) {
      return { success: false, message: 'Users sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    // Find the user row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userData.userId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, message: 'User not found' };
    }

    // Check if new username conflicts with another user
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] !== userData.userId && data[i][1].toLowerCase() === userData.username.toLowerCase()) {
        return { success: false, message: 'Username already exists' };
      }
    }

    // Update user data
    sheet.getRange(rowIndex, 2).setValue(userData.username); // Username
    // Only update password if provided (hash it before storing)
    if (userData.password && userData.password.trim() !== '') {
      const hashedPassword = hashPassword(userData.password);
      sheet.getRange(rowIndex, 3).setValue(hashedPassword); // Hashed Password
    }
    sheet.getRange(rowIndex, 4).setValue(userData.fullName); // Full Name
    sheet.getRange(rowIndex, 5).setValue(userData.role); // Role
    sheet.getRange(rowIndex, 6).setValue(userData.status); // Status

    Logger.log('User updated successfully: ' + userData.userId);
    return { success: true, message: 'User updated successfully' };
  } catch (error) {
    Logger.log('Error in updateUser: ' + error.message);
    return { success: false, message: 'Error updating user: ' + error.message };
  }
}

