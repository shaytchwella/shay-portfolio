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

// ===== Opening screen: a carousel of chosen images (computer) =====
// The column of images is repeated a few times. The scroll starts on the second round,
// and whenever it gets near the first or the last round it jumps back by one round,
// to the same picture, so the images seem to go round without end.
const intro = document.getElementById("intro");
const INTRO_ROUNDS = 5; // how many times the column is repeated (enough for a tall screen)
const firstRound = intro.querySelector(".intro-set");
for (let round = 1; round < INTRO_ROUNDS; round++) {
  const copy = firstRound.cloneNode(true);
  copy.setAttribute("aria-hidden", "true"); // the same images again: screen readers skip them
  intro.appendChild(copy);
}

// Height of one round of images (with the space after it)
function introRoundHeight() {
  return firstRound.offsetHeight;
}

function showIntro() {
  showContent(intro);
  intro.closest(".pane--right").scrollTop = introRoundHeight();
}

// ===== Close the index and any open project (not the contact details) =====
function closeIndexAndProjects() {
  if (intro.classList.contains("is-open")) {
    hideContent(intro);
  }
  if (indexGrid.classList.contains("is-open")) {
    hideContent(indexGrid);
  }
  indexButton.setAttribute("aria-expanded", false);
  indexButton.classList.remove("is-active");

  markOpenProject(null);
  hideCases();
}

// ===== Project images =====
// All the case studies, in the order of the table
const cases = [...document.querySelectorAll(".case")];

