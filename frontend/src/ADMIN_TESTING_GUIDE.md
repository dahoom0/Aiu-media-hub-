# AIU Media Hub - Admin Panel Testing Guide

## 🧪 Complete Testing Guide for Admin Features

This guide provides step-by-step instructions to test all admin panel features in the AIU Media Hub application.

---

## 🚀 Getting Started

### Prerequisites
1. Application is running (npm run dev or deployed)
2. You have admin credentials
3. Browser is open (Chrome, Firefox, Safari, or Edge recommended)

### Accessing Admin Panel
```
1. Navigate to application URL
2. Click "Login" button on landing page
3. Enter admin credentials:
   - Email: admin@aiu.edu.my (or your admin email)
   - Password: [your admin password]
4. You should be redirected to Admin Dashboard
```

**✅ Expected Result:** You see the Admin Dashboard with sidebar showing admin navigation items.

---

## 📊 Test 1: Admin Dashboard

### Test 1.1: Dashboard Overview
```
1. Login as admin
2. Verify you see:
   - Header: "Admin Dashboard"
   - 4 stat cards (Active Students, Equipment in Use, Active Bookings, Tutorial Views)
   - Pending Approvals section
   - Recent Activity section
   - 3 Quick Stats cards (Equipment Status, Lab Utilization, System Health)
   - 2 Action cards (Content Management, User Management)
```

**✅ Expected Result:** All sections display with mock data and proper styling.

### Test 1.2: Navigation from Dashboard
```
1. Click "Manage" button on Content Management card
   → Should navigate to Tutorial Management
2. Click back button or sidebar "Dashboard"
3. Click "Manage" button on User Management card
   → Should navigate to Profile Management
```

**✅ Expected Result:** Navigation works smoothly between pages.

### Test 1.3: Theme Toggle
```
1. From Admin Dashboard, click Moon icon (top right)
   → Should switch to dark mode
2. Click Sun icon
   → Should switch back to light mode
```

**✅ Expected Result:** Theme changes applied across entire interface.

---

## 📹 Test 2: Tutorial Management

### Test 2.1: View Tutorials List
```
1. Click "Tutorial Management" in sidebar
2. Verify you see:
   - Page header: "Tutorial Management"
   - "Upload Tutorial" button (top right)
   - Table/list of tutorials with columns:
     * Title
     * Category
     * Views
     * Date Added
     * Status
     * Source icon
     * Linked equipment (if any)
```

**✅ Expected Result:** Tutorial list displays with sample data.

### Test 2.2: Upload Tutorial - Local Video
```
1. Click "Upload Tutorial" button
2. Dialog opens showing "Step 1 of 2"
3. Select "Upload Local Video File" option
   → Card highlights in teal
4. Click "Next" or continue button
5. Should show Step 2
6. Fill in:
   - Title: "Test Tutorial - Camera Basics"
   - Description: "Introduction to camera operations"
   - Category: Select "General"
7. Click "Submit" or "Upload"
```

**✅ Expected Result:** 
- Success toast notification appears
- Dialog closes
- (In production: Tutorial would appear in list)

### Test 2.3: Upload Tutorial - YouTube Link with Equipment
```
1. Click "Upload Tutorial" button
2. Select "Insert YouTube Link" option
3. Enter YouTube URL (any valid URL)
4. Click "Next"
5. Fill in:
   - Title: "Test Tutorial - Sony Camera Guide"
   - Description: "Complete guide to Sony A7S III"
   - Category: Select "Equipment"
6. Click "Next" → Should show Step 3
7. Click "Link Related Equipment" button
8. Equipment selection popup opens
9. Select one or more equipment (e.g., "Sony A7S III")
10. Confirm selection
11. Click "Submit" or "Upload"
```

**✅ Expected Result:** 
- Multi-step process works smoothly
- Equipment linking dialog opens
- Success notification on completion

### Test 2.4: Upload Tutorial - Google Drive
```
1. Click "Upload Tutorial" button
2. Select "Insert Google Drive Link" option
3. Enter Google Drive URL
4. Complete Step 2 with details
5. Submit
```

**✅ Expected Result:** Similar to YouTube upload process.

---

## 🏢 Test 3: Lab Management

### Test 3.1: View Lab Settings
```
1. Click "Lab Management" in sidebar
2. Verify two tabs: "Lab Settings" and "Booking Requests"
3. "Lab Settings" tab should be active by default
4. Verify you see:
   - List of labs/studios
   - "Add New" buttons
   - Lab details (name, capacity, PC count, status)
```

