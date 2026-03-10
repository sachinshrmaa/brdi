# Troubleshooting Production OAuth Issues

## Problem: Google Sign-In redirects to localhost:3000 in production

This happens when Supabase doesn't know which URL to redirect back to after Google authentication.

### Root Cause
Supabase's OAuth flow:
```
Your App → Google OAuth → Supabase Callback → Your App
```

The final redirect depends on:
1. The `redirectTo` parameter you pass in code ✅ (already set)
2. Supabase's **whitelist** of allowed redirect URLs ⚠️ (needs configuration)

### Solution Steps

#### Step 1: Find Your Supabase Project Reference
Your Supabase URL looks like: `https://xxxxxxxxxxxxx.supabase.co`

The `xxxxxxxxxxxxx` part is your **Project Reference ID**. Copy it.

#### Step 2: Configure Supabase Redirect URLs
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** (left sidebar)
4. Click **URL Configuration** (or **Settings** tab)
5. Find **Redirect URLs** section
6. Add these URLs (one per line or separated by commas):
   ```
   http://localhost:5173/**
   https://your-actual-vercel-app.vercel.app/**
   ```
   Replace `your-actual-vercel-app` with your real Vercel domain.

The `**` wildcard is important—it allows `/book`, `/admin`, etc.

#### Step 3: Verify Google Console Settings
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services → Credentials**
3. Click your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, make sure you have:
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
   (Using the Project Reference ID from Step 1)

5. Under **Authorized JavaScript origins**, add:
   ```
   https://your-actual-vercel-app.vercel.app
   ```

#### Step 4: Set Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Click **Settings → Environment Variables**
3. Add or update these:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   VITE_OAUTH_REDIRECT_URL=https://your-actual-vercel-app.vercel.app/book
   ```

#### Step 5: Redeploy
After saving environment variables in Vercel:
- Trigger a new deployment (push to git or click "Redeploy" in Vercel)
- Wait for deployment to complete
- Clear your browser cache or use incognito mode
- Test Google sign-in again

### Still Not Working?

#### Check Browser Console
Open Developer Tools → Console and check for errors when clicking "Sign in with Google"

#### Check Network Tab
1. Open Developer Tools → Network
2. Click "Sign in with Google"
3. Look for the redirect URLs in the request chain
4. The final redirect should go to `https://your-app.vercel.app/book`, not localhost

#### Verify Environment Variables Were Applied
In your deployed app, open console and run:
```javascript
console.log(import.meta.env.VITE_OAUTH_REDIRECT_URL);
```

If it shows `undefined` or wrong URL, your environment variables didn't deploy correctly. Redeploy after verifying they're set in Vercel dashboard.

### Common Mistakes

❌ **Adding your app URL to Google Console redirect URIs**
- Google should only redirect to Supabase, not your app directly

❌ **Forgetting the `/**` wildcard in Supabase Redirect URLs**
- Without it, only exact matches work

❌ **Not redeploying after changing Vercel env vars**
- Environment variables only apply to new deployments

❌ **Using the wrong Supabase Project Reference**
- Double-check your Supabase project URL

### How to Find Settings in New Supabase UI

If you can't find "URL Configuration":
- Try **Authentication → Settings** (tab at top)
- Or **Project Settings → API** (might show redirect settings)
- Or search the dashboard with Ctrl+K and type "redirect"

Some Supabase versions call it:
- "Redirect URLs"
- "Additional Redirect URLs"  
- "Allowed Redirect URLs"

The field usually accepts multiple URLs separated by commas or line breaks.
