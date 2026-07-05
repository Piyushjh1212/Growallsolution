// login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('gacLoginForm');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Page reload hone se rokne ke liye

        // Form fields se values lena
        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value;
        const submitBtn = loginForm.querySelector('.gac-submit-btn');

        // Global window object se Supabase client uthana
        const client = window.supabaseClient;

        if (!client) {
            alert("Error: Supabase client nahi mila! `supabase-config.js` ko check karein.");
            return;
        }

        try {
            // Button disable karna taaki multiple clicks na hon
            submitBtn.disabled = true;
            submitBtn.innerText = "Logging in...";

            // Supabase Authentication method call karna
            const { data, error } = await client.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            // Agar login successful ho gaya
            if (data && data.user) {
                // [CRITICAL SYNC]: Refresh delay khatam karne ke liye flag set karo
                localStorage.setItem('gac_logged_in', 'true');

                alert("Login Successful! Welcome back.");
                loginForm.reset();
                
                // Dashboard ya Home page par user ko bhejna
                window.location.href = "../index.html"; 
            }

        } catch (error) {
            console.error("Login Failed:", error.message);
            
            // User ko simple aur clear message dena
            if (error.message.toLowerCase().includes("invalid login credentials")) {
                alert("Galat Email ya Password! Kripya sahi details daalein.");
            } else {
                alert("Login Error: " + error.message);
            }
        } finally {
            // Button ko wapas normal karna
            submitBtn.disabled = false;
            submitBtn.innerText = "Log In";
        }
    });
});