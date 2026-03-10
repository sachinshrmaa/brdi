# Construction Waste Booking App

React + Supabase web app for scheduling waste drop-off appointments at a mineral waste extraction facility.

## Features

### User Flow
- **Google Sign-In**: Users must authenticate with Google before booking
- **Detailed Booking Form**: Collects address, phone, vehicle details, driver info, waste type, and appointment scheduling
- **Vehicle Size Selection**: Estimates load based on vehicle capacity (1-30 tons)
- **Automated Pricing**: Calculates fees based on estimated tonnage
- **Payment Confirmation**: Simple in-app payment simulation
- **QR Code Generation**: Unique QR code issued upon successful booking for facility entry

### Admin Portal
- **Secure Login**: Admin authentication via Supabase Auth
- **Bookings Management**: View all bookings with comprehensive details
- **Search & Filter**: Search by name, email, vehicle, phone, or ID
- **Filter Options**: By status (checked-in/pending) and waste type
- **Sort Options**: By date, appointment time, or amount
- **QR Verification**: Scan/verify QR tokens at entry gate
- **Check-In System**: Mark bookings as checked-in upon entry
- **Statistics Dashboard**: 
  - Total bookings, revenue, and waste tonnage
  - Average weight per booking
  - Waste type breakdown with counts and revenue
  - Vehicle size distribution analysis
- **Conditional Navigation**: Admin users see Bookings/Statistics tabs instead of Book/Admin

### Accepted Waste Types
- Concrete Dominant Material
- Brick-Concrete Mixed Material  
- Brick Dominant Material
- Other Inert Mineral Material
- Reinforced and Non-Reinforced Concrete
- Brick Masonry Debris
- Cement Mortar Debris
- Concrete Blocks
- Stone Rubble
- Precast Concrete Elements
- Ceramic and Cement-Based Tiles
- Sand-Cement Plaster Debris
- Inert Excavation Debris

### Prohibited Waste
- Municipal solid waste
- Organic waste
- Hazardous waste
- Medical waste

## Tech Stack

- React 19 (Vite)
- Supabase (`@supabase/supabase-js`)
- React Router
- `qrcode.react` for QR rendering
- Google OAuth for authentication

## 1) Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. **Enable Google OAuth**:
   - Go to Authentication → Providers → Google
   - Enable the Google provider
   - Add your Google OAuth credentials (Client ID & Secret)
   - Add your site URL as an authorized redirect URI

3. **Run Database Schema**:
   - Open SQL Editor in Supabase
   - Run the contents of `supabase/schema.sql`

4. **Create Admin User**:
   - In Supabase Auth, create an admin user (email/password or via Google)
   - Get that user's UUID from `auth.users` table
   - Insert into admins table:
   ```sql
   insert into public.admins (user_id) values ('YOUR_AUTH_USER_UUID');
   ```

## 2) Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
   ```

## 3) Run Locally

```bash
npm install
npm run dev
```

## 4) Application Routes

- `/` - User booking page (requires Google sign-in)
- `/admin` - Admin login and bookings management
- `/admin/statistics` - Admin statistics dashboard (only visible when logged in as admin)

## Database Schema

### `bookings` table
- `id` - Primary key
- `user_id` - References auth.users
- `applicant_name` - From Google profile
- `email` - From Google account
- `phone` - User input
- `address` - User input
- `vehicle_number` - Registration number
- `driver_name` - Driver details
- `driver_license` - Optional license number
- `waste_type` - Selected from approved list
- `vehicle_size` - Selected capacity
- `estimated_weight_tons` - Auto-calculated from vehicle size
- `appointment_at` - Scheduled timestamp
- `amount` - Calculated fee
- `payment_status` - Default 'paid'
- `qr_token` - Unique UUID for entry
- `checked_in_at` - Timestamp when checked in
- `actual_weight_tons` - Can be updated post-entry
- `created_at` - Record creation timestamp

### `admins` table
- `user_id` - References auth.users (primary key)
- `created_at` - Record creation timestamp

## Security & Policies

- Users can only create bookings with their own user_id
- Users can only view their own bookings
- Admins can view and update all bookings
- Admin role verified via `admins` table lookup

## Notes

- **Payment**: Currently a mock "Pay And Confirm" step for MVP. Integrate Stripe/PayPal for production with webhook-based confirmation.
- **Google OAuth**: Ensure your Supabase project has Google OAuth properly configured with valid credentials and redirect URIs.
- **Pricing**: Calculated as: `Base Fee ($20) + (Tons × $35/ton)`, minimum $50.
- **Admin Detection**: The app automatically detects admin users and adjusts navigation accordingly.

## Production (Vercel) Checklist

- Add `vercel.json` rewrite so React Router routes like `/book`, `/admin`, and `/my-bookings` resolve to `index.html` on refresh.
- In Supabase Auth settings:
   - Set `Site URL` to your production app URL (for example `https://your-app.vercel.app`).
   - Add local and production URLs to `Redirect URLs` (for example `http://localhost:5173/book` and `https://your-app.vercel.app/book`).
- In Google Cloud OAuth client:
   - Authorized redirect URI must include your Supabase callback: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
   - You do not add your app URL as the Google callback URI directly for Supabase OAuth.
- In Vercel environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OAUTH_REDIRECT_URL=https://your-app.vercel.app/book`