**✅ Expected Result:** Lab settings tab displays with sample labs.

### Test 3.2: Add New Lab
```
1. In Lab Settings tab, click "Add Lab" or "Add New"
2. Dialog opens
3. Fill in:
   - Lab Name: "Test Studio C"
   - Capacity: "20"
   - Status: "Available"
4. Click "Add" or "Submit"
```

**✅ Expected Result:** 
- Success toast notification
- Dialog closes
- (In production: New lab appears in list)

### Test 3.3: Add PC to Lab
```
1. Click "Add PC" button
2. Dialog opens
3. Fill in:
   - Select Lab: "Studio A"
   - PC Number: "PC-99"
   - Status: "Available"
4. Click "Add"
```

**✅ Expected Result:** Success notification.

### Test 3.4: Add Time Slot
```
1. Click "Add Time Slot" button
2. Dialog opens
3. Fill in:
   - Time: "18:00 - 20:00"
   - Available: Toggle ON
4. Click "Add"
```

**✅ Expected Result:** Success notification.

### Test 3.5: Review Booking Requests
```
1. Click "Booking Requests" tab
2. Verify table shows:
   - Student name (clickable)
   - Lab requested
   - Date
   - Time slot
   - Purpose
   - Status
   - Action buttons
```

**✅ Expected Result:** Booking requests list displays.

### Test 3.6: Approve Booking
```
1. Find a pending booking
2. Click "Approve" button
```

**✅ Expected Result:** 
- Success toast notification
- Booking status updates to "Approved"

### Test 3.7: Reject Booking
```
1. Find a pending booking
2. Click "Reject" button
3. Rejection dialog opens
4. Enter reason: "Lab is under maintenance on this date"
5. Click "Submit"
```

**✅ Expected Result:** 
- Success notification
- Booking status updates to "Rejected"
- Reason is saved

### Test 3.8: View Student Profile from Booking
```
1. In Booking Requests tab
2. Click on a student's name
```

**✅ Expected Result:** 
- Opens student profile view or dialog
- Shows student details

---

## 📦 Test 4: Equipment Management

### Test 4.1: View Equipment List
```
1. Click "Equipment Management" in sidebar
2. Verify you see:
   - Page header: "Equipment Management"
   - "Add Equipment" button
   - Grid/table of equipment showing:
     * Image/Picture
     * Name
     * Equipment ID
     * Category
     * Status badge
     * Action buttons
```

**✅ Expected Result:** Equipment list displays with images and details.

### Test 4.2: Add New Equipment
```
1. Click "Add Equipment" button
2. Dialog opens
3. Fill in:
   - Click image upload area
   - (Select or drop an image)
   - Equipment Name: "Test Lens - 50mm"
   - Category: Select "Camera Accessories"
   - Description: "Professional prime lens"
   - Status: "Available"
4. Click "Add" or "Submit"
```

**✅ Expected Result:** 
- Image preview shows in dialog
- Success notification
- (In production: Equipment appears in list)

### Test 4.3: Change Equipment Status
```
1. Find any equipment item
2. Click status dropdown or edit button
3. Change status from "Available" to "Under Maintenance"
4. Confirm change
```

**✅ Expected Result:** 
- Status badge updates immediately
- Success notification

### Test 4.4: Test All Status Options
```
1. Change equipment to "Available" → Green badge
2. Change to "Rented" → Yellow badge
3. Change to "Under Maintenance" → Red badge
```

**✅ Expected Result:** Badge colors update correctly for each status.

---

## 📄 Test 5: CV Review & Management

### Test 5.1: View Student CV List
```
1. Click "CV Review" in sidebar
2. Verify you see:
   - Page header: "Student CVs"
   - Table with columns:
     * Student Name (clickable)
     * Email
     * Date Last Updated
     * Status
     * Action button
```

**✅ Expected Result:** List of students with CVs displays.

### Test 5.2: Open CV Review Page
```
1. Click on a student's name (e.g., "John Smith")
2. CV Review Page opens showing:
   - All CV sections (Personal, Contact, Education, etc.)
   - "Download CV" button
   - "Back to List" button
   - "View Student Profile" button
   - "Flag CV" button
   - Comment box at bottom
```

**✅ Expected Result:** Full CV displays with all sections visible.

