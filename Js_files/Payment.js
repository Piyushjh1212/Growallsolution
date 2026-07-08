// Js_files/Payment.js - Step-by-Step Dynamic OTP & Phone Verification Checkout

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Dynamic UI Styles automatically into the Document Head
    injectStyles();

    const buyNowBtn = document.getElementById('buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', async () => {
            // Check if user is already logged in via Supabase Auth
            const user = await checkExistingUser();
            
            if (user.loggedIn && user.email) {
                // If logged in, pass data straight to Razorpay
                initiateRazorpay(user.name, user.email, user.phone, user.id);
            } else {
                // If guest, trigger the multi-step micro modal
                openStepVerificationModal();
            }
        });
    }
});

// Global state tracking variables
let generatedOTP = null;
let verifiedEmail = "";

// Minimalist Responsive CSS Injection via Javascript
function injectStyles() {
    if (document.getElementById('razorpay-js-injected-styles')) return;

    const style = document.createElement('style');
    style.id = 'razorpay-js-injected-styles';
    style.innerHTML = `
        .js-custom-modal {
            display: flex; position: fixed; z-index: 99999; left: 0; top: 0;
            width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px); justify-content: center; align-items: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            animation: modalFadeIn 0.2s ease-out;
        }
        .js-modal-content {
            background: #ffffff; padding: 25px; border-radius: 14px;
            width: 90%; max-width: 380px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
            position: relative; box-sizing: border-box; text-align: left;
        }
        .js-modal-content h3 { margin: 0 0 6px 0; color: #1e293b; font-size: 1.25rem; display: flex; align-items: center; gap: 8px; }
        .js-modal-content p { color: #64748b; font-size: 0.85rem; margin: 0 0 16px 0; line-height: 1.4; }
        .js-close-btn { position: absolute; right: 18px; top: 15px; font-size: 24px; cursor: pointer; color: #94a3b8; line-height: 1; }
        .js-close-btn:hover { color: #1e293b; }
        .js-input-group { margin-bottom: 14px; }
        .js-input-group label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.85rem; color: #475569; }
        .js-input-group input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; transition: all 0.2s; }
        .js-input-group input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        .js-submit-btn { width: 100%; background: #3b82f6; color: white; border: none; padding: 12px; font-size: 0.95rem; font-weight: bold; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
        .js-submit-btn:hover { background: #2563eb; }
        
        /* Dynamic step control classes */
        .step-hidden { display: none !important; }
        .step-visible { display: block !important; animation: slideDown 0.2s ease-in-out; }
        
        @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);
}

// Function to construct and display the multi-step form inside the modal
function openStepVerificationModal() {
    let modal = document.getElementById('js-step-checkout-modal');
    if (modal) {
        modal.style.display = 'flex';
        resetFormState();
        return;
    }

    modal = document.createElement('div');
    modal.id = 'js-step-checkout-modal';
    modal.className = 'js-custom-modal';

    modal.innerHTML = `
        <div class="js-modal-content">
            <span class="js-close-btn">&times;</span>
            <h3><i class="fa-solid fa-user-shield"></i> Secure Checkout</h3>
            <p id="js-modal-desc">Please verify your Email ID to initiate the payment gateway setup.</p>
            
            <form id="js-step-form">
                <!-- STEP 1: Email Input Field -->
                <div class="js-input-group" id="group-email">
                    <label>Email Address</label>
                    <input type="email" id="js-input-email" placeholder="yourname@gmail.com" required>
                </div>

                <!-- STEP 2: Embedded OTP Input Field (Hidden Initially) -->
                <div class="js-input-group step-hidden" id="group-otp">
                    <label style="color: #b45309;">🔑 Enter 6-Digit OTP Sent to Email</label>
                    <input type="text" id="js-input-otp" placeholder="Enter OTP Code" maxlength="6" autocomplete="off">
                </div>

                <!-- STEP 3: Phone Number Input Field (Hidden Initially) -->
                <div class="js-input-group step-hidden" id="group-phone">
                    <label>WhatsApp / Phone Number</label>
                    <input type="tel" id="js-input-phone" placeholder="10-digit mobile number" pattern="[0-9]{10}" title="Enter a valid 10-digit mobile number">
                </div>

                <!-- Action Button -->
                <button type="button" id="js-action-btn" class="js-submit-btn">Send Verification OTP</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('js-input-email').focus();
    
    modal.querySelector('.js-close-btn').addEventListener('click', () => modal.style.display = 'none');

    // Multi-step Action Button Logic Router
    const actionBtn = document.getElementById('js-action-btn');
    const emailInput = document.getElementById('js-input-email');
    const otpInput = document.getElementById('js-input-otp');
    const phoneInput = document.getElementById('js-input-phone');
    
    const groupOtp = document.getElementById('group-otp');
    const groupPhone = document.getElementById('group-phone');
    const modalDesc = document.getElementById('js-modal-desc');

    let currentStep = 1; // 1: Enter Email, 2: Enter OTP, 3: Enter Phone

    actionBtn.addEventListener('click', async () => {
        // --- STEP 1: Process Email and Trigger OTP ---
        if (currentStep === 1) {
            const email = emailInput.value.trim();
            if (!email || !email.includes('@') || email.split('@')[1].length < 3) {
                alert("❌ Please enter a valid Email address.");
                return;
            }

            // Block Fake Disposable Email Domains
            const blocklist = ['10minutemail', 'mailinator', 'yopmail', 'tempmail', 'sharklasers', 'guerrillamail'];
            const domain = email.split('@')[1]?.toLowerCase();
            if (blocklist.some(blocked => domain.includes(blocked))) {
                alert("❌ Temporary emails are blocked. Please use your genuine Google Account.");
                return;
            }

            actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Dispatched OTP...';
            actionBtn.disabled = true;

            // Generate temporary 6-digit verification code token
            generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
            console.log("🔒 [SECURITY TRACKING] Email OTP Code:", generatedOTP); // Safe validation trace

            // Send actual email using your client/server helper
            const isSent = await sendOTPViaEmail(email, generatedOTP);

            if (isSent) {
                verifiedEmail = email;
                alert(`📨 Verification code forwarded to ${email}.\nCheck your inbox/spam folder.`);
                
                // Advance to OTP Input Step directly beneath the email group
                emailInput.disabled = true; // lock email input
                groupOtp.className = "js-input-group step-visible";
                otpInput.focus();
                
                actionBtn.innerText = "Verify Email ID";
                actionBtn.disabled = false;
                currentStep = 2;
            } else {
                alert("⚠️ Transmission failed. Please try a different email address.");
                actionBtn.innerText = "Send Verification OTP";
                actionBtn.disabled = false;
            }
            return;
        }

        // --- STEP 2: Validate Entered OTP & Request Phone ---
        if (currentStep === 2) {
            const enteredOTP = otpInput.value.trim();
            if (enteredOTP !== generatedOTP) {
                alert("❌ Invalid OTP Code! Please match the code sent to your email.");
                return;
            }

            // Code matching cleared! Open phone component field
            groupOtp.className = "js-input-group step-hidden"; // hide OTP field safely
            modalDesc.innerText = "Email Verified! Now enter your mobile number to load the payment gateway.";
            
            groupPhone.className = "js-input-group step-visible";
            phoneInput.required = true;
            phoneInput.focus();
            
            actionBtn.innerText = "Proceed to Payment";
            actionBtn.style.background = "#22c55e"; // Green confirmation style button
            currentStep = 3;
            return;
        }

        // --- STEP 3: Validate Phone and Fire Razorpay Gateway ---
        if (currentStep === 3) {
            const phone = phoneInput.value.trim();
            if (!phone || phone.length !== 10 || isNaN(phone)) {
                alert("❌ Please enter a valid 10-digit mobile number.");
                return;
            }

            // Close dynamic validation terminal UI view window
            modal.style.display = 'none';
            generatedOTP = null; // flush security token

            // Auto-extract readable fallback user-profile tracking name sequence from email prefix
            let extractedName = verifiedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\d+/g, '').trim();
            extractedName = extractedName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || "Student";

            // Open payment widget gateway frame loop immediately
            initiateRazorpay(extractedName, verifiedEmail, phone, null);
        }
    });
}

