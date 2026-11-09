// Clicking INDEX opens the image grid. Clicking it again closes it.
const indexButton = document.querySelector(".side-label--index");

indexButton.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("is-index-open");
  indexButton.setAttribute("aria-expanded", isOpen);
});
