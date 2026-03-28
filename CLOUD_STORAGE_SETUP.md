# Cloud Storage Setup Guide for Document Uploads

## Overview
This implementation uses **Cloudinary** for cloud storage of membership verification documents. All uploaded files (PDFs, JPG, PNG) are stored in Cloudinary's cloud and the URLs are saved in the database.

## Setup Instructions

### Step 1: Create a Cloudinary Account
1. Go to https://cloudinary.com/users/register/free
2. Sign up for a free account (free tier includes 25GB storage)
3. Go to your Dashboard: https://cloudinary.com/console
4. Copy your credentials:
   - **Cloud Name**: Your unique cloud identifier
   - **API Key**: Your API key
   - **API Secret**: Your API secret

### Step 2: Install Required Package
```bash
cd server
npm install cloudinary
```

### Step 3: Add Environment Variables
Add these to your `.env` file:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Replace with your actual Cloudinary credentials from Step 1.

### Step 4: File Structure
The following files have been created/updated:

**New Files:**
- `server/config/cloudinaryConfig.js` - Cloudinary configuration
- `server/utils/cloudinaryHelper.js` - Cloud upload/delete utilities

**Updated Files:**
- `server/controller/membershipController.js` - Updated document upload handler
- `server/model/memberDocument.js` - Added `cloudinaryPublicId` field
- `server/routes/membershipRoutes.js` - Routes remain the same (no changes needed)

### Step 5: Restart Your Server
```bash
# Stop the current server
Ctrl+C

# Restart
npm start
# or
npm run dev
```

## How It Works

### User Side (Frontend)
1. User registers for membership
2. On Step 3, if document verification is required:
   - User selects document type (STUDENT_ID, GOVERNMENT_ID, VETERAN_PROOF)
   - User uploads PDF/JPG/PNG file (max 5MB)
   - Upload button shows loading state
   - File is sent to backend

### Backend Process
1. File is validated:
   - Type: Only PDF, JPG, PNG allowed
   - Size: Maximum 5MB
2. File is uploaded to Cloudinary:
   - Stored in `membership-verification-documents` folder
   - Secure URL is returned
3. Database is updated:
   - `fileUrl` = Cloudinary secure URL
   - `cloudinaryPublicId` = Used for deletion
   - `verificationStatus` = PENDING
4. File is **deleted** from local server (not stored locally)

### Admin Side
1. Admin sees pending documents in dashboard
2. Admin can view document via Cloudinary URL
3. Admin approves/rejects verification
4. On rejection, document is deleted from Cloudinary

## Features

✅ **Safe File Handling**: Files validated before upload
✅ **Cloud Storage**: Files stored on Cloudinary servers (secure, scalable)
✅ **Database Tracking**: Document URLs and metadata saved in MongoDB
✅ **Automatic Cleanup**: Old documents deleted when new ones uploaded
✅ **Admin Control**: Full verification workflow
✅ **Australian Client**: Pricing in AUD

## Document Upload Flow

```
User Selects File
        ↓
Frontend Validation (size, type)
        ↓
Send to Backend
        ↓
Backend Validation
        ↓
Upload to Cloudinary
        ↓
Get Secure URL
        ↓
Save to MongoDB (with URL)
        ↓
Admin Reviews in Dashboard
        ↓
Admin Approves/Rejects
        ↓
If Approved → Member Status = ACTIVE
If Rejected → Member Can Reupload
```

## Testing

1. **Create Membership Types** (as admin):
   - Go to Admin Dashboard → Membership Types tab
   - Create a membership type with "Requires Document Verification" ✓
   - Save it

2. **Register as Member**:
   - Go to User Dashboard → Membership card
   - Fill registration steps 1 & 2
   - Step 3 will ask for document upload
   - Select a PDF/JPG/PNG file and upload

3. **Verify Admin Dashboard**:
   - Go to Admin Dashboard → Verifications tab
   - Should see pending document
   - Click to view (will open Cloudinary URL)
   - Approve or reject

## Troubleshooting

### Upload fails with "Internal Server Error"
- Check if `.env` has Cloudinary credentials
- Verify `npm install cloudinary` was run
- Restart the server

### Document not visible to admin
- Check MongoDB if document was created with fileUrl
- Verify Cloudinary upload was successful
- Check browser console for errors

### Cloudinary URL broken
- Verify Cloud Name in `.env` is correct
- Check Cloudinary dashboard for uploaded file

## Security Notes
- API Secret is only used on backend (kept safe in `.env`)
- Only PDFs and images allowed
- File size limited to 5MB
- All files go to specific Cloudinary folder
- Only members in PENDING_VERIFICATION status can see their documents

