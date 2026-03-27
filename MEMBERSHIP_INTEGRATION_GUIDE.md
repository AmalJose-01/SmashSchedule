# Membership & Court Management Module - Integration Guide

## Overview
Complete membership management system with member registration, profile management, document verification, and admin dashboard.

## ✅ Created Files

### Backend Models (server/model/)
- ✅ `member.js` - Member profile model
- ✅ `membership.js` - Membership records model
- ✅ `memberDocument.js` - Document verification model
- ✅ `membershipType.js` - Membership type configuration model

### Backend Controllers (server/controller/)
- ✅ `membershipController.js` - All membership business logic

### Backend Routes (server/routes/)
- ✅ `membershipRoutes.js` - All membership API endpoints

### Frontend Services (client/src/services/membership/)
- ✅ `membershipService.js` - API integration layer

### Frontend Pages (client/src/pages/)
- ✅ `member/MemberRegistration.jsx` - Multi-step member registration
- ✅ `member/MemberProfile.jsx` - Member profile & management
- ✅ `admin/AdminMembershipDashboard.jsx` - Admin dashboard

### Styles (client/src/pages/)
- ✅ `member/MemberRegistration.css`
- ✅ `member/MemberProfile.css`
- ✅ `admin/AdminMembershipDashboard.css`

---

## 🔧 Integration Steps

### Step 1: Update Backend server.js/index.js

Add the membership routes to your main server file:

```javascript
// In server/index.js or server.js

const membershipRoutes = require("./routes/membershipRoutes");

// Add this with your other routes
app.use("/api/membership", membershipRoutes);
```

### Step 2: Update Frontend App.js/Router

Add routes for membership pages:

```javascript
// In client/src/App.jsx or your routing file

import MemberRegistration from "./pages/member/MemberRegistration";
import MemberProfile from "./pages/member/MemberProfile";
import AdminMembershipDashboard from "./pages/admin/AdminMembershipDashboard";

// Add routes
const routes = [
  // ... existing routes

  // Member Routes
  {
    path: "/membership/register",
    element: <MemberRegistration />,
  },
  {
    path: "/member/profile/:memberId",
    element: <MemberProfile />,
  },

  // Admin Routes
  {
    path: "/admin/membership",
    element: <AdminMembershipDashboard />,
    requiredRole: "admin",
  },
];
```

### Step 3: Install Required Dependencies

The code uses these packages (likely already installed):

```bash
npm install @tanstack/react-query axios react-router-dom react-hot-toast multer
```

### Step 4: Setup Environment Variables

Add to `.env` files:

```env
# Backend (.env or .env.local)
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
UPLOAD_DIR=./uploads  # For document storage

# Frontend (.env.local)
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 5: Database Setup

Initialize membership types (run once):

```javascript
// Create membership types in database
const membershipTypes = [
  {
    name: "STANDARD",
    displayName: "Standard Membership",
    price: 99,
    discountPercentage: 0,
    validityMonths: 12,
    requiresDocumentVerification: false,
    benefits: [
      { title: "Court Access", description: "Full access to all courts" },
      { title: "Booking Priority", description: "Priority court bookings" },
    ],
  },
  {
    name: "STUDENT",
    displayName: "Student Membership",
    price: 49,
    discountPercentage: 50,
    validityMonths: 12,
    requiresDocumentVerification: true,
    requiredDocumentType: ["STUDENT_ID"],
    benefits: [
      { title: "50% Discount", description: "Exclusive student discount" },
      { title: "Court Access", description: "Full access to all courts" },
    ],
  },
  {
    name: "VETERAN",
    displayName: "Veteran Membership",
    price: 59,
    discountPercentage: 40,
    validityMonths: 12,
    requiresDocumentVerification: true,
    requiredDocumentType: ["VETERAN_PROOF"],
    benefits: [
      { title: "40% Discount", description: "Exclusive veteran discount" },
      { title: "Court Access", description: "Full access to all courts" },
    ],
  },
];

await MembershipType.insertMany(membershipTypes);
```

---

## 📋 API Endpoints

### Member Endpoints

```
POST   /api/membership/register
       Register new member

GET    /api/membership/types
       Get all membership types

