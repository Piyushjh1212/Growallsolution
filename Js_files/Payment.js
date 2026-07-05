// Js_files/Payment.js - Complete Payment Integration & Database Engine

document.addEventListener('DOMContentLoaded', () => {
    const buyNowBtn = document.getElementById('buy-now-btn');
    
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', processPayment);
    }
});

async function processPayment() {
    const btn = document.getElementById('buy-now-btn');
    const priceElement = document.getElementById('course-price');
    
    // Safety check: Agar button ya price element nahi mila to aage na badhe
    if (!btn || !priceElement) {
        console.error("Payment initialization error: Required elements missing.");
        alert("Unable to start payment. Please refresh the page.");
        return;
    }

    // UI mein loading state dikhayein
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    try {
        // 1. Get exact price (Razorpay takes amount in Paise, so multiply by 100)
        const amountInRupees = parseInt(priceElement.getAttribute('data-price')) || 499;
        const amountInPaise = amountInRupees * 100;

        // Course/Category ID from URL (?sub_category_id=X)
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('sub_category_id') || '1';

        // Course ka naam fetch karna (Optional prefill ke liye)
        const courseTitleEl = document.getElementById('db-main-title');
        const courseTitle = courseTitleEl ? courseTitleEl.innerText : "Premium Course Bundle";

        // 2. Setup Razorpay Options
        const options = {
            key: RAZORPAY_CONFIG.key_id,
            amount: amountInPaise,
            currency: RAZORPAY_CONFIG.currency || "INR",
            name: RAZORPAY_CONFIG.company_name || "Grow All Solution",
            description: courseTitle,
            image: RAZORPAY_CONFIG.company_logo || "",
            
            // Handler function tab chalega jab payment SUCCESSFUL hogi
            handler: async function (response) {
                console.log("Payment Success Object:", response);
                
                const paymentId = response.razorpay_payment_id;
                
                // User ko UI par success dikhao
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving Course Access...';
                btn.style.backgroundColor = "#eab308"; // Yellow loading
                
                // 3. Save Transaction directly to Supabase Database
                const isSaved = await savePurchaseRecord(paymentId, courseId, amountInRupees);
                
                if (isSaved) {
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Payment Successful!';
                    btn.style.backgroundColor = "#22c55e"; // Green color
                    
                    alert(`🎉 Congratulations! Course unlocked.\nTransaction ID: ${paymentId}`);
                    // Optional: Page reload ya dashboard par bhejna
                    // window.location.reload();
                } else {
                    btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Contact Support';
                    btn.style.backgroundColor = "#ef4444"; // Red color
                }
            },
            modal: {
                // Agar user payment popup bina pay kiye cross (X) daba kar close kar de
                ondismiss: function() {
                    console.warn("User dismissed the payment widget.");
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            },
            prefill: {
                // Future integration: Supabase auth se current user ka email/phone laa sakte ho
                name: "Student", 
                email: "student@example.com",
                contact: "9999999999"
            },
            notes: {
                course_id: courseId,
                purchase_type: "Full Masterclass Access"
            },
            theme: {
                color: RAZORPAY_CONFIG.theme_color || "#3b82f6"
            }
        };

        // 4. Open Razorpay Checkout Widget
        const rzp = new Razorpay(options);
        
        rzp.on('payment.failed', function (response){
            console.error("Payment Failed:", response.error);
            alert(`❌ Payment Failed!\nReason: ${response.error.description}`);
            
            // Reset Button to Original State
            btn.innerHTML = originalText;
            btn.disabled = false;
        });

        rzp.open();

    } catch (error) {
        console.error("Error initiating payment:", error);
        alert("Something went wrong initializing the gateway. Please try again.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Supabase me database record insert karne ka main function
async function savePurchaseRecord(paymentId, courseId, amount) {
    if (!window.supabaseClient) {
        console.error("Supabase client not initialized. Cannot save purchase.");
        alert("⚠️ Payment done, but connection to database failed. Please save your Transaction ID: " + paymentId);
        return false;
    }

    try {
        // Current logged-in user check karna (Agar Supabase Auth use ho raha hai)
        let userId = null;
        if (window.supabaseClient.auth) {
            const { data: authData } = await window.supabaseClient.auth.getUser();
            userId = authData?.user?.id || null;
        }

        // 'purchases' table me data insert karein
        const { data, error } = await window.supabaseClient
            .from('purchases')
            .insert([
                {
                    transaction_id: paymentId,
                    course_id: courseId,
                    amount_paid: amount,
                    status: 'completed',
                    user_id: userId // Agar user logged in nahi h to null save hoga
                }
            ]);

        if (error) {
            console.error("Database Insert Error:", error);
            throw error;
        }

        console.log("✅ Purchase saved to database successfully!", data);
        return true;

    } catch (dbError) {
        console.error("Critical: Payment cut but database save failed:", dbError);
        alert(`⚠️ Payment Successful (${paymentId}), but course activation delayed. Please take a screenshot and contact support.`);
        return false;
    }
}