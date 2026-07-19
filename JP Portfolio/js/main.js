/* ============================================================
   COS 106 PORTFOLIO SCRIPT
   Author: Musa James Paul

   This file only runs code once the browser has finished parsing
   the whole page, because the <script> tag sits at the bottom of
   <body> in every HTML file, every element referenced below is
   guaranteed to already exist by the time this code runs.
   ============================================================ */

/* ============================================================
   1. STICKY NAV BACKGROUND ON SCROLL
   ------------------------------------------------------------
   The nav starts transparent so it sits cleanly over the hero.
   Once the page has scrolled a little, a "scrolled" class is
   added, which CSS uses to fade in a solid background. This is
   checked on every scroll event, so the class is only added or
   removed when the state actually needs to change, adding it on
   every single scroll tick would be wasteful. */
const siteHeader = document.getElementById("site-header");
const SCROLL_THRESHOLD = 60; // pixels scrolled before the nav gets a background

function handleHeaderScroll() {
  const scrolledPastThreshold = window.scrollY > SCROLL_THRESHOLD;
  siteHeader.classList.toggle("scrolled", scrolledPastThreshold);
}

window.addEventListener("scroll", handleHeaderScroll);
handleHeaderScroll(); // runs once immediately in case the page loads already scrolled

/* ============================================================
   2. MOBILE MENU TOGGLE
   ------------------------------------------------------------
   Below the tablet breakpoint the nav links are hidden off-canvas
   in CSS. Clicking the hamburger button adds a "nav-open" class to
   <body>, which CSS uses to slide the menu into view and morph the
   hamburger icon into an X. The aria-expanded attribute is kept in
   sync too, so screen readers announce whether the menu is
   currently open or closed. */
const menuToggle = document.getElementById("menu-toggle");

menuToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

/* Closes the mobile menu automatically after a link is tapped, so
   the panel does not stay open covering the page once the user has
   already navigated away. */
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

/* ============================================================
   3. TERMINAL BOOT / TYPING ANIMATION
   ------------------------------------------------------------
   Each line inside the hero terminal has its full text sitting in
   a data-line attribute in the HTML (so it is present immediately
   for anyone with JavaScript disabled, or using a screen reader).
   This script reads that text back out, clears the visible line,
   and types it back in one character at a time using
   setTimeout, moving on to the next line only once the current
   one finishes. This demonstrates arrays (the collected lines),
   functions, and DOM manipulation, all required by the brief. */
const typeLines = Array.from(document.querySelectorAll(".type-line"));
const TYPE_SPEED_MS = 28;   // delay between each character
const LINE_PAUSE_MS = 250;  // pause between finishing one line and starting the next

function typeLine(lineElement, onDone) {
  const fullText = lineElement.dataset.line;
  const target = lineElement.querySelector(".typed");
  let charIndex = 0;

  function typeNextChar() {
    if (charIndex < fullText.length) {
      target.textContent += fullText.charAt(charIndex);
      charIndex += 1;
      setTimeout(typeNextChar, TYPE_SPEED_MS);
    } else {
      onDone();
    }
  }

  typeNextChar();
}

function runBootSequence(lines) {
  if (lines.length === 0) return;

  const [currentLine, ...remainingLines] = lines;
  typeLine(currentLine, () => {
    setTimeout(() => runBootSequence(remainingLines), LINE_PAUSE_MS);
  });
}

/* PREFERS-REDUCED-MOTION CHECK: If the visitor's operating system
   has motion reduction turned on, skip the typing animation
   entirely and just show the full text straight away instead. */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  typeLines.forEach((line) => {
    line.querySelector(".typed").textContent = line.dataset.line;
  });
} else {
  runBootSequence(typeLines);
}

/* ============================================================
   4. SCROLL REVEAL USING INTERSECTION OBSERVER
   ------------------------------------------------------------
   Rather than listening to the scroll event again (which fires
   very frequently and is expensive to compute against every
   element's position by hand), the Intersection Observer API lets
   the browser itself notify this script only when an observed
   element actually enters or leaves the viewport. Every section
   heading and project card gets the .reveal class added here in
   JavaScript, then CSS handles the actual fade/slide transition
   once .in-view is applied. */
const revealTargets = document.querySelectorAll(
  ".section-heading, .about-grid, .project-card, .cta-section"
);

revealTargets.forEach((el) => el.classList.add("reveal"));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        // Stops watching this element once it has revealed itself,
        // there is no need to keep checking it on every scroll.
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 } // fires once 15% of the element is visible
);

