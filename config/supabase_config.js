// supabase-config.js

// 1. Supabase Credentials
const SUPABASE_URL = 'https://rlbvbbnvswuzggbpcnpn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYnZiYm52c3d1emdnYnBjbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTI3MDUsImV4cCI6MjA5Nzc4ODcwNX0._zeUZjHPN3-D390QmTJxTCgVaoRCcVt4XJH25KfwrNI';

// 2. Client Initialize karke global window object par daalna
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Supabase Client Successfully Initialized! 🚀");