GET    /api/membership/:memberId/profile
       Get member profile (requires auth)

PUT    /api/membership/:memberId/profile
       Update member profile (requires auth)

POST   /api/membership/:memberId/upload-document
       Upload verification document (requires auth)

POST   /api/membership/:memberId/renew
       Renew membership (requires auth)

GET    /api/membership/:memberId/history
       Get membership history (requires auth)
```

### Admin Endpoints

```
GET    /api/membership/admin/members
       Get all members with pagination & filtering (requires admin)

GET    /api/membership/admin/pending-verifications
       Get documents pending verification (requires admin)

POST   /api/membership/admin/verify-document/:documentId
       Verify/reject member document (requires admin)

GET    /api/membership/admin/expiring-memberships
       Get members with expiring membership (requires admin)

GET    /api/membership/admin/statistics
       Get membership statistics (requires admin)

POST   /api/membership/admin/auto-expire
       Trigger auto-expiry of expired memberships (requires admin)
```

---

## 🎨 Features Implemented

### Member Features
✅ Multi-step registration with personal & address info
✅ Membership type selection with pricing
✅ Document verification for discount memberships
✅ Profile viewing & editing
✅ Membership renewal online
✅ Membership history
✅ Status tracking (Active, Pending, Expired, etc.)
✅ Notification preferences

### Admin Features
✅ Member list with search & filtering
✅ Document verification dashboard
✅ Batch approve/reject documents
✅ Expiring membership alerts
✅ Membership statistics
✅ Revenue tracking
✅ Member overview dashboard
✅ Auto-expiry functionality

---

## 🔐 Authentication Integration

The controller expects an `authenticateToken` middleware that:
- Validates JWT tokens
- Attaches `req.userId` and `req.userRole`

Example middleware:

```javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};

const authorizeRole = (role) => (req, res, next) => {
  if (req.userRole !== role) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  next();
};

module.exports = { authenticateToken, authorizeRole };
```

---

## 📦 File Upload Handling

The system uses `multer` for file uploads. Configure cloud storage:

```javascript
// For AWS S3 (example)
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

// Or use local file storage:
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
```

Update the `fileUrl` in the controller to point to your storage solution.

---

## 📧 Email Integration (Optional)

Add email notifications using Resend (already in your package.json):

```javascript
// In membershipController.js after registration
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "noreply@yourdomain.com",
  to: member.email,
  subject: "Welcome to SmashSchedule!",
  html: `<h1>Welcome ${member.firstName}!</h1><p>Your membership is confirmed.</p>`,
});
```

---

## 🗓️ Scheduled Tasks (Cron Jobs)

Add auto-expiry task to run daily:

```javascript
const cron = require("node-cron");

// Run every day at 2 AM
cron.schedule("0 2 * * *", async () => {
  console.log("Running auto-expiry job...");
  await membershipController.autoExpireMembers({ body: {} }, { status: () => ({}) });
});
```

---

## ⚠️ Important Notes

1. **File Storage**: Current implementation saves to memory. Configure cloud storage (AWS S3, Google Cloud, etc.)
2. **Payment Integration**: Document shows Square integration requirement. Add payment gateway in registration
3. **Email Notifications**: Implement email service for confirmations and reminders
4. **Verification Documents**: Store securely and implement document retention policies
5. **Admin Section**: Ensure proper role-based access control

---

## 🧪 Testing Checklist

- [ ] Member registration (all types)
- [ ] Document upload and validation
- [ ] Admin verification workflow
- [ ] Membership renewal
- [ ] Status updates (Pending → Active)
- [ ] Expiry alerts
- [ ] Admin dashboard statistics
- [ ] Search and filtering

---

## 📝 Next Steps

1. ✅ Created Models, Controllers, Routes, Services, Pages
2. 🔲 Add Payment Integration (Square/Stripe)
3. 🔲 Add Email Notifications (Resend)
4. 🔲 Create Court Management Module
5. 🔲 Add Court Booking System
6. 🔲 Create Stadium Management Module
7. 🔲 Add Reporting & Analytics

---

## 📞 Support

For issues or questions about the implementation, refer to the code comments in each file.
