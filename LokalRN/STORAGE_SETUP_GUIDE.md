# Supabase Storage Setup Guide

## 🚨 Current Issue
Your Supabase Storage buckets exist but have configuration issues:
- Buckets not visible in listing (RLS issue)
- MIME type restrictions preventing uploads
- Missing proper policies

## 🔧 Step-by-Step Fix

### Step 1: Create Storage Buckets

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `sgiuzcfsjzsspnukgdtf`

2. **Go to Storage Section**
   - Click on "Storage" in the left sidebar
   - Click "Create a new bucket"

3. **Create Videos Bucket**
   - **Bucket name**: `videos`
   - **Public bucket**: ✅ Check this box
   - **File size limit**: `500 MB`
   - **Allowed MIME types**: `video/mp4,video/mov,video/avi,video/mkv,video/webm`
   - Click "Create bucket"

4. **Create Thumbnails Bucket**
   - **Bucket name**: `thumbnails`
   - **Public bucket**: ✅ Check this box
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`
   - Click "Create bucket"

### Step 2: Run SQL Scripts

1. **Go to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

2. **Run Storage Buckets Script**
   - Copy and paste the contents of `scripts/create-storage-buckets.sql`
   - Click "Run" to execute

3. **Run Storage Policies Script**
   - Create a new query
   - Copy and paste the contents of `scripts/storage-policies.sql`
   - Click "Run" to execute

### Step 3: Verify Setup

Run the verification script:
```bash
cd LokalRN
node scripts/diagnose-storage.js
```

You should see:
- ✅ Found 2 bucket(s)
- ✅ Successfully accessed 'videos'
- ✅ Successfully accessed 'thumbnails'
- ✅ Upload test successful

## 🧪 Test Upload

After setup, test with a real video file:
```bash
cd LokalRN
node scripts/test-storage-upload.js
```

## 🔍 Troubleshooting

### If buckets still not found:
1. Check bucket names are exactly `videos` and `thumbnails`
2. Ensure buckets are set to "Public"
3. Verify SQL scripts ran successfully

### If upload still fails:
1. Check MIME type restrictions
2. Verify file size is under limits
3. Ensure user is authenticated

### If RLS errors persist:
1. Check that policies were created successfully
2. Verify `storage.objects` has RLS enabled
3. Try using service role key for admin operations

## 📋 Verification Checklist

- [ ] Videos bucket created and public
- [ ] Thumbnails bucket created and public
- [ ] Storage policies created
- [ ] RLS enabled on storage.objects
- [ ] Upload test passes
- [ ] Download test passes
- [ ] App can upload videos

## 🎯 Expected Result

After completing these steps, your storage should work perfectly:
- Video uploads will work
- Thumbnail uploads will work
- Public read access will work
- User-specific permissions will work 