function hideCases() {
  cases.forEach((images) => {
    if (images.classList.contains("is-open")) {
      hideContent(images);
    }
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
// On a computer all the projects' images open together, one project after the other,
// and the right half moves to the chosen one. On a phone only the chosen one opens.
function openProject(button) {
  const images = document.getElementById(button.getAttribute("aria-controls"));

  // Computer, images already open: just move to this project, smoothly
  if (!phone.matches && images.classList.contains("is-open")) {
    markOpenProject(button);
    scrollToCase(images, "smooth");
    return;
  }

  closeIndexAndProjects();
  markOpenProject(button);
  if (phone.matches) {
    showContent(images);
  } else {
    cases.forEach(showContent);
    scrollToCase(images, "auto");
  }
}

function closeProject() {
  markOpenProject(null);
  hideCases();
  showIntro(); // nothing is open: the opening images come back
}

// Opens one project's text in the table and closes the others' (their images stay as they are).
// null: closes them all
let scrollProject = null; // the project the scroll is on now (its text may still be waiting to open)
let waitingToOpen = null;

function markOpenProject(button) {
  scrollProject = button;
  clearTimeout(waitingToOpen);
  projectButtons.forEach((other) => {
    const isThis = other === button;
    other.closest(".project").classList.toggle("is-open", isThis);
    other.setAttribute("aria-expanded", isThis);
  });
}

// Clicking a project's name opens it. When it is open, clicking its name
// or anywhere on its text closes it
projectButtons.forEach((button) => {
  const project = button.closest(".project");
  button.addEventListener("click", () => {
    if (project.classList.contains("is-open")) {
      closeProject();
      showText(); // phone: nothing is open any more, so the spine goes back to the middle
    } else {
      openProject(button);
    }
  });
  project.querySelector(".project-details").addEventListener("click", () => {
    if (project.classList.contains("is-open")) {
      closeProject();
      showText();
    }
  });
});

// ===== Index: clicking an image opens its project =====
// The number above the image (like 3.05) says which project it belongs to (3).
// Computer only: the phone keeps the index as it is.
document.querySelectorAll(".index-item").forEach((item) => {
  item.addEventListener("click", () => {
    if (phone.matches) return;
    const projectNumber = item.querySelector("figcaption").textContent.split(".")[0];
    const button = [...projectButtons].find(
      (projectButton) => projectButton.querySelector(".project-number").textContent === projectNumber
    );
    if (button) {
      openProject(button);
    }
  });
});

// ===== Scrolling on from one project to the next (computer) =====
// The images of all the projects come one after the other, so the scroll goes on
// from the last image of a project straight into the next one.
// The table follows: when a project's images reach the middle of the right half,
// its text opens in the table and the one before closes, the same way as a click.
const rightHalf = document.querySelector(".pane--right");
const AUTO_SCROLL_MS = 1000; // while the page moves by itself to a clicked project, the table waits
let autoScrollUntil = 0;

function openProjectButton() {
  return [...projectButtons].find((button) => button.closest(".project").classList.contains("is-open"));
}

// Puts the project's first number in its usual place: in the row of "Table of Projects"
function scrollToCase(images, behavior) {
  const top = images.offsetTop - parseFloat(getComputedStyle(images).top);
  autoScrollUntil = performance.now() + (behavior === "smooth" ? AUTO_SCROLL_MS : 0);
  rightHalf.scrollTo({ top, behavior });
}

// Opening carousel: near the first or the last round, jump back by one round
rightHalf.addEventListener("scroll", () => {
  if (!intro.classList.contains("is-open")) return;
  const round = introRoundHeight();
  if (rightHalf.scrollTop < round / 2) {
    rightHalf.scrollTop += round;
  } else if (rightHalf.scrollTop > round * (INTRO_ROUNDS - 2.5)) {
    rightHalf.scrollTop -= round;
  }
}, { passive: true });

// The carousel starts on its second round, so it can be scrolled up too
window.addEventListener("load", () => {
  if (intro.classList.contains("is-open")) {
    rightHalf.scrollTop = introRoundHeight();
  }
});

rightHalf.addEventListener("scroll", () => {
  if (phone.matches || performance.now() < autoScrollUntil) return;
  if (!cases.some((images) => images.classList.contains("is-open"))) return;

  // The project whose images are in the middle of the right half (at the very end: the last one)
  const atBottom = rightHalf.scrollTop + rightHalf.clientHeight >= rightHalf.scrollHeight - 1;
  const middle = rightHalf.scrollTop + rightHalf.clientHeight / 2;
  const shown = cases.filter((images) => images.classList.contains("is-open"));
  const current = atBottom
    ? shown[shown.length - 1]
    : shown.filter((images) => images.offsetTop <= middle).pop() || shown[0];
  if (!current) return;

  const button = document.querySelector(`[aria-controls="${current.id}"]`);
  if (button !== scrollProject) {
    // The open text closes, and the line under the next project curls once where it is.
    // Only then its text opens, so the wave stays on that one line
    markOpenProject(null);
    scrollProject = button;
    const project = button.closest(".project");
    project.scrollIntoView({ block: "nearest", behavior: "smooth" });
    project.waveOnce();
    waitingToOpen = setTimeout(() => markOpenProject(button), cssNumber("--wave-time") * 1000);
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
  if (!intro.classList.contains("is-open")) {
    showIntro();
  }
  rightHalf.scrollTop = introRoundHeight(); // the carousel starts on its second round
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

  // A wave once, without the mouse (when the scroll moves on to the next project):
  // the line curls from one end to the other, then stretches back
  owner.waveOnce = () => {
    start();
    setTimeout(() => {
      if (!mouseInside) hovering = false;
    }, cssNumber("--wave-time") * 1000);
  };

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

// ===== Contact details: hover and copy (computer) =====
// Clicking a contact detail copies it, instead of opening the mail, Instagram or phone app.
// It then says "copied" with a straight red underline, until the mouse moves off it.
// (This click listener comes before addWave's, so the wave stops at once when it is copied.)
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  // Older way, for a page opened without https (like on the local network)
  const field = document.createElement("textarea");
  field.value = text;
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
  return Promise.resolve();
}

document.querySelectorAll(".contact-link").forEach((link) => {
  // The words go in their own span, so changing them leaves the wave drawing in place
  const text = link.textContent;
  const words = document.createElement("span");
  words.textContent = text;
  link.replaceChildren(words);

  link.addEventListener("click", (event) => {
    if (phone.matches) return; // a phone opens the app as usual
    event.preventDefault();
    copyText(text);
    words.textContent = "copied";
    link.classList.add("is-copied");
  });

  link.addEventListener("pointerleave", () => {
    words.textContent = text;
    link.classList.remove("is-copied");
  });

  addWave({
    owner: link,
    trigger: link,
    svgClass: "contact-wave",
    vertical: () => false,
    restColor: "transparent",
    canWave: () => !link.classList.contains("is-copied"),
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

// The spine goes up to --m-spine-top-min, and down only back to where it started: the middle
function moveSpineY(y) {
  const spineHeight = parseFloat(getComputedStyle(root).getPropertyValue("--m-spine-height"));
  const lowest = window.innerHeight / 2 - spineHeight / 2;
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

  // Phone: dragging down from the top brings the text back while the spine moves
  // (it fades in from the pink band). Let go near the top again and it folds away again
  if (phone.matches && root.classList.contains("is-collapsed")) {
    root.classList.remove("is-collapsed");
    projectsToggle.setAttribute("aria-label", "Show only the images");
  }

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

    // Phone: pushed up near the top, it settles there and only the images are shown
    // (also after a tap on the spine without moving it)
    if (phone.matches) {
      const top = lastTop !== null ? lastTop : spine.getBoundingClientRect().top;
      if (somethingOpen() && top < spineTopMin() + SPINE_SNAP) {
        showOnlyImages();
      }
    }
  }

  spine.addEventListener("pointermove", onMove);
  spine.addEventListener("pointerup", onUp);
  spine.addEventListener("pointercancel", onUp);
});

// ===== A number above each project image, like in the index =====
// The number is the project's number, then the image's place: 1.01, 1.02...
// A standing image sits on the right: its number moves with it and starts where it starts.
// styles.css works out the number's width from the image's proportions (--ratio)
document.querySelectorAll(".case").forEach((images) => {
  const button = document.querySelector(`[aria-controls="${images.id}"]`);
  const projectNumber = button.querySelector(".project-number").textContent;
  [...images.children].forEach((image, place) => {
    const number = document.createElement("p");
    number.className = "case-number";
    number.textContent = `${projectNumber}.${String(place + 1).padStart(2, "0")}`;
    images.insertBefore(number, image);

    if (image.classList.contains("case-poster")) {
      number.classList.add("case-number--poster");
    } else if (image.classList.contains("case-image--portrait")) {
      number.classList.add("case-number--portrait");
      // A standing video knows its size once its first details have loaded
      const isVideo = image.tagName === "VIDEO";
      const setRatio = () => number.style.setProperty("--ratio", isVideo
        ? image.videoWidth / image.videoHeight
        : image.naturalWidth / image.naturalHeight);
      if (isVideo ? image.readyState >= 1 : image.complete) setRatio();
      image.addEventListener(isVideo ? "loadedmetadata" : "load", setRatio);
    }
  });
});

// ===== Magnifying square on the project images (computer) =====
// Pressing the mouse on a project image grows the square cursor into a big square
// that shows the image up close, under the mouse. Letting go brings back the small cursor.
// Inside the square is a copy of the image, made bigger and moved so the point
// under the mouse stays in the middle of the square.
const lens = document.createElement("div");
lens.className = "zoom-lens";
lens.setAttribute("aria-hidden", "true");
document.body.appendChild(lens);

let zoomed = null; // the image being looked at, and its copy inside the square
let lastPointer = { x: 0, y: 0 };

function moveLens() {
  if (!zoomed) return;
  const size = cssNumber("--lens-size");
  const zoom = cssNumber("--lens-zoom");
  const box = zoomed.item.getBoundingClientRect();
  const x = lastPointer.x - box.left; // the point under the mouse, inside the image
  const y = lastPointer.y - box.top;
  lens.style.left = `${lastPointer.x - size / 2}px`;
  lens.style.top = `${lastPointer.y - size / 2}px`;
  zoomed.copy.style.transform = `translate(${size / 2 - x * zoom}px, ${size / 2 - y * zoom}px) scale(${zoom})`;
}

function stopZoom() {
  if (!zoomed) return;
  zoomed = null;
  lens.replaceChildren();
  lens.classList.remove("is-shown");
  root.classList.remove("is-zooming");
}

rightHalf.addEventListener("pointerdown", (event) => {
  if (phone.matches || event.pointerType !== "mouse" || event.button !== 0) return;
  // An image (or a framed photo) of a project. Not the numbers, and not the videos
  const item = event.target.closest(".case > :not(.case-number):not(video)");
  if (!item) return;
  event.preventDefault(); // don't start dragging the image

  // A copy of the image at its size on the page; moveLens makes it bigger
  const box = item.getBoundingClientRect();
  const copy = item.cloneNode(true);
  Object.assign(copy.style, {
    position: "absolute",
    left: "0",
    top: "0",
    margin: "0",
    width: `${box.width}px`,
    height: `${box.height}px`,
    maxWidth: "none",
    maxHeight: "none",
    transformOrigin: "0 0",
  });
  lens.replaceChildren(copy);
  zoomed = { item, copy };
  lastPointer = { x: event.clientX, y: event.clientY };
  moveLens();
  lens.classList.add("is-shown");
  root.classList.add("is-zooming");
});

window.addEventListener("pointermove", (event) => {
  lastPointer = { x: event.clientX, y: event.clientY };
  moveLens();
});
rightHalf.addEventListener("scroll", moveLens, { passive: true }); // scrolling while pressing
window.addEventListener("pointerup", stopZoom);
window.addEventListener("pointercancel", stopZoom);
window.addEventListener("blur", stopZoom);

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
