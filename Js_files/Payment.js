// Js_files/Payment.js - Complete All-in-One JS Injector (No external HTML/CSS needed)

document.addEventListener('DOMContentLoaded', () => {
    // 1. Automatically Inject Required CSS Styles into the Page Head
    injectStyles();

    const buyNowBtn = document.getElementById('buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', async () => {
            // Check if user is already logged in via Supabase
            const user = await checkExistingUser();
            
            if (user.loggedIn) {
                initiateRazorpay(user.name, user.email, user.phone, user.id);
            } else {
                // If not logged in, dynamically build and open the UI Modal
                openCheckoutModal();
            }
        });
    }
});

// Function to inject CSS styles directly from JavaScript
function injectStyles() {
    if (document.getElementById('razorpay-js-injected-styles')) return; // Avoid duplicate styling

    const style = document.createElement('style');
    style.id = 'razorpay-js-injected-styles';
    style.innerHTML = `
        .js-custom-modal {
            display: flex; position: fixed; z-index: 99999; left: 0; top: 0;
            width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(5px); justify-content: center; align-items: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .js-modal-content {
            background: #ffffff; padding: 30px; border-radius: 16px;
            width: 90%; max-width: 420px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            position: relative; box-sizing: border-box; text-align: left;
        }
        .js-modal-content h3 { margin: 0 0 10px 0; color: #1e293b; font-size: 1.4rem; }
        .js-modal-content p { color: #64748b; font-size: 0.85rem; margin: 0 20px 20px 0; line-height: 1.4; }
        .js-close-btn { position: absolute; right: 20px; top: 15px; font-size: 28px; cursor: pointer; color: #94a3b8; }
        .js-close-btn:hover { color: #1e293b; }
        .js-input-group { margin-bottom: 16px; }
        .js-input-group label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.85rem; color: #475569; }
        .js-input-group input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; }
        .js-input-group input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        .js-submit-btn { width: 100%; background: #3b82f6; color: white; border: none; padding: 14px; font-size: 1rem; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 10px; }
        .js-submit-btn:hover { background: #2563eb; }
    `;
    document.head.appendChild(style);
}

// Function to build and show the modern Modal via JS
function openCheckoutModal() {
    // If modal already exists, just show it
    let modal = document.getElementById('js-dynamic-checkout-modal');
    if (modal) {
        modal.style.display = 'flex';
        return;
    }

    // Create modal elements purely through JS
    modal = document.createElement('div');
    modal.id = 'js-dynamic-checkout-modal';
    modal.className = 'js-custom-modal';

    modal.innerHTML = `
        <div class="js-modal-content">
            <span class="js-close-btn">&times;</span>
            <h3>Checkout Details</h3>
            <p>Please enter your real information. Course access will be linked to this Email & Phone Number.</p>
            <form id="js-dynamic-form">
                <div class="js-input-group">
                    <label>Full Name</label>
                    <input type="text" id="js-js-name" placeholder="Enter Full Name" required>
                </div>
                <div class="js-input-group">
                    <label>Email Address</label>
                    <input type="email" id="js-js-email" placeholder="example@gmail.com" required>
                </div>
                <div class="js-input-group">
                    <label>WhatsApp / Phone Number</label>
                    <input type="tel" id="js-js-phone" placeholder="10-digit number" pattern="[0-9]{10}" title="Enter a valid 10-digit phone number" required>
                </div>
                <button type="submit" class="js-submit-btn">Proceed to Payment</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Close button event
    modal.querySelector('.js-close-btn').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Form Submit Event
    document.getElementById('js-dynamic-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('js-js-name').value;
        const email = document.getElementById('js-js-email').value;
        const phone = document.getElementById('js-js-phone').value;

        modal.style.display = 'none'; // Hide modal

        // Send data directly to Razorpay
        initiateRazorpay(name, email, phone, null);
    });
}

// Supabase Auth Integration
async function checkExistingUser() {
    let result = { loggedIn: false, name: "", email: "", phone: "", id: null };
    if (window.supabaseClient && window.supabaseClient.auth) {
        try {
            const { data: authData } = await window.supabaseClient.auth.getUser();
            if (authData?.user) {
                result.loggedIn = true;
                result.id = authData.user.id;
                result.email = authData.user.email || "";
                result.name = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || "";
                result.phone = authData.user.phone || "";
                
                // If core data is completely missing even after login, trigger modal
                if (!result.name || !result.email) result.loggedIn = false; 
            }
        } catch (e) { console.error("Supabase error checking:", e); }
    }
    return result;
}

// Razorpay Processor
async function initiateRazorpay(studentName, studentEmail, studentPhone, userId) {
    const btn = document.getElementById('buy-now-btn');
    const priceElement = document.getElementById('course-price');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Payment...';
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
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Finalizing Database Entry...';
                
                // Save to Database
                const isSaved = await savePurchaseRecord({
                    paymentId, courseId, amountInRupees, userId, studentName, studentEmail, studentPhone
                });
                
                if (isSaved) {
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Success!';
                    btn.style.backgroundColor = "#22c55e";
                    alert(`🎉 Success! Thank you ${studentName}.\nTransaction ID: ${paymentId}`);
                } else {
                    btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error Occurred';
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

// Supabase Database Record Creation
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
                buyer_name: studentName,   // Make sure these match your Supabase columns!
                buyer_email: studentEmail,
                buyer_phone: studentPhone
            }]);
        if (error) throw error;
        return true;
    } catch (dbError) {
        console.error("Supabase Save Error:", dbError);
        return false;
    }
}