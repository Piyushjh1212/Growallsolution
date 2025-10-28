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
