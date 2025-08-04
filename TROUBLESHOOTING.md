# Troubleshooting Guide

This guide helps you resolve common issues when setting up and running the Lokal React Native app.

## Table of Contents

- [Environment Setup Issues](#environment-setup-issues)
- [Supabase Configuration](#supabase-configuration)
- [Database Issues](#database-issues)
- [Storage Issues](#storage-issues)
- [Authentication Issues](#authentication-issues)
- [Development Issues](#development-issues)
- [Performance Issues](#performance-issues)

## Environment Setup Issues

### Node.js Version Issues

**Problem**: App fails to start or build
```
Error: Node.js version not supported
```

**Solution**:
1. Check your Node.js version: `node --version`
2. Ensure you have Node.js 18 or higher
3. Update Node.js if needed:
   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18
   
   # Or download from nodejs.org
   ```

### Expo CLI Issues

**Problem**: Expo commands not found
```
Command not found: expo
```

**Solution**:
```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Or use npx
npx expo start
```

### Dependencies Issues

**Problem**: Package installation fails
```
npm ERR! peer dependency conflict
```

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# If using yarn
rm -rf node_modules yarn.lock
yarn install
```

## Supabase Configuration

### Environment Variables Not Set

**Problem**: App shows "Configuration Required" screen
```
Supabase not configured
```

**Solution**:
1. Create `.env` file in project root
2. Add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
3. Restart the development server
4. Run verification: `npm run verify-supabase`

### Invalid Supabase Credentials

**Problem**: Connection to Supabase fails
```
Failed to connect to Supabase
```

**Solution**:
1. Verify your project URL and anon key in Supabase dashboard
2. Check that your project is active (not paused)
3. Ensure you're using the correct keys:
   - Use **anon key** (public), not service role key
   - URL should be your project URL, not organization URL
4. Test connection: `npm run verify-supabase`

### Project Not Found

**Problem**: Supabase project doesn't exist
```
Project not found or access denied
```

**Solution**:
1. Check if project was deleted or paused
2. Verify you're using the correct project URL
3. Check your Supabase account permissions
4. Create a new project if needed

## Database Issues

### Tables Missing

**Problem**: Database queries fail
```
Table 'profiles' does not exist
```

**Solution**:
1. Run the database setup script:
   ```bash
   npm run setup-supabase
   ```
2. Execute SQL migrations in Supabase dashboard:
   - Go to SQL Editor
   - Run the content of `scripts/supabase-setup.sql`
3. Verify tables exist: `npm run verify-supabase`

### RLS Policy Issues

**Problem**: Access denied to tables
```
new row violates row-level security policy
```

**Solution**:
1. Check that RLS is enabled on tables
2. Verify RLS policies are correctly configured
3. Ensure user is authenticated when required
4. Check policy conditions match your use case

### Migration Errors

**Problem**: SQL migrations fail
```
ERROR: relation already exists
```

**Solution**:
1. Check if tables already exist
2. Use `IF NOT EXISTS` in your SQL
3. Drop tables and recreate if needed:
   ```sql
   DROP TABLE IF EXISTS profiles CASCADE;
   DROP TABLE IF EXISTS videos CASCADE;
   DROP TABLE IF EXISTS products CASCADE;
   ```

## Storage Issues

### Buckets Not Found

**Problem**: File upload fails
```
Bucket 'videos' not found
```

**Solution**:
1. Create storage buckets in Supabase dashboard:
   - Go to Storage
   - Create bucket: `videos` (public)
   - Create bucket: `thumbnails` (public)
2. Set bucket permissions to public
3. Verify buckets: `npm run verify-supabase`

### Upload Permission Denied

**Problem**: Cannot upload files
```
new row violates row-level security policy
```

**Solution**:
1. Check storage RLS policies
2. Ensure user is authenticated
3. Verify file path structure matches policy
4. Check bucket permissions

### File Size Limits

**Problem**: Large files fail to upload
```
File too large
```

**Solution**:
1. Check Supabase storage limits (50MB default)
2. Compress videos before upload
3. Use chunked upload for large files
4. Consider using external storage for large files

## Authentication Issues

### User Registration Fails

**Problem**: Cannot create new accounts
```
Sign up failed
```

**Solution**:
1. Check email confirmation settings
2. Verify password requirements
3. Check for duplicate emails
4. Test with: `npm run create-test-user`

### Login Issues

**Problem**: Cannot sign in
```
Invalid login credentials
```

**Solution**:
1. Verify email and password
2. Check if email is confirmed
3. Reset password if needed
4. Clear app cache and restart

### Session Expired

**Problem**: User logged out unexpectedly
```
Auth session missing
```

**Solution**:
1. This is normal behavior
2. User needs to sign in again
3. Check token refresh settings
4. Verify session persistence

## Development Issues

### Metro Bundler Issues

**Problem**: App won't start
```
Metro bundler error
```

**Solution**:
```bash
# Clear Metro cache
npx expo start --clear

# Reset cache completely
rm -rf .expo
npx expo start --clear
```

### iOS Simulator Issues

**Problem**: iOS app won't run
```
iOS Simulator not found
```

**Solution**:
1. Install Xcode and iOS Simulator
2. Open Simulator manually first
3. Check Xcode command line tools:
   ```bash
   xcode-select --install
   ```
4. Use `npm run ios` to start

### Android Emulator Issues

**Problem**: Android app won't run
```
Android emulator not found
```

**Solution**:
1. Install Android Studio
2. Create and start an Android Virtual Device (AVD)
3. Ensure ANDROID_HOME is set
4. Use `npm run android` to start

### TypeScript Errors

**Problem**: TypeScript compilation fails
```
Type error: Property does not exist
```

**Solution**:
1. Check type definitions in `src/types/`
2. Update types to match database schema
3. Run type check: `npx tsc --noEmit`
4. Fix type mismatches

## Performance Issues

### Slow App Startup

**Problem**: App takes long to load
```
Loading screen for extended time
```

**Solution**:
1. Check network connection
2. Reduce initial bundle size
3. Use lazy loading for screens
4. Optimize images and assets

### Video Playback Issues

**Problem**: Videos don't play smoothly
```
Video stuttering or buffering
```

**Solution**:
1. Check video format compatibility
2. Compress videos before upload
3. Use appropriate video quality
4. Check network bandwidth

### Memory Issues

**Problem**: App crashes or becomes slow
```
Out of memory error
```

**Solution**:
1. Close unused apps
2. Restart development server
3. Clear app cache
4. Check for memory leaks in components

## Getting Help

### Before Asking for Help

1. **Check the logs**: Look at console output for error messages
2. **Verify setup**: Run `npm run verify-supabase`
3. **Test with demo mode**: Ensure app works without Supabase
4. **Check documentation**: Review README.md and this guide

### Useful Commands

```bash
# Verify Supabase setup
npm run verify-supabase

# Create test user
npm run create-test-user

# Clear all caches
npm run clean

# Check environment
npm run check-env

# Reset to demo mode
npm run reset-demo
```

### Debug Mode

Enable debug logging by setting environment variable:
```env
EXPO_PUBLIC_DEBUG=true
```

### Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `PGRST116` | RLS policy violation | Check authentication and policies |
| `PGRST301` | Table not found | Run database setup |
| `PGRST302` | Column not found | Check database schema |
| `STORAGE_ERROR` | Storage bucket issue | Create buckets and check permissions |
| `AUTH_ERROR` | Authentication failed | Check credentials and user status |

### Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev/docs)
- [Project Issues](https://github.com/your-repo/issues)

### Reporting Issues

When reporting issues, include:
1. Error message and stack trace
2. Steps to reproduce
3. Environment details (OS, Node version, etc.)
4. Supabase project status
5. Screenshots if applicable 