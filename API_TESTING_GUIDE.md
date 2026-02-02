# API Testing Guide - YAGNEXOR Platform

## Using Postman or cURL to Test APIs

### Prerequisites
- Backend running on `http://localhost:3000`
- MySQL database initialized with tables

---

## 1. Authentication Endpoints

### Register New Institution

**Endpoint:** `POST /api/auth/register`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_name": "Lincoln High School",
    "tenant_domain": "lincolnhigh",
    "admin_email": "principal@lincolnhigh.com",
    "admin_password": "SecurePassword123",
    "admin_first_name": "John",
    "admin_last_name": "Principal"
  }'
```

**Expected Response (201):**
```json
{
  "message": "Tenant and admin user created successfully",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-here",
    "email": "principal@lincolnhigh.com",
    "first_name": "John",
    "last_name": "Principal",
    "role": "super_admin",
    "tenant_id": "uuid-here",
    "is_active": true
  }
}
```

### Login

**Endpoint:** `POST /api/auth/login`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_domain": "lincolnhigh",
    "email": "principal@lincolnhigh.com",
    "password": "SecurePassword123"
  }'
```

**Save the tokens:**
```bash
export ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIs..."
export REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

### Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "'$REFRESH_TOKEN'"
  }'
```

### Get Current User

**Endpoint:** `GET /api/auth/me`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 2. User Management Endpoints

### Create New User

**Endpoint:** `POST /api/users`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "email": "teacher1@lincolnhigh.com",
    "password": "TeacherPass123",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "faculty"
  }'
```

### List All Users

**Endpoint:** `GET /api/users`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Get Specific User

**Endpoint:** `GET /api/users/:user_id`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/users/user-uuid-here \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Update User Role

**Endpoint:** `PUT /api/users/:user_id/role`

**cURL:**
```bash
curl -X PUT http://localhost:3000/api/users/user-uuid-here/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "role": "hod"
  }'
```

### Deactivate User

**Endpoint:** `DELETE /api/users/:user_id`

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/users/user-uuid-here \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 3. Role Management Endpoints

### List Roles

**Endpoint:** `GET /api/roles`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/roles \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Create Role

**Endpoint:** `POST /api/roles`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "academic_head",
    "description": "Head of Academic Affairs"
  }'
```

---

## 4. Student Management Endpoints

### Create Student

**Endpoint:** `POST /api/students`

**Note:** First, create a user with role "student", then use that user_id

**cURL:**
```bash
# First create student user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "email": "student1@lincolnhigh.com",
    "password": "StudentPass123",
    "first_name": "Alex",
    "last_name": "Johnson",
    "role": "student"
  }'

# Use the returned ID for student creation
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "user_id": "user-uuid-from-above",
    "class_id": "class-uuid-here",
    "academic_year_id": "year-uuid-here",
    "enrollment_number": "2024-S001",
    "date_of_birth": "2005-06-15",
    "gender": "Male",
    "phone": "+1234567890",
    "address": "123 Student Street"
  }'
```

### List Students

**Endpoint:** `GET /api/students`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Get Student Details

**Endpoint:** `GET /api/students/:student_id`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/students/student-uuid-here \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Update Student

**Endpoint:** `PUT /api/students/:student_id`

**cURL:**
```bash
curl -X PUT http://localhost:3000/api/students/student-uuid-here \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "phone": "+9876543210",
    "address": "456 New Street",
    "status": "ACTIVE"
  }'
```

---

## 5. Attendance Endpoints

### Mark Attendance

**Endpoint:** `POST /api/attendance`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "student_id": "student-uuid-here",
    "subject_id": "subject-uuid-here",
    "attendance_date": "2024-01-20",
    "status": "PRESENT",
    "remarks": "Regular attendance"
  }'
```

### Get Attendance Records

**Endpoint:** `GET /api/attendance`

**Query parameters:** `?student_id=uuid&date_from=2024-01-01&date_to=2024-01-31`

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/attendance?student_id=student-uuid-here&date_from=2024-01-01&date_to=2024-01-31" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Get Attendance Summary

**Endpoint:** `GET /api/attendance/summary/:student_id`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/attendance/summary/student-uuid-here \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 6. Exam Endpoints

### Create Exam

**Endpoint:** `POST /api/exams`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "subject_id": "subject-uuid-here",
    "class_id": "class-uuid-here",
    "academic_year_id": "year-uuid-here",
    "name": "Mathematics Mid-Term",
    "exam_type": "MIDTERM",
    "total_marks": 100,
    "exam_date": "2024-02-10",
    "exam_time": "09:00:00",
    "duration_minutes": 120
  }'
```

### List Exams

**Endpoint:** `GET /api/exams`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/exams \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Add Exam Result

**Endpoint:** `POST /api/exams/:exam_id/results`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/exams/exam-uuid-here/results \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "student_id": "student-uuid-here",
    "marks_obtained": 85,
    "grade": "A",
    "remarks": "Excellent performance"
  }'
```

### Publish Exam Results

**Endpoint:** `PUT /api/exams/:exam_id/publish`

**cURL:**
```bash
curl -X PUT http://localhost:3000/api/exams/exam-uuid-here/publish \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Get Exam Results

**Endpoint:** `GET /api/exams/:exam_id/results`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/exams/exam-uuid-here/results \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 7. Fee Endpoints

### Get All Fees

**Endpoint:** `GET /api/fees`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/fees \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Get Student Fee Details

**Endpoint:** `GET /api/fees/:student_id`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/fees/student-uuid-here \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Record Fee Payment

**Endpoint:** `POST /api/fees/:fee_id/payment`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/fees/fee-uuid-here/payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "amount": 5000
  }'
```

---

## 8. Faculty Endpoints

### Create Faculty

**Endpoint:** `POST /api/faculty`

**cURL:**
```bash
# First create faculty user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "email": "faculty1@lincolnhigh.com",
    "password": "FacultyPass123",
    "first_name": "Robert",
    "last_name": "Brown",
    "role": "faculty"
  }'

# Create faculty record
curl -X POST http://localhost:3000/api/faculty \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "user_id": "user-uuid-from-above",
    "department_id": "department-uuid-here",
    "qualification": "M.Sc Mathematics",
    "specialization": "Algebra",
    "phone": "+1111111111",
    "office_number": "A101"
  }'
```

### List Faculty

**Endpoint:** `GET /api/faculty`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/faculty \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Testing with Postman

1. Import these endpoints into Postman
2. Create a collection called "YAGNEXOR"
3. Set up environment variables:
   - `base_url`: http://localhost:3000
   - `access_token`: (paste token after login)
   - `tenant_domain`: lincolnhigh
4. Test each endpoint systematically

## Common HTTP Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad request (validation error)
- **401** - Unauthorized (invalid token)
- **403** - Forbidden (no permission)
- **404** - Not found
- **500** - Server error

## Error Response Example

```json
{
  "error": "Permission denied: student:create"
}
```

## Rate Limiting Headers

After requests, check these headers:
- `RateLimit-Limit`: 100
- `RateLimit-Remaining`: 99
- `RateLimit-Reset`: timestamp

---

**Happy Testing! 🚀**
