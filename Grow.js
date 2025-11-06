function HandleIconClick() {
  const menu = document.getElementById("menuList");
  const navbarIcon = document.querySelector(".navbar-icon");
  const bars = navbarIcon.querySelector(".fa-bars");
  const cross = navbarIcon.querySelector(".fa-xmark");

  if (menu) {
    menu.classList.toggle("show");

    // Toggle icons
    if (menu.classList.contains("show")) {
      bars.style.display = "none";
      cross.style.display = "inline-block";
    } else {
      bars.style.display = "inline-block";
      cross.style.display = "none";
    }
  } else {
    console.error("Element with id 'menuList' not found!");
  }
}

// Initially hide the cross icon
document.addEventListener("DOMContentLoaded", () => {
  const cross = document.querySelector(".navbar-icon .fa-xmark");
  if (cross) cross.style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector(".gac-feedback-slider");
  const cards = document.querySelectorAll(".gac-feedback-card");
  const prevBtn = document.querySelector(".gac-prev");
  const nextBtn = document.querySelector(".gac-next");
  const dotsContainer = document.querySelector(".gac-feedback-dots");

  let currentIndex = 0;
  let startX = 0;
  let endX = 0;

  // Create dots dynamically
  cards.forEach((_, index) => {
    const dot = document.createElement("div");
    dot.classList.add("gac-dot");
    if (index === 0) dot.classList.add("active");
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

  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % cards.length;
    showFeedback(currentIndex);
  });

  prevBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    showFeedback(currentIndex);
  });

  //  Auto-slide every 5 seconds
  setInterval(() => {
    currentIndex = (currentIndex + 1) % cards.length;
    showFeedback(currentIndex);
  }, 5000);

  // Touch Swipe (Mobile)
  slider.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  slider.addEventListener("touchmove", (e) => {
    endX = e.touches[0].clientX;
  });

  slider.addEventListener("touchend", () => {
    const diff = startX - endX;
    const threshold = 50; // minimum swipe distance

    if (diff > threshold) {
      // Swiped left → next
      currentIndex = (currentIndex + 1) % cards.length;
      showFeedback(currentIndex);
    } else if (diff < -threshold) {
      // Swiped right → previous
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      showFeedback(currentIndex);
    }

    // Reset values
    startX = 0;
    endX = 0;
  });
});

// Optional: click interaction for demo
document.querySelectorAll(".gac-card-hover").forEach((el) => {
  el.addEventListener("click", () => {
    const name =
      el.querySelector("h3, h4, .gac-director-name")?.innerText || "Profile";
    alert(
      name +
        " - detailed bio can be added here. Replace alert with modal if needed."
    );
  });
});
