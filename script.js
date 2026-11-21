const root = document.documentElement;
const nameButton = document.querySelector(".side-label--name");
const indexButton = document.querySelector(".side-label--index");
const contactButton = document.querySelector(".side-label--contact");
const indexGrid = document.getElementById("index-grid");
const contact = document.getElementById("contact");
const projectButtons = document.querySelectorAll(".project-toggle");

// Phone: the spine lies across the screen (same width as in the @media rule in styles.css)
const phone = window.matchMedia("(max-width: 600px)");

// Length of the open/close animation, read from --index-time in styles.css
const ANIMATION_MS = parseFloat(getComputedStyle(root).getPropertyValue("--index-time")) * 1000;

// ===== Show and hide content =====
// Showing: put it on the page, then start the fade in.
function showContent(element) {
  const rightHalf = element.closest(".pane--right");
  if (rightHalf) {
    rightHalf.scrollTop = 0; // new content in the right half starts from the top
  }
  element.classList.add("is-shown");
  element.offsetWidth; // makes the browser draw the start point, so the fade in is animated
  element.classList.add("is-open");
}

// Hiding: start the fade out, then take it off the page so there is nothing left to scroll.
function hideContent(element) {
  element.classList.remove("is-open");
  setTimeout(() => {
    if (!element.classList.contains("is-open")) {
      element.classList.remove("is-shown");
    }
  }, ANIMATION_MS);
}

// ===== Close the index and any open project (not the contact details) =====
function closeIndexAndProjects() {
  if (indexGrid.classList.contains("is-open")) {
    hideContent(indexGrid);
  }
  indexButton.setAttribute("aria-expanded", false);
  indexButton.classList.remove("is-active");

  projectButtons.forEach((button) => {
    const project = button.closest(".project");
    if (project.classList.contains("is-open")) {
      project.classList.remove("is-open");
      hideContent(document.getElementById(button.getAttribute("aria-controls")));
    }
    button.setAttribute("aria-expanded", false);
  });
}

// ===== Close the contact details =====
function closeContact() {
  if (contact.classList.contains("is-open")) {
    hideContent(contact);
  }
  contactButton.setAttribute("aria-expanded", false);
  contactButton.classList.remove("is-active");
}

// ===== INDEX and projects =====
// Each one opens on click and stays open until another one is opened.
// The contact details stay as they are.

// INDEX: the image grid. Clicking it again does nothing. INDEX stays red while it is open
indexButton.addEventListener("click", () => {
  if (indexGrid.classList.contains("is-open")) return;
  closeIndexAndProjects();
  showContent(indexGrid);
  indexButton.setAttribute("aria-expanded", true);
  indexButton.classList.add("is-active");
});

// Projects: the text opens first, then the images.
// fromEnd: show the images from their last one (when scrolling up from the next project)
function openProject(button, fromEnd = false) {
  closeIndexAndProjects();
  button.closest(".project").classList.add("is-open");
  const images = document.getElementById(button.getAttribute("aria-controls"));
  showContent(images);
  if (fromEnd) {
    rightHalf.scrollTop = rightHalf.scrollHeight;
  }
  button.setAttribute("aria-expanded", true);
}

function closeProject(button) {
  button.closest(".project").classList.remove("is-open");
  hideContent(document.getElementById(button.getAttribute("aria-controls")));
  button.setAttribute("aria-expanded", false);
}

// Clicking a project's name opens it. When it is open, clicking its name
// or anywhere on its text closes it
projectButtons.forEach((button) => {
  const project = button.closest(".project");
  button.addEventListener("click", () => {
    if (project.classList.contains("is-open")) {
      closeProject(button);
      showText(); // phone: nothing is open any more, so the spine goes back to the middle
    } else {
      openProject(button);
    }
  });
  project.querySelector(".project-details").addEventListener("click", () => {
    if (project.classList.contains("is-open")) {
      closeProject(button);
      showText();
    }
  });
});

// ===== Scrolling the images on to the next project =====
// After the last image of a project, scrolling on down opens the next project in the list
// (its text on the left, its images on the right). Scrolling up from the first image
// opens the one before it, at its last image.
// Only a new scroll that starts at the end counts, and it has to push on a little,
// so the images never jump on by themselves at the end of a fast scroll.
const rightHalf = document.querySelector(".pane--right");
const SCROLL_PUSH = 80;     // how far to push past the end before moving on (pixels)
const SCROLL_PAUSE_MS = 250; // a break this long between wheel moves starts a new scroll
let pushed = 0;
let lastWheel = 0;
let scrollStartedAtEnd = false;

