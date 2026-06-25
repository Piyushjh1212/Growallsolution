// =========================
// Mobile Navbar Toggle
// =========================

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("active");

      if (mobileMenu.classList.contains("active")) {
        menuToggle.innerHTML = "✕";
      } else {
        menuToggle.innerHTML = "☰";
      }
    });
  }
});

// =========================
// Feedback Slider
// =========================

document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector(".gac-feedback-slider");
  const cards = document.querySelectorAll(".gac-feedback-card");
  const prevBtn = document.querySelector(".gac-prev");
  const nextBtn = document.querySelector(".gac-next");
  const dotsContainer = document.querySelector(".gac-feedback-dots");

  if (!slider || !cards.length || !dotsContainer) return;

  let currentIndex = 0;
  let startX = 0;
  let endX = 0;

  cards.forEach((_, index) => {
    const dot = document.createElement("div");
    dot.classList.add("gac-dot");

    if (index === 0) {
      dot.classList.add("active");
    }

    dot.addEventListener("click", () => showFeedback(index));

    dotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll(".gac-dot");

  function showFeedback(index) {
    slider.style.transform = `translateX(-${index * 100}%)`;

    dots.forEach((dot) => dot.classList.remove("active"));
    dots[index].classList.add("active");

    currentIndex = index;
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % cards.length;
      showFeedback(currentIndex);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      showFeedback(currentIndex);
    });
  }

  setInterval(() => {
    currentIndex = (currentIndex + 1) % cards.length;
    showFeedback(currentIndex);
  }, 5000);

  slider.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  slider.addEventListener("touchmove", (e) => {
    endX = e.touches[0].clientX;
  });

  slider.addEventListener("touchend", () => {
    const diff = startX - endX;
    const threshold = 50;

    if (diff > threshold) {
      currentIndex = (currentIndex + 1) % cards.length;
      showFeedback(currentIndex);
    } else if (diff < -threshold) {
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      showFeedback(currentIndex);
    }

    startX = 0;
    endX = 0;
  });
});

// =========================
// Card Click Demo
// =========================

document.querySelectorAll(".gac-card-hover").forEach((el) => {
  el.addEventListener("click", () => {
    const name =
      el.querySelector("h3, h4, .gac-director-name")?.innerText || "Profile";

    alert(`${name} - detailed bio can be added here.`);
  });
});