revealTargets.forEach((el) => revealObserver.observe(el));

/* ============================================================
   5. BACKGROUND MUSIC CONSENT POPUP
   ------------------------------------------------------------
   Browsers will not let a page autoplay audio with sound until
   the visitor has interacted with it somehow, this is a deliberate
   anti-annoyance rule built into every major browser, not a bug.
   This popup solves two problems at once: it asks permission, and
   the click itself counts as the "user interaction" the browser
   needs before it will allow audio.play() to actually produce
   sound. The audio element itself lives in index.html with the
   loop attribute set, so once it starts playing it keeps playing
   in the background for as long as the visitor stays on the page,
   no matter which section they scroll to. */
const musicBackdrop = document.getElementById("music-popup-backdrop");
const musicPopup = document.getElementById("music-popup");
const musicYesBtn = document.getElementById("music-yes");
const musicNoBtn = document.getElementById("music-no");
const bgAudio = document.getElementById("bg-audio");
const audioToggle = document.getElementById("audio-toggle");
const audioToggleText = audioToggle.querySelector(".audio-toggle-text");
/* Hides the popup and, if the visitor is using a screen reader,
   returns keyboard focus to the page body so they are not left
   focused on an element that no longer exists on screen. */
function closeMusicPopup() {
  musicBackdrop.hidden = true;
  document.body.classList.remove("popup-open");
}

function showMusicPopup() {
  musicBackdrop.hidden = false;
  document.body.classList.add("popup-open"); // CSS uses this to stop background scrolling while the popup is open
  musicPopup.focus();
}

/* "Yes" starts playback and closes the popup. .play() returns a
   Promise, wrapped in .catch() here because some browsers can still
   reject it in edge cases (for example if the audio file has not
   been supplied yet), this stops that rejection from showing up as
   an uncaught error in the console and breaking the rest of the
   page's JavaScript. */
musicYesBtn.addEventListener("click", () => {
  bgAudio.play().catch((error) => {
    console.warn("Background audio could not start:", error.message);
  });
  closeMusicPopup();
});

/* "No thanks" just closes the popup, the audio element is simply
   never told to play, so it stays silent. */
musicNoBtn.addEventListener("click", () => {
  closeMusicPopup();
});

/* Runs once the page has finished loading. A short delay feels less
   jarring than a popup slamming into view the instant the page
   paints, it gives the hero a moment to be seen first. */
window.addEventListener("load", () => {
  setTimeout(showMusicPopup, 600);
});
/* ============================================================
   5b. AUDIO ON/OFF TOGGLE
   ------------------------------------------------------------
   The popup above only asks once, right after the page loads.
   This button lives in the nav on every page instead, so a visitor
   can turn the background track on or off at any point while they
   browse, not only in the moment the popup happens to be showing.
   Rather than tracking play/paused state by hand, the toggle just
   listens to the audio element's own native "play" and "pause"
   events, so its dot and label always match what is actually
   happening, no matter whether playback was started from this
   button, from the popup's "Yes" button, or paused by the browser
   for some other reason. */
function setAudioToggleState(isPlaying) {
  audioToggle.classList.toggle("is-playing", isPlaying);
  audioToggle.setAttribute("aria-pressed", String(isPlaying));
  audioToggle.setAttribute("aria-label", isPlaying ? "Turn background music off" : "Turn background music on");
  audioToggleText.textContent = isPlaying ? "Audio: On" : "Audio: Off";
}

bgAudio.addEventListener("play", () => setAudioToggleState(true));
bgAudio.addEventListener("pause", () => setAudioToggleState(false));

/* Clicking the toggle simply asks the audio element to play or
   pause depending on its current state, .play()'s Promise is
   caught for the same reason as the popup's "Yes" button above. */
audioToggle.addEventListener("click", () => {
  if (bgAudio.paused) {
    bgAudio.play().catch((error) => {
      console.warn("Background audio could not start:", error.message);
    });
  } else {
    bgAudio.pause();
  }
});
/* ============================================================
   6. ACADEMIC PLANNER (TASK MANAGER)
   ------------------------------------------------------------
   This whole block only runs its setup if #task-form actually
   exists on the current page. main.js is shared across every page
   of the site, but only planner.html has the planner markup, so
   without this guard, every other page would throw an error trying
   to attach a submit listener to something that is not there. */
const taskForm = document.getElementById("task-form");