function openProjectButton() {
  return [...projectButtons].find((button) => button.closest(".project").classList.contains("is-open"));
}

rightHalf.addEventListener("wheel", (event) => {
  const open = openProjectButton();
  if (!open || event.ctrlKey) return;

  const atBottom = rightHalf.scrollTop + rightHalf.clientHeight >= rightHalf.scrollHeight - 1;
  const atTop = rightHalf.scrollTop <= 0;
  const down = event.deltaY > 0;

  if (event.timeStamp - lastWheel > SCROLL_PAUSE_MS) {
    pushed = 0;
    scrollStartedAtEnd = down ? atBottom : atTop;
  }
  lastWheel = event.timeStamp;
  if (!scrollStartedAtEnd) return;

  pushed += event.deltaY;
  const list = [...projectButtons];
  const index = list.indexOf(open);
  if (pushed > SCROLL_PUSH && list[index + 1]) {
    scrollStartedAtEnd = false; // one move per scroll
    openProject(list[index + 1]);
  } else if (pushed < -SCROLL_PUSH && list[index - 1]) {
    scrollStartedAtEnd = false;
    openProject(list[index - 1], true);
  }
}, { passive: true });

// ===== CONTACT: about text and contact details =====
// Opens and closes only by clicking CONTACT, together with anything else.
// CONTACT stays red while they are open.
contactButton.addEventListener("click", () => {
  if (contact.classList.contains("is-open")) {
    closeContact();
  } else {
    showContent(contact);
    contactButton.setAttribute("aria-expanded", true);
    contactButton.classList.add("is-active");
    // Phone: the contact details are under the table, so bring them into view
    if (phone.matches) {
      showText();
      contact.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }
});

// ===== SHAY TCHWELLA: back to the start =====
// Everything closes and the spine returns to the middle
nameButton.addEventListener("click", () => {
  closeIndexAndProjects();
  closeContact();
  showText();
  resetSpine();
  document.querySelectorAll(".pane").forEach((pane) => {
    pane.scrollTop = 0;
  });
});

// ===== Wavy lines on hover =====
// Hovering a project name (or a spine label) curls its line into a wave, starting at
// one end and moving along the line. When the mouse leaves, the waves flatten
// everywhere at once, so the line stretches back to straight.
// While it is wavy the line is red; when it is straight again it goes back to its own color.
// Sizes and times come from styles.css.
const SVG_NS = "http://www.w3.org/2000/svg";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function cssNumber(name) {
  return parseFloat(getComputedStyle(root).getPropertyValue(name));
}

function smooth(t) {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
}

// owner: the element that holds the line (it gets the class "is-waving" while it moves)
// trigger: the element the mouse hovers
// svgClass: class of the drawing, placed by styles.css exactly on the line
// vertical: says if the line runs top to bottom (the spine labels, not on a phone)
// restColor: the line's color when it is straight ("transparent" = no line)
// canWave: says if the line may curl now (an open spine label keeps its straight line)
function addWave({ owner, trigger, svgClass, vertical, restColor, canWave = () => true }) {
  const svg = document.createElementNS(SVG_NS, "svg");
  const path = document.createElementNS(SVG_NS, "path");
  svg.setAttribute("class", svgClass);
  svg.setAttribute("aria-hidden", "true");
  svg.style.display = "none";
  svg.appendChild(path);
  owner.appendChild(svg);

  let hovering = false;
  let curl = 0;   // 0 → 1: how far the wave has travelled from one end of the line to the other
  let height = 0; // 0 → 1: how tall the waves are (1 while hovered, back to 0 after)
  let lastTime = null;
  let frame = null;

  // shownCurl and shownHeight are curl and height after easing
  function draw(shownCurl, shownHeight) {
    const box = svg.getBoundingClientRect();
    const isVertical = vertical();
    const length = isVertical ? box.height : box.width;
    const across = isVertical ? box.width : box.height;
    const waveLength = cssNumber("--wave-length");
    const amplitude = (cssNumber("--wave-height") / 2) * shownHeight;
    const front = shownCurl * (length + waveLength); // the wave reaches up to here
    const middle = across / 2;
    let d = "";
    for (let along = 0; along <= length; along += 1) {
      // Just behind the front the waves grow from 0, so the line curls instead of jumping
      const grow = smooth((front - along) / waveLength);
      const side = middle - amplitude * grow * Math.sin((2 * Math.PI * along) / waveLength);
      const point = isVertical ? `${side.toFixed(2)} ${along}` : `${along} ${side.toFixed(2)}`;
      d += (along === 0 ? "M" : "L") + point;
    }
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    path.setAttribute("d", d);
    path.style.strokeWidth = cssNumber("--line-width") + (cssNumber("--wave-stroke") - cssNumber("--line-width")) * shownHeight;
    path.style.stroke = `color-mix(in srgb, var(--color-accent) ${shownHeight * 100}%, ${restColor})`;
  }

  function stop() {
    curl = 0;
    height = 0;
    svg.style.display = "none";
    owner.classList.remove("is-waving");
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastTime = null;
  }

  function step(time) {
    const dt = lastTime === null ? 0 : (time - lastTime) / 1000;
    lastTime = time;
    if (hovering) {
      curl = Math.min(1, curl + dt / cssNumber("--wave-time"));
      height = 1;
    } else {
      height = Math.max(0, height - dt / cssNumber("--wave-back-time"));
    }
    // The curl slows down a little toward the end; the stretch back is soft at both ends
    draw(1 - (1 - curl) * (1 - curl), smooth(height));

    if (!hovering && height === 0) {
      stop(); // straight again: back to the plain line
      return;
    }
    frame = requestAnimationFrame(step);
  }

  function start() {
    if (reduceMotion || !canWave()) return;
    if (height === 0) curl = 0; // a fresh curl starts again from the beginning of the line
    hovering = true;
    svg.style.display = "";
    owner.classList.add("is-waving");
    if (frame === null) {
      lastTime = null;
      frame = requestAnimationFrame(step);
    }
  }

  // Only a mouse hovers: a finger tap does not curl the line
  let mouseInside = false;
  trigger.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "mouse") return;
    mouseInside = true;
    start();
  });
  trigger.addEventListener("pointerleave", () => {
    mouseInside = false;
    hovering = false;
  });

  // A click can open a spine label: then its straight red line takes over at once
  trigger.addEventListener("click", () => {
    if (!canWave()) {
      hovering = false;
      stop();
    } else if (mouseInside) {
      start();
    }
  });
}

