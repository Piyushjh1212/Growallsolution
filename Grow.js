// ==========================================================================
// CENTRALIZED WEB LOGIC: MOBILE NAVBAR TOGGLE + SUPABASE CONTACT LEADS
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  
  /* ------------------------------------------------------------------------
     1. BULLETPROOF MOBILE NAVBAR TOGGLE LOGIC
     ------------------------------------------------------------------------ */
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuToggle && mobileMenu) {
    // Toggle Menu Function
    const toggleMenu = (event) => {
      event.stopPropagation(); // Ghost clicks prevent karne ke liye
      const isMenuOpen = mobileMenu.classList.toggle("active");
      
      // Clean Unicode Icons (Cross & Hamburger)
      menuToggle.innerHTML = isMenuOpen ? "&#x2715;" : "&#x2630;";
      menuToggle.setAttribute("aria-expanded", isMenuOpen);
    };

    // Close Menu Function
    const closeMenu = () => {
      if (mobileMenu.classList.contains("active")) {
        mobileMenu.classList.remove("active");
        menuToggle.innerHTML = "&#x2630;";
        menuToggle.setAttribute("aria-expanded", "false");
      }
    };

    // Menu Click Listeners
    menuToggle.addEventListener("click", toggleMenu);

    // Outside Click Close: Screen par kahi bhi click ho to menu close ho jaye
    document.addEventListener("click", (event) => {
      const isClickInsideMenu = mobileMenu.contains(event.target);
      const isClickOnToggle = menuToggle.contains(event.target);

      if (!isClickInsideMenu && !isClickOnToggle) {
        closeMenu();
      }
    });

    // Escape Key Press Support
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }


  /* ------------------------------------------------------------------------
     2. SUPABASE REAL-TIME CONTACT FORM LOGIC (FIXED SINGLE INSTANCE)
     ------------------------------------------------------------------------ */
  const contactForm = document.getElementById('my-supabase-contact-form');
  const submitBtn = document.getElementById('form-submit-btn');
  const statusMsg = document.getElementById('form-status-msg');
  const honeypotField = document.getElementById('contact-form-honeypot');

  // CRITICAL FIX: Alag se client banane ke badle global window client use karenge
  const supabaseClient = window.supabaseClient;
  const RATE_LIMIT_KEY = 'gac-contact-rate-limit';
  const RATE_LIMIT_WINDOW_MS = 60000;
  const MAX_SUBMITS_PER_WINDOW = 3;

  function showStatus(message, type = 'info') {
    statusMsg.innerText = message;
    statusMsg.className = `sb-leadform-status-panel${type === 'error' ? ' error' : type === 'success' ? ' success' : ''}`;
    statusMsg.style.display = 'block';
  }

  function sanitizeText(value, maxLength = 500) {
    return String(value || '')
      .replace(/<[^>]*>/g, '')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, maxLength);
  }

  function validateContactForm(formValues) {
    const errors = [];
    const name = sanitizeText(formValues.name, 80);
    const email = sanitizeText(formValues.email, 120);
    const service = sanitizeText(formValues.service, 80);
    const message = sanitizeText(formValues.message, 1000);

    if (!name || name.length < 2) {
      errors.push('Name rule: enter at least 2 characters.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Email rule: enter a valid email address.');
    }

    if (!message || message.length < 10) {
      errors.push('Message rule: enter at least 10 characters.');
    }

    if (service.length > 80) {
      errors.push('Service rule: selection is too long.');
    }

    if (message.includes('<') || message.includes('>')) {
      errors.push('Message rule: remove HTML-style characters.');
    }

    return { errors, safeValues: { name, email, service, message } };
  }

  function getRateLimitState() {
    try {
      const stored = sessionStorage.getItem(RATE_LIMIT_KEY);
      if (!stored) return { count: 0, blocked: false };

      const parsed = JSON.parse(stored);
      const now = Date.now();
      const age = now - (parsed.firstTimestamp || now);

      if (age > RATE_LIMIT_WINDOW_MS) {
        sessionStorage.removeItem(RATE_LIMIT_KEY);
        return { count: 0, blocked: false };
      }

      return { count: parsed.count || 0, blocked: (parsed.count || 0) >= MAX_SUBMITS_PER_WINDOW };
    } catch (error) {
      return { count: 0, blocked: false };
    }
  }

  function recordSuccessfulSubmission() {
    try {
      const current = getRateLimitState();
      const now = Date.now();
      const payload = {
        count: current.count + 1,
        firstTimestamp: current.count === 0 ? now : (JSON.parse(sessionStorage.getItem(RATE_LIMIT_KEY) || '{}').firstTimestamp || now)
      };
      sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('Rate limit storage unavailable:', error);
    }
  }

  if (contactForm && supabaseClient) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (honeypotField && honeypotField.value.trim()) {
        showStatus('Message blocked as spam.', 'error');
        return;
      }

      const rateLimitState = getRateLimitState();
      if (rateLimitState.blocked) {
        showStatus('Too many messages sent. Please try again in a minute.', 'error');
        return;
      }

      const formValues = {
        name: document.getElementById('client-name').value,
        email: document.getElementById('client-email').value,
        service: document.getElementById('client-service').value,
        message: document.getElementById('client-message').value
      };

      const { errors, safeValues } = validateContactForm(formValues);
      if (errors.length) {
        showStatus(`Form blocked: ${errors.join(' | ')}`, 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = 'Sending Message...';
      statusMsg.className = 'sb-leadform-status-panel';
      statusMsg.style.display = 'none';

      try {
        const { error } = await supabaseClient
          .from('Contact')
          .insert([
            {
              full_name: safeValues.name,
              email_address: safeValues.email,
              interested_service: safeValues.service || 'Not Specified',
              client_message: safeValues.message
            }
          ]);

        if (error) throw error;

        recordSuccessfulSubmission();
        showStatus('🚀 Awesome! Aapka message save ho gaya hai. Hum jald hi connect karenge.', 'success');
        contactForm.reset();
      } catch (err) {
        console.error('Supabase Database Error:', err);
        showStatus('❌ Message send nahi ho paya. Please try again later.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Send Message';
      }
    });
  } else if (!contactForm) {
    console.warn('Supabase Warning: Contact form template DOM element missing on this page.');
  } else {
    console.error('Supabase Error: Global configuration client missing! Script tags check karein.');
  }

});


