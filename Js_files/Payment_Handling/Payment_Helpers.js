// Js_files/Payment_Helpers.js - Network & Database Helpers Module

function isOnline() {
    return navigator.onLine && typeof window.supabaseClient !== 'undefined';
}

async function retryWithBackoff(asyncFn, maxRetries = 3, initialDelayMs = 1000) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await asyncFn();
        } catch (error) {
            lastError = error;
            console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
            const isRetriable = error.message?.includes('network') || 
                               error.message?.includes('timeout') || 
                               error.status >= 500 ||
                               error.code === 'ECONNREFUSED' ||
                               error.code === 'ETIMEDOUT';
            if (!isRetriable || attempt === maxRetries) throw error;
            const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    throw lastError;
}

async function sendOTPViaEmail(targetEmail, otpCode) {
    if (!isOnline()) throw new Error('No internet connection. Please check your network and try again.');
    try {
        return await retryWithBackoff(async () => {
            return true; // Replace with actual live delivery if needed
        }, 3, 1000);
    } catch (err) {
        console.error("❌ OTP transmission failed:", err);
        if (err.message?.includes('network')) throw new Error('Network error. Please check your internet connection.');
        if (err.message?.includes('timeout')) throw new Error('Request timeout. Please try again.');
        throw new Error('Failed to send OTP. Please try again.');
    }
}

async function checkExistingUser() {
    let result = { loggedIn: false, name: "Student", email: "", phone: "9999999999", id: null };
    if (!window.supabaseClient || !window.supabaseClient.auth) return result;
    try {
        if (!isOnline()) return result;
        const { data: authData, error } = await window.supabaseClient.auth.getUser();
        if (error) return result;
        if (authData?.user) {
            result.loggedIn = true;
            result.id = authData.user.id;
            result.email = authData.user.email || "";
            result.name = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || "Student";
            result.phone = authData.user.phone || "9999999999";
        }
    } catch (e) {
        console.warn("⚠️ Session fetch failed, proceeding as guest:", e.message);
    }
    return result;
}

async function savePurchaseRecord({ paymentId, courseId, amountInRupees, userId, studentName, studentEmail, studentPhone }) {
    if (!window.supabaseClient) throw new Error('Database connection not available. Please refresh the page.');
    if (!isOnline()) throw new Error('No internet connection. Cannot save purchase.');
    
    const purchaseData = { transaction_id: paymentId, course_id: courseId, amount_paid: amountInRupees, status: 'completed', user_id: userId };
    
    try {
        await retryWithBackoff(async () => {
            const { data, error } = await window.supabaseClient.from('purchases').insert([purchaseData]);
            if (error) {
                if (error.code === '42P01') throw new Error('Database table not found.');
                if (error.code === '23505') throw new Error('This transaction already exists.');
                throw error;
            }
            return data;
        }, 3, 2000);
        return true;
    } catch (dbError) {
        throw new Error("Failed to save purchase. " + dbError.message);
    }
}

// Make helpers globally accessible
window.isOnline = isOnline;
window.sendOTPViaEmail = sendOTPViaEmail;
window.checkExistingUser = checkExistingUser;
window.savePurchaseRecord = savePurchaseRecord;