// Reset form fields state tracking for re-entry loops
function resetFormState() {
    document.getElementById('js-input-email').disabled = false;
    document.getElementById('js-input-email').value = "";
    document.getElementById('js-input-otp').value = "";
    document.getElementById('js-input-phone').value = "";
    document.getElementById('group-otp').className = "js-input-group step-hidden";
    document.getElementById('group-phone').className = "js-input-group step-hidden";
    
    const actionBtn = document.getElementById('js-action-btn');
    actionBtn.innerText = "Send Verification OTP";
    actionBtn.style.background = "#3b82f6";
    
    document.getElementById('js-modal-desc').innerText = "Please verify your Email ID to initiate the payment gateway setup.";
}

// Micro email pipeline connector mock hook interface stub
async function sendOTPViaEmail(targetEmail, otpCode) {
    try {
        // Link your live delivery mechanism (e.g. EmailJS / Supabase Edge Function) here
        return true; 
    } catch (err) {
        console.error("Transmission stack failure:", err);
        return false;
    }
}

// Supabase Auth Context Verification Engine
async function checkExistingUser() {
    let result = { loggedIn: false, name: "Student", email: "", phone: "9999999999", id: null };
    if (window.supabaseClient && window.supabaseClient.auth) {
        try {
            const { data: authData } = await window.supabaseClient.auth.getUser();
            if (authData?.user) {
                result.loggedIn = true;
                result.id = authData.user.id;
                result.email = authData.user.email || "";
                result.name = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || "Student";
                result.phone = authData.user.phone || "9999999999";
            }
        } catch (e) { console.error("Session fetch bypassed:", e); }
    }
    return result;
}

