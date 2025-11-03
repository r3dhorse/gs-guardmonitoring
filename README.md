# Sparc Properties: Professional Security Guard Management System

A comprehensive, web-based Guard Monitoring System built with Google Apps Script, designed to streamline security guard management, document tracking, performance monitoring, and compliance management for Sparc Properties.

![System Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Google Apps Script](https://img.shields.io/badge/platform-Google%20Apps%20Script-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [Installation & Setup](#installation--setup)
- [User Roles & Permissions](#user-roles--permissions)
- [Module Documentation](#module-documentation)
- [Security Features](#security-features)
- [UI/UX Design](#uiux-design)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Maintenance & Support](#maintenance--support)

---

## 🎯 Overview

The **Guard Monitoring System** is a full-featured web application that provides end-to-end management of security guard operations. Built entirely on Google Apps Script with Google Sheets as the backend database, it offers:

- **Real-time guard profile management** with photo uploads
- **Document validity tracking** with expiration alerts
- **Performance & violation tracking** with sanctions management
- **Health monitoring** with BMI calculations
- **Comprehensive audit trail** for compliance
- **System logs** with advanced search and pagination
- **Role-based access control** (Admin & Viewer)

Perfect for security agencies, property management firms, and organizations managing large security teams.

---

## ✨ Key Features

### 👤 Guard Management
- **Complete Guard Profiles**
  - Personal information (name, DOB, hire date, contract dates)
  - Photo upload and preview (stored in Google Drive)
  - Status management (Active, Return to Agency, Banned)
  - Auto-generated unique Guard IDs

### 📄 Document Tracking
- **Validity Monitoring**
  - Security Guard License tracking
  - Police Clearance validation
  - NBI Clearance validation
  - Drug Test validity
  - Neuro Exam validity
- **Visual Expiration Alerts**
  - Red border highlighting for expired documents
  - Real-time validation on date changes
  - Dashboard alerts for expiring documents

### 📊 Performance Management
- **Violation Tracking System**
  - Pre-defined violation types (Tardiness, Absent, Misconduct, etc.)
  - Customizable sanctions (Written Warning, Suspension, Termination)
  - Date-stamped performance records
  - Violation history per guard
- **Performance Records**
  - Paginated violation history (10 records per page)
  - Filter and search capabilities
  - PDF export functionality

### 💪 Health Monitoring
- **Health Metrics**
  - Height and weight tracking
  - Automatic BMI calculation
  - BMI status classification (Underweight, Normal, Overweight, Obese)
  - Color-coded health indicators
  - Health notes and observations

### 🔍 Advanced Search & Filtering
- **Guard List Filters**
  - Search by name, ID, or license number
  - Status filtering (Active, Inactive, All)
  - Real-time search results
- **Performance Filters**
  - Filter by violation type
  - Date range selection
  - Sanction-based filtering

### 📊 Dashboard Analytics
- **Real-time Statistics**
  - Total guards count
  - Active guards count
  - Document expiration alerts
  - System activity monitoring
- **Visual Charts** (Chart.js integration)
  - Guard status distribution
  - Performance trends
  - Document expiry timeline

### 🔐 User Management
- **Role-Based Access Control**
  - Admin: Full CRUD operations
  - Viewer: Read-only access
- **User Features**
  - Secure password hashing (SHA-256)
  - Account lockout after failed login attempts
  - Session timeout management
  - Password change functionality
  - Password visibility toggles

### 📝 System Logs & Audit Trail
- **Comprehensive Logging**
  - All CRUD operations logged
  - User activity tracking
  - Login/logout tracking
  - Timestamp with user attribution
- **Advanced Log Viewer**
  - 10 logs per page with pagination
  - Search across all fields
  - Action-type filtering (Login, Create, Update, Delete)
  - Export capabilities
  - Color-coded action badges

### 🖼️ Modern UI/UX
- **Glassmorphism Design**
  - Frosted glass effect cards
  - Animated gradient backgrounds
  - Smooth transitions and hover effects
- **Responsive Layout**
  - Mobile-friendly interface
  - Adaptive sidebar navigation
  - Touch-optimized controls
- **Interactive Elements**
  - Modal-based forms
  - Toast notifications
  - Loading spinners
  - Confirmation dialogs

---

## 🏗️ System Architecture

### Frontend Architecture
```
┌─────────────────────────────────────┐
│         index.html (SPA)            │
│  ┌──────────────────────────────┐   │
│  │  Landing Page with Carousel  │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  Authentication Modal        │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  Main Dashboard              │   │
│  │  ├─ Guards Module            │   │
│  │  ├─ Performance Module       │   │
│  │  ├─ Settings Module          │   │
│  │  ├─ Users Module             │   │
│  │  └─ System Logs Module       │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Backend Architecture (Google Apps Script)
```
┌─────────────────────────────────────────┐
│         Apps Script Backend             │
├─────────────────────────────────────────┤
│  Config.js          - Configuration     │
│  Main.js            - Entry points      │
│  Security.js        - Authentication    │
│  Guards.js          - Guard operations  │
│  Performance.js     - Violations        │
│  Health.js          - Health tracking   │
│  Dashboard.js       - Analytics         │
│  Users.js           - User management   │
│  Audit.js           - Logging           │
│  Utils.js           - Helper functions  │
│  Setup.js           - Database setup    │
│  Violations.js      - Violation types   │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│       Google Sheets Database            │
├─────────────────────────────────────────┤
│  - Users                                │
│  - Guards                               │
│  - Documents                            │
│  - Licenses                             │
│  - Performance                          │
│  - Health Records                       │
│  - Violation Types                      │
│  - Violation Sanctions                  │
│  - Audit Trail                          │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│         Google Drive Storage            │
├─────────────────────────────────────────┤
│  - Guard Photos                         │
│  - Generated PDF Reports                │
└─────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Glassmorphism design, animations
- **Vanilla JavaScript (ES6+)** - No frameworks, pure JS
- **Chart.js** - Dashboard analytics visualization

### Backend
- **Google Apps Script** - Server-side JavaScript
- **V8 Runtime** - Modern JavaScript features
- **Web App Deployment** - Public/authenticated access

### Database
- **Google Sheets** - Spreadsheet-based database
- **9 Sheets** - Normalized data structure

### Storage
- **Google Drive API** - File storage and retrieval
- **Image Optimization** - Photo compression and thumbnails

### Security
- **SHA-256 Hashing** - Password encryption
- **Session Management** - localStorage-based sessions
- **OAuth Scopes** - Restricted API access

---

## 🗄️ Database Schema

### 1. Users Sheet
| Column | Type | Description |
|--------|------|-------------|
| User ID | String | USR001, USR002... |
| Username | String | Unique username |
| Password | String | SHA-256 hashed |
| Full Name | String | Display name |
| Role | String | Admin/Viewer |
| Status | String | Active/Inactive |
| Created At | Date | Registration date |

### 2. Guards Sheet
| Column | Type | Description |
|--------|------|-------------|
| Guard ID | String | GRD001, GRD002... |
| First Name | String | Required |
| Middle Name | String | Optional |
| Last Name | String | Required |
| Suffix | String | Jr., Sr., III |
| Date of Birth | Date | Required |
| Hired Date | Date | Contract start |
| End of Contract | Date | Optional |
| Status | String | Active/Return to Agency/Banned |
| Photo URL | String | Google Drive link |
| Created At | Date | Record creation |
| Updated At | Date | Last modification |

### 3. Documents Sheet
| Column | Type | Description |
|--------|------|-------------|
| Document ID | String | DOC001, DOC002... |
| Guard ID | String | Foreign key |
| Document Type | String | License/Clearance/etc |
| Document Number | String | License number |
| Issue Date | Date | Issuance date |
| Expiry Date | Date | Expiration date |
| Status | String | Valid/Expired/Expiring |
| PDF URL | String | Google Drive link |

### 4. Licenses Sheet
| Column | Type | Description |
|--------|------|-------------|
| License ID | String | LIC001, LIC002... |
| Guard ID | String | Foreign key |
| License Number | String | Unique number |
| Expiry Date | Date | Validity date |
| Police Clearance | Date | Validity date |
| NBI Clearance | Date | Validity date |
| Drug Test | Date | Validity date |
| Neuro Exam | Date | Validity date |

### 5. Performance Sheet
| Column | Type | Description |
|--------|------|-------------|
| Performance ID | String | PER001, PER002... |
| Guard ID | String | Foreign key |
| Guard Name | String | Full name |
| Violation Type | String | Tardiness/Absent/etc |
| Date | Date | Occurrence date |
| Sanction | String | Warning/Suspension/etc |
| Created By | String | Admin username |
| Created At | Date | Record timestamp |

### 6. Health Records Sheet
| Column | Type | Description |
|--------|------|-------------|
| Health ID | String | HLT001, HLT002... |
| Guard ID | String | Foreign key |
| Height (cm) | Number | Height in centimeters |
| Weight (kg) | Number | Weight in kilograms |
| BMI | Number | Auto-calculated |
| BMI Status | String | Underweight/Normal/etc |
| Notes | String | Health observations |
| Recorded At | Date | Record timestamp |

### 7. Violation Types Sheet
| Column | Type | Description |
|--------|------|-------------|
| Type ID | String | VT001, VT002... |
| Violation Name | String | Tardiness, Absent, etc |
| Description | String | Details |
| Created At | Date | Record timestamp |

**Default Types:**
- Tardiness
- Absent
- Misconduct
- Uniform Violation
- Policy Violation

### 8. Violation Sanctions Sheet
| Column | Type | Description |
|--------|------|-------------|
| Sanction ID | String | VS001, VS002... |
| Sanction Name | String | Warning, Suspension, etc |
| Description | String | Details |
| Created At | Date | Record timestamp |

**Default Sanctions:**
- Written Warning
- Verbal Warning
- 1-Day Suspension
- 3-Day Suspension
- 7-Day Suspension
- Termination

### 9. Audit Trail Sheet
| Column | Type | Description |
|--------|------|-------------|
| Audit ID | String | AUD20250103... |
| Timestamp | Date | Action timestamp |
| Username | String | User who performed action |
| Action | String | LOGIN/CREATE/UPDATE/DELETE |
| Target Type | String | Guard/User/Performance |
| Target Name | String | Affected record name |
| Details | String | Additional info |

---

## 🚀 Installation & Setup

### Prerequisites
1. **Google Account** with access to:
   - Google Apps Script
   - Google Sheets
   - Google Drive
2. **clasp** (Command Line Apps Script Projects)
   ```bash
   npm install -g @google/clasp
   ```

### Step 1: Clone the Repository
```bash
git clone https://github.com/r3dhorse/gs-guardmonitoring.git
cd gs-guardmonitoring
```

### Step 2: Login to clasp
```bash
clasp login
```

### Step 3: Create a New Apps Script Project
```bash
clasp create --type webapp --title "Guard Monitoring System"
```

### Step 4: Update Configuration
Edit `Config.js` and update the following:
```javascript
const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
  GOOGLE_DRIVE_FOLDER_ID: 'YOUR_DRIVE_FOLDER_ID_FOR_PDFS',
  PHOTO_FOLDER_ID: 'YOUR_DRIVE_FOLDER_ID_FOR_PHOTOS'
};
```

### Step 5: Push Files to Apps Script
```bash
clasp push
```

### Step 6: Deploy as Web App
1. Open the Apps Script editor:
   ```bash
   clasp open
   ```
2. Click **Deploy** → **New deployment**
3. Select type: **Web app**
4. Configuration:
   - Execute as: **Me**
   - Who has access: **Anyone** (or **Anyone with Google account**)
5. Click **Deploy**
6. Copy the Web App URL

### Step 7: Initialize the Database
1. Run the `setupSheets()` function from Apps Script editor
2. This will create all 9 sheets with proper headers
3. Default admin user will be created:
   - **Username:** `admin`
   - **Password:** `admin123`

### Step 8: Configure Google Drive Folders
1. Create two folders in Google Drive:
   - One for guard photos
   - One for PDF documents
2. Set permissions to **"Anyone with link - Editor"**
3. Copy folder IDs from URLs and update `Config.js`

### Step 9: Access the Application
Open the Web App URL in your browser and login with default credentials.

---

## 👥 User Roles & Permissions

### Admin Role
**Full Access:**
- ✅ Create, Read, Update, Delete guards
- ✅ Manage users (create/edit/delete)
- ✅ Add/edit performance records
- ✅ Configure violation types and sanctions
- ✅ View system logs and audit trail
- ✅ Export data to PDF
- ✅ Manage system settings

### Viewer Role
**Read-Only Access:**
- ✅ View guard profiles
- ✅ View performance records
- ✅ View dashboard analytics
- ❌ Cannot create/edit/delete records
- ❌ Cannot access user management
- ❌ Cannot access system logs
- ❌ Cannot modify settings

---

## 📚 Module Documentation

### Guards Module (`Guards.js`)
**Functions:**
- `addGuard(guardData, username)` - Create new guard
- `updateGuard(guardId, guardData, username)` - Update guard info
- `deleteGuard(guardId, username)` - Soft delete guard
- `getAllGuards()` - Retrieve all guards
- `getGuardById(guardId)` - Get single guard
- `uploadGuardPhoto(guardId, photoData)` - Upload photo to Drive

### Performance Module (`Performance.js`)
**Functions:**
- `addPerformanceRecord(recordData, username)` - Add violation
- `getGuardPerformanceRecords(guardId)` - Get guard's violations
- `getAllPerformanceRecords()` - Get all violations
- `getViolationTypes()` - Get violation type list
- `getViolationSanctions()` - Get sanction list

### Health Module (`Health.js`)
**Functions:**
- `addHealthRecord(healthData, username)` - Record health data
- `getGuardHealthRecord(guardId)` - Get latest health record
- `calculateBMI(height, weight)` - Calculate BMI
- `getBMIStatus(bmi)` - Classify BMI status

### Dashboard Module (`Dashboard.js`)
**Functions:**
- `getDashboardData()` - Get summary statistics
- `getExpiringDocuments(days)` - Get expiring docs
- `getGuardStatusDistribution()` - Status chart data
- `getRecentActivity(limit)` - Recent actions

### Security Module (`Security.js`)
**Functions:**
- `login(username, password)` - Authenticate user
- `logout(username)` - Log out user
- `hashPassword(password)` - SHA-256 hashing
- `validateSession(sessionToken)` - Verify session

### Users Module (`Users.js`)
**Functions:**
- `createUser(userData, createdBy)` - Add new user
- `updateUser(userId, userData, updatedBy)` - Update user
- `deleteUser(userId, deletedBy)` - Delete user
- `getAllUsers()` - Get all users
- `changePassword(userId, newPassword)` - Update password

### Audit Module (`Audit.js`)
**Functions:**
- `logAudit(username, action, targetType, targetName, details)` - Log action
- `getRecentActivity(limit)` - Get audit logs
- `archiveOldAuditLogs()` - Archive old logs

---

## 🔐 Security Features

### Authentication & Authorization
- **Password Hashing:** SHA-256 algorithm
- **Account Lockout:** 5 failed attempts = 15-minute lockout
- **Session Management:** 6-hour timeout
- **Role-Based Access:** Admin vs Viewer permissions
- **Audit Logging:** All actions tracked with username and timestamp

### Data Security
- **OAuth Scopes:** Restricted to required permissions only
- **Input Validation:** Server-side validation for all inputs
- **SQL Injection Prevention:** Apps Script handles this natively
- **XSS Protection:** Input sanitization and escaping

### Google Drive Security
- **Folder Permissions:** Controlled access to photo/document folders
- **File Access:** URL-based authentication
- **File Deletion:** Soft deletes preserve audit trail

### Password Policy
- **Minimum Length:** 8 characters
- **Maximum Length:** 128 characters
- **Password History:** Last 5 passwords stored (hashed)
- **Force Change:** Option for first-time login password change

---

## 🎨 UI/UX Design

### Design System

#### Color Palette
```css
/* Primary Colors */
--primary-green: #006341;
--accent-green: #81d742;
--white: #FFFFFF;

/* Status Colors */
--success: #22C55E;
--warning: #FBBF24;
--error: #EF4444;
--info: #3B82F6;

/* Background Gradients */
--gradient-primary: linear-gradient(135deg, #006341 0%, #007850 100%);
--gradient-dark: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
```

#### Glassmorphism Effects
- **Frosted Glass Cards:** `backdrop-filter: blur(10px)`
- **Transparency:** `rgba(255, 255, 255, 0.1)`
- **Border Glow:** Subtle colored borders with opacity
- **Shadows:** Multi-layered shadows for depth

#### Typography
- **Primary Font:** System UI fonts (Segoe UI, Roboto, Arial)
- **Heading Sizes:** 2rem - 1.1rem
- **Body Text:** 0.95rem
- **Font Weights:** 400 (normal), 600 (semi-bold), 700 (bold)

#### Animations & Transitions
- **Hover Effects:** 0.2s - 0.3s ease transitions
- **Modal Animations:** Fade-in with scale
- **Loading Spinners:** Rotating border animation
- **Toast Notifications:** Slide-in from top

#### Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 768px) {
  /* Stacked layout, full-width cards */
}

/* Tablet */
@media (max-width: 1024px) {
  /* 2-column grids */
}

/* Desktop */
@media (min-width: 1025px) {
  /* 3-4 column grids, sidebar visible */
}
```

### Landing Page Features
- **Hero Section:** Full-screen with animated gradient
- **Feature Carousel:** 4 features, auto-rotating
- **Smooth Scrolling:** Animated section transitions
- **Call-to-Action:** Prominent login button

---

## 📡 API Documentation

### Authentication Endpoints

#### Login
```javascript
google.script.run
  .withSuccessHandler(callback)
  .withFailureHandler(errorCallback)
  .login(username, password);
```
**Returns:** `{ success: true, user: {...}, sessionToken: "..." }`

#### Logout
```javascript
google.script.run
  .withSuccessHandler(callback)
  .logout(username);
```

### Guard Management Endpoints

#### Get All Guards
```javascript
google.script.run
  .withSuccessHandler(callback)
  .getAllGuards();
```
**Returns:** Array of guard objects

#### Add Guard
```javascript
google.script.run
  .withSuccessHandler(callback)
  .addGuard(guardData, username);
```
**guardData Structure:**
```javascript
{
  firstName: "John",
  middleName: "A",
  lastName: "Doe",
  suffix: "",
  dateOfBirth: "1990-01-01",
  hiredDate: "2024-01-01",
  endOfContractDate: "2025-01-01",
  status: "Active",
  // Documents
  licenseNumber: "LIC123",
  licenseExpiry: "2025-12-31",
  policeClearance: "2025-06-30",
  nbiClearance: "2025-06-30",
  drugTestValidity: "2025-03-31",
  neuroExamValidity: "2025-03-31",
  // Health
  height: 175,
  weight: 70,
  healthNotes: "Good health"
}
```

#### Update Guard
```javascript
google.script.run
  .withSuccessHandler(callback)
  .updateGuard(guardId, guardData, username);
```

#### Delete Guard
```javascript
google.script.run
  .withSuccessHandler(callback)
  .deleteGuard(guardId, username);
```

### Performance Endpoints

#### Add Performance Record
```javascript
google.script.run
  .withSuccessHandler(callback)
  .addPerformanceRecord(recordData, username);
```
**recordData Structure:**
```javascript
{
  guardId: "GRD001",
  guardName: "John Doe",
  violationType: "Tardiness",
  date: "2024-01-15",
  sanction: "Written Warning"
}
```

#### Get Guard Performance
```javascript
google.script.run
  .withSuccessHandler(callback)
  .getGuardPerformanceRecords(guardId);
```

### System Logs Endpoint

#### Get Recent Activity
```javascript
google.script.run
  .withSuccessHandler(callback)
  .getRecentActivity(limit);
```
**Returns:** Array of audit log objects

---

## 🚢 Deployment

### Production Deployment Checklist

1. **Update Configuration**
   - [ ] Update `SPREADSHEET_ID` in Config.js
   - [ ] Update Drive folder IDs
   - [ ] Set timezone in appsscript.json

2. **Security Review**
   - [ ] Change default admin password
   - [ ] Review OAuth scopes
   - [ ] Verify folder permissions
   - [ ] Test authentication flow

3. **Deploy Web App**
   - [ ] Create new deployment
   - [ ] Set execution permissions
   - [ ] Test web app URL
   - [ ] Verify all features work

4. **Database Setup**
   - [ ] Run `setupSheets()` function
   - [ ] Verify all 9 sheets created
   - [ ] Populate violation types
   - [ ] Populate sanctions

5. **Testing**
   - [ ] Test admin login
   - [ ] Test viewer login
   - [ ] Test CRUD operations
   - [ ] Test photo uploads
   - [ ] Test PDF generation
   - [ ] Test audit logging

6. **Documentation**
   - [ ] Update README with production URLs
   - [ ] Document custom configurations
   - [ ] Create user manual
   - [ ] Train administrators

### Continuous Deployment

```bash
# Pull latest changes
git pull origin main

# Push to Apps Script
clasp push --force

# Create new version deployment
# (Manual step in Apps Script console)
```

---

## 🔧 Maintenance & Support

### Regular Maintenance Tasks

#### Daily
- Monitor system logs for errors
- Check for expired documents
- Review guard status updates

#### Weekly
- Backup Google Sheets data
- Review performance records
- Check disk usage in Drive folders

#### Monthly
- Archive old audit logs (365-day retention)
- Review user access and permissions
- Update violation types/sanctions if needed
- Performance optimization review

### Backup Strategy

**Automated Backups:**
1. Google Sheets automatic version history
2. Drive folder periodic snapshots
3. Export critical data to CSV weekly

**Manual Backups:**
```javascript
// Run from Apps Script
function backupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const backup = ss.copy('Guard System Backup - ' + new Date().toISOString());
  Logger.log('Backup created: ' + backup.getId());
}
```

### Troubleshooting

#### Common Issues

**Issue: Photos not uploading**
- Check Drive folder permissions (Anyone with link - Editor)
- Verify `PHOTO_FOLDER_ID` in Config.js
- Check OAuth scopes in appsscript.json

**Issue: Login fails with correct password**
- Check if account is locked (5 failed attempts)
- Wait 15 minutes or reset from Admin panel
- Verify user status is "Active"

**Issue: System Logs showing "No data"**
- Check if `getRecentActivity()` returns data
- Verify Audit Trail sheet has records
- Check console for JavaScript errors

**Issue: Expired dates not highlighting**
- Verify date format (YYYY-MM-DD)
- Check browser console for errors
- Ensure latest deployment is active

### Support Channels

- **GitHub Issues:** https://github.com/r3dhorse/gs-guardmonitoring/issues
- **Email:** support@sparcproperties.com
- **Documentation:** This README file

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👨‍💻 Contributors

- **Development:** Claude Code + Human Collaboration
- **Design:** Custom Glassmorphism UI
- **Architecture:** Modular Google Apps Script

---

## 🙏 Acknowledgments

- Google Apps Script Platform
- Chart.js for analytics visualization
- Google Drive for file storage
- Community feedback and testing

---

## 📈 Roadmap

### Version 1.1 (Planned)
- [ ] Email notifications for expiring documents
- [ ] SMS alerts via Twilio integration
- [ ] Mobile app (React Native)
- [ ] Advanced reporting with filters
- [ ] Shift scheduling module

### Version 1.2 (Planned)
- [ ] Biometric integration
- [ ] Real-time location tracking
- [ ] Incident reporting module
- [ ] Client portal access
- [ ] Multi-language support

### Version 2.0 (Future)
- [ ] AI-powered performance analytics
- [ ] Predictive document expiration alerts
- [ ] Automated report generation
- [ ] Integration with payroll systems
- [ ] Mobile check-in/check-out

---

## 📞 Contact

**Sparc Properties**
Professional Security Guard Management
Email: info@sparcproperties.com
Website: https://sparcproperties.com

---

**Built with ❤️ using Google Apps Script and Claude Code**

*Last Updated: January 2025*
