document.addEventListener('DOMContentLoaded', () => {

    console.log("✅ Signup JS Loaded");

    const signupForm = document.getElementById('gacSignupForm');

    if (!signupForm) {
        console.error("❌ Signup form not found in DOM.");
        return;
    }

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("🔥 FORM SUBMITTED");

        const fullName = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value;
        const submitBtn = signupForm.querySelector('.gac-submit-btn') || signupForm.querySelector('button[type="submit"]');

        if (!fullName || !email || !password) {
            alert("Please fill all fields.");
            return;
        }

        if (password.length < 8) {
            alert("Password must be at least 8 characters.");
            return;
        }

        const supabase = window.supabaseClient || window._supabase;

        if (!supabase) {
            alert("Supabase Client Not Initialized.");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Processing...";
        }

        try {
            console.log("1️⃣ Step: Creating User in Supabase (Confirm Email is OFF)...");

            // 1. Supabase में यूजर तुरंत बिना एरर के बन जाएगा
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });

            if (signUpError) throw signUpError;

            console.log("2️⃣ Step: Triggering Direct Resend Email via Frontend...");

            // 2. आपकी Resend API Key
            const resendApiKey = "re_hmJ5mJE6_Nztta2SmF28Xr9YCnDczhfKm"; 

            // लोकलहोस्ट से सीधा Resend सर्वर को हिट मार रहे हैं (CORS बाईपास के साथ)
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                mode: 'no-cors', 
                body: JSON.stringify({
                    from: 'Grow All Coaching <no-reply@growallcoaching.online>',
                    to: [email],
                    subject: 'Verify Your Account - Grow All Coaching',
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; max-width: 600px; border-radius: 8px;">
                            <h2 style="color: #007bff;">Hello ${fullName},</h2>
                            <p>Grow All Coaching में आपका स्वागत है!</p>
                            <p>आपका अकाउंट सफलतापूर्वक बन गया है। कृपया नीचे दिए गए लिंक पर क्लिक करके अपना लॉगिन कन्फर्म करें:</p>
                            <br>
                            <a href="${window.location.origin}/Authentication/Login.html" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Confirm Login</a>
                            <br><br>
                            <hr style="border: none; border-top: 1px solid #eee;" />
                            <p style="font-size: 12px; color: #666;">Regards,<br>Team Grow All Coaching</p>
                        </div>
                    `
                })
            });

            // सक्सेस मैसेज
            alert("Account Created! 📩\n\nवेरिफिकेशन लिंक सीधे आपके ईमेल पर भेज दिया गया है। अपना Inbox या Spam फोल्डर चेक करें!");
            
            signupForm.reset();
            window.location.href = "./Login.html";

        } catch (err) {
            console.error("💥 System Error:", err);
            alert(err.message || "Signup Failed");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "Sign Up";
            }
        }
    });
});