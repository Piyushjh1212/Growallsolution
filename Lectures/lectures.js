// catalog-app.js - Dynamic Syllabus & Course Details Engine

document.addEventListener('DOMContentLoaded', () => {
    createNotificationContainer();
    initializeCourseCatalog();
});

/**
 * Create notification container for toast messages
 */
function createNotificationContainer() {
    if (document.getElementById('lecture-notification-container')) return;

    const container = document.createElement('div');
    container.id = 'lecture-notification-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 500px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    document.body.appendChild(container);

    // Add animation styles
    const style = document.createElement('style');
    if (!document.getElementById('lecture-notification-animation')) {
        style.id = 'lecture-notification-animation';
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
}

/**
 * Show toast notification
 */
function showLectureNotification(message, type = 'info', duration = 4000) {
    const container = document.getElementById('lecture-notification-container');
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

    // Auto remove
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

async function initializeCourseCatalog() {
    // URL se sub_category_id read karna (?sub_category_id=1)
    const urlParams = new URLSearchParams(window.location.search);
    const subCategoryId = urlParams.get('sub_category_id') || '1'; // Default fallback

    if (!window.supabaseClient) {
        console.error("Supabase Client initialized nahi mila! Path chain verify karein.");
        return;
    }

    try {
        // ==========================================
        // FETCH DATA A: Sub-Category & Course Details
        // ==========================================
        const { data: subCategory, error: subError } = await window.supabaseClient
            .from('sub_categories')
            .select(`
                name, 
                price,
                original_price,
                instructor_name,
                instructor_bio,
                course_image_url,
                categories ( name )
            `)
            .eq('id', subCategoryId)
            .single();

        if (subError || !subCategory) throw subError;

        // 1. Breadcrumb aur Titles dynamically load karna
        const parentCat = subCategory.categories?.name || "Development";
        document.getElementById('db-breadcrumb').innerHTML = `${parentCat} <i class="fa-solid fa-chevron-right"></i> ${subCategory.name}`;
        document.getElementById('db-main-title').innerHTML = `The Ultimate <span>${subCategory.name}</span> Masterclass`;

        // 2. Pricing & Discount Logic Update karna
        const priceEl = document.getElementById('course-price');
        const origPriceEl = document.getElementById('db-original-price');
        const discountEl = document.getElementById('db-discount-badge');

        if (priceEl) {
            priceEl.innerText = `₹${subCategory.price || 499}`;
            // Payment gateway ke liye attribute set karna zaroori hai
            priceEl.setAttribute('data-price', subCategory.price || 499); 
        }
        
        if (origPriceEl && subCategory.original_price) {
            origPriceEl.innerText = `₹${subCategory.original_price}`;
            
            // Discount percentage calculate karna
            if (subCategory.original_price > subCategory.price) {
                const discount = Math.round(((subCategory.original_price - subCategory.price) / subCategory.original_price) * 100);
                discountEl.innerText = `${discount}% off`;
            } else {
                discountEl.style.display = 'none'; // Agar discount nahi hai toh hide kardo
            }
        }

        // 3. Instructor Details Update karna
        if (subCategory.instructor_name) {
            document.getElementById('db-instructor-name').innerText = subCategory.instructor_name;
        }
        if (subCategory.instructor_bio) {
            document.getElementById('db-instructor-bio').innerText = subCategory.instructor_bio;
        }
        if (subCategory.course_image_url) {
            const imgEl = document.getElementById('db-instructor-img');
            if (imgEl) imgEl.src = subCategory.course_image_url;
        }

        // 4. Default "What you'll learn" statements
        const pointsContainer = document.getElementById('db-learning-points');
        const defaultPoints = [
            `Master comprehensive ${subCategory.name} workflows to build modern web solutions.`,
            `Develop production-ready applications and deploy digital products efficiently.`,
            `Understand structural architecture, cloud integration, and optimization patterns.`,
            `Implement security parameters and industry-standard clean code practices.`
        ];
        pointsContainer.innerHTML = defaultPoints.map(pt => `<li><i class="fa-solid fa-check-double"></i> ${pt}</li>`).join('');

        // ==========================================
        // FETCH DATA B: Grouped Lectures Array Loop
        // ==========================================
        const { data: lectures, error: lecError } = await window.supabaseClient
            .from('lectures')
            .select('*')
            .eq('sub_category_id', subCategoryId)
            .order('id', { ascending: true });

        if (lecError) throw lecError;

        document.getElementById('db-total-lectures').innerText = `${lectures.length} lectures • Dynamic Syllabus Track`;

        const accordionContainer = document.getElementById('db-dynamic-accordion');
        if (!accordionContainer) return;
        accordionContainer.innerHTML = ''; 

        if (lectures.length === 0) {
            accordionContainer.innerHTML = `<p style="text-align: center; padding: 20px; font-style: italic;">No lectures posted yet for this course. Coming soon!</p>`;
        } else {
            const sectionsGroup = {};
            lectures.forEach(lec => {
                const secName = lec.section_name || "Section 1: General Module Foundation";
                if (!sectionsGroup[secName]) sectionsGroup[secName] = [];
                sectionsGroup[secName].push(lec);
            });

            Object.keys(sectionsGroup).forEach((sectionTitle, idx) => {
                const sectionLectures = sectionsGroup[sectionTitle];
                const isFirst = idx === 0 ? 'active' : '';
                const initialStyle = idx === 0 ? 'style="max-height: 2000px;"' : '';

                let listHTML = '';
                sectionLectures.forEach(l => {
                    const previewTag = l.is_preview 
                        ? `<a href="#" onclick="playVideo('${l.video_url}')"><i class="fa-solid fa-eye"></i> Preview</a>` 
                        : '';
                    const fileIcon = l.notes_url ? 'fa-solid fa-file-pdf' : 'fa-solid fa-circle-play';

                    listHTML += `
                        <li>
                            <i class="${fileIcon} lecture-icon"></i>
                            <div class="lecture-title">${l.title} ${previewTag}</div>
                            <div class="lecture-time">${l.duration || '12:00'}</div>
                        </li>
                    `;
                });

                accordionContainer.innerHTML += `
                    <div class="accordion-item ${isFirst}">
                        <div class="accordion-header">
                            <div><i class="fa-solid fa-chevron-down" style="margin-right: 15px; transition: 0.3s;"></i>
                                ${sectionTitle}</div>
                            <span style="font-size: 0.9rem; color: var(--text-light); font-weight: 500;">
                                ${sectionLectures.length} lectures
                            </span>
                        </div>
                        <div class="accordion-content" ${initialStyle}>
                            <div class="inner-pad">
                                <ul class="lecture-list">
                                    ${listHTML}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            });

            attachAccordionEvents();
        }

        // ==========================================
        // 🟢 NEW: CHECK PURCHASE STATUS (Validity & Access)
        // ==========================================
        await checkPurchaseAccess(subCategoryId);

    } catch (err) {
        console.error("Database initialization failed:", err);
        showLectureNotification("Error loading course details. Please try again.", "error");
    }
}

// 🟢 NEW FUNCTION: Check if user already owns this course
async function checkPurchaseAccess(courseId) {
    if (!window.supabaseClient || !window.supabaseClient.auth) {
        console.warn("Supabase Auth not loaded");
        return;
    }

    try {
        // 1. Get current user
        const { data: authData } = await window.supabaseClient.auth.getUser();
        const userId = authData?.user?.id;

        if (!userId) {
            console.log("No user logged in - showing purchase button");
            return;
        }

        // 2. Check if user purchased this course
        const { data: purchaseRecord, error } = await window.supabaseClient
            .from('purchases')
            .select('*')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .eq('status', 'completed')
            .maybeSingle();

        if (error) {
            console.error("Error fetching purchase data:", error);
            return;
        }

        // 3. If user owns course, update UI
        if (purchaseRecord) {
            console.log("✅ User has purchased this course!");
            
            const buyBtn = document.getElementById('buy-now-btn');
            const cartBtn = document.getElementById('add-to-cart-btn');
            const priceContainer = document.getElementById('price-container');
            const offerTimer = document.getElementById('offer-timer');

            // Change buy button to "Watch Now"
            if (buyBtn) {
                buyBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i> Watch Now';
                buyBtn.style.backgroundColor = "#10b981";
                buyBtn.style.color = "#ffffff";
                buyBtn.style.outline = "transparent";
                
                // Replace button to remove old event listeners
                const newBtn = buyBtn.cloneNode(true);
                buyBtn.parentNode.replaceChild(newBtn, buyBtn);
                
                newBtn.addEventListener('click', () => {
                    window.location.href = `../Preview/Preview.html?course_id=${courseId}`;
                });
            }

            // Hide cart button
            if (cartBtn) cartBtn.style.display = "none";
            if (priceContainer) priceContainer.style.display = "none";

            // Show confirmation message
            if (offerTimer) {
                offerTimer.innerHTML = '<div style="color: #10b981; font-weight: 600; padding: 10px 0; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-check-circle"></i> Course Access Unlocked!</div>';
            }

            showLectureNotification("✅ You have access to this course!", "success", 3000);
        } else {
            console.log("User has not purchased this course yet");
            showLectureNotification("Unlock this course to access all lectures", "info", 3000);
        }
    } catch (error) {
        console.error("Error checking purchase access:", error);
    }
}


window.playVideo = function(url) {
    if (!url) {
        showLectureNotification("Video not available yet", "warning");
        return;
    }
    window.open(url, '_blank');
};

function attachAccordionEvents() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = item.querySelector('.accordion-content');
            const isActive = item.classList.contains('active');

            document.querySelectorAll('.accordion-item').forEach(el => {
                el.classList.remove('active');
                el.querySelector('.accordion-content').style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });
}