// Razorpay Processor Core
async function initiateRazorpay(studentName, studentEmail, studentPhone, userId) {
    const btn = document.getElementById('buy-now-btn');
    const priceElement = document.getElementById('course-price');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Directing to Gateway...';
    btn.disabled = true;

    try {
        const amountInRupees = parseInt(priceElement.getAttribute('data-price')) || 499;
        const amountInPaise = amountInRupees * 100;
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('sub_category_id') || '1';
        const courseTitleEl = document.getElementById('db-main-title');
        const courseTitle = courseTitleEl ? courseTitleEl.innerText : "Premium Course Bundle";

        const options = {
            key: RAZORPAY_CONFIG.key_id,
            amount: amountInPaise,
            currency: RAZORPAY_CONFIG.currency || "INR",
            name: RAZORPAY_CONFIG.company_name || "Grow All Solution",
            description: courseTitle,
            image: RAZORPAY_CONFIG.company_logo || "",
            handler: async function (response) {
                const paymentId = response.razorpay_payment_id;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving Course Access...';
                
                const isSaved = await savePurchaseRecord({
                    paymentId, courseId, amountInRupees, userId, studentName, studentEmail, studentPhone
                });
                
                if (isSaved) {
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Enrolled!';
                    btn.style.backgroundColor = "#22c55e";
                    alert(`🎉 Enrolled successfully under account: ${studentEmail}.\nTransaction Reference ID: ${paymentId}`);
                } else {
                    btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Sync Error';
                    btn.style.backgroundColor = "#ef4444";
                }
            },
            modal: {
                ondismiss: function() {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            },
            prefill: { name: studentName, email: studentEmail, contact: studentPhone },
            notes: { course_id: courseId, student_name: studentName },
            theme: { color: RAZORPAY_CONFIG.theme_color || "#3b82f6" }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (error) {
        console.error(error);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Database Sync Execution Loop
async function savePurchaseRecord({ paymentId, courseId, amountInRupees, userId, studentName, studentEmail, studentPhone }) {
    if (!window.supabaseClient) return false;
    try {
        const { data, error } = await window.supabaseClient
            .from('purchases')
            .insert([{
                transaction_id: paymentId,
                course_id: courseId,
                amount_paid: amountInRupees,
                status: 'completed',
                user_id: userId,
                buyer_name: studentName,
                buyer_email: studentEmail,
                buyer_phone: studentPhone
            }]);
        if (error) throw error;
        return true;
    } catch (dbError) {
        console.error("Database layer save crash:", dbError);
        return false;
    }
}