# 🔄 Supabase Project Reset Guide

This guide will help you completely reset your Supabase project to a clean state. This will **DELETE ALL DATA** and recreate the database schema from scratch.

## ⚠️ **WARNING: This will delete all data!**

Before proceeding, make sure you:
- Have backed up any important data
- Are ready to lose all existing users, videos, and products
- Have your Supabase credentials ready

## 🚀 Quick Reset (Recommended)

### Step 1: Reset Storage
```bash
cd LokalRN
npm run reset-storage
```

### Step 2: Reset Database
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the entire contents of `scripts/reset-supabase.sql`
5. Click **Run** to execute the script

### Step 3: Verify Reset
```bash
npm run verify-supabase
```

## 📋 Detailed Reset Process

### 1. Storage Reset

The storage reset script will:
- List all current storage buckets
- Clear all files from the `videos` bucket
- Clear all files from the `thumbnails` bucket
- Verify bucket configuration

**Run with:**
```bash
npm run reset-storage
```

### 2. Database Reset

The SQL reset script will:

#### Step 2a: Drop Everything
- Drop all triggers
- Drop all functions
- Drop all storage policies
- Drop all table policies
- Drop all tables (profiles, videos, products)

#### Step 2b: Recreate Schema
- Create profiles table
- Create videos table
- Create products table
- Enable Row Level Security (RLS)

#### Step 2c: Set Up Security
- Create RLS policies for profiles
- Create RLS policies for videos
- Create RLS policies for products
- Create storage policies for videos and thumbnails

#### Step 2d: Create Functions & Triggers
- User registration handler
- Updated timestamp triggers

#### Step 2e: Insert Sample Data
- 4 sample products for testing

#### Step 2f: Verification
- Count rows in each table
- Verify RLS is enabled
- List all policies

**Execute in Supabase Dashboard:**
1. Go to **SQL Editor**
2. Copy contents of `scripts/reset-supabase.sql`
3. Click **Run**

### 3. Manual Storage Bucket Creation (if needed)

If the storage reset shows missing buckets, create them manually:

1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Create bucket named `videos` (public)
4. Create bucket named `thumbnails` (public)

### 4. Verification

After the reset, verify everything is working:

```bash
npm run verify-supabase
```

Expected output:
```
✅ Supabase connection successful
✅ Database tables accessible
✅ Sample products found (4 items)
✅ Storage buckets accessible
✅ Authentication ready
```

## 🔧 Troubleshooting

### Storage Reset Issues

**Error: "Videos bucket might not exist"**
- This is normal if the bucket was never created
- Create the bucket manually in the Supabase dashboard

**Error: "Permission denied"**
- Check your Supabase credentials in `.env`
- Ensure you have admin access to the project

### Database Reset Issues

**Error: "Table already exists"**
- The script uses `DROP TABLE IF EXISTS` so this shouldn't happen
- If it does, run the script again

**Error: "Policy already exists"**
- The script uses `DROP POLICY IF EXISTS` so this shouldn't happen
- If it does, run the script again

**Error: "Function already exists"**
- The script uses `CREATE OR REPLACE` so this shouldn't happen
- If it does, run the script again

### Verification Issues

**Error: "Connection failed"**
- Check your `.env` file
- Verify Supabase URL and anon key
- Ensure your project is active

**Error: "Tables not found"**
- Run the SQL reset script again
- Check for any error messages in the SQL execution

## 📊 What Gets Reset

### ✅ What's Deleted
- All user profiles
- All videos and metadata
- All products (except sample data)
- All storage files
- All database policies
- All functions and triggers

### ✅ What's Recreated
- Complete database schema
- All RLS policies
- Storage policies
- User registration triggers
- Sample product data (4 items)
- Updated timestamp triggers

### ✅ What's Preserved
- Your Supabase project settings
- Authentication configuration
- Storage bucket structure (if manually created)
- Environment variables

## 🎯 After Reset

Once the reset is complete, you'll have:

1. **Clean Database**: Fresh tables with no user data
2. **Sample Products**: 4 test products for development
3. **Working Authentication**: Ready for new user signups
4. **Storage Ready**: Empty buckets ready for file uploads
5. **Security Policies**: All RLS policies properly configured

## 🚀 Next Steps

After a successful reset:

1. **Test the app**: Run `npm start` and test basic functionality
2. **Create test user**: Run `npm run create-test-user` to test authentication
3. **Upload test video**: Test video upload functionality
4. **Verify object detection**: Test the backend integration

## 📞 Need Help?

If you encounter issues:

1. Check the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) file
2. Review the Supabase documentation
3. Check the console output for specific error messages
4. Verify your environment variables are correct

---

**🎉 Your Supabase project is now reset and ready for development!** 