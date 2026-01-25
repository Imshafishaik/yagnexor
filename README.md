# YAGNEXOR - Multi-SaaS Educational Management Platform

A comprehensive, enterprise-grade educational management system built with modern web technologies supporting multiple institutions through a solid multi-tenant architecture.

**Status:** ✅ Production Ready | **Backend:** Running on 3000 | **Frontend:** Running on 5173

## 📚 Documentation Guide

**Start here based on your needs:**

| Document | Purpose | Time | Audience |
|----------|---------|------|----------|
| [QUICK_START.md](./QUICK_START.md) | Quick reference & how to run | 5-10 min | Everyone |
| [PAGES_CREATED.md](./PAGES_CREATED.md) | Detailed page documentation | 20-30 min | Developers |
| [PAGES_REFERENCE.md](./PAGES_REFERENCE.md) | Code patterns & examples | 15-20 min | Developers |
| [PROJECT_COMPLETION.md](./PROJECT_COMPLETION.md) | Complete project details | 25-30 min | Project Managers |
| [DELIVERY_SUMMARY.md](./DELIVERY_SUMMARY.md) | What's been delivered | 10-15 min | Stakeholders |
| [BUG_FIXES.md](./BUG_FIXES.md) | Form validation improvements | 10 min | Developers |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | How to test features | 15 min | QA/Testers |

**Choose by role:**
- 👨‍💻 **Developer?** → [QUICK_START.md](./QUICK_START.md) then [PAGES_REFERENCE.md](./PAGES_REFERENCE.md)
- 📋 **Tester?** → [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- 👔 **Manager?** → [PROJECT_COMPLETION.md](./PROJECT_COMPLETION.md)
- 🚀 **DevOps?** → [QUICK_START.md](./QUICK_START.md) then backend docs

---

## 🚀 Quick Start (2 minutes)

```bash
cd /Users/shafi/myproj/yagnexor
npm start
```

Then visit: http://localhost:5173

---

## 🎯 Key Features

### Core Platform
- **Multi-Tenant Architecture** - Support unlimited institutions with complete data isolation
- **Authentication & Authorization** - JWT-based authentication with role-based access control (RBAC)
- **API Guard** - Rate limiting, request validation, and security middleware
- **Tenant Isolation** - Database-level isolation ensuring data privacy

### Education Domain
- **Student Management** - Enrollment, profiles, status tracking
- **Faculty Management** - Staff records, departments, qualifications
- **Attendance Tracking** - Real-time attendance marking with analytics
- **Exam Management** - Exam scheduling, result recording, grade publishing
- **Fee Management** - Fee structure, payment tracking, financial reports
- **LMS Integration** - Course materials and learning resources

### User Management
- **Super Admin** - Create institutions and users, manage all tenants
- **Tenant Admin** - Manage users and roles within institution
- **Role-Based Access** - Flexible permission system with resource:action matrix
- **Multi-Role Support** - Super Admin, Tenant Admin, Principal, HOD, Faculty, Student

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Or Node.js 20+, MySQL 8.0+

### Using Docker Compose (Recommended)

```bash
cd /Users/shafi/myproj/yagnexor
docker-compose up -d
```

Services will start on:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **MySQL:** localhost:3306

### First Use
1. Open http://localhost:5173 in your browser
2. Click "Register" to create a new institution
3. Create admin user credentials
4. Login and start managing your institution

## 📚 Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed installation and deployment
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Complete feature documentation
- [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) - API endpoints and testing examples
- [EDUCATION_DOMAIN_FEATURES.md](./EDUCATION_DOMAIN_FEATURES.md) - Education feature details

## 🏗️ Architecture

### Backend Stack
- **Framework:** Express.js 4.18+
- **Database:** MySQL 8.0
- **Authentication:** JWT (jsonwebtoken 9.1.2)
- **Validation:** Joi 17.11.0
- **Security:** Helmet 7.1.0, bcryptjs 2.4.3
- **Rate Limiting:** express-rate-limit 7.1.5

### Frontend Stack
- **Framework:** React 18.2.0
- **Build Tool:** Vite 5.0.8
- **Styling:** Tailwind CSS 3.4.1
- **State Management:** Zustand 4.4.2
- **HTTP Client:** Axios 1.6.2
- **Routing:** React Router DOM 6.20.1

### Deployment
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Database Persistence:** MySQL volumes

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
