# Google OAuth Setup Guide

This guide walks you through setting up Google OAuth for the waste booking app.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in app name: "Waste Booking Portal"
   - Add your email as developer contact
   - Save and continue through the scopes (no changes needed)
6. For application type, select **Web application**
7. Add authorized redirect URIs:
   - `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
   - `http://localhost:5173` (for local development)
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Open your Supabase project dashboard
2. Go to **Authentication** → **Providers**
3. Find **Google** in the list and enable it
4. Paste your Google **Client ID** and **Client Secret**
5. The **Redirect URL** is shown - verify it matches what you added to Google Console
6. Click **Save**

## Step 3: Update Your .env File

Your `.env` file should already have the Supabase credentials. No Google-specific env vars needed - Supabase handles the OAuth flow.

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

## Step 4: Test Authentication

1. Start your dev server: `npm run dev`
2. Visit `http://localhost:5173`
3. Click "Continue with Google"
4. You should be redirected to Google's sign-in page
5. After signing in, you'll be redirected back to the app
6. You should see the booking form with "Signed in as [your email]"

## Troubleshooting

### "Redirect URI mismatch" error

- Make sure the redirect URI in Google Cloud Console exactly matches: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
- Check for typos and ensure there's no trailing slash

### "OAuth client was not found"

- Verify you copied the correct Client ID and Secret into Supabase
- Try creating new credentials in Google Cloud Console

### Sign-in works but can't create booking

- Check browser console for errors
- Verify the `bookings` table policies allow authenticated users to insert with their own user_id
- Run `supabase/schema.sql` again if needed

### User signed in but name shows as "Unknown"

- Google OAuth might not have returned the full name
- In Google Cloud Console → OAuth consent screen, ensure required scopes include profile/email
- The app falls back to email prefix if full name is not available

## Production Deployment

When deploying to production (e.g., Vercel, Netlify):

### 1. Environment Variables on Vercel

1. Go to your Vercel project settings → Environment Variables
2. Add or update `VITE_OAUTH_REDIRECT_URL=https://your-app.vercel.app/book` (must include `/book` path)
3. Redeploy after setting the variable

### 2. **CRITICAL: Configure Supabase Site URL** ⚠️

This is the key to fixing the localhost redirect issue:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Set **Site URL** to your production domain: `https://brdi.vercel.app`
   - This tells Supabase where to redirect users after OAuth completes
4. Add your production URL to **Redirect URLs** list: `https://brdi.vercel.app/book`
5. Click **Save**

### 3. Verify Google OAuth Settings

1. In Google Cloud Console → OAuth credentials
2. Ensure the redirect URI includes: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
3. Authorized JavaScript origins should include your production domain

### How It Works

- User clicks "Continue with Google" → redirected to Google
- Google sends user back to `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
- Supabase uses **Site URL** setting to redirect user to: `https://brdi.vercel.app/book`
- The **VITE_OAUTH_REDIRECT_URL** env var provides fallback path if Supabase config is missing

### Troubleshooting localhost:3000 Redirect

If you see `localhost:3000/#access_token`:

1. ✅ First, check Supabase dashboard → Authentication → URL Configuration
2. Verify **Site URL** is set to your production domain (not localhost)
3. Check Vercel environment variables are deployed correctly
4. Clear browser cache and try again
5. Check browser console for error messages

## Notes

- Users authenticate via Google - no password storage in your app
- User data (email, name) comes from their Google profile
- Supabase handles all OAuth tokens and session management
- Users can sign out, which clears their local session
