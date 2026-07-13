document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Signup JS Loaded");

    const signupForm = document.getElementById('gacSignupForm');
    const submitBtn = signupForm?.querySelector('.gac-submit-btn') || signupForm?.querySelector('button[type="submit"]');

    if (!signupForm) {
        console.error("❌ Signup form not found in DOM.");
        return;
    }

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("🔥 Form Submission Started");

        // Get form values
        const fullName = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value;

        // Validation
        if (!validateForm(fullName, email, password)) return;

        const supabase = window.supabaseClient || window._supabase;
        if (!supabase) {
            showError("Supabase Client Not Initialized.");
            return;
        }

        // Disable button and show loading
        setButtonLoading(submitBtn, true);

        try {
            console.log("📝 Step 1: Creating user account in Supabase...");

            const { data, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { full_name: fullName },
                    emailRedirectTo: `${window.location.origin}/Authentication/Login.html`
                }
            });

            if (signUpError) throw signUpError;

            console.log("✅ User created successfully. Waiting for email confirmation...");

            // Show success message with instructions
            showSuccessMessage(email);

            // Reset form
            signupForm.reset();

            // Optional: Auto-redirect to login after 5 seconds
            // (User can click before redirect)
            setTimeout(() => {
                window.location.href = "./Login.html";
            }, 5000);

        } catch (err) {
            console.error("❌ Signup Error:", err);
            handleSignupError(err);
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });

    /**
     * Validate form inputs
     */
    function validateForm(fullName, email, password) {
        if (!fullName || !email || !password) {
            showError("कृपया सभी फील्ड भरें। (Please fill all fields.)");
            return false;
        }

        if (!isValidEmail(email)) {
            showError("कृपया सही Email दर्ज करें। (Please enter a valid email.)");
            return false;
        }

        if (password.length < 8) {
            showError("पासवर्ड कम से कम 8 वर्ण का होना चाहिए। (Password must be at least 8 characters.)");
            return false;
        }

        return true;
    }

    /**
     * Email validation
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Show error message
     */
    function showError(message) {
        alert("❌ " + message);
        console.error(message);
    }

    /**
     * Show success message with email verification instructions
     */
    function showSuccessMessage(email) {
        const message = `✅ अकाउंट बनाया गया! (Account Created!)\n\n📧 Email Verification:\n\nआपके Email (${email}) पर एक verification लिंक भेज दिया गया है।\n\n📝 कृपया:\n1. अपना Email खोलें\n2. Verification लिंक पर क्लिक करें\n3. फिर Login करें\n\n(Check your Email for a verification link. Click it and then login.)\n\nNote: Inbox के अलावा Spam फोल्डर में भी देखें।`;
        
        alert(message);
    }

    /**
     * Handle different signup errors
     */
    function handleSignupError(err) {
        let errorMessage = err.message || "Signup failed. Please try again.";

        if (err.message?.includes("User already registered")) {
            errorMessage = "यह Email पहले से रजिस्टर है। (This email is already registered.) कृपया Login करें।";
        } else if (err.message?.includes("Invalid email")) {
            errorMessage = "अमान्य Email पता। (Invalid email address.)";
        } else if (err.message?.includes("weak password")) {
            errorMessage = "पासवर्ड कमजोर है। मजबूत पासवर्ड दें। (Weak password. Please use a stronger password.)";
        }

        showError(errorMessage);
    }

    /**
     * Set button loading state
     */
    function setButtonLoading(btn, isLoading) {
        if (!btn) return;

        if (isLoading) {
            btn.disabled = true;
            btn.innerText = "⏳ Processing...";
            btn.style.opacity = "0.6";
        } else {
            btn.disabled = false;
            btn.innerText = "Sign Up";
            btn.style.opacity = "1";
        }
    }
});