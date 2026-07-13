document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('gacLoginForm'); // अपने लॉगिन फॉर्म की ID चेक कर लें

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // इनपुट्स से ईमेल और पासवर्ड लेना (अपनी ID के हिसाब से मैच कर लें)
        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value;
        const submitBtn = loginForm.querySelector('.gac-submit-btn');

        if (!email || !password) {
            alert('Please fill in all fields.');
            return;
        }

        // आपके config फ़ाइल से बनाए गए क्लाइंट को ढूँढना
        const supabase = window.supabaseClient || window._supabase;

        if (!supabase) {
            console.error("Supabase client not found.");
            alert("Configuration error: Could not connect to authentication server.");
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Logging in...';

            // सीधे Supabase SDK से लॉगिन की रिक्वेस्ट (कोई मैन्युअल fetch नहीं)
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            // अगर पासवर्ड गलत है या यूजर नहीं मिला, तो Supabase एरर देगा
            if (error) throw error;

            // लॉगिन सफल होने पर एक्शन
            if (data && data.session) {
                alert('Login successful! Welcome back.');
                
                // सेशन की जानकारी लोकलस्टोरेज में सेफ करना (ताकि डैशबोर्ड पर यूजर का नाम दिखा सकें)
                localStorage.setItem('gac_logged_in', 'true');
                localStorage.setItem('gac_current_user', JSON.stringify(data.user.user_metadata));

                loginForm.reset();
                window.location.href = '../index.html'; // अपने डैशबोर्ड या होमपेज का पाथ दें
            }

        } catch (error) {
            console.error('Login Error Details:', error);
            
            // एरर मैसेज को यूजर के समझने लायक बनाना
            let friendlyMessage = error.message;
            if (error.message === 'Invalid login credentials') {
                friendlyMessage = 'Wrong email or password. Please check your credentials or Sign Up first.';
            }
            
            alert('Login Failed: ' + friendlyMessage);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Log In';
        }
    });
});