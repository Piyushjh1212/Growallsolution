// Js_files/Payment_Core.js - Core Checkout & Razorpay Router Module

document.addEventListener('DOMContentLoaded', () => {
    const buyNowBtn = document.getElementById('buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', async () => {
            const user = await window.checkExistingUser();
            if (user.loggedIn && user.email) {
                initiateRazorpay(user.name, user.email, user.phone, user.id);
            } else {
                openStepVerificationModal();
            }
        });
    }
});

function openStepVerificationModal() {
    let modal = document.getElementById('js-step-checkout-modal');
    if (modal) {
        modal.style.display = 'flex';
        window.resetFormState();
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
                <div class="js-input-group" id="group-email"><label>Email Address</label><input type="email" id="js-input-email" placeholder="yourname@gmail.com" required></div>
                <div class="js-input-group step-hidden" id="group-otp"><label style="color: #b45309;">🔑 Enter 6-Digit OTP</label><input type="text" id="js-input-otp" placeholder="Enter OTP Code" maxlength="6"></div>
                <div class="js-input-group step-hidden" id="group-phone"><label>WhatsApp / Phone Number</label><input type="tel" id="js-input-phone" placeholder="10-digit mobile number" pattern="[0-9]{10}"></div>
                <button type="button" id="js-action-btn" class="js-submit-btn">Send Verification OTP</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    const closeModal = () => {
        document.body.style.overflow = 'auto';
        document.body.style.position = 'relative';
    };
    
    modal.querySelector('.js-close-btn').addEventListener('click', () => {
        modal.style.display = 'none';
        closeModal();
    });

    const actionBtn = document.getElementById('js-action-btn');
    const emailInput = document.getElementById('js-input-email');
    const otpInput = document.getElementById('js-input-otp');
    const phoneInput = document.getElementById('js-input-phone');
    const groupOtp = document.getElementById('group-otp');
    const groupPhone = document.getElementById('group-phone');
    const modalDesc = document.getElementById('js-modal-desc');

    let currentStep = 1;

    actionBtn.addEventListener('click', async () => {
        if (currentStep === 1) {
            const email = emailInput.value.trim();
            if (!email || !email.includes('@')) {
                window.showNotification("Please enter a valid Email address.", "warning");
                return;
            }
            actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending OTP...';
            actionBtn.disabled = true;

            window.generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
            
            try {
                const isSent = await window.sendOTPViaEmail(email, window.generatedOTP);
                if (isSent) {
                    window.verifiedEmail = email;
                    window.showNotification(`✅ Verification code sent to ${email}.`, "success");
                    emailInput.disabled = true;
                    groupOtp.className = "js-input-group step-visible";
                    actionBtn.innerText = "Verify Email ID";
                    actionBtn.disabled = false;
                    currentStep = 2;
                }
            } catch (err) {
                window.showNotification(err.message, "error");
                actionBtn.innerText = "Send Verification OTP";
                actionBtn.disabled = false;
            }
            return;
        }

        if (currentStep === 2) {
            if (otpInput.value.trim() !== window.generatedOTP) {
                window.showNotification("Invalid OTP.", "warning");
                return;
            }
            groupOtp.className = "js-input-group step-hidden";
            modalDesc.innerText = "Email Verified! Enter mobile number.";
            groupPhone.className = "js-input-group step-visible";
            actionBtn.innerText = "Proceed to Payment";
            actionBtn.style.background = "#22c55e";
            currentStep = 3;
            return;
        }

        if (currentStep === 3) {
            const phone = phoneInput.value.trim();
            if (!phone || phone.length !== 10) {
                window.showNotification("Please enter a valid 10-digit number.", "warning");
                return;
            }
            modal.style.display = 'none';
            closeModal();
            
            let extractedName = window.verifiedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\d+/g, '').trim();
            extractedName = extractedName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || "Student";

            initiateRazorpay(extractedName, window.verifiedEmail, phone, null);
        }
    });
}

async function sendWelcomeEmailDirectly(studentName, studentEmail, courseTitle, amountInRupees, paymentId) {
    try {
        console.log("🚀 sendWelcomeEmailDirectly Started");
        console.log("📧 Sending to:", studentEmail);

        const emailHtml = window.getEmailTemplate(
            studentName,
            courseTitle,
            amountInRupees,
            paymentId
        );

        console.log("🌐 Calling Supabase Edge Function...");

        const response = await fetch(
            "https://rlbvbbnvswuzggbpcnpn.supabase.co/functions/v1/smooth-service",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": window.gacSupabaseConfig.anonKey,
                    "Authorization": `Bearer ${window.gacSupabaseConfig.anonKey}`
                },
                body: JSON.stringify({
                    studentName,
                    studentEmail,
                    courseTitle,
                    amountInRupees,
                    paymentId,
                    emailHtml
                })
            }
        );

        const result = await response.json();

        console.log("✅ Edge Function Response:", result);

    } catch (error) {
        console.error("❌ Email Error:", error);
    }
}

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
            name: RAZORPAY_CONFIG.company_name || "Grow All Coaching",
            description: courseTitle,
            image: RAZORPAY_CONFIG.company_logo || "",
            handler: async function (response) {
                console.log("✅ Razorpay Success Handler Called");
                const paymentId = response.razorpay_payment_id;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving Course Access...';
                
                //  1. बिना किसी इफ-एल्स कंडीशन के तुरंत बैकग्राउंड में ईमेल ट्रिगर करें
                console.log("⚡ Initiating Welcome Email to:", studentEmail);
                console.log("✅ Payment_Core.js Loaded");
                sendWelcomeEmailDirectly(studentName, studentEmail, courseTitle, amountInRupees, paymentId);
                
                try {
                    //  2. डेटाबेस (Supabase) में परचेज रिकॉर्ड को इंसर्ट करें
                    await window.savePurchaseRecord({
                        paymentId, courseId, amountInRupees, userId, studentName, studentEmail, studentPhone
                    });
                    
                    // यूआई को सक्सेस पर सेट करें
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Enrolled! Opening Course...';
                    btn.style.backgroundColor = "#22c55e";
                    window.showNotification(` Payment Successful! ID: ${paymentId}`, "success", 3000);
                    
                    //  3. यूजर को सीधे लेक्चर्स पेज पर भेजें
                    setTimeout(() => {
                        window.location.href = `../Lectures/lectures.html?sub_category_id=${courseId}`;
                    }, 2000);

                } catch (saveError) {
                    console.error("❌ Database Operation Error:", saveError);
                    // अगर डेटाबेस में कोई दिक्कत आ भी जाए, तो भी यूजर का पैसा कट चुका है, उसे अटकाएंगे नहीं
                    window.location.href = `../Lectures/lectures.html?sub_category_id=${courseId}`;
                }
            },
            modal: {
                ondismiss: function() {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    window.showNotification("Payment cancelled", "warning");
                }
            },
            prefill: { name: studentName, email: studentEmail, contact: studentPhone },
            theme: { color: RAZORPAY_CONFIG.theme_color || "#3b82f6" }
        };

        if (!window.isOnline()) throw new Error('No internet connection.');
        const rzp = new Razorpay(options);
        rzp.open();

    } catch (error) {
        btn.innerHTML = originalText;
        btn.disabled = false;
        window.showNotification(error.message || "Payment gateway error.", "error");
    }
}