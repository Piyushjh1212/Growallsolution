function HandleIconClick() {
  const menu = document.getElementById("menuList");
  if (menu) {
    menu.classList.toggle("show");
  } else {
    console.error("Element with id 'menuList' not found!");
  }
}
