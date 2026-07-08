-- ==========================================
-- FINAL SECURE RLS POLICIES FOR CONTACT FORM
-- ==========================================

-- 1) Enable Row Level Security (RLS) on the table
ALTER TABLE public."Contact" ENABLE ROW LEVEL SECURITY;

-- 2) Purani saari policies ko delete karna (Safe Clean Slate)
DROP POLICY IF EXISTS "Allow anon insert for contact form" ON public."Contact";
DROP POLICY IF EXISTS "Allow authenticated read for contact form" ON public."Contact";
DROP POLICY IF EXISTS "Allow authenticated update for contact form" ON public."Contact";
DROP POLICY IF EXISTS "Allow authenticated delete for contact form" ON public."Contact";
DROP POLICY IF EXISTS "Allow service_role full access" ON public."Contact";

-- 3) Public / Anonymous Users: Form submit karne ki ijaazat (WORKING)
CREATE POLICY "Allow anon insert for contact form"
ON public."Contact"
FOR INSERT
TO anon
WITH CHECK (true);

-- 4) Authenticated Users (Admins): Data dekhne (Read) ki ijaazat
CREATE POLICY "Allow authenticated read for contact form"
ON public."Contact"
FOR SELECT
TO authenticated
USING (true);

-- 5) Authenticated Users (Admins): Data badalne (Update) ki ijaazat
CREATE POLICY "Allow authenticated update for contact form"
ON public."Contact"
FOR UPDATE
TO authenticated
USING (true);

-- 6) Authenticated Users (Admins): Data delete karne ki ijaazat
CREATE POLICY "Allow authenticated delete for contact form"
ON public."Contact"
FOR DELETE
TO authenticated
USING (true);

-- 7) Service Role (Backend/Cron/Edge Functions): Full Master Access
CREATE POLICY "Allow service_role full access"
ON public."Contact"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);