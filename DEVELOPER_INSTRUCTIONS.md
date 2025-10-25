# Bed Availability System - Developer Instructions

## Project Overview

Build a real-time bed availability system for Crossing Sunsets healthcare platform.

## User Roles (4 Types)

### 1. Super Admin (Crossing Sunsets Staff)
- **Can:** Manage all users, view all data, update beds (only for troubleshooting SNF issues)
- **Custom Claim:** `orgType: "superadmin"`
- **Note:** Super Admin is for system administration, NOT daily bed updates

### 2. Admin (Skilled Nursing Facilities - SNF)
- **Can:** Update their facility's bed counts, view all data
- **Cannot:** Add/remove users or access user management
- **Custom Claim:** `orgType: "admin"`
- **Note:** SNF admins are the PRIMARY bed count updaters

### 3. Hospital (View Only)
- **Can:** View all bed availability
- **Cannot:** Update beds or manage users
- **Custom Claim:** `orgType: "hospital"`

### 4. Hospice (View Only)
- **Can:** View all bed availability
- **Cannot:** Update beds or manage users
- **Custom Claim:** `orgType: "hospice"`

## What to Build

### 1. Admin Dashboard (For SNF)
**File:** `admin-dashboard.html`

**Features:**
- Login with Firebase Authentication
- Update bed counts:
  - General beds: Total [input] Available [input]
  - Emergency beds: Total [input] Available [input]
- Occupied auto-calculated (Total - Available) - DO NOT store occupied in database
- Save to Firebase Realtime Database
- Show "Last Updated" timestamp
- Mobile responsive
- Validate: Available cannot exceed Total

**Access:** Super Admin + SNF Admin only

### 2. User Management Dashboard (For Super Admin)
**File:** `user-management.html`

**Features:**
- Add new users with:
  - Email
  - Password
  - Role (dropdown: superadmin, admin, hospital, hospice)
  - Organization name
- List all existing users
- Edit user roles
- Delete users
- Use Firebase Admin SDK to set Custom Claims

**Access:** Super Admin ONLY (block SNF admins from accessing this)

### 3. Bed Availability View (For Hospitals/Hospices)
**File:** `bed-view.html`

**Features:**
- Login required
- Display all facilities and their bed availability
- Real-time updates (no page refresh)
- Show last updated time
- Read-only (no edit buttons)
- Mobile responsive

**Access:** All authenticated users

## Firebase Setup

### Database Structure
See `database-schema.json` for complete structure.

**Important:**
- Path: `bed_availability/facilities/{facilityId}/beds`
- Store ONLY: `total`, `available`, `last_updated`
- Calculate `occupied` on display (Total - Available)
- Do NOT store `occupied` in database

### Security Rules
See `security-rules.json` - already provided.

**You must apply these rules in Firebase Console:**
1. Go to Firebase Console → Realtime Database
2. Click "Rules" tab
3. Copy content from `security-rules.json`
4. Paste and publish

### Authentication
Enable Email/Password authentication in Firebase Console.

### Custom Claims
Use Firebase Admin SDK to set custom claims when creating users:
```javascript
admin.auth().setCustomUserClaims(userId, {
  orgType: 'admin',  // or 'superadmin', 'hospital', 'hospice'
  orgName: 'ABC Skilled Nursing'
});
```

## Key Requirements

### Data Storage
✅ Store: `total`, `available`, `last_updated`
❌ Do NOT store: `occupied` (calculate it: total - available)

### User Access Control
- Super Admin: Can manage users + update beds (for troubleshooting only)
- SNF Admin: Can update beds (primary role) + view data (NO user management access)
- Hospital/Hospice: Can view only

### Validation
- Available beds cannot be negative
- Available beds cannot exceed total beds
- Total beds max: 1000
- Show inline error messages
- Disable save button if validation fails

### Real-Time Updates
- Use Firebase `.on('value')` listener
- Website updates automatically when data changes
- No page refresh needed

## Testing Requirements

Create 4 test accounts:
1. `superadmin@test.com` - role: superadmin
2. `snf@test.com` - role: admin
3. `hospital@test.com` - role: hospital
4. `hospice@test.com` - role: hospice

**Verify:**
- ✅ Super Admin can access user management
- ✅ Super Admin can update beds
- ✅ SNF Admin can update beds
- ❌ SNF Admin CANNOT access user management
- ✅ Hospital/Hospice can view only
- ❌ Hospital/Hospice CANNOT update beds

## Important Notes

1. **Super Admin is for system management**, not daily bed updates
2. **SNF Admins do the daily bed count updates** - they are the primary users
3. Only Super Admin can add/remove users
4. SNF Admin should NOT see user management option at all
5. Calculate occupied beds on display, don't store in database
6. All users must authenticate - no public access

## Deliverables

1. Three HTML pages (admin dashboard, user management, bed view)
2. Firebase integration code
3. User management backend (Firebase Admin SDK)
4. Documentation on how to add new users
5. Test accounts and verification

## Questions?

Contact: [Project Manager Email]
