// signup.js

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('gacSignupForm');

    if (!signupForm) return;

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Page reload rokne ke liye

        // Form inputs se values nikalna
        const fullName = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value;
        const submitBtn = signupForm.querySelector('.gac-submit-btn');

        // Aapki supabase-config.js se banaya hua global client use kar rahe hain
        const client = window.supabaseClient;

        if (!client) {
            alert("Error: Supabase client nahi mila! Pehle 'supabase-config.js' file ka path check karein.");
            return;
        }

        try {
            // Button ko disable karna taaki user multiple times click na kare
            submitBtn.disabled = true;
            submitBtn.innerText = "Creating Account...";

            // Supabase Signup API Request
            const { data, error } = await client.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName // Metadata me name save ho raha hai
                    }
                }
            });

            if (error) {
                throw error;
            }

            if (data && data.user) {
                alert("Registration Successful! Redirecting to login page...");
                signupForm.reset();
                window.location.href = "login.html"; // Aapke login page ka link
            }

        } catch (error) {
            console.error("Signup Failed:", error.message);
            alert("Signup Error: " + error.message);
        } finally {
            // Button wapas active karna
            submitBtn.disabled = false;
            submitBtn.innerText = "Sign Up";
        }
    });
});