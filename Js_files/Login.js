document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Login JS Loaded");

    // Create notification container
    createNotificationContainer();

    const loginForm = document.getElementById('gacLoginForm');

    if (!loginForm) {
        console.error("❌ Login form not found in DOM.");
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("🔥 Login Form Submitted");

        // Get form values
        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value;
        const submitBtn = loginForm.querySelector('.gac-submit-btn') || loginForm.querySelector('button[type="submit"]');
        const rememberCheckbox = document.getElementById('rememberMe');

        // Validation
        if (!validateLogin(email, password)) return;

        // Get Supabase client
        const supabase = window.supabaseClient || window._supabase;
        if (!supabase) {
            showNotification("Configuration error: Could not connect to authentication server.", "error");
            return;
        }

        // Set button loading state
        setButtonLoading(submitBtn, true);

        try {
            console.log("🔍 Authenticating user...");

            // Sign in with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // Check if email is verified
            if (data.user && !data.user.email_confirmed_at) {
                console.warn("⚠️ Email not verified yet");
                showNotification("Your email has not been verified yet. Please check your email for the verification link.", "warning", 6000);
                setButtonLoading(submitBtn, false);
                return;
            }

            // Login successful
            if (data && data.session) {
                console.log("✅ Login successful!");

                // Save session info
                localStorage.setItem('gac_logged_in', 'true');
                localStorage.setItem('gac_current_user', JSON.stringify(data.user.user_metadata));
                localStorage.setItem('gac_user_email', data.user.email);

                // Remember me feature
                if (rememberCheckbox?.checked) {
                    localStorage.setItem('gac_remember_email', email);
                } else {
                    localStorage.removeItem('gac_remember_email');
                }

                showNotification("Login successful! Welcome back.", "success", 2000);

                // Reset form
                loginForm.reset();

                // Redirect to home
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
            }

        } catch (error) {
            console.error("❌ Login Error:", error);
            handleLoginError(error);
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });

    // Pre-fill email if "Remember Me" was checked
    const rememberEmail = localStorage.getItem('gac_remember_email');
    if (rememberEmail) {
        const emailInput = document.getElementById('userEmail');
        if (emailInput) {
            emailInput.value = rememberEmail;
            const rememberCheckbox = document.getElementById('rememberMe');
            if (rememberCheckbox) rememberCheckbox.checked = true;
        }
    }

    /**
     * Create notification container
     */
    function createNotificationContainer() {
        if (document.getElementById('notification-container')) return;

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
     * Show notification toast
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

        // Add animation styles
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

        // Auto remove notification
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    /**
     * Validate login form
     */
    function validateLogin(email, password) {
        if (!email || !password) {
            showNotification("Please fill in all fields.", "warning");
            return false;
        }

        if (!isValidEmail(email)) {
            showNotification("Please enter a valid email address.", "warning");
            return false;
        }

        if (password.length < 8) {
            showNotification("Password must be at least 8 characters.", "warning");
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
     * Handle login errors
     */
    function handleLoginError(error) {
        let errorMessage = error.message || "Login failed. Please try again.";

        if (error.message?.includes("Invalid login credentials")) {
            errorMessage = "Wrong email or password. Please check and try again.";
        } else if (error.message?.includes("Email not confirmed")) {
            errorMessage = "Your email has not been verified yet. Please check your email for the verification link.";
        } else if (error.message?.includes("User not found")) {
            errorMessage = "No account found with this email. Please sign up first.";
        } else if (error.message?.includes("Invalid password")) {
            errorMessage = "Wrong password. Please try again.";
        } else if (error.message?.includes("too many requests")) {
            errorMessage = "Too many login attempts. Please try again later.";
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
            btn.innerText = "⏳ Logging in...";
            btn.style.opacity = "0.6";
        } else {
            btn.disabled = false;
            btn.innerText = "Log In";
            btn.style.opacity = "1";
        }
    }
});