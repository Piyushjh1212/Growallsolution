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
     2. SUPABASE REAL-TIME CONTACT FORM LOGIC (FIXED URL)
     ------------------------------------------------------------------------ */
  // FIXED: Yahan se /rest/v1/ hata diya hai bhai, ab ye ekdum sahi endpoint hai
  const SUPABASE_URL = "https://rlbvbbnvswuzggbpcnpn.supabase.co"; 
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYnZiYm52c3d1emdnYnBjbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTI3MDUsImV4cCI6MjA5Nzc4ODcwNX0._zeUZjHPN3-D390QmTJxTCgVaoRCcVt4XJH25KfwrNI";          
  
  const contactForm = document.getElementById('my-supabase-contact-form');
  const submitBtn = document.getElementById('form-submit-btn');
  const statusMsg = document.getElementById('form-status-msg');

  // Form block verify karne ke baad hi trigger hoga (Prevents script breaks)
  if (contactForm && typeof supabase !== 'undefined') {
    
    // Client initialization
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        // Direct injection to Cloud Database
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
    console.error("Supabase Error: CDN script link missing! Kripya header me Supabase SDK inject karein.");
  }

});