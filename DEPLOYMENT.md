# Food Distribution System Deployment (Render + Vercel + MySQL)

This guide deploys:
- Backend: Render (Web Service)
- Frontend: Vercel
- Database: Managed MySQL (for example Railway MySQL, PlanetScale, Aiven, or similar)

## 1) Prerequisites

- Code pushed to GitHub (you already did this).
- A managed MySQL instance with:
  - host
  - port
  - database name
  - username
  - password
- Render and Vercel accounts connected to your GitHub repository.

## 2) Prepare Environment Variables

Use these templates:
- backend/.env.example
- frontend/.env.example

Important backend values:
- DB_URL
- DB_USERNAME
- DB_PASSWORD
- JWT_SECRET (strong, base64-encoded secret, 32+ bytes)
- ADMIN_PASSWORD (do not keep default)
- APP_PUBLIC_BASE_URL (your Render backend URL)
- APP_STORAGE_TYPE=local (or cloudinary)
- APP_UPLOAD_DIR=/var/data/uploads (when using local storage on Render persistent disk)
- CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET (when using cloudinary)

Generate a secure JWT secret (example):
- `openssl rand -base64 32`

Important frontend value:
- VITE_API_BASE_URL=https://<your-render-backend>.onrender.com/api

## 3) Deploy Backend on Render

1. In Render, click New + > Web Service.
2. Select your GitHub repository.
3. Configure:
   - Root Directory: backend
   - Environment: Java
   - Build Command: ./mvnw clean package -DskipTests
   - Start Command: java -jar target/backend-0.0.1-SNAPSHOT.jar
4. Add environment variables from backend/.env.example.
5. Add Persistent Disk in Render:
   - Mount path: /var/data
   - Size: at least 1 GB
   - Set APP_UPLOAD_DIR=/var/data/uploads
   - Keep APP_STORAGE_TYPE=local
6. Deploy.

Optional Cloudinary mode (recommended for production image hosting):
- Set APP_STORAGE_TYPE=cloudinary
- Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- Optional: set CLOUDINARY_FOLDER (default: food-distribution/food-images)
- In this mode, backend uploads image binaries to Cloudinary and stores only returned URL in DB.

After deployment, set:
- APP_PUBLIC_BASE_URL=https://<your-render-backend>.onrender.com

Reason: image URLs returned by backend should point to your real backend domain.

## 4) Deploy Frontend on Vercel

1. In Vercel, click Add New > Project.
2. Import the same GitHub repository.
3. Configure:
   - Root Directory: frontend
   - Framework: Vite (auto-detected)
   - Build Command: npm run build
   - Output Directory: dist
4. Add environment variable:
   - VITE_API_BASE_URL=https://<your-render-backend>.onrender.com/api
5. Deploy.

## 5) CORS and Security Notes

Your backend currently allows broad CORS patterns, so frontend-backend communication should work immediately.
For production hardening, later restrict CORS to your Vercel domain.

Also ensure these are strong in production:
- JWT_SECRET
- ADMIN_PASSWORD
- DB credentials

## 6) Verify After Deployment

1. Open frontend URL from Vercel.
2. Test signup/login OTP flow.
3. Add a food listing with image.
4. Confirm image URL loads:
   - local mode: backend /uploads path
   - cloudinary mode: cloudinary secure URL
5. Check backend logs in Render for errors.

## 7) Updating Code Later

- Push new commits to GitHub.
- Render and Vercel auto-redeploy (if Auto Deploy is enabled).
- Database data remains unless you manually modify/drop schema/data.

## 8) Common Production Issues

- 401/403 issues: verify JWT_SECRET and Authorization header flow.
- CORS errors: verify VITE_API_BASE_URL and backend URL correctness.
- Uploads disappearing: confirm Render persistent disk is mounted and APP_UPLOAD_DIR points to /var/data/uploads.
- Cloudinary upload failed: verify APP_STORAGE_TYPE=cloudinary and all CLOUDINARY_* variables are set correctly.
- DB connection failed: verify DB_URL format and credentials.