// Projects: the line under each name, from left to right. Straight, it is --color-line
document.querySelectorAll(".project").forEach((project) => {
  addWave({
    owner: project,
    trigger: project.querySelector(".project-name"),
    svgClass: "project-wave",
    vertical: () => false,
    restColor: "var(--color-line)",
  });
});

// Spine labels: the underline, from top to bottom. Straight, there is no line
// (an open label keeps its straight red underline instead)
document.querySelectorAll(".side-label").forEach((label) => {
  addWave({
    owner: label,
    trigger: label,
    svgClass: "side-label-wave",
    vertical: () => !phone.matches,
    restColor: "transparent",
    canWave: () => !label.classList.contains("is-active"),
  });
});

// ===== The spine: drag the middle column left or right =====
// Moving it left makes room for more image columns (up to 6, like in Figma)
// and makes the case study images bigger.
// On a phone the spine lies across the screen and is dragged up and down instead.
const spine = document.querySelector(".spine");

const SPINE_WIDTH = 40;  // same as --spine-width in styles.css
const SPINE_MIN_X = 358; // furthest left position, from the Figma frame "Desktop - 34" (6 columns)
let spineX = null;       // null = not moved yet, stays in the middle of the screen

// Puts the spine at x (its left edge), but never past the limits
function moveSpine(x) {
  const middleX = window.innerWidth / 2 - SPINE_WIDTH / 2;
  spineX = Math.min(Math.max(x, SPINE_MIN_X), middleX);
  root.style.setProperty("--spine-x", spineX + "px");
}

// Puts the spine back in the middle of the screen
function resetSpine() {
  spineX = null;
  root.style.removeProperty("--spine-x");
  root.style.removeProperty("--spine-y");
}

// ----- Phone: up and down -----
const projectsToggle = document.querySelector(".projects-toggle");
const SPINE_SNAP = 40;            // let go this close to the top: only the images are shown
const SPINE_LOWEST = 0.75;        // the spine never goes lower than 3/4 of the screen

function spineTopMin() {
  return parseFloat(getComputedStyle(root).getPropertyValue("--m-spine-top-min"));
}

function somethingOpen() {
  return indexGrid.classList.contains("is-open") || openProjectButton() !== undefined;
}

