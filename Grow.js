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



const slider = document.querySelector(".gac-feedback-slider");
const cards = document.querySelectorAll(".gac-feedback-card");
const prevBtn = document.querySelector(".gac-prev");
const nextBtn = document.querySelector(".gac-next");
const dotsContainer = document.querySelector(".gac-feedback-dots");

let currentIndex = 0;

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

  dots.forEach(dot => dot.classList.remove("active"));
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

// Auto-slide every 5 seconds
setInterval(() => {
  currentIndex = (currentIndex + 1) % cards.length;
  showFeedback(currentIndex);
}, 5000);
