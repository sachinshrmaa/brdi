-- Migration: Add cancelled_at column to bookings table
-- Run this in Supabase SQL Editor if you already have the bookings table

-- Add cancelled_at column if it doesn't exist
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Drop and recreate the users update policy to allow cancellations
DROP POLICY IF EXISTS "users_can_update_own_bookings" ON public.bookings;
CREATE POLICY "users_can_update_own_bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