// Only the images: the spine goes up and the text above it folds away (✕ turns into +)
function showOnlyImages() {
  root.classList.add("is-collapsed");
  root.style.setProperty("--spine-y", spineTopMin() + "px");
  projectsToggle.setAttribute("aria-label", "Show the text again");
}

// Text again: the spine goes back to the middle (+ turns back into ✕)
function showText() {
  if (!root.classList.contains("is-collapsed")) return;
  root.classList.remove("is-collapsed");
  root.style.removeProperty("--spine-y");
  projectsToggle.setAttribute("aria-label", "Show only the images");
}

// ✕: only the images. +: the text again. — (nothing open): does nothing
projectsToggle.addEventListener("click", () => {
  if (root.classList.contains("is-collapsed")) {
    showText();
  } else if (somethingOpen()) {
    showOnlyImages();
  }
});

function moveSpineY(y) {
  const lowest = window.innerHeight * SPINE_LOWEST;
  const top = Math.min(Math.max(y, spineTopMin()), lowest);
  root.style.setProperty("--spine-y", top + "px");
  return top;
}

spine.addEventListener("pointerdown", (event) => {
  event.preventDefault(); // don't start selecting text (the blue highlight) while dragging

  // Remember where inside the spine it was grabbed, so it doesn't jump
  const box = spine.getBoundingClientRect();
  const grabOffset = phone.matches ? event.clientY - box.top : event.clientX - box.left;
  spine.setPointerCapture(event.pointerId);
  root.classList.add("is-dragging");

  // The mouse can report many moves between two screen refreshes.
  // Move the spine once per refresh, to the latest position, so the motion stays smooth.
  let latest = null;
  let lastTop = null;
  let waitingForFrame = false;

  function onMove(moveEvent) {
    latest = (phone.matches ? moveEvent.clientY : moveEvent.clientX) - grabOffset;
    if (waitingForFrame) return;
    waitingForFrame = true;
    requestAnimationFrame(() => {
      waitingForFrame = false;
      if (phone.matches) {
        lastTop = moveSpineY(latest);
      } else {
        moveSpine(latest);
      }
    });
  }

  function onUp() {
    spine.removeEventListener("pointermove", onMove);
    spine.removeEventListener("pointerup", onUp);
    spine.removeEventListener("pointercancel", onUp);
    root.classList.remove("is-dragging");
    window.getSelection().removeAllRanges(); // clear any highlight left over

    // Phone: pushed up near the top, it settles there and only the images are shown.
    // Pulled down from there, the text comes back where the spine was left
    if (phone.matches && lastTop !== null) {
      if (somethingOpen() && lastTop < spineTopMin() + SPINE_SNAP) {
        showOnlyImages();
      } else if (root.classList.contains("is-collapsed")) {
        root.classList.remove("is-collapsed");
        projectsToggle.setAttribute("aria-label", "Show only the images");
      }
    }
  }

  spine.addEventListener("pointermove", onMove);
  spine.addEventListener("pointerup", onUp);
  spine.addEventListener("pointercancel", onUp);
});

// ===== Phone: a number above each project image, like in the index =====
// The number is the project's number, then the image's place: 1.01, 1.02...
document.querySelectorAll(".case").forEach((images) => {
  const button = document.querySelector(`[aria-controls="${images.id}"]`);
  const projectNumber = button.querySelector(".project-number").textContent;
  [...images.children].forEach((image, place) => {
    const number = document.createElement("p");
    number.className = "case-number";
    number.textContent = `${projectNumber}.${String(place + 1).padStart(2, "0")}`;
    images.insertBefore(number, image);
  });
});

// ===== No zooming with the mouse or the trackpad =====
// Ctrl + scroll wheel, and a pinch on a trackpad (which the browser reports the same way),
// would zoom the whole page in or out. Stop it, so the page always stays at its real size.
window.addEventListener("wheel", (event) => {
  if (event.ctrlKey) {
    event.preventDefault();
  }
}, { passive: false }); // "passive: false" is needed so preventDefault is allowed

// Safari reports a trackpad pinch as a "gesture" instead
["gesturestart", "gesturechange", "gestureend"].forEach((type) => {
  document.addEventListener(type, (event) => event.preventDefault());
});

// If the window gets narrower, keep the spine inside the limits
window.addEventListener("resize", () => {
  if (spineX !== null) {
    moveSpine(spineX);
  }
});