if (taskForm) {
  const taskInput = document.getElementById("task-input");
  const taskList = document.getElementById("task-list");
  const taskCounter = document.getElementById("task-counter");
  const taskEmpty = document.getElementById("task-empty");

  /* STORAGE KEY: One fixed string used every time this script reads
     from or writes to localStorage, kept as a constant so the exact
     same key is never accidentally mistyped in two different places. */
  const STORAGE_KEY = "cos106-planner-tasks";

  /* TASKS ARRAY: The single source of truth for everything on this
     page. The list on screen is never edited directly, instead this
     array is changed first (push a new task, flip a "completed"
     flag, filter one out) and then renderTasks() rebuilds the whole
     visible list to match it. This "data drives the DOM" pattern is
     the core idea behind DOM manipulation in this project, rather
     than manually creating and removing one <li> at a time by hand. */
  let tasks = loadTasks();

  /* Reads any previously saved tasks back out of the browser's
     localStorage. localStorage only stores strings, so the saved
     data is stored as a JSON string and has to be parsed back into
     a real array with JSON.parse. Wrapped in try/catch because
     malformed or missing data would otherwise throw and stop the
     rest of the script from running. */
  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn("Could not load saved tasks:", error.message);
      return [];
    }
  }

  /* Writes the current tasks array back to localStorage as a JSON
     string, called after every single change (add, toggle, delete)
     so a refresh or a later visit never loses anything. */
  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  /* Builds one <li> element for a single task object. Kept as its
     own function rather than inlined inside renderTasks() because it
     is easier to read, and it is the one place that needs updating
     if a task's markup ever changes. */
  function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " task-item-done" : "");
    li.dataset.id = task.id;

    /* COMPLETE TOGGLE: A real <button> with an ASCII style checkbox
       inside it rather than a native <input type="checkbox">, this
       keeps full styling control over the checked/unchecked look
       while still being a properly focusable, clickable, keyboard
       operable control (Enter and Space both trigger a button by
       default in every browser). */
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "task-toggle";
    toggleBtn.setAttribute("aria-label", task.completed ? "Mark task as not completed" : "Mark task as completed");
    toggleBtn.innerHTML = `<span class="task-checkbox" aria-hidden="true">${task.completed ? "[x]" : "[ ]"}</span>`;
    toggleBtn.addEventListener("click", () => toggleTask(task.id));

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = task.text; // textContent, not innerHTML, so a task typed with < or > characters cannot break the page's markup

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "task-delete";
    deleteBtn.setAttribute("aria-label", `Delete task: ${task.text}`);
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.append(toggleBtn, span, deleteBtn);
    return li;
  }

  /* Clears out the current list and rebuilds it from scratch based
     on whatever is currently in the tasks array, then updates the
     counter text and switches the empty state message on or off.
     Called after every single change so the screen never falls out
     of sync with the underlying data. */
  function renderTasks() {
    taskList.innerHTML = "";
    tasks.forEach((task) => taskList.appendChild(createTaskElement(task)));

    const completedCount = tasks.filter((task) => task.completed).length;
    taskCounter.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}, ${completedCount} completed`;

    const hasTasks = tasks.length > 0;
    taskList.hidden = !hasTasks;
    taskEmpty.hidden = hasTasks;
  }

  /* Adds one new task object to the array. Date.now() as an id is
     good enough here, it produces a different number every single
     millisecond, which is more than enough to keep task ids unique
     within one planner session. */
  function addTask(text) {
    tasks.push({ id: Date.now(), text: text, completed: false });
    saveTasks();
    renderTasks();
  }

  /* Flips a single task's completed flag on or off by matching its
     id. .map() returns a brand new array rather than mutating the
     old one in place, which is a safer habit in JavaScript, nothing
     else that might be holding a reference to the old array gets
     silently changed out from under it. */
  function toggleTask(id) {
    tasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks();
    renderTasks();
  }

  /* Removes a task by id using .filter(), which builds a new array
     containing every task except the one whose id matches. */
  function deleteTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
    saveTasks();
    renderTasks();
  }

  /* FORM SUBMIT: preventDefault() stops the browser's normal form
     behaviour, which is to reload the page and send the data
     somewhere, neither of which this planner wants. .trim() strips
     leading/trailing whitespace so someone cannot submit a task that
     is just spaces, and the empty check after that stops a blank
     task being added at all. */
  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = taskInput.value.trim();
    if (text === "") return;
    addTask(text);
    taskInput.value = "";
    taskInput.focus();
  });

  renderTasks(); // draws whatever was loaded from localStorage the moment the page is ready
}

/* ============================================================
   7. CONTACT FORM VALIDATION
   ------------------------------------------------------------
   Same page guard pattern as the planner above, everything in this
   block only sets up if #contact-form actually exists, so this file
   can stay shared across every page without erroring anywhere else. */
const contactForm = document.getElementById("contact-form");

if (contactForm) {
  const nameInput = document.getElementById("name-input");
  const emailInput = document.getElementById("email-input");
  const phoneInput = document.getElementById("phone-input");
  const messageInput = document.getElementById("message-input");
  const formSuccess = document.getElementById("form-success");

  /* EMAIL PATTERN: A practical, not exhaustive, email shape check,
     it requires something, then @, then something, then a dot, then
     something, which catches the vast majority of typos (missing @,
     missing domain) without trying to implement the full, notoriously
     complicated official email specification. */
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* PHONE PATTERN: Digits only, as the brief specifically requires,
     no spaces, dashes, or plus signs allowed. \d matches any digit
     0 to 9, + means one or more, and the ^ and $ anchors make sure
     the ENTIRE value matches this pattern, not just part of it. */
  const PHONE_PATTERN = /^\d+$/;

  /* Shared helper for showing or clearing one field's error message.
     Takes the input element, its matching error <p>, and the message
     to show (an empty string clears it). Also toggles an
     "field-invalid" class on the input itself, which CSS uses to
     draw a red-tinted border on that specific field, so the visitor
     gets both a coloured cue and a written reason together. */
  function setFieldError(input, errorEl, message) {
    if (message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
      input.classList.add("field-invalid");
    } else {
      errorEl.textContent = "";
      errorEl.hidden = true;
      input.classList.remove("field-invalid");
    }
  }

  /* Runs all four field checks and returns true only if every single
     one passed. Each check is written as its own small "if invalid,
     set the error and remember that, otherwise clear the error"
     block, all four run every time (not stopping at the first
     failure), so the visitor sees every problem with their form at
     once instead of fixing one error only to immediately hit the
     next one on a second attempt. */
  function validateForm() {
    let isValid = true;

    const nameValue = nameInput.value.trim();
    if (nameValue === "") {
      setFieldError(nameInput, document.getElementById("name-error"), "Please enter your full name.");
      isValid = false;
    } else {
      setFieldError(nameInput, document.getElementById("name-error"), "");
    }

    const emailValue = emailInput.value.trim();
    if (emailValue === "") {
      setFieldError(emailInput, document.getElementById("email-error"), "Please enter your email address.");
      isValid = false;
    } else if (!EMAIL_PATTERN.test(emailValue)) {
      setFieldError(emailInput, document.getElementById("email-error"), "Please enter a valid email address, e.g. name@example.com.");
      isValid = false;
    } else {
      setFieldError(emailInput, document.getElementById("email-error"), "");
    }

    const phoneValue = phoneInput.value.trim();
    if (phoneValue === "") {
      setFieldError(phoneInput, document.getElementById("phone-error"), "Please enter your phone number.");
      isValid = false;
    } else if (!PHONE_PATTERN.test(phoneValue)) {
      setFieldError(phoneInput, document.getElementById("phone-error"), "Phone number must contain digits only, no spaces or symbols.");
      isValid = false;
    } else {
      setFieldError(phoneInput, document.getElementById("phone-error"), "");
    }

    const messageValue = messageInput.value.trim();
    if (messageValue === "") {
      setFieldError(messageInput, document.getElementById("message-error"), "Please enter a message.");
      isValid = false;
    } else {
      setFieldError(messageInput, document.getElementById("message-error"), "");
    }

    return isValid;
  }

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault(); // this is a static site, there is nowhere for a real submission to go, so the default browser submit is always stopped here

    formSuccess.hidden = true; // hides any success message left over from a previous successful submit

    if (validateForm()) {
      contactForm.reset();
      formSuccess.hidden = false;
    }
  });

  /* LIVE RE-VALIDATION: Once a visitor has already tried to submit
     once, re-checking each field as they type (on the "input" event)
     clears an error the moment it is fixed, rather than making them
     hit Send Message again just to see the red text disappear. */
  [nameInput, emailInput, phoneInput, messageInput].forEach((input) => {
    input.addEventListener("input", () => {
      if (input.classList.contains("field-invalid")) {
        validateForm();
      }
    });
  });
}
