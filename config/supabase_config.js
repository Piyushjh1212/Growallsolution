// supabase-config.js

(function () {
    const SUPABASE_URL = 'https://rlbvbbnvswuzggbpcnpn.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYnZiYm52c3d1emdnYnBjbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTI3MDUsImV4cCI6MjA5Nzc4ODcwNX0._zeUZjHPN3-D390QmTJxTCgVaoRCcVt4XJH25KfwrNI';

    window.gacSupabaseConfig = {
        url: SUPABASE_URL,
        anonKey: SUPABASE_ANON_KEY
    };

    const sdk = window.supabase || globalThis.supabase;

    if (!sdk || typeof sdk.createClient !== 'function') {
        console.warn('Supabase SDK failed to load. Direct API auth will still be used if the network is available.');
        window.supabaseClient = null;
        window._supabase = null;
        return;
    }

    const _client = sdk.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    window.supabaseClient = _client;
    window._supabase = _client;

    console.log('Supabase Client Successfully Initialized! 🚀');
})();

(async () => {
    console.log("Testing connection...");

    try {
        const { data, error } = await window.supabaseClient.auth.getSession();

        console.log("Session:", data);
        console.log("Error:", error);
    } catch (e) {
        console.error(e);
    }
})();