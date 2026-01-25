# How to Test Students Form - Step-by-Step Guide

## Prerequisites

1. **Servers Running**
   - Backend: http://localhost:3000 ✅
   - Frontend: http://localhost:5173 ✅

2. **Logged In**
   - Go to http://localhost:5173
   - Login with your credentials

3. **Data Exists**
   - You need valid User IDs, Class IDs, and Academic Year IDs in the database

---

## Getting Valid Test Data

### Find Existing Users
1. Go to **Users** page from dashboard
2. Look at the users list
3. Note down a **User ID** (usually UUID format like `dcca7838-f22b-4247-8751-399ba6acdc8f`)
4. For testing, use these IDs when creating students

### Find Existing Classes
The database should have classes seeded. Common test values:
- `GB123` or `10A` or `1`

### Find Existing Academic Years
The database should have academic years seeded. Common test values:
- `2526` or `2525` or `1`

---

## Testing: Create Student Successfully

### Step 1: Navigate to Students Page
- Click on **Students** module card from dashboard
- Should see list of existing students (may be empty)

### Step 2: Click "Add Student" Button
- Click the blue **"Add Student"** button in top right
- Modal form opens with all fields

### Step 3: Fill Form with Valid Data
```
User ID:            dcca7838-f22b-4247-8751-399ba6acdc8f  (copy from Users page)
Class ID:           GB123
Academic Year ID:   2526
Roll Number:        14
Enrollment Number:  E001
Date of Birth:      2003-02-03  (use date picker)
Gender:             Male  (from dropdown)
Phone:              0759132805
Address:            Munnangi, Kollipara, District
```

### Step 4: Click "Add Student"
- Form submits to server
- If successful:
  - Modal closes automatically
  - Student appears in the table
  - No error message shown

### Step 5: Verify in Table
- Look for new student in the table below
- Should see all your entered data displayed

---

## Testing: Validation Errors

### Test Case 1: Missing Date of Birth
**Steps:**
1. Open "Add Student" form
2. Fill all fields EXCEPT Date of Birth
3. Leave Date of Birth empty
4. Click "Add Student"

**Expected Result:**
- ❌ Form does NOT submit
- ✅ Red error message appears: **"Date of Birth is required"**
- ✅ Form stays open for correction
- ✅ All your data is still there

---

### Test Case 2: Missing User ID
**Steps:**
1. Open "Add Student" form
2. Leave User ID empty
3. Fill all other fields
4. Click "Add Student"

**Expected Result:**
- ❌ Form does NOT submit
- ✅ Red error message appears: **"User ID is required"**
- ✅ Form stays open for correction

---

### Test Case 3: Missing Required Fields
**Steps:**
1. Open "Add Student" form
2. Fill ONLY: Class ID, Academic Year ID, Roll Number
3. Leave everything else empty
4. Click "Add Student"

**Expected Result:**
- ❌ Form does NOT submit
- ✅ Red error message appears for first missing field
- ✅ Example: **"User ID is required"**

---

### Test Case 4: Invalid User ID (Non-Existent)
**Steps:**
1. Open "Add Student" form
2. In User ID field, enter: `invalid-user-id-12345`
3. Fill all other fields with valid data
4. Click "Add Student"

**Expected Result:**
- Form submits to backend
- ❌ API returns error
- ✅ Red error message appears: Shows database error about foreign key
- ✅ Message example: **"Cannot add or update a child row: a foreign key constraint fails"**
- ✅ Form stays open for correction
- ✅ Data remains in form

---

## Testing: Error Clear on Typing

### Steps:
1. Open "Add Student" form
2. Leave Date of Birth empty
3. Click "Add Student"
4. Error message appears: "Date of Birth is required"
5. **Click in Date of Birth field**
6. **Start typing or select date**

**Expected Result:**
- ✅ Red error message **disappears automatically**
- ✅ User can then click "Add Student" again

---

## Testing: Required Field Indicators

### What to Look For:
- ✅ All important fields have `*` in placeholder
- Examples:
  - "User ID *"
  - "Class ID *"
  - "Roll Number *"
  - "Date of Birth" (shown with date picker)
  - "Phone Number *"
  - "Address *"

---

## Testing: Form Data Persistence

### Steps:
1. Open "Add Student" form
2. Fill in: Name, Phone, Address
3. Leave Date of Birth empty
4. Click "Add Student"
5. Error appears
6. **Check if your data is still in the form** ✅

**Expected:**
- All previously entered data remains visible
- Only the date field is empty
- User doesn't have to re-enter everything

---

## Troubleshooting Tests

### If Error Messages Don't Appear
1. **Check browser console** (F12 → Console)
   - Should show no red errors
2. **Check backend logs**
   - Terminal where npm start is running
   - Should show request being processed

### If Form Submits Without Validation
1. **Refresh page** (Cmd+R or Ctrl+R)
2. **Restart servers:**
   ```bash
   # Stop: Ctrl+C
   # Restart:
   npm start
   ```

### If Date Picker Doesn't Work
1. Browser might not support HTML5 date input
2. Try entering date manually: YYYY-MM-DD format
3. Example: 2003-02-03

### If User ID Causes Foreign Key Error
1. **Go to Users page**
2. **Copy an actual User ID** from the table
3. **Paste it** in the User ID field
4. Try again

---

## Quick Test Checklist

- [ ] Form has all required fields marked with `*`
- [ ] Date picker works and accepts dates
- [ ] Leaving date empty shows error
- [ ] Leaving user_id empty shows error
- [ ] Submitting with non-existent user_id shows API error
- [ ] Error disappears when user starts typing
- [ ] Form data persists when error occurs
- [ ] Successfully submitting adds student to table
- [ ] Table shows all entered information
- [ ] Can edit existing student
- [ ] Can delete student (with confirmation)

---

## Common Test Data

If you need to create test data first:

### Step 1: Create a Test User
1. Go to **Users** page
2. Click "Create User"
3. Fill:
   - Email: testuser@example.com
   - Password: Test@123
   - First Name: Test
   - Last Name: Student
   - Phone: 1234567890
   - Role ID: student
   - Status: ACTIVE
4. Click "Create User"
5. **Copy the User ID** shown in the table

### Step 2: Use This User ID for Students
1. Go to **Students** page
2. Click "Add Student"
3. Paste the User ID you copied
4. Fill remaining fields
5. Submit

---

## Expected Behavior Summary

| Action | Expected | Status |
|--------|----------|--------|
| Submit with empty date | Error message shown | ✅ Fixed |
| Submit with empty user_id | Error message shown | ✅ Fixed |
| Submit with invalid user_id | API error shown | ✅ Fixed |
| Submit with valid data | Student created, modal closes | ✅ Ready to test |
| Error message on validation fail | Red box at top | ✅ Fixed |
| Error clears on typing | Error disappears | ✅ Fixed |
| Form data persists on error | Data still visible | ✅ Fixed |

---

## Next Steps

After testing the Students form:

1. **Apply same fixes to other pages:**
   - FacultyPage
   - ExamsPage
   - FeesPage
   - UsersPage

2. **Test end-to-end workflow:**
   - Create User → Create Student with that User → Mark Attendance → View Results

3. **Test edge cases:**
   - Very long text inputs
   - Special characters in names
   - Duplicate roll numbers
   - Past and future dates

---

## Support

If tests fail:
1. Check the exact error message shown
2. Review [BUG_FIXES.md](./BUG_FIXES.md) for details
3. Check backend logs for API errors
4. Verify test data exists in database

---

**Ready to test?** Start with Step 1: Navigate to Students Page! 🚀
