document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Signup JS Loaded");

    // Create notification container
    createNotificationContainer();

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
            showNotification("Supabase Client Not Initialized.", "error");
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
                    emailRedirectTo: `${window.location.origin}/index.html`
                }
            });

            if (signUpError) throw signUpError;

            console.log("✅ User created successfully.");
            console.log("🔑 Attempting auto-login after signup...");

            // Try to auto-login right after signup
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            // If auto-login succeeds, save session and redirect to home
            if (loginData && loginData.session) {
                console.log("✅ Auto-login successful!");

                // Save session info
                localStorage.setItem('gac_logged_in', 'true');
                localStorage.setItem('gac_current_user', JSON.stringify(loginData.user.user_metadata));
                localStorage.setItem('gac_user_email', loginData.user.email);

                // Reset form
                signupForm.reset();

                // Show success message
                showSuccessMessage(email);

                // Redirect to home directly
                setTimeout(() => {
                    window.location.href = "../index.html";
                }, 2000);
            } else {
                // If auto-login failed, show email verification message and redirect to login
                console.warn("⚠️ Auto-login not available yet. Email verification pending.");
                showNotificationEmailVerification(email);

                // Reset form
                signupForm.reset();

                // Redirect to login
                setTimeout(() => {
                    window.location.href = "./Login.html";
                }, 4000);
            }

        } catch (err) {
            console.error("❌ Signup Error:", err);
            handleSignupError(err);
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });

    /**
     * Create notification container
     */
    function createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 500px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        document.body.appendChild(container);
    }

    /**
     * Show notification (replaces alert)
     */
    function showNotification(message, type = 'info', duration = 4000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        const bgColor = {
            'success': '#10b981',
            'error': '#ef4444',
            'info': '#3b82f6',
            'warning': '#f59e0b'
        }[type] || '#3b82f6';

        notification.style.cssText = `
            background: ${bgColor};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
            word-break: break-word;
            font-size: 14px;
            line-height: 1.5;
        `;

        notification.textContent = message;
        container.appendChild(notification);

        // Add animation
        const style = document.createElement('style');
        if (!document.getElementById('notification-animation')) {
            style.id = 'notification-animation';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    /**
     * Validate form inputs
     */
    function validateForm(fullName, email, password) {
        if (!fullName || !email || !password) {
            showNotification("Please fill all fields.", "warning");
            return false;
        }

        if (!isValidEmail(email)) {
            showNotification("Please enter a valid email address.", "warning");
            return false;
        }

        if (password.length < 8) {
            showNotification("Password must be at least 8 characters long.", "warning");
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
     * Show success message with email verification instructions
     */
    function showSuccessMessage(email) {
        const message = `✅ Account Created Successfully! You're now logged in. A verification link has been sent to ${email} for security purposes.`;
        
        showNotification(message, "success", 5000);
    }

    /**
     * Show email verification pending message
     */
    function showNotificationEmailVerification(email) {
        const message = `✅ Account Created! A verification link has been sent to ${email}. Please check your email and click the verification link to complete signup. Redirecting to login...`;
        
        showNotification(message, "info", 6000);
    }

    /**
     * Handle different signup errors
     */
    function handleSignupError(err) {
        let errorMessage = err.message || "Signup failed. Please try again.";

        if (err.message?.includes("User already registered")) {
            errorMessage = "This email is already registered. Please login instead.";
        } else if (err.message?.includes("Invalid email")) {
            errorMessage = "Invalid email address.";
        } else if (err.message?.includes("weak password")) {
            errorMessage = "Password is too weak. Please use a stronger password.";
        }

        showNotification(errorMessage, "error");
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