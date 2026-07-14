
        // Js_files/Payment_UI.js - UI & Styles Module

        // Global state tracking variables (Will be shared across files)
        window.generatedOTP = null;
        window.verifiedEmail = "";

        document.addEventListener('DOMContentLoaded', () => {
            createNotificationContainer();
            injectStyles();
        });

        function createNotificationContainer() {
            if (document.getElementById('payment-notification-container')) return;

            const container = document.createElement('div');
            container.id = 'payment-notification-container';
            container.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 500px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
            document.body.appendChild(container);

            const style = document.createElement('style');
            if (!document.getElementById('payment-notification-animation')) {
                style.id = 'payment-notification-animation';
                style.textContent = `
            @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
        `;
                document.head.appendChild(style);
            }
        }

        function showNotification(message, type = 'info', duration = 4000) {
            const container = document.getElementById('payment-notification-container');
            if (!container) return;

            const notification = document.createElement('div');
            const bgColor = { 'success': '#10b981', 'error': '#ef4444', 'info': '#3b82f6', 'warning': '#f59e0b' }[type] || '#3b82f6';

            notification.style.cssText = `
        background: ${bgColor}; color: white; padding: 16px 20px; border-radius: 8px;
        margin-bottom: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out; word-break: break-word; font-size: 14px; line-height: 1.5;
    `;

            notification.textContent = message;
            container.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }

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
            animation: modalFadeIn 0.2s ease-out; padding: 16px; overflow-y: auto;
        }
        .js-modal-content {
            background: #ffffff; padding: 25px; border-radius: 14px;
            width: 100%; max-width: 380px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
            position: relative; box-sizing: border-box; text-align: left;
            max-height: 90vh; overflow-y: auto; -webkit-overflow-scrolling: touch;
        }
        .js-modal-content h3 { margin: 0 0 6px 0; color: #1e293b; font-size: 1.25rem; display: flex; align-items: center; gap: 8px; }
        .js-modal-content p { color: #64748b; font-size: 0.85rem; margin: 0 0 16px 0; line-height: 1.4; }
        .js-close-btn { position: absolute; right: 18px; top: 15px; font-size: 24px; cursor: pointer; color: #94a3b8; line-height: 1; border: none; background: none; padding: 0; }
        .js-close-btn:hover { color: #1e293b; }
        .js-input-group { margin-bottom: 14px; }
        .js-input-group label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.85rem; color: #475569; }
        .js-input-group input { 
            width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; 
            font-size: 0.95rem; box-sizing: border-box; transition: all 0.2s;
            -webkit-appearance: none; appearance: none; background-color: #ffffff;
        }
        .js-input-group input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        .js-submit-btn { 
            width: 100%; background: #3b82f6; color: white; border: none; padding: 12px; 
            font-size: 0.95rem; font-weight: bold; border-radius: 8px; cursor: pointer; 
            transition: background 0.2s; -webkit-appearance: none; appearance: none;
        }
        .js-submit-btn:hover { background: #2563eb; }
        .js-submit-btn:active { background: #1d4ed8; }
        .step-hidden { display: none !important; }
        .step-visible { display: block !important; animation: slideDown 0.2s ease-in-out; }
        @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 480px) {
            .js-custom-modal { align-items: flex-end; padding: 0; background-color: rgba(0, 0, 0, 0.4); }
            .js-modal-content { width: 100%; max-width: 100%; border-radius: 16px 16px 0 0; padding: 20px; max-height: 85vh; }
            .js-modal-content h3 { font-size: 1.1rem; }
            .js-input-group label { font-size: 0.8rem; }
            .js-input-group input { padding: 14px; font-size: 16px; }
            .js-submit-btn { padding: 14px; font-size: 0.9rem; }
            .js-close-btn { right: 12px; top: 12px; font-size: 28px; }
        }
    `;
            document.head.appendChild(style);
        }

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


        function getEmailTemplate(studentName, courseTitle, amountInRupees, paymentId) {
            return `
    <body style="margin:0;padding:0;background:#f5f7fa;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fa;">
            <tr>
                <td align="center" style="padding:40px 15px;">
                    <table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" align="center"
                        style="width:100%;max-width:620px;background:#fff;border:1px solid #e5e7eb;">
                        <tr>
                            <td align="center" style="padding:30px;border-bottom:1px solid #e5e7eb;">
                                <img src="https://res.cloudinary.com/dieboinjz/image/upload/v1772387672/GacImages/cjgywtxrv1g6etyve2rl.jpg"
                                    width="90" style="display:block;border-radius:10px;margin:0 auto;">
                                <div style="font:700 24px Arial,sans-serif;color:#111827;margin-top:16px;">Grow All
                                    Coaching</div>
                                <div style="font:14px Arial,sans-serif;color:#6b7280;margin-top:6px;">Payment
                                    Confirmation</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:40px;font:16px/28px Arial,sans-serif;color:#374151;">
                                <h1 style="margin:0 0 20px;font:700 28px Arial,sans-serif;color:#111827;">Payment
                                    received</h1>
                                <p>Hello <strong>${studentName}</strong>,</p>
                                <p>Thank you for your purchase. We have successfully received your payment and your
                                    enrollment has been confirmed. Your course is now available in your dashboard.</p>
                                <table width="100%" cellpadding="0" cellspacing="0"
                                    style="border:1px solid #e5e7eb;border-collapse:collapse;margin:30px 0;">
                                    <tr>
                                        <td style="padding:14px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                                            Course</td>
                                        <td style="padding:14px;border-bottom:1px solid #e5e7eb;text-align:right;">
                                            ${courseTitle}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:14px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                                            Amount Paid</td>
                                        <td style="padding:14px;border-bottom:1px solid #e5e7eb;text-align:right;">
                                            ₹${amountInRupees}.00 INR</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:14px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                                            Transaction ID</td>
                                        <td
                                            style="padding:14px;border-bottom:1px solid #e5e7eb;text-align:right;font-family:monospace;">
                                            ${paymentId}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:14px;background:#f9fafb;">Status</td>
                                        <td style="padding:14px;text-align:right;"><span
                                                style="display:inline-block;padding:6px 12px;background:#ecfdf3;border:1px solid #bbf7d0;border-radius:999px;color:#15803d;font-weight:bold;font-size:13px;">PAID</span>
                                        </td>
                                    </tr>
                                </table>
                                <div style="text-align:center;margin:35px 0;">
                                    <a href="https://growallcoaching.online/dashboard.html"
                                        style="background:#111827;color:#fff;text-decoration:none;padding:15px 30px;border-radius:6px;display:inline-block;">Access
                                        My Dashboard</a>
                                </div>
                                <hr style="border:none;border-top:1px solid #e5e7eb;">
                                <p>If you have any questions, simply reply to this email.</p>
                                <p style="font-size:13px;color:#6b7280;">Grow All
                                    Coaching<br>https://growallcoaching.online</p>
                                <p style="font-size:12px;color:#9ca3af;">© 2026 Grow All Coaching. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>

    `;
        }

        // Global scope में फंक्शंस को डालना ताकि दूसरी फाइलें इस्तेमाल कर सकें
        window.showNotification = showNotification;
        window.resetFormState = resetFormState;
        window.getEmailTemplate = getEmailTemplate;
   