/* ------------------------------------------------------------------------
   3. GROW LECTURE DYNAMIC CATEGORIES LOGIC
   ------------------------------------------------------------------------ */
async function loadCategories() {
  const container = document.getElementById('dynamic-categories-grid');

  // Content area check agar kisi dusre page par grid na ho
  if (!container) return;

  // Safety Check: Pehle dekhlo ki config load hui hai ya nahi
  if (!window.supabaseClient) {
    console.error("Error: Supabase client initialization miss ho gayi! Script order check karein.");
    container.innerHTML = `<p style="color: red; font-weight: bold;">Error: Configuration issue. Please try again later.</p>`;
    return;
  }

  // Database ke 'categories' table se saare required columns fetch karna
  const { data: categories, error } = await window.supabaseClient
    .from('categories')
    .select('id, name, tag, image_url, link_url, description');

  // Agar network ya database mein koi error aaye
  if (error) {
    console.error("Database fetch error:", error.message);
    container.innerHTML = `<p style="color: red; font-weight: bold;">Error: Data load nahi ho paya. Please page refresh karein.</p>`;
    return;
  }

  // Loading text ko clear karna
  container.innerHTML = '';

  // Agar database khali hai toh alert dikhayein
  if (!categories || categories.length === 0) {
    container.innerHTML = `<p>No categories found in the database.</p>`;
    return;
  }

  // Har ek category ke liye dynamic card generate karna
  categories.forEach(category => {
    const safeName = escapeHtml(category.name || '');
    const safeTag = escapeHtml(category.tag || '');
    const safeDescription = escapeHtml(category.description || '');
    const safeImage = escapeAttr(category.image_url || '');
    const safeLink = escapeAttr(`${category.link_url || '#'}?category_id=${category.id}`);

    const cardHTML = `
      <div class="my-custom-product-card" data-category-id="${escapeAttr(category.id)}">
        <div class="my-custom-product-image-box">
          <img src="${safeImage}" alt="${safeName}">
        </div>
        <div class="my-custom-product-content">
          <span class="my-custom-product-tag">${safeTag}</span>
          <h3>${safeName}</h3>
          <p>${safeDescription}</p>
          <div class="my-custom-product-footer">
            <a href="${safeLink}" class="my-custom-product-btn">Explore</a>
          </div>
        </div>
      </div>
    `;
    
    // Container ke andar card ko append (add) karte jana
    container.innerHTML += cardHTML;
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

// Webpage load hote hi function ko execute karna
document.addEventListener('DOMContentLoaded', loadCategories);