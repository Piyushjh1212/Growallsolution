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

  // CRITICAL FIX: Alag se client banane ke badle global window client use karenge
  const supabaseClient = window.supabaseClient;

  if (contactForm && supabaseClient) {
    
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // Reload freeze

      // UI States: Lock actions & Loader ON
      submitBtn.disabled = true;
      submitBtn.innerText = "Sending Message...";
      statusMsg.className = "sb-leadform-status-panel";
      statusMsg.style.display = "none";

      // Form inputs reading
      const name = document.getElementById('client-name').value;
      const email = document.getElementById('client-email').value;
      const serviceSelected = document.getElementById('client-service').value;
      
      // Fallback mechanism if service is omitted
      const service = serviceSelected ? serviceSelected : "Not Specified"; 
      const message = document.getElementById('client-message').value;

      try {
        // Direct injection to Cloud Database using unified global client
        const { data, error } = await supabaseClient
          .from('Contact')
          .insert([
            { 
              full_name: name, 
              email_address: email, 
              interested_service: service, 
              client_message: message 
            }
          ]);

        if (error) throw error;

        // Success Alert UI Update
        statusMsg.innerText = "🚀 Awesome! Aapka message real-time save ho gaya hai. Hum jald hi connect karenge.";
        statusMsg.className = "sb-leadform-status-panel success";
        statusMsg.style.display = "block";
        contactForm.reset(); // Fields automatic flush

      } catch (err) {
        console.error("Supabase Database Error:", err);
        statusMsg.innerText = "❌ Oops! Database se connection nahi ho paya. Kripya check karein ki RLS Disable hai ya nahi.";
        statusMsg.className = "sb-leadform-status-panel error";
        statusMsg.style.display = "block";
      } finally {
        // Normal state restore
        submitBtn.disabled = false;
        submitBtn.innerText = "Send Message";
      }
    });
  } else if (!contactForm) {
    console.warn("Supabase Warning: Contact form template DOM element missing on this page.");
  } else {
    console.error("Supabase Error: Global configuration client missing! Script tags check karein.");
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