### Test 5.3: Review CV Sections
```
1. Scroll through and verify all sections:
   ✓ Personal Details (Name, Title, Summary)
   ✓ Contact Information
   ✓ Education
   ✓ Experience
   ✓ Projects
   ✓ Certifications
   ✓ Involvement
   ✓ Skills
   ✓ References (Name, Position, Workplace, Phone, Email)
```

**✅ Expected Result:** All sections display with properly formatted data.

### Test 5.4: Download CV
```
1. Click "Download CV" button
```

**✅ Expected Result:** 
- CV downloads as PDF or document
- (In production: Generates formatted CV file)

### Test 5.5: View Student Profile from CV
```
1. Click "View Student Profile" button
```

**✅ Expected Result:** 
- Navigates to student profile page
- Shows full student details

### Test 5.6: Flag CV
```
1. Click "Flag CV" button
```

**✅ Expected Result:** 
- CV marked as flagged
- Status updates
- Success notification

### Test 5.7: Add Admin Feedback
```
1. Scroll to comment box at bottom
2. Enter feedback: "Great work! Please add more details to your project descriptions. Consider including specific software and tools used."
3. Click "Submit Feedback" or similar button
```

**✅ Expected Result:** 
- Success notification
- Feedback saved
- (Student will see this feedback when viewing their CV)

### Test 5.8: Navigate Back to List
```
1. Click "Back to List" button
```

**✅ Expected Result:** Returns to CV list page.

---

## 👥 Test 6: Profile Management

### Test 6.1: View Student Profiles Tab
```
1. Click "Profile Management" in sidebar
2. Verify two tabs: "Students" and "Admins"
3. "Students" tab active by default
4. Verify table shows:
   - Name
   - Email
   - Student ID
   - Program
   - Year
   - Status
   - "View Profile" button
```

**✅ Expected Result:** Student list displays with details.

### Test 6.2: View Student Profile Details
```
1. Click "View Profile" button for any student
2. Profile view/dialog opens showing:
   - Full name
   - Email
   - Phone
   - Student ID
   - Profile picture
   - Program/Course
   - Year
   - Statistics:
     * Total bookings
     * Active rentals
     * Tutorials watched
   - "View CV Details" button
```

**✅ Expected Result:** Complete student profile displays.

### Test 6.3: Navigate to CV from Profile
```
1. In student profile view
2. Click "View CV Details" button
```

**✅ Expected Result:** 
- Navigates to CV Review page
- Shows that student's CV

### Test 6.4: View Admin Profiles Tab
```
1. Click "Admins" tab
2. Verify table shows:
   - Name
   - Email
   - Admin ID
   - Role
   - Status
   - "View Profile" button
```

**✅ Expected Result:** Admin list displays.

### Test 6.5: View Admin Profile Details
```
1. Click "View Profile" for any admin
2. Profile view opens showing:
   - Full name
   - Email
   - Phone
   - Admin ID
   - Profile picture
   - Role/Position
```

**✅ Expected Result:** Admin profile displays correctly.

---

## 🎨 Test 7: Theme & Responsive Design

### Test 7.1: Light Mode
```
1. Ensure light mode is active
2. Navigate through all admin pages
3. Verify:
   - Background: Light blue (#EBF2FA)
   - Cards: White with subtle shadows
   - Text: Dark gray/black
   - Borders: Light gray
```

**✅ Expected Result:** Consistent light theme across all pages.

### Test 7.2: Dark Mode
```
1. Click Moon icon to switch to dark mode
2. Navigate through all admin pages
3. Verify:
   - Background: Dark gradient (gray-950)
   - Cards: Dark gray with borders
   - Text: White/light gray
   - Proper contrast
```

**✅ Expected Result:** Consistent dark theme across all pages.

### Test 7.3: Responsive Design - Tablet
```
1. Resize browser to tablet size (768px - 1024px)
2. Check:
   - Sidebar remains visible or collapses
   - Cards stack appropriately
   - Tables become scrollable
   - Buttons remain accessible
```

**✅ Expected Result:** Layout adapts smoothly.

### Test 7.4: Responsive Design - Mobile
```
1. Resize browser to mobile size (< 768px)
2. Check:
   - Hamburger menu appears
   - Content stacks vertically
   - Dialogs adapt to screen size
   - Touch targets are large enough
```

**✅ Expected Result:** Mobile-friendly layout.

---

## 🔐 Test 8: Access Control & Security

### Test 8.1: Admin-Only Access
```
1. Logout from admin account
2. Login as student account
3. Try to access admin URLs directly:
   - /admin-dashboard
   - /admin-tutorials
   - /admin-labs
   - /admin-equipment
   - /admin-cv-review
   - /admin-profiles
```

**✅ Expected Result:** 
- Student cannot access admin pages
- Redirected or shown error
- Admin navigation not visible in sidebar

### Test 8.2: Logout Functionality
```
1. Login as admin
2. Click "Logout" button in sidebar
```

**✅ Expected Result:** 
- Redirects to landing page
- Session cleared
- Cannot access admin pages without logging in again

---

## 🔔 Test 9: Notifications & Feedback

### Test 9.1: Toast Notifications
```
1. Perform various actions:
   - Upload tutorial
   - Approve booking
   - Reject booking
   - Add equipment
   - Submit feedback
2. Observe toast notifications
```

**✅ Expected Result:** 
- Toasts appear in correct position
- Auto-dismiss after a few seconds
- Appropriate colors (success = green, error = red)
- Clear messages

### Test 9.2: Notification Bell
```
1. Click bell icon in top bar
```

**✅ Expected Result:** 
- Shows notification count badge
- (In production: Opens notification dropdown)

---

## 🔍 Test 10: Search Functionality

### Test 10.1: Global Search
```
1. From any admin page
2. Click search bar in top header
3. Type search query
```

**✅ Expected Result:** 
- Search bar accepts input
- (In production: Shows search results)

---

## 📋 Test 11: Form Validation

### Test 11.1: Required Fields
```
1. Open any "Add" dialog (tutorial, equipment, lab)
2. Leave required fields empty
3. Try to submit
```

**✅ Expected Result:** 
- Form shows validation errors
- Submit button disabled or shows error toast
- Red borders or error messages on invalid fields

### Test 11.2: URL Validation
```
1. Open Upload Tutorial dialog
2. Select YouTube or Google Drive
3. Enter invalid URL format
4. Try to proceed
```

**✅ Expected Result:** 
- Shows URL format error
- Prevents progression to next step

---

## ✅ Test Summary Checklist

### Admin Dashboard
- [ ] Dashboard loads correctly
- [ ] Stats display properly
- [ ] Navigation to other pages works
- [ ] Theme toggle works

### Tutorial Management
- [ ] Tutorial list displays
- [ ] Upload dialog (all 3 source types)
- [ ] Multi-step process works
- [ ] Equipment linking works
- [ ] Tutorials can be edited/deleted

### Lab Management
- [ ] Lab settings tab works
- [ ] Add lab/PC/time slot
- [ ] Booking requests tab works
- [ ] Approve/reject functionality
- [ ] Student profile link works

### Equipment Management
- [ ] Equipment list displays
- [ ] Add equipment with image
- [ ] Status change functionality
- [ ] All status types display correctly

### CV Review
- [ ] CV list displays
- [ ] CV detail view shows all sections
- [ ] Download CV works
- [ ] View student profile works
- [ ] Flag CV works
- [ ] Add feedback works

### Profile Management
- [ ] Student tab displays
- [ ] Student profile view works
- [ ] CV link from profile works
- [ ] Admin tab displays
- [ ] Admin profile view works

### General
- [ ] Light/dark mode works
- [ ] Responsive design works
- [ ] Access control enforced
- [ ] Logout works
- [ ] Notifications display
- [ ] Form validation works
- [ ] Navigation smooth throughout

---

## 🐛 Bug Reporting Template

If you find issues during testing, report them using this format:

```
**Bug Title:** [Brief description]

**Page/Component:** [e.g., Admin Tutorial Management]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [etc.]

**Expected Behavior:** [What should happen]

**Actual Behavior:** [What actually happens]

**Screenshots:** [If applicable]

**Browser:** [Chrome/Firefox/Safari/Edge + version]

**Theme:** [Light/Dark]

**Priority:** [High/Medium/Low]
```

---

## 📞 Support & Documentation

For additional help:
- See `/ADMIN_PANEL_GUIDE.md` for feature documentation
- See `/NAVIGATION_MAP.md` for navigation structure
- See `/INTEGRATION_GUIDE.md` for backend integration

---

**Testing Completed By:** _______________  
**Date:** _______________  
**Version Tested:** 1.0  
**Status:** ⬜ Pass | ⬜ Fail | ⬜ Partial
