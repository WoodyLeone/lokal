# LokalRN Setup Guide

This guide will help you set up the LokalRN project with all dependencies and configurations properly configured.

## 🚨 Current Issues & Solutions

### 1. Storage Buckets Missing
**Problem**: Storage buckets (`videos` and `thumbnails`) are not created automatically due to RLS policies.

**Solution**: Manual creation required in Supabase dashboard.

### 2. Dependencies & Configuration
**Problem**: Some dependencies may be missing or misconfigured.

**Solution**: Use the provided scripts to fix everything.

## 📋 Complete Setup Process

### Step 1: Install Dependencies
```bash
cd LokalRN
npm install
```

### Step 2: Run Complete Setup
```bash
npm run setup-complete
```

This will:
- Set up Supabase configuration
- Provide manual storage bucket instructions
- Verify the setup

### Step 3: Manual Storage Bucket Creation

Since automatic bucket creation fails due to RLS policies, you need to create them manually:

1. **Open Supabase Dashboard**
   - Go to: https://sgiuzcfsjzsspnukgdtf.supabase.co
   - Navigate to Storage section

2. **Create "videos" Bucket**
   - Click "New bucket"
   - Name: `videos`
   - Public bucket: ✓ (checked)
   - File size limit: 500 MB
   - Allowed MIME types: `video/mp4, video/mov, video/avi, video/mkv`

3. **Create "thumbnails" Bucket**
   - Click "New bucket"
   - Name: `thumbnails`
   - Public bucket: ✓ (checked)
   - File size limit: 10 MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

### Step 4: Verify Setup
```bash
npm run verify-supabase
```

## 🔧 Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Start Android development
- `npm run ios` - Start iOS development
- `npm run web` - Start web development
- `npm run setup-complete` - Complete setup process
- `npm run verify-supabase` - Verify Supabase connection
- `npm run create-test-user` - Create test user account
- `npm run clean` - Clean and reinstall dependencies
- `npm run reset` - Complete reset and setup

## 🛠️ Troubleshooting

### If Setup Fails

1. **Clean Install**:
   ```bash
   npm run clean
   ```

2. **Complete Reset**:
   ```bash
   npm run reset
   ```

3. **Manual Verification**:
   ```bash
   npm run verify-supabase
   ```

### Common Issues

1. **Storage Buckets Missing**
   - Follow manual setup instructions
   - Run `npm run setup-storage-manual`

2. **Dependencies Issues**
   - Run `npm run clean`
   - Check Node.js version (should be 18+)

3. **Expo Issues**
   - Run `npx expo install --fix`
   - Clear Expo cache: `npx expo start --clear`

## 📱 Running the App

Once setup is complete:

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser

## ✅ Verification Checklist

- [ ] Dependencies installed
- [ ] Supabase connection working
- [ ] Database tables accessible
- [ ] Storage buckets created
- [ ] Environment variables configured
- [ ] App starts without errors

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section
2. Run `npm run verify-supabase` for diagnostics
3. Check the console output for specific error messages
4. Ensure all environment variables are set correctly

## 🎉 Success!

Once all checks pass, your LokalRN app should be fully functional with:
- ✅ Supabase database integration
- ✅ File storage capabilities
- ✅ User authentication
- ✅ Video upload and playback
- ✅ Product matching features 