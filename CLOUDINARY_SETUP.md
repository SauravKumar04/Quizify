# Cloudinary Setup Guide

Quizify now uses Cloudinary for storing question images instead of local storage.

## Setup Steps

### 1. Create a Cloudinary Account
- Go to [cloudinary.com](https://cloudinary.com)
- Sign up for a free account
- After login, you'll be on your dashboard

### 2. Get Your Credentials
From your Cloudinary dashboard, you'll find:
- **Cloud Name**
- **API Key**
- **API Secret**

### 3. Update Environment Variables
Open `/backend/.env` and update these values:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

Replace the placeholder values with your actual Cloudinary credentials.

### 4. Restart Backend Server
After updating the `.env` file, restart your backend server:

```bash
cd backend
npm start
```

## Features

- **Automatic Upload**: Images are automatically uploaded to Cloudinary when admins add questions
- **Optimized Storage**: Images are optimized and limited to 1200x1200px
- **CDN Delivery**: Fast image loading via Cloudinary's global CDN
- **Organized**: All quiz images are stored in `quizify/questions` folder in your Cloudinary account

## Image Formats Supported
- JPEG/JPG
- PNG
- GIF
- WEBP

## File Size Limit
- Maximum: 5MB per image

## Note
The old `/uploads` directory is no longer used and can be deleted if desired.
