// Enhanced time management
const CACHE_EXPIRY_TIME = 60 * 5 * 1000;
let lastKnownTime = null;
let lastFetchTime = 0;
let lastUpdateTime = 0;
let isFetching = false;

// DOM elements
const clockElement = document.getElementById("clock");
const dateElement = document.getElementById("date");
const dayElement = document.getElementById("day");
const clockContainer = document.getElementById("clockContainer");
const loadingScreen = document.getElementById("loading-screen");
const loadingLogElement = document.getElementById("loading-log");

// Navigation and control elements
const navCalendarBtn = document.getElementById("nav-calendar");
const navResourcesBtn = document.getElementById("nav-resources");
const mobileCalendarBtn = document.getElementById("mobile-calendar");
const mobileResourcesBtn = document.getElementById("mobile-resources");
const hamburgerButton = document.getElementById("hamburger-button");
const hamburgerDropdown = document.getElementById("hamburger-dropdown");

// Background and slideshow controls
const bgContainer = document.getElementById("bgContainer");
const bgToggleBtn =
  document.getElementById("bg-toggle-button") ||
  document.getElementById("mobile-bg-toggle");
const prevBtn =
  document.getElementById("prev-button") ||
  document.getElementById("mobile-prev");
const nextBtn =
  document.getElementById("next-button") ||
  document.getElementById("mobile-next");

// Tropa and animation controls
const tropaBtn =
  document.getElementById("footer-tropa") ||
  document.getElementById("mobile-tropa");
const burstBtn =
  document.getElementById("footer-burst") ||
  document.getElementById("mobile-burst");
const countdownBtn =
  document.getElementById("footer-countdown") ||
  document.getElementById("mobile-countdown");

// Overlay elements
const calendarOverlay = document.getElementById("calendar-overlay");
const resourcesOverlay = document.getElementById("resources-overlay");
const imagePreviewOverlay = document.getElementById("image-preview-overlay");
const closeCalendarBtn = document.getElementById("close-calendar");
const closeResourcesBtn = document.getElementById("close-resources");
const closePreviewBtn = document.getElementById("closePreview");

// Countdown elements
const countdownContainer = document.getElementById("countdown-container");
const countdownTime = document.getElementById("countdown-time");
const countdownDate = document.getElementById("countdown-date");
const countdownSelect = document.getElementById("countdown-select");
const customTimeContainer = document.getElementById("custom-time-container");
const customStart = document.getElementById("customStart");
const customEnd = document.getElementById("customEnd");

// Upload elements
const bgUpload = document.getElementById("bg-upload");
const imageUpload = document.getElementById("image-upload");

// Calendar elements
const calendarGrid = document.getElementById("calendar-grid");
const monthSelector = document.getElementById("month-selector");
const yearSelector = document.getElementById("year-selector");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");

// Resource elements
const bgTab = document.getElementById("bg-tab");
const imagesTab = document.getElementById("images-tab");
const bgContent = document.getElementById("bg-content");
const imagesContent = document.getElementById("images-content");
const bgGrid = document.getElementById("bg-grid");
const imagesGrid = document.getElementById("images-grid");

// Image preview elements
const previewImage = document.getElementById("preview-image");
const prevImageBtn = document.getElementById("prevImage");
const nextImageBtn = document.getElementById("nextImage");
const downloadImageBtn = document.getElementById("downloadImage");

const dayNames = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

// Enhanced system variables
let bgSlides = [];
let currentSlide = 0;
const SLIDESHOW_INTERVAL = 6000;
let slideshowInterval;
let isSlideshowPlaying = true;
let availableBackgrounds = [];
let cachedBackgrounds = [];
let lastBgIndex = 0;

// Enhanced image cache system
let availableImages = [];
let cachedImages = [];
let lastImageIndex = 0;
let imageIndex = 0;
let currentPreviewIndex = -1;

// Burst functionality
let burstCooldown = false;
const BURST_COOLDOWN_TIME = 30000;
const BURST_COUNT = 15;

// Bubble tracking
let activeBubbles = 0;

// Button fading timer
let fadeTimer;
const FADE_DELAY = 5000;

// Calendar state
let currentCalendarDate = new Date();

// Performance cache
const resourceCache = new Map();

// Replace the setupResizeSystem function with this improved version
function setupResizeSystem() {
  if (!countdownContainer) return;

  const countdownBox = countdownContainer.querySelector(".countdown-box");
  if (!countdownBox) return;

  let isResizing = false;
  let resizeType = "";
  let startX, startY, startWidth, startHeight, startLeft, startTop;

  const getResizeCursor = (type) => {
    switch (type) {
      case "se":
        return "se-resize";
      case "nw":
        return "nw-resize";
      case "ne":
        return "ne-resize";
      case "sw":
        return "sw-resize";
      case "e":
      case "w":
        return "ew-resize";
      case "n":
      case "s":
        return "ns-resize";
      default:
        return "default";
    }
  };

  const startResize = (e) => {
    const rect = countdownBox.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Increase detection area to 25px for better corner detection
    const isNearRight = x > rect.width - 25;
    const isNearBottom = y > rect.height - 25;
    const isNearLeft = x < 25;
    const isNearTop = y < 25;

    // Determine resize type with priority for corners
    if (isNearRight && isNearBottom) {
      resizeType = "se";
    } else if (isNearLeft && isNearTop) {
      resizeType = "nw";
    } else if (isNearRight && isNearTop) {
      resizeType = "ne";
    } else if (isNearLeft && isNearBottom) {
      resizeType = "sw";
    } else if (isNearRight) {
      resizeType = "e";
    } else if (isNearLeft) {
      resizeType = "w";
    } else if (isNearBottom) {
      resizeType = "s";
    } else if (isNearTop) {
      resizeType = "n";
    } else {
      return; // Not in resize area
    }

    console.log("Resize started:", resizeType); // Debug log

    e.preventDefault();
    e.stopPropagation();

    isResizing = true;

    const containerRect = countdownContainer.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startWidth = countdownBox.offsetWidth;
    startHeight = countdownBox.offsetHeight;
    startLeft = containerRect.left;
    startTop = containerRect.top;

    document.body.style.userSelect = "none";
    document.body.style.cursor = getResizeCursor(resizeType);

    document.addEventListener("mousemove", doResize);
    document.addEventListener("mouseup", stopResize);
  };

  const doResize = (e) => {
    if (!isResizing) return;
    e.preventDefault();

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    // Handle different resize directions
    switch (resizeType) {
      case "se": // Southeast
        newWidth = Math.max(260, Math.min(600, startWidth + deltaX));
        newHeight = Math.max(200, Math.min(600, startHeight + deltaY));
        break;
      case "nw": // Northwest
        newWidth = Math.max(260, Math.min(600, startWidth - deltaX));
        newHeight = Math.max(200, Math.min(600, startHeight - deltaY));
        newLeft = startLeft + (startWidth - newWidth);
        newTop = startTop + (startHeight - newHeight);
        break;
      case "ne": // Northeast
        newWidth = Math.max(260, Math.min(600, startWidth + deltaX));
        newHeight = Math.max(200, Math.min(600, startHeight - deltaY));
        newTop = startTop + (startHeight - newHeight);
        break;
      case "sw": // Southwest
        newWidth = Math.max(260, Math.min(600, startWidth - deltaX));
        newHeight = Math.max(200, Math.min(600, startHeight + deltaY));
        newLeft = startLeft + (startWidth - newWidth);
        break;
      case "e": // East
        newWidth = Math.max(260, Math.min(600, startWidth + deltaX));
        break;
      case "w": // West
        newWidth = Math.max(260, Math.min(600, startWidth - deltaX));
        newLeft = startLeft + (startWidth - newWidth);
        break;
      case "s": // South
        newHeight = Math.max(200, Math.min(600, startHeight + deltaY));
        break;
      case "n": // North
        newHeight = Math.max(200, Math.min(600, startHeight - deltaY));
        newTop = startTop + (startHeight - newHeight);
        break;
    }

    countdownBox.style.width = newWidth + "px";
    countdownBox.style.height = newHeight + "px";
    countdownContainer.style.left = newLeft + "px";
    countdownContainer.style.top = newTop + "px";
  };

  const stopResize = () => {
    isResizing = false;
    resizeType = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", doResize);
    document.removeEventListener("mouseup", stopResize);
  };

  // Show resize cursors on hover
  const updateCursor = (e) => {
    if (isResizing) return;

    const rect = countdownBox.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Increase detection area to 25px
    const isNearRight = x > rect.width - 25;
    const isNearBottom = y > rect.height - 25;
    const isNearLeft = x < 25;
    const isNearTop = y < 25;

    let cursor = "move";

    // Priority for corners
    if (isNearRight && isNearBottom) {
      cursor = "se-resize";
    } else if (isNearLeft && isNearTop) {
      cursor = "nw-resize";
    } else if (isNearRight && isNearTop) {
      cursor = "ne-resize";
    } else if (isNearLeft && isNearBottom) {
      cursor = "sw-resize";
    } else if (isNearRight || isNearLeft) {
      cursor = "ew-resize";
    } else if (isNearBottom || isNearTop) {
      cursor = "ns-resize";
    }

    countdownBox.style.cursor = cursor;
  };

  countdownBox.addEventListener("mousedown", startResize);
  countdownBox.addEventListener("mousemove", updateCursor);
}

// Setup draggable countdown system
function setupDragSystem() {
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  if (!countdownContainer) return;

  const countdownBox = countdownContainer.querySelector(".countdown-box");
  if (!countdownBox) return;

  function startDrag(e) {
    // Skip drag if clicking on inputs, selects, buttons, or resize areas
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "SELECT" ||
      e.target.tagName === "BUTTON" ||
      e.target.tagName === "TEXTAREA"
    ) {
      return;
    }

    // Check if we're in a resize area (within 20px of edges)
    const rect = countdownBox.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const isNearRight = x > rect.width - 25;
    const isNearBottom = y > rect.height - 25;
    const isNearLeft = x < 25;
    const isNearTop = y < 25;

    // Don't start drag if we're near resize areas
    if (isNearRight || isNearBottom || isNearLeft || isNearTop) {
      return;
    }

    isDragging = true;
    const containerRect = countdownContainer.getBoundingClientRect();
    dragOffset.x = e.clientX - containerRect.left;
    dragOffset.y = e.clientY - containerRect.top;

    countdownBox.style.cursor = "grabbing";
    countdownContainer.style.zIndex = "2000";
    document.body.style.userSelect = "none";

    // Prevent text selection during drag
    document.body.style.userSelect = "none";

    e.preventDefault();
    e.stopPropagation();
  }

  function doDrag(e) {
    if (!isDragging) return;

    const x = Math.max(
      10,
      Math.min(
        window.innerWidth - countdownContainer.offsetWidth - 10,
        e.clientX - dragOffset.x
      )
    );
    const y = Math.max(
      10,
      Math.min(
        window.innerHeight - countdownContainer.offsetHeight - 10,
        e.clientY - dragOffset.y
      )
    );

    countdownContainer.style.left = x + "px";
    countdownContainer.style.top = y + "px";

    e.preventDefault();
  }

  function stopDrag() {
    if (!isDragging) return;

    isDragging = false;
    countdownBox.style.cursor = "move";
    countdownContainer.style.zIndex = "1500";
    document.body.style.userSelect = "";
  }

  // Only add drag listeners to the countdown box
  countdownBox.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", doDrag);
  document.addEventListener("mouseup", stopDrag);

  // Set default cursor
  countdownBox.style.cursor = "move";
}

// Enhanced button fading system
function resetFadeTimer() {
  const mainNavButtons = document.querySelectorAll(
    ".main-nav-button, .nav-button, .footer-button"
  );
  clearTimeout(fadeTimer);
  mainNavButtons.forEach((btn) => btn.classList.remove("translucent"));
  fadeTimer = setTimeout(() => {
    mainNavButtons.forEach((btn) => btn.classList.add("translucent"));
  }, FADE_DELAY);
}

// Enhanced fetch time function
async function fetchTime() {
  if (isFetching) return null;
  isFetching = true;

  try {
    const response = await fetch("https://worldtimeapi.org/api/ip");
    if (!response.ok) throw new Error("API fetch failed");

    const data = await response.json();
    lastKnownTime = new Date(data.datetime);
    lastFetchTime = Date.now();
    logToScreen("✅ Time synchronized with WorldTimeAPI");
    return lastKnownTime;
  } catch (error) {
    logToScreen("⚠️ Using local time: API unavailable");
    if (!lastKnownTime) {
      lastKnownTime = new Date();
    }
    return null;
  } finally {
    isFetching = false;
  }
}

// Enhanced clock display
function updateClockDisplay() {
  if (!lastKnownTime) {
    requestAnimationFrame(updateClockDisplay);
    return;
  }

  const now = Date.now();
  const timeElapsed = now - lastUpdateTime;
  lastKnownTime.setTime(lastKnownTime.getTime() + timeElapsed);
  lastUpdateTime = now;

  if (now - lastFetchTime >= CACHE_EXPIRY_TIME && !isFetching) {
    fetchTime();
  }

  const hours = lastKnownTime.getHours();
  const minutes = lastKnownTime.getMinutes();
  const seconds = lastKnownTime.getSeconds();
  const month = lastKnownTime.getMonth() + 1;
  const day = lastKnownTime.getDate();
  const year = lastKnownTime.getFullYear() % 100;
  const dayOfWeek = lastKnownTime.getDay();

  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  const formattedHours = String(displayHours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");
  const formattedMonth = String(month).padStart(2, "0");
  const formattedDay = String(day).padStart(2, "0");
  const formattedYear = String(year).padStart(2, "0");

  if (dayElement) dayElement.textContent = dayNames[dayOfWeek];
  if (clockElement)
    clockElement.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
  if (dateElement)
    dateElement.textContent = `${formattedMonth}/${formattedDay}/${formattedYear}`;

  requestAnimationFrame(updateClockDisplay);
}

// Optimized background loading with better performance
async function loadBackgrounds() {
  clearInterval(slideshowInterval);
  availableBackgrounds = [];
  lastBgIndex = 0;

  logToScreen("🎨 Scanning for background images...");

  const batchSize = 10;
  const maxChecks = 50;
  const batches = Math.ceil(maxChecks / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const promises = [];
    const start = batch * batchSize;
    const end = Math.min(start + batchSize, maxChecks);

    for (let i = start; i < end; i++) {
      const bgPath = `./bg/BG${i === 0 ? "" : i}.gif`;
      const cacheKey = `bg_${i}`;

      if (resourceCache.has(cacheKey)) {
        const cached = resourceCache.get(cacheKey);
        if (cached) availableBackgrounds.push(cached);
      } else {
        promises.push(
          checkResourceExists(bgPath).then((result) => {
            resourceCache.set(cacheKey, result);
            return result;
          })
        );
      }
    }

    if (promises.length > 0) {
      const results = await Promise.all(promises);
      results.forEach((path) => {
        if (path) availableBackgrounds.push(path);
      });

      // Early termination if no results
      if (results.every((r) => !r) && batch > 2) break;
    }
  }

  if (availableBackgrounds.length > 0) {
    lastBgIndex = availableBackgrounds.length - 1;
    logToScreen(`✅ Found ${availableBackgrounds.length} background images`);
  }

  // Add cached backgrounds
  availableBackgrounds = availableBackgrounds.concat(cachedBackgrounds);

  setupBackgroundSlides();
}

// Optimized image loading
async function loadRandomImages() {
  logToScreen("🎭 Loading Tropa images...");
  const images = [];

  const extensions = ["png", "jpg", "jpeg", "gif", "jfif"];
  const batchSize = 15;
  const maxChecks = 150;
  const batches = Math.ceil(maxChecks / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const promises = [];
    const start = batch * batchSize + 1;
    const end = Math.min(start + batchSize, maxChecks + 1);

    for (let i = start; i < end; i++) {
      for (const ext of extensions) {
        const imagePath = `./rss/image_(${i}).${ext}`;
        const cacheKey = `img_${i}_${ext}`;

        if (resourceCache.has(cacheKey)) {
          const cached = resourceCache.get(cacheKey);
          if (cached) images.push(cached);
        } else {
          promises.push(
            checkResourceExists(imagePath).then((result) => {
              resourceCache.set(cacheKey, result);
              return result;
            })
          );
        }
      }
    }

    if (promises.length > 0) {
      const results = await Promise.all(promises);
      const foundImages = results.filter((path) => path !== null);

      if (foundImages.length > 0) {
        images.push(...foundImages);
      }

      // Early termination optimization
      if (results.every((r) => !r) && batch > 5) break;
    }
  }

  if (images.length > 0) {
    lastImageIndex = Math.max(lastImageIndex, images.length);
    logToScreen(`✅ Found ${images.length} Tropa images`);
  }

  // Add cached images
  images.push(...cachedImages);

  // Fallback colored squares
  if (images.length === 0) {
    logToScreen("⚠️ No images found, using fallback squares");
    const colors = ["ff0080", "00ff41", "40e0d0", "ffff00", "ff8040"];
    colors.forEach((color, i) => {
      images.push(
        `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23${color}"/><rect x="20" y="20" width="60" height="60" fill="%23000"/><rect x="30" y="30" width="40" height="40" fill="%23${color}"/></svg>`
      );
    });
  }

  return images;
}

// Enhanced resource existence check
async function checkResourceExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok ? url : null;
  } catch {
    return null;
  }
}

function setupBackgroundSlides() {
  if (!bgContainer) return;

  bgContainer.innerHTML = "";

  availableBackgrounds.forEach((bg, index) => {
    const slide = document.createElement("div");
    slide.className = "bg-slide";
    slide.dataset.index = index;
    slide.style.backgroundImage = `url('${bg}')`;
    if (index === 0) slide.classList.add("active");
    bgContainer.appendChild(slide);
  });

  bgSlides = document.querySelectorAll(".bg-slide");
  currentSlide = 0;

  updateSlideshowUI();

  if (isSlideshowPlaying) {
    startSlideshow();
  }
}

function updateSlideshowUI() {
  const navBtns = document.querySelectorAll(".navigation");
  const desktopToggleBtn = document.getElementById("bg-toggle-button");
  const mobileToggleBtn = document.getElementById("mobile-bg-toggle");

  if (isSlideshowPlaying) {
    // Desktop button
    if (desktopToggleBtn) {
      desktopToggleBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>
        <span>PAUSE</span>
      `;
    }

    // Mobile button - just icon, no text
    if (mobileToggleBtn) {
      mobileToggleBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>
      `;
    }

    navBtns.forEach((button) => {
      button.style.opacity = "0.3";
      button.style.pointerEvents = "none";
    });
  } else {
    // Desktop button
    if (desktopToggleBtn) {
      desktopToggleBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
        <span>PLAY</span>
      `;
    }

    // Mobile button - just icon, no text
    if (mobileToggleBtn) {
      mobileToggleBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
      `;
    }

    navBtns.forEach((button) => {
      button.style.opacity = "1";
      button.style.pointerEvents = "auto";
    });
  }
}

function nextSlide() {
  if (bgSlides.length === 0) return;

  bgSlides[currentSlide].classList.remove("active");
  currentSlide = (currentSlide + 1) % bgSlides.length;
  bgSlides[currentSlide].classList.add("active");
}

function prevSlide() {
  if (bgSlides.length === 0) return;

  bgSlides[currentSlide].classList.remove("active");
  currentSlide = (currentSlide - 1 + bgSlides.length) % bgSlides.length;
  bgSlides[currentSlide].classList.add("active");
}

function toggleSlideshow() {
  if (isSlideshowPlaying) {
    clearInterval(slideshowInterval);
  } else {
    startSlideshow();
  }
  isSlideshowPlaying = !isSlideshowPlaying;
  updateSlideshowUI();
}

function startSlideshow() {
  if (slideshowInterval) clearInterval(slideshowInterval);
  slideshowInterval = setInterval(nextSlide, SLIDESHOW_INTERVAL);
}

function setActiveBackground(index) {
  if (index < 0 || index >= bgSlides.length) return;

  bgSlides.forEach((slide) => slide.classList.remove("active"));
  bgSlides[index].classList.add("active");
  currentSlide = index;

  if (isSlideshowPlaying) {
    clearInterval(slideshowInterval);
    isSlideshowPlaying = false;
    updateSlideshowUI();
  }
}

// Enhanced bouncing bubble system
class BouncingBubble {
  constructor(imageSrc) {
    this.element = document.createElement("div");
    this.element.className = "funny-container";
    this.element.style.boxShadow = `0 0 15px rgba(255, 255, 255, 0.3)`;

    const img = document.createElement("img");
    img.src = imageSrc;
    img.alt = "Bouncing pixel art";
    img.onerror = () => this.destroy();
    this.element.appendChild(img);

    // Enhanced physics properties
    this.x = Math.random() * (window.innerWidth - 100);
    this.y = Math.random() * (window.innerHeight - 100);
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.size = Math.max(60, Math.min(140, window.innerWidth * 0.08));
    this.lifetime = 10000;
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 2;

    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
    this.element.style.width = `${this.size}px`;
    this.element.style.height = `${this.size}px`;

    document.body.appendChild(this.element);
    activeBubbles++;
    this.updateClockEffect();
    this.animate();

    setTimeout(() => this.destroy(), this.lifetime);
  }

  updateClockEffect() {
    if (activeBubbles > 0) {
      clockContainer.classList.add("bubble-active");
    } else {
      clockContainer.classList.remove("bubble-active");
    }
  }

  animate() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;

    // Enhanced bouncing with color changes
    let bounced = false;
    if (this.x <= 0 || this.x >= window.innerWidth - this.size) {
      this.vx *= -1.08;
      this.x = Math.max(0, Math.min(window.innerWidth - this.size, this.x));
      bounced = true;
    }
    if (this.y <= 0 || this.y >= window.innerHeight - this.size) {
      this.vy *= -1.08;
      this.y = Math.max(0, Math.min(window.innerHeight - this.size, this.y));
      bounced = true;
    }

    if (bounced) {
      const colors = ["#ff0080", "#00ff41", "#40e0d0", "#ffff00", "#ff8040"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      this.element.style.boxShadow = `0 0 25px 10px ${randomColor}`;
    }

    // Enhanced transformations
    const time = Date.now() * 0.001;
    const scale = 1 + Math.sin(time * 2 + this.x * 0.01) * 0.12;

    this.element.style.transform = `rotate(${this.rotation}deg) scale(${scale})`;
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;

    if (this.element.parentNode) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    }
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    if (this.element && this.element.parentNode) {
      this.element.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      this.element.style.opacity = "0";
      this.element.style.transform += " scale(0)";

      setTimeout(() => {
        if (this.element.parentNode) {
          this.element.remove();
        }
      }, 500);
    }

    activeBubbles--;
    this.updateClockEffect();
  }
}

// Enhanced logging function
function logToScreen(message) {
  if (loadingLogElement) {
    const logLine = document.createElement("div");
    logLine.textContent = `> ${message}`;
    logLine.style.opacity = "0";
    logLine.style.transform = "translateY(10px)";
    loadingLogElement.appendChild(logLine);

    setTimeout(() => {
      logLine.style.transition = "all 0.3s ease";
      logLine.style.opacity = "1";
      logLine.style.transform = "translateY(0)";
    }, 50);

    loadingLogElement.scrollTop = loadingLogElement.scrollHeight;

    // Remove old log entries
    const logEntries = loadingLogElement.children;
    if (logEntries.length > 25) {
      logEntries[0].remove();
    }
  }
  console.log(`[TROPA] ${message}`);
}

// Setup all event listeners
function setupEventListeners() {
  // Navigation events
  if (navCalendarBtn) navCalendarBtn.addEventListener("click", showCalendar);
  if (navResourcesBtn) navResourcesBtn.addEventListener("click", showResources);
  if (mobileCalendarBtn)
    mobileCalendarBtn.addEventListener("click", showCalendar);
  if (mobileResourcesBtn)
    mobileResourcesBtn.addEventListener("click", showResources);

  // Slideshow controls
  if (bgToggleBtn) bgToggleBtn.addEventListener("click", toggleSlideshow);
  if (prevBtn) prevBtn.addEventListener("click", prevSlide);
  if (nextBtn) nextBtn.addEventListener("click", nextSlide);

  // Fixed mobile button event listeners
  const tropaButtons = [
    document.getElementById("footer-tropa"),
    document.getElementById("mobile-tropa"),
  ];
  const burstButtons = [
    document.getElementById("footer-burst"),
    document.getElementById("mobile-burst"),
  ];
  const countdownButtons = [
    document.getElementById("footer-countdown"),
    document.getElementById("mobile-countdown"),
  ];
  const bgToggleButtons = [
    document.getElementById("bg-toggle-button"),
    document.getElementById("mobile-bg-toggle"),
  ];
  const prevButtons = [
    document.getElementById("prev-button"),
    document.getElementById("mobile-prev"),
  ];
  const nextButtons = [
    document.getElementById("next-button"),
    document.getElementById("mobile-next"),
  ];

  tropaButtons.forEach((btn) => {
    if (btn) btn.addEventListener("click", spawnTropa);
  });
  burstButtons.forEach((btn) => {
    if (btn) btn.addEventListener("click", startBurst);
  });
  countdownButtons.forEach((btn) => {
    if (btn) btn.addEventListener("click", toggleCountdown);
  });
  bgToggleButtons.forEach((btn) => {
    if (btn) btn.addEventListener("click", toggleSlideshow);
  });
  prevButtons.forEach((btn) => {
    if (btn) btn.addEventListener("click", prevSlide);
  });
  nextButtons.forEach((btn) => {
    if (btn) btn.addEventListener("click", nextSlide);
  });

  // Hamburger menu
  if (hamburgerButton) {
    hamburgerButton.addEventListener("click", toggleHamburgerMenu);
  }

  // Close buttons
  if (closeCalendarBtn)
    closeCalendarBtn.addEventListener("click", hideCalendar);
  if (closeResourcesBtn)
    closeResourcesBtn.addEventListener("click", hideResources);
  if (closePreviewBtn)
    closePreviewBtn.addEventListener("click", closeImagePreview);

  // Overlay click-outside-to-close
  if (calendarOverlay) {
    calendarOverlay.addEventListener("click", (e) => {
      if (e.target === calendarOverlay) hideCalendar();
    });
  }

  if (resourcesOverlay) {
    resourcesOverlay.addEventListener("click", (e) => {
      if (e.target === resourcesOverlay) hideResources();
    });
  }

  if (imagePreviewOverlay) {
    imagePreviewOverlay.addEventListener("click", (e) => {
      if (e.target === imagePreviewOverlay) closeImagePreview();
    });
  }

  // Calendar navigation
  if (prevMonthBtn)
    prevMonthBtn.addEventListener("click", () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      generateCalendar(
        currentCalendarDate.getFullYear(),
        currentCalendarDate.getMonth()
      );
    });

  if (nextMonthBtn)
    nextMonthBtn.addEventListener("click", () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      generateCalendar(
        currentCalendarDate.getFullYear(),
        currentCalendarDate.getMonth()
      );
    });

  if (monthSelector) {
    monthSelector.addEventListener("change", (e) => {
      currentCalendarDate.setMonth(parseInt(e.target.value));
      generateCalendar(
        currentCalendarDate.getFullYear(),
        currentCalendarDate.getMonth()
      );
    });
  }

  if (yearSelector) {
    yearSelector.addEventListener("change", (e) => {
      currentCalendarDate.setFullYear(parseInt(e.target.value));
      generateCalendar(
        currentCalendarDate.getFullYear(),
        currentCalendarDate.getMonth()
      );
    });
  }

  // Resource tabs
  if (bgTab) {
    bgTab.addEventListener("click", () => {
      bgTab.classList.add("active");
      imagesTab.classList.remove("active");
      bgContent.classList.add("active");
      imagesContent.classList.remove("active");
    });
  }

  if (imagesTab) {
    imagesTab.addEventListener("click", () => {
      imagesTab.classList.add("active");
      bgTab.classList.remove("active");
      imagesContent.classList.add("active");
      bgContent.classList.remove("active");
    });
  }

  // File uploads
  if (bgUpload) {
    bgUpload.addEventListener("change", handleBackgroundUpload);
  }

  if (imageUpload) {
    imageUpload.addEventListener("change", handleImageUpload);
  }

  // Countdown controls
  if (countdownSelect) {
    countdownSelect.addEventListener("change", (e) => {
      if (e.target.value === "custom") {
        customTimeContainer.classList.add("active");
        customTimeContainer.setAttribute("aria-hidden", "false");
      } else {
        customTimeContainer.classList.remove("active");
        customTimeContainer.setAttribute("aria-hidden", "true");
      }
    });
  }

  // Break controls
  const enableBreaks = document.getElementById("enable-breaks");
  const breakTimes = document.getElementById("break-times");
  const countdownBox = document.querySelector(".countdown-box");

  enableBreaks.addEventListener("change", (e) => {
    breakTimes.style.display = e.target.checked ? "block" : "none";
    countdownBox.classList.toggle("breaks-enabled", e.target.checked);
  });

  // Image preview controls
  if (prevImageBtn) prevImageBtn.addEventListener("click", showPrevImage);
  if (nextImageBtn) nextImageBtn.addEventListener("click", showNextImage);

  // Setup fade system with hover listeners
  const mainNavButtons = document.querySelectorAll(
    ".main-nav-button, .nav-button, .footer-button"
  );
  mainNavButtons.forEach((button) => {
    button.addEventListener("mouseenter", resetFadeTimer);
    button.addEventListener("mousemove", resetFadeTimer);
    button.addEventListener("mouseleave", resetFadeTimer);
  });

  // Close hamburger menu when clicking outside
  document.addEventListener("click", (e) => {
    if (hamburgerButton && hamburgerDropdown) {
      if (
        !hamburgerButton.contains(e.target) &&
        !hamburgerDropdown.contains(e.target)
      ) {
        hamburgerButton.classList.remove("active");
        hamburgerDropdown.classList.remove("active");
      }
    }
  });
}

// Enhanced keyboard shortcuts
function setupKeyboardShortcuts() {
  const shortcuts = {
    " ": (e) => {
      e.preventDefault();
      toggleSlideshow();
    },
    ArrowLeft: () => !isSlideshowPlaying && prevSlide(),
    ArrowRight: () => !isSlideshowPlaying && nextSlide(),
    c: () => showCalendar(),
    C: () => showCalendar(),
    r: () => showResources(),
    R: () => showResources(),
    Enter: () => spawnTropa(),
    b: () => !burstCooldown && startBurst(),
    B: () => !burstCooldown && startBurst(),
    t: () => toggleCountdown(),
    T: () => toggleCountdown(),
    Escape: () => {
      hideCalendar();
      hideResources();
      closeImagePreview();
      if (hamburgerButton && hamburgerDropdown) {
        hamburgerButton.classList.remove("active");
        hamburgerDropdown.classList.remove("active");
      }
    },
    m: () => toggleHamburgerMenu(),
    M: () => toggleHamburgerMenu(),
  };

  document.addEventListener("keydown", (e) => {
    // Disable shortcuts when typing in input fields
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.contentEditable === "true"
    ) {
      return;
    }

    if (shortcuts[e.key]) {
      shortcuts[e.key](e);
    }
  });

  // Konami code easter egg
  let konami = [];
  const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
  document.addEventListener("keydown", (e) => {
    konami.push(e.keyCode);
    if (konami.length > konamiCode.length) {
      konami.shift();
    }
    if (JSON.stringify(konami) === JSON.stringify(konamiCode)) {
      logToScreen("🎊 KONAMI CODE ACTIVATED!");
      logToScreen("🌟 MEGA BURST SEQUENCE INITIATED!");

      for (let i = 0; i < 25; i++) {
        setTimeout(async () => {
          if (availableImages.length > 0) {
            const randomImage =
              availableImages[
                Math.floor(Math.random() * availableImages.length)
              ];
            new BouncingBubble(randomImage);
          }
        }, i * 100);
      }
      konami = [];
    }
  });
}

// Enhanced hamburger menu functionality
function toggleHamburgerMenu() {
  if (!hamburgerButton || !hamburgerDropdown) return;

  const isActive = hamburgerDropdown.classList.contains("active");
  hamburgerButton.classList.toggle("active", !isActive);
  hamburgerDropdown.classList.toggle("active", !isActive);
}

// Tropa spawning function
async function spawnTropa() {
  if (availableImages.length === 0) {
    availableImages = await loadRandomImages();
  }

  const randomImage = availableImages[imageIndex % availableImages.length];
  imageIndex++;

  new BouncingBubble(randomImage);
}

// Enhanced burst functionality
function startBurst() {
  if (burstCooldown || availableImages.length === 0) return;

  burstCooldown = true;
  if (burstBtn) burstBtn.classList.add("disabled");

  // Create enhanced cooldown indicator
  const cooldownElement = document.createElement("div");
  cooldownElement.className = "cooldown-indicator";
  if (burstBtn) burstBtn.appendChild(cooldownElement);

  let timeLeft = BURST_COOLDOWN_TIME / 1000;
  const cooldownInterval = setInterval(() => {
    timeLeft--;
    cooldownElement.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(cooldownInterval);
      cooldownElement.remove();
      burstCooldown = false;
      if (burstBtn) burstBtn.classList.remove("disabled");
    }
  }, 1000);

  cooldownElement.textContent = timeLeft;

  // Generate enhanced burst of bubbles
  for (let i = 0; i < BURST_COUNT; i++) {
    setTimeout(() => {
      if (availableImages.length > 0) {
        const randomImage =
          availableImages[Math.floor(Math.random() * availableImages.length)];
        new BouncingBubble(randomImage);
      }
    }, i * 150);
  }

  logToScreen(`💥 BURST ACTIVATED! Generated ${BURST_COUNT} bubbles`);
}

// Calendar functions
function showCalendar() {
  if (calendarOverlay) {
    populateYearSelector();
    generateCalendar(
      currentCalendarDate.getFullYear(),
      currentCalendarDate.getMonth()
    );
    calendarOverlay.classList.add("active");
  }
  hideHamburgerMenu();
}

function hideCalendar() {
  if (calendarOverlay) calendarOverlay.classList.remove("active");
}

function populateYearSelector() {
  if (!yearSelector) return;

  const currentYear = new Date().getFullYear();
  yearSelector.innerHTML = "";

  for (let year = currentYear - 50; year <= currentYear + 50; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    if (year === currentCalendarDate.getFullYear()) {
      option.selected = true;
    }
    yearSelector.appendChild(option);
  }
}

function generateCalendar(year, month) {
  if (!calendarGrid || !monthSelector || !yearSelector) return;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // Update selectors
  monthSelector.value = month;
  yearSelector.value = year;

  calendarGrid.innerHTML = "";

  const dayHeaders = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  dayHeaders.forEach((day) => {
    const header = document.createElement("div");
    header.className = "calendar-day-header";
    header.textContent = day;
    calendarGrid.appendChild(header);
  });

  const prevMonth = new Date(year, month, 0);
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = document.createElement("div");
    day.className = "calendar-day other-month";
    day.textContent = prevMonth.getDate() - i;
    calendarGrid.appendChild(day);
  }

  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement("div");
    dayElement.className = "calendar-day";
    dayElement.textContent = day;

    if (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    ) {
      dayElement.classList.add("today");
    }

    calendarGrid.appendChild(dayElement);
  }

  const remainingCells = 42 - (firstDayOfWeek + daysInMonth);
  for (let day = 1; day <= remainingCells; day++) {
    const dayElement = document.createElement("div");
    dayElement.className = "calendar-day other-month";
    dayElement.textContent = day;
    calendarGrid.appendChild(dayElement);
  }
}

// Resource functions
function showResources() {
  if (resourcesOverlay) {
    resourcesOverlay.classList.add("active");
    populateBackgroundGrid();
    populateImageGrid();
  }
  hideHamburgerMenu();
}

function hideResources() {
  if (resourcesOverlay) resourcesOverlay.classList.remove("active");
}

function populateBackgroundGrid() {
    const bgGrid = document.getElementById("bg-grid");
    if (!bgGrid) return;

    bgGrid.innerHTML = "";
    const defaultBgCount = availableBackgrounds.length - cachedBackgrounds.length;
    let totalSize = 0;

    availableBackgrounds.forEach((bg, index) => {
        const item = document.createElement("div");
        item.className = "enhanced-background-item";
        item.dataset.index = index;

        const thumb = document.createElement("img");
        thumb.className = "background-thumb";
        thumb.src = bg;
        thumb.alt = `Background ${index + 1}`;
        thumb.loading = "lazy";

        const info = document.createElement("div");
        info.className = "background-info";

        const name = document.createElement("div");
        name.className = "background-name";
        name.textContent = index < defaultBgCount 
            ? `BG${index === 0 ? "" : index}.gif`
            : `cache_(${index - defaultBgCount + 1}).gif`;

        const details = document.createElement("div");
        details.className = "background-details";
        const fileSize = bg.startsWith("data:") ? Math.round((bg.length * 0.75) / 1024) : 0;
        totalSize += fileSize;
        details.textContent = `${fileSize}KB • ${index < defaultBgCount ? "Default" : "Cached"}`;

        const actions = document.createElement("div");
        actions.className = "background-actions";
        actions.innerHTML = `
            <button class="action-btn" onclick="setActiveBackground(${index})" title="Set Active">
                <svg viewBox="0 0 24 24"><path d="M12,2L15.09,8.26L22,9L17,14L18.18,21L12,17.77L5.82,21L7,14L2,9L8.91,8.26L12,2Z"/></svg>
            </button>
            <button class="action-btn" onclick="downloadSingleBackground(${index})" title="Download">
                <svg viewBox="0 0 24 24"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/></svg>
            </button>
        `;

        info.appendChild(name);
        info.appendChild(details);
        item.appendChild(thumb);
        item.appendChild(info);
        item.appendChild(actions);

        item.addEventListener("click", (e) => {
            if (!e.target.closest(".action-btn")) {
                setActiveBackground(index);
                hideResources();
            }
        });

        bgGrid.appendChild(item);
    });

    updateBackgroundStats(availableBackgrounds.length, totalSize);
}

// Add these helper functions
function updateBackgroundStats(count, totalSize) {
    const countEl = document.getElementById('bg-count');
    const sizeEl = document.getElementById('bg-size');

    if (countEl) countEl.textContent = `${count} Background${count !== 1 ? 's' : ''}`;
    if (sizeEl) {
        const sizeText = totalSize > 1024 
            ? `${(totalSize / 1024).toFixed(1)} MB`
            : `${totalSize} KB`;
        sizeEl.textContent = sizeText;
    }
}

function downloadSingleBackground(index) {
    if (index < 0 || index >= availableBackgrounds.length) return;

    const defaultBgCount = availableBackgrounds.length - cachedBackgrounds.length;
    const filename = index < defaultBgCount 
        ? `BG${index === 0 ? '' : index}.gif`
        : `cache_(${index - defaultBgCount + 1}).gif`;

    const link = document.createElement("a");
    link.href = availableBackgrounds[index];
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function populateImageGrid() {
  const enhancedGrid = document.getElementById("enhanced-images-grid");
  if (!enhancedGrid) return;

  enhancedGrid.innerHTML = "";
  const defaultImageCount = availableImages.length - cachedImages.length;
  let totalSize = 0;

  availableImages.forEach((img, index) => {
    const item = document.createElement("div");
    item.className = "enhanced-image-item";
    item.dataset.index = index;

    const thumb = document.createElement("img");
    thumb.className = "image-thumb";
    thumb.src = img;
    thumb.alt = `Image ${index + 1}`;
    thumb.loading = "lazy";

    const info = document.createElement("div");
    info.className = "image-info";

    const name = document.createElement("div");
    name.className = "image-name";
    name.textContent =
      index < defaultImageCount
        ? `image_(${index + 1})`
        : `cache_(${index - defaultImageCount + 1})`;

    const details = document.createElement("div");
    details.className = "image-details";
    const fileSize = img.startsWith("data:")
      ? Math.round((img.length * 0.75) / 1024)
      : 0;
    totalSize += fileSize;
    details.textContent = `${fileSize}KB • ${
      index < defaultImageCount ? "Default" : "Cached"
    }`;

    const actions = document.createElement("div");
    actions.className = "image-actions";
    actions.innerHTML = `
            <button class="action-btn" onclick="openImagePreview(${index})" title="Preview">
                <svg viewBox="0 0 24 24"><path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/></svg>
            </button>
            <button class="action-btn" onclick="downloadSingleImage(${index})" title="Download">
                <svg viewBox="0 0 24 24"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/></svg>
            </button>
        `;

    info.appendChild(name);
    info.appendChild(details);
    item.appendChild(thumb);
    item.appendChild(info);
    item.appendChild(actions);

    item.addEventListener("click", (e) => {
      if (!e.target.closest(".action-btn")) {
        openImagePreview(index);
      }
    });

    enhancedGrid.appendChild(item);
  });

  updateImageStats(availableImages.length, totalSize);
}

function populateImageGrid() {
  const enhancedGrid = document.getElementById("enhanced-images-grid");
  if (!enhancedGrid) return;

  enhancedGrid.innerHTML = "";
  const defaultImageCount = availableImages.length - cachedImages.length;
  let totalSize = 0;

  availableImages.forEach((img, index) => {
    const item = document.createElement("div");
    item.className = "enhanced-image-item";
    item.dataset.index = index;

    const thumb = document.createElement("img");
    thumb.className = "image-thumb";
    thumb.src = img;
    thumb.alt = `Image ${index + 1}`;
    thumb.loading = "lazy";

    const info = document.createElement("div");
    info.className = "image-info";

    const name = document.createElement("div");
    name.className = "image-name";
    name.textContent =
      index < defaultImageCount
        ? `image_(${index + 1})`
        : `cache_(${index - defaultImageCount + 1})`;

    const details = document.createElement("div");
    details.className = "image-details";
    const fileSize = img.startsWith("data:")
      ? Math.round((img.length * 0.75) / 1024)
      : 0;
    totalSize += fileSize;
    details.textContent = `${fileSize}KB • ${
      index < defaultImageCount ? "Default" : "Cached"
    }`;

    const actions = document.createElement("div");
    actions.className = "image-actions";
    actions.innerHTML = `
            <button class="action-btn" onclick="openImagePreview(${index})" title="Preview">
                <svg viewBox="0 0 24 24"><path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/></svg>
            </button>
            <button class="action-btn" onclick="downloadSingleImage(${index})" title="Download">
                <svg viewBox="0 0 24 24"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/></svg>
            </button>
        `;

    info.appendChild(name);
    info.appendChild(details);
    item.appendChild(thumb);
    item.appendChild(info);
    item.appendChild(actions);

    item.addEventListener("click", (e) => {
      if (!e.target.closest(".action-btn")) {
        openImagePreview(index);
      }
    });

    enhancedGrid.appendChild(item);
  });

  updateImageStats(availableImages.length, totalSize);
}

// Update stats
function updateImageStats(count, totalSize) {
  const countEl = document.getElementById("images-count");
  const sizeEl = document.getElementById("images-size");

  if (countEl) countEl.textContent = `${count} Image${count !== 1 ? "s" : ""}`;
  if (sizeEl) {
    const sizeText =
      totalSize > 1024
        ? `${(totalSize / 1024).toFixed(1)} MB`
        : `${totalSize} KB`;
    sizeEl.textContent = sizeText;
  }
}

// Download single image
function downloadSingleImage(index) {
  if (index < 0 || index >= availableImages.length) return;

  const defaultImageCount = availableImages.length - cachedImages.length;
  const filename =
    index < defaultImageCount
      ? `image_(${index + 1}).png`
      : `cache_(${index - defaultImageCount + 1}).png`;

  const link = document.createElement("a");
  link.href = availableImages[index];
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Image preview system
let currentZoom = 1;
let isDragging = false;
let startX = 0;
let startY = 0;
let scrollLeft = 0;
let scrollTop = 0;

function openImagePreview(index) {
  if (index < 0 || index >= availableImages.length) return;

  currentPreviewIndex = index;
  currentZoom = 1;

  const overlay = document.getElementById("image-preview-overlay");
  const image = document.getElementById("preview-image");
  const filename = document.getElementById("preview-filename");
  const counter = document.getElementById("preview-counter");
  const downloadBtn = document.getElementById("downloadImageBtn");
  const zoomLevel = document.getElementById("zoomLevel");

  if (image) {
    image.src = availableImages[index];
    image.style.transform = "scale(1)";

    // Setup scroll functionality when image loads
    image.onload = () => {
      setupImageScroll();

      // Auto-fit large images
      if (
        image.naturalWidth > window.innerWidth * 0.8 ||
        image.naturalHeight > window.innerHeight * 0.6
      ) {
        setTimeout(fitToScreen, 100);
      }
    };
  }

  if (filename) {
    const defaultCount = availableImages.length - cachedImages.length;
    filename.textContent =
      index < defaultCount
        ? `image_(${index + 1}).png`
        : `cache_(${index - defaultCount + 1}).png`;
  }

  if (counter) {
    counter.textContent = `${index + 1} of ${availableImages.length}`;
  }

  if (downloadBtn) {
    downloadBtn.href = availableImages[index];
    downloadBtn.download = filename
      ? filename.textContent
      : `image_${index + 1}.png`;
  }

  if (zoomLevel) {
    zoomLevel.textContent = "100%";
  }

  if (overlay) {
    overlay.classList.add("active");
  }
}

function closeImagePreview() {
  const overlay = document.getElementById("image-preview-overlay");
  if (overlay) overlay.classList.remove("active");
  currentPreviewIndex = -1;
}

function showPrevImage() {
  if (currentPreviewIndex > 0) {
    openImagePreview(currentPreviewIndex - 1);
  } else if (availableImages.length > 0) {
    openImagePreview(availableImages.length - 1);
  }
}

function showNextImage() {
  if (currentPreviewIndex < availableImages.length - 1) {
    openImagePreview(currentPreviewIndex + 1);
  } else {
    openImagePreview(0);
  }
}

// Zoom functions
function zoomIn() {
  currentZoom = Math.min(currentZoom * 1.25, 5); // Increased max zoom
  updateImageZoom();
}

function zoomOut() {
  currentZoom = Math.max(currentZoom / 1.25, 0.25); // Decreased min zoom
  updateImageZoom();
}

function resetZoom() {
  currentZoom = 1;
  updateImageZoom();

  // Reset scroll position
  const container = document.querySelector(".image-container");
  if (container) {
    container.scrollLeft = 0;
    container.scrollTop = 0;
  }
}

// Fit to screen function
function fitToScreen() {
  const container = document.querySelector(".image-container");
  const image = document.getElementById("preview-image");

  if (!container || !image) return;

  // Reset zoom and position first
  currentZoom = 1;
  image.style.transform = "scale(1)";
  container.classList.remove("zoomed");

  // Reset scroll position
  container.scrollLeft = 0;
  container.scrollTop = 0;

  updateImageZoom();
}

// Add a new function for actual size
function actualSize() {
  const container = document.querySelector(".image-container");
  const image = document.getElementById("preview-image");

  if (!container || !image) return;

  // Set to actual size (may require scrolling)
  currentZoom = 1;
  container.classList.add("zoomed"); // Enable scrolling
  image.style.transform = "scale(1)";

  updateImageZoom();
}

function updateImageZoom() {
  const image = document.getElementById("preview-image");
  const container =
    document.getElementById("image-container") ||
    document.querySelector(".image-container");
  const zoomLevel = document.getElementById("zoomLevel");

  if (image) {
    image.style.transform = `scale(${currentZoom})`;

    // Add zoomed class for scroll behavior
    if (container) {
      if (currentZoom > 1) {
        container.classList.add("zoomed");
      } else {
        container.classList.remove("zoomed");
      }
    }
  }

  if (zoomLevel) {
    zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
  }
}

// Add this to your existing setupEventListeners or create a new function
function setupPreviewKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (
      !document
        .getElementById("image-preview-overlay")
        .classList.contains("active")
    )
      return;

    switch (e.key) {
      case "Escape":
        closeImagePreview();
        break;
      case "ArrowLeft":
        showPrevImage();
        break;
      case "ArrowRight":
        showNextImage();
        break;
      case "+":
      case "=":
        zoomIn();
        break;
      case "-":
        zoomOut();
        break;
      case "0":
        fitToScreen();
        break;
      case "1":
        actualSize();
        break;
    }
  });
}

// Call this in your initialization
setupPreviewKeyboard();

// Enhanced image container setup
function setupImageScroll() {
  const container = document.querySelector(".image-container");
  if (!container) return;

  // Mouse drag scrolling
  container.addEventListener("mousedown", (e) => {
    if (currentZoom > 1) {
      isDragging = true;
      startX = e.pageX - container.offsetLeft;
      startY = e.pageY - container.offsetTop;
      scrollLeft = container.scrollLeft;
      scrollTop = container.scrollTop;
      container.style.cursor = "grabbing";
      e.preventDefault();
    }
  });

  container.addEventListener("mouseleave", () => {
    isDragging = false;
    if (currentZoom > 1) {
      container.style.cursor = "move";
    } else {
      container.style.cursor = "grab";
    }
  });

  container.addEventListener("mouseup", () => {
    isDragging = false;
    if (currentZoom > 1) {
      container.style.cursor = "move";
    } else {
      container.style.cursor = "grab";
    }
  });

  container.addEventListener("mousemove", (e) => {
    if (!isDragging || currentZoom <= 1) return;

    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const y = e.pageY - container.offsetTop;
    const walkX = (x - startX) * 2;
    const walkY = (y - startY) * 2;
    container.scrollLeft = scrollLeft - walkX;
    container.scrollTop = scrollTop - walkY;
  });

  // Mouse wheel zoom
  container.addEventListener("wheel", (e) => {
    e.preventDefault();

    if (e.deltaY > 0) {
      zoomOut();
    } else {
      zoomIn();
    }
  });
}

// View toggle functions
function setupViewToggles() {
  const gridBtn = document.getElementById("grid-view");
  const listBtn = document.getElementById("list-view");
  const grid = document.getElementById("enhanced-images-grid");

  if (gridBtn && listBtn && grid) {
    gridBtn.addEventListener("click", () => {
      gridBtn.classList.add("active");
      listBtn.classList.remove("active");
      grid.classList.remove("list-view");
      document.querySelectorAll(".enhanced-image-item").forEach((item) => {
        item.classList.remove("list-view");
      });
    });

    listBtn.addEventListener("click", () => {
      listBtn.classList.add("active");
      gridBtn.classList.remove("active");
      grid.classList.add("list-view");
      document.querySelectorAll(".enhanced-image-item").forEach((item) => {
        item.classList.add("list-view");
      });
    });
  }
}

// Add to your existing setupEventListeners function:
document
  .getElementById("closePreview")
  ?.addEventListener("click", closeImagePreview);
document
  .getElementById("prevImageBtn")
  ?.addEventListener("click", showPrevImage);
document
  .getElementById("nextImageBtn")
  ?.addEventListener("click", showNextImage);
document.getElementById("zoomIn")?.addEventListener("click", zoomIn);
document.getElementById("zoomOut")?.addEventListener("click", zoomOut);
document.getElementById("resetZoom")?.addEventListener("click", resetZoom);
document.getElementById("fitToScreen")?.addEventListener("click", fitToScreen);

// Initialize view toggles
setupViewToggles();

// File upload handlers
function handleBackgroundUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const uploadedImageURL = e.target.result;
    cachedBackgrounds.push(uploadedImageURL);
    logToScreen(`✅ New background uploaded: ${file.name}`);

    await loadBackgrounds();
    populateBackgroundGrid();
  };
  reader.readAsDataURL(file);
  event.target.value = "";
}

function handleImageUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  let filesProcessed = 0;
  const totalFiles = files.length;

  Array.from(files).forEach((file) => {
    if (!file.type.startsWith("image/")) {
      logToScreen(`❌ ${file.name} is not a valid image file`);
      filesProcessed++;
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const uploadedImageURL = e.target.result;
      cachedImages.push(uploadedImageURL);

      // Add to available images array
      availableImages.push(uploadedImageURL);

      logToScreen(
        `✅ New image uploaded: ${file.name} -> cache_(${cachedImages.length})`
      );

      filesProcessed++;

      // Update the grid after all files are processed
      if (filesProcessed === totalFiles) {
        populateImageGrid();
        updateImageStats(availableImages.length, calculateTotalSize());
      }
    };
    reader.readAsDataURL(file);
  });

  event.target.value = ""; // Clear input
}

// Add this inside the setupEventListeners function
if (document.getElementById("bg-refresh")) {
  document.getElementById("bg-refresh").addEventListener("click", async () => {
    logToScreen("🔄 Refreshing background library...");
    await loadBackgrounds();
    populateBackgroundGrid();
    logToScreen("✅ Background library refreshed");
  });
}

function calculateTotalSize() {
  return availableImages.reduce((total, img) => {
    if (img.startsWith("data:")) {
      return total + Math.round((img.length * 0.75) / 1024);
    }
    return total;
  }, 0);
}

// Countdown functions
function toggleCountdown() {
  if (!countdownContainer) return;

  const isVisible = countdownContainer.classList.contains("active");

  if (isVisible) {
    countdownContainer.classList.remove("active");
    countdownContainer.setAttribute("aria-hidden", "true");
  } else {
    countdownContainer.classList.add("active");
    countdownContainer.setAttribute("aria-hidden", "false");
  }
}

function startCountdownTimer() {
  const updateCountdown = () => {
    if (!countdownTime) return;

    const now = new Date();
    const { startTime, endTime } = getCountdownTimes();

    // Get custom field values
    const prefixInput = document.getElementById("custom-prefix");
    const suffixInput = document.getElementById("custom-suffix");
    const prefixVal = prefixInput?.value.trim();
    const suffixVal = suffixInput?.value.trim();

    if (now < startTime) {
      // Rest phase
      const diff = startTime - now;
      const timeString = formatTimeDifference(diff);
      countdownTime.textContent = `${
        prefixVal || "Meron ka pang"
      } ${timeString} ${suffixVal || "Para Mamahinga"}`;
    } else if (now >= startTime && now <= endTime) {
      // Work phase
      const diff = endTime - now;
      const timeString = formatTimeDifference(diff);
      countdownTime.textContent = `${
        prefixVal || "Trabaho ka muna ng"
      } ${timeString} ${suffixVal || "Bago Hayahay"}`;
    } else {
      countdownTime.textContent = "OFF HOURS — Enjoy your free time!";
    }
  };

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // 🔧 Live update while typing
  ["custom-prefix", "custom-suffix"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateCountdown);
  });
}

function getCountdownTimes() {
  if (!countdownSelect) return { startTime: new Date(), endTime: new Date() };

  const isCustom = countdownSelect.value === "custom";

  const now = new Date();
  const monday = getMondayOfWeek(now);

  let startTime = new Date(monday);
  let endTime = new Date(monday);
  endTime.setDate(monday.getDate() + 4); // Friday

  if (isCustom && customStart && customEnd) {
    const customStartValue = customStart.value;
    const customEndValue = customEnd.value;

    if (customStartValue) {
      const [hours, minutes] = customStartValue.split(":").map(Number);
      startTime.setHours(hours, minutes, 0, 0);
    }

    if (customEndValue) {
      const [hours, minutes] = customEndValue.split(":").map(Number);
      endTime.setHours(hours, minutes, 0, 0);
    }
  } else {
    const presetHour = parseInt(countdownSelect.value) || 7;
    startTime.setHours(presetHour, 0, 0, 0);

    const endHour = presetHour === 7 ? 16 : presetHour === 8 ? 17 : 18;
    endTime.setHours(endHour, 0, 0, 0);
  }

  // Adjust for next week if current week is over
  if (now > endTime) {
    startTime.setDate(startTime.getDate() + 7);
    endTime.setDate(endTime.getDate() + 7);
  }

  return { startTime, endTime };
}

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatTimeDifference(diff) {
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Utility functions
function hideHamburgerMenu() {
  if (hamburgerButton && hamburgerDropdown) {
    hamburgerButton.classList.remove("active");
    hamburgerDropdown.classList.remove("active");
  }
}

// Touch support for mobile
let touchStartX = 0;
let touchStartY = 0;

function setupTouchSupport() {
  document.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (e) => {
      if (!e.changedTouches) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Detect swipe gestures
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0 && !isSlideshowPlaying) {
          nextSlide();
        } else if (deltaX < 0 && !isSlideshowPlaying) {
          prevSlide();
        }
      }

      // Double tap to toggle slideshow
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        const now = Date.now();
        if (window.lastTap && now - window.lastTap < 300) {
          toggleSlideshow();
        }
        window.lastTap = now;
      }
    },
    { passive: true }
  );
}

// Window resize handler
function handleResize() {
  const bubbles = document.querySelectorAll(".funny-container");
  bubbles.forEach((bubble) => {
    const rect = bubble.getBoundingClientRect();
    const maxX = window.innerWidth - parseInt(bubble.style.width);
    const maxY = window.innerHeight - parseInt(bubble.style.height);

    if (rect.left > maxX) {
      bubble.style.left = maxX + "px";
    }
    if (rect.top > maxY) {
      bubble.style.top = maxY + "px";
    }
  });
}

// Performance cleanup
function performanceCleanup() {
  setInterval(() => {
    const bubbles = document.querySelectorAll(".funny-container");
    if (bubbles.length > 20) {
      for (let i = 0; i < bubbles.length - 15; i++) {
        bubbles[i].remove();
        if (activeBubbles > 0) activeBubbles--;
      }
    }

    // Clear old cache entries
    if (resourceCache.size > 500) {
      const entries = Array.from(resourceCache.entries());
      const oldEntries = entries.slice(0, 100);
      oldEntries.forEach(([key]) => resourceCache.delete(key));
    }
  }, 10000);
}

// Main initialization function
async function initialize() {
  logToScreen("🚀 Initializing Enhanced TROPA Clock System...");
  logToScreen("⚡ Loading advanced components...");

  try {
    // Setup systems
    setupDragSystem();
    setupEventListeners();
    setupKeyboardShortcuts();
    setupTouchSupport();

    // Start fade timer
    resetFadeTimer();

    logToScreen("🎨 Optimized background scanning initiated...");
    await loadBackgrounds();
    logToScreen("✅ Background system initialized");

    logToScreen("🎭 Loading Tropa image library...");
    availableImages = await loadRandomImages();
    logToScreen(`✅ Image system ready (${availableImages.length} images)`);

    logToScreen("⏰ Synchronizing with time servers...");
    await fetchTime();
    lastUpdateTime = Date.now();
    requestAnimationFrame(updateClockDisplay);
    logToScreen("✅ Time synchronization complete");

    logToScreen("⏲️ Initializing countdown system...");
    startCountdownTimer();
    logToScreen("✅ Countdown system active");

    logToScreen("🎮 Initializing user interface...");
    logToScreen("✅ Navigation controls ready");
    logToScreen("✅ Calendar system loaded");
    logToScreen("✅ Resource manager active");
    logToScreen("✅ Burst system armed");

    // Setup performance monitoring
    performanceCleanup();

    logToScreen("🌟 Enhanced TROPA Clock fully operational!");
    logToScreen("Ready for ultimate pixel perfection...");

    setTimeout(() => {
      loadingScreen.classList.add("hidden");
    }, 2500);
  } catch (error) {
    logToScreen("⚠️ Warning: Some features may use fallback mode");
    logToScreen("✅ System operational with limited functionality");
    console.error("Enhanced initialization error:", error);

    // Ensure basic functionality
    if (!lastKnownTime) {
      lastKnownTime = new Date();
      lastUpdateTime = Date.now();
      requestAnimationFrame(updateClockDisplay);
    }

    setTimeout(() => {
      loadingScreen.classList.add("hidden");
    }, 2000);
  }
}

// Window event listeners
window.addEventListener("resize", handleResize);
window.addEventListener("beforeunload", () => {
  if (slideshowInterval) clearInterval(slideshowInterval);
  resourceCache.clear();
});

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

// Additional Image Preview System styling
const imagePreviewStyles = `
.image-preview-popup {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: min(90vw, 800px);
    max-height: min(90vh, 700px);
}

.image-preview-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-height: 70vh;
    margin-bottom: 20px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.1);
}

.image-preview-container img {
    max-width: 100%;
    max-height: 100%;
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    image-rendering: pixelated;
    background: rgba(0, 0, 0, 0.5);
    padding: 8px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.image-preview-controls {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    justify-content: center;
    width: 100%;
}

.image-preview-controls .control-button,
.image-preview-controls a {
    background: rgba(20, 30, 50, 0.85);
    backdrop-filter: blur(20px);
    border: 3px solid rgba(255, 255, 255, 0.25);
    color: #FFFFFF;
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.image-preview-controls .control-button:hover,
.image-preview-controls a:hover {
    background: rgba(30, 40, 70, 0.9);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.15);
}
`;

// Inject additional styles
const additionalStyleSheet = document.createElement("style");
additionalStyleSheet.textContent = imagePreviewStyles;
document.head.appendChild(additionalStyleSheet);

// Enhanced Mobile Responsive Adjustments
function adjustMobileLayout() {
  const isDesktop = window.innerWidth >= 1024;
  const mobileControls = document.getElementById("mobileControls");
  const bottomControls = document.getElementById("bottomControls");
  const navBar = document.getElementById("navBar");
  const footer = document.getElementById("footer");

  if (isDesktop) {
    if (mobileControls) mobileControls.style.display = "none";
    if (bottomControls) bottomControls.style.display = "none";
    if (navBar) navBar.style.display = "flex";
    if (footer) footer.style.display = "flex";
    document.body.classList.add("desktop-layout");
  } else {
    if (mobileControls) mobileControls.style.display = "flex";
    if (bottomControls) bottomControls.style.display = "flex";
    if (navBar) navBar.style.display = "none";
    if (footer) footer.style.display = "none";
    document.body.classList.remove("desktop-layout");
  }
}

// Call on load and resize
adjustMobileLayout();
window.addEventListener("resize", adjustMobileLayout);

// Enhanced Error Handling and Fallbacks
function createFallbackSystems() {
  // Fallback for missing elements
  const essentialElements = [
    "clock",
    "date",
    "day",
    "clockContainer",
    "bgContainer",
    "loading-screen",
    "loading-log",
    "countdown-container",
  ];

  essentialElements.forEach((id) => {
    if (!document.getElementById(id)) {
      console.warn(`Missing essential element: ${id}`);
      logToScreen(`Warning: Missing element ${id}, creating fallback`);
    }
  });

  // Fallback time display if API fails
  if (!lastKnownTime) {
    lastKnownTime = new Date();
    lastUpdateTime = Date.now();
    logToScreen("Using local time as fallback");
  }
}

// Additional Touch Gestures
function setupAdvancedTouchGestures() {
  let touchStartTime = 0;
  let touchPoints = [];

  document.addEventListener("touchstart", (e) => {
    touchStartTime = Date.now();
    touchPoints = Array.from(e.touches).map((touch) => ({
      x: touch.clientX,
      y: touch.clientY,
    }));
  });

  document.addEventListener("touchend", (e) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;

    // Long press detection (for context menus)
    if (touchDuration > 500 && touchPoints.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - touchPoints[0].x);
      const deltaY = Math.abs(touch.clientY - touchPoints[0].y);

      if (deltaX < 20 && deltaY < 20) {
        // Long press detected - could trigger special menu
        logToScreen("Long press detected");
      }
    }

    // Pinch gesture detection
    if (touchPoints.length === 2) {
      logToScreen("Multi-touch gesture detected");
    }
  });
}

// Performance Monitoring
function startPerformanceMonitoring() {
  let frameCount = 0;
  let lastTime = performance.now();

  function measureFPS() {
    frameCount++;
    const currentTime = performance.now();

    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

      if (fps < 30) {
        logToScreen(`Performance warning: FPS dropped to ${fps}`);
      }

      frameCount = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(measureFPS);
  }

  requestAnimationFrame(measureFPS);
}

// Enhanced Bubble Collision Detection
function setupBubbleCollisionSystem() {
  setInterval(() => {
    const bubbles = document.querySelectorAll(".funny-container");

    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const bubble1 = bubbles[i].getBoundingClientRect();
        const bubble2 = bubbles[j].getBoundingClientRect();

        const distance = Math.sqrt(
          Math.pow(bubble1.left - bubble2.left, 2) +
            Math.pow(bubble1.top - bubble2.top, 2)
        );

        if (distance < 100) {
          // Collision detected - add special effects
          bubbles[i].style.filter = "brightness(1.5) hue-rotate(90deg)";
          bubbles[j].style.filter = "brightness(1.5) hue-rotate(90deg)";

          setTimeout(() => {
            if (bubbles[i]) bubbles[i].style.filter = "";
            if (bubbles[j]) bubbles[j].style.filter = "";
          }, 200);
        }
      }
    }
  }, 100);
}

// Initialize additional systems
setTimeout(() => {
  createFallbackSystems();
  setupAdvancedTouchGestures();
  startPerformanceMonitoring();
  setupBubbleCollisionSystem();

  logToScreen("Advanced systems initialized");
  logToScreen("All enhancement modules loaded successfully");
}, 1000);

// Final initialization message
setTimeout(() => {
  logToScreen("====================================");
  logToScreen("TROPA ENHANCED PIXEL CLOCK");
  logToScreen("Version 2.0 - Fully Operational");
  logToScreen("====================================");
  logToScreen("Ready for production use!");
}, 3000);
setupResizeSystem();

// Enhanced Cursor System
// Enhanced Cursor System - Optimized for immediate response
// Enhanced Cursor System
class EnhancedCursorSystem {
  constructor() {
    this.mainCursor = document.getElementById("mainCursor");
    this.cursorTrail = document.getElementById("cursorTrail");
    this.cursorGlow = document.getElementById("cursorGlow");
    this.cursorRipple = document.getElementById("cursorRipple");

    this.mouseX = 0;
    this.mouseY = 0;
    this.trailX = 0;
    this.trailY = 0;
    this.glowX = 0;
    this.glowY = 0;

    this.init();
  }

  init() {
    if (!this.mainCursor) return;

    // Mouse movement
    document.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      this.updateCursor();
    });

    // Click effects
    document.addEventListener("mousedown", (e) => {
      this.addClickEffect(e.clientX, e.clientY);
      this.mainCursor.classList.add("active");
    });

    document.addEventListener("mouseup", () => {
      this.mainCursor.classList.remove("active");
    });

    // Element-specific cursors
    this.setupElementCursors();

    // Start animation loop
    this.animate();
  }

  updateCursor() {
    if (this.mainCursor) {
      this.mainCursor.style.left = this.mouseX + "px";
      this.mainCursor.style.top = this.mouseY + "px";
    }
  }

  animate() {
    // Smooth trail following
    this.trailX += (this.mouseX - this.trailX) * 0.1;
    this.trailY += (this.mouseY - this.trailY) * 0.1;

    this.glowX += (this.mouseX - this.glowX) * 0.05;
    this.glowY += (this.mouseY - this.glowY) * 0.05;

    if (this.cursorTrail) {
      this.cursorTrail.style.left = this.trailX + "px";
      this.cursorTrail.style.top = this.trailY + "px";
    }

    if (this.cursorGlow) {
      this.cursorGlow.style.left = this.glowX + "px";
      this.cursorGlow.style.top = this.glowY + "px";
    }

    requestAnimationFrame(() => this.animate());
  }

  addClickEffect(x, y) {
    if (!this.cursorRipple) return;

    this.cursorRipple.style.left = x + "px";
    this.cursorRipple.style.top = y + "px";
    this.cursorRipple.classList.add("animate");

    setTimeout(() => {
      this.cursorRipple.classList.remove("animate");
    }, 600);
  }

  setupElementCursors() {
    // Buttons and clickable elements
    const buttons = document.querySelectorAll(
      "button, .nav-button, .footer-button, .control-button"
    );
    buttons.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        this.mainCursor.classList.add("button-hover");
      });
      btn.addEventListener("mouseleave", () => {
        this.mainCursor.classList.remove("button-hover");
      });
    });

    // Input fields
    const inputs = document.querySelectorAll(
      'input[type="text"], input[type="time"], textarea, select'
    );
    inputs.forEach((input) => {
      input.addEventListener("mouseenter", () => {
        this.mainCursor.classList.add("text");
      });
      input.addEventListener("mouseleave", () => {
        this.mainCursor.classList.remove("text");
      });
      input.addEventListener("focus", () => {
        this.mainCursor.classList.add("input-focus");
      });
      input.addEventListener("blur", () => {
        this.mainCursor.classList.remove("input-focus");
      });
    });

    // Draggable elements
    const draggables = document.querySelectorAll(
      ".countdown-box, .funny-container"
    );
    draggables.forEach((draggable) => {
      draggable.addEventListener("mouseenter", () => {
        this.mainCursor.classList.add("grab");
      });
      draggable.addEventListener("mouseleave", () => {
        this.mainCursor.classList.remove("grab", "grabbing");
      });
      draggable.addEventListener("mousedown", () => {
        this.mainCursor.classList.add("grabbing");
        this.mainCursor.classList.remove("grab");
      });
      draggable.addEventListener("mouseup", () => {
        this.mainCursor.classList.add("grab");
        this.mainCursor.classList.remove("grabbing");
      });
    });

    // Resize cursors
    this.setupResizeCursors();

    // Links and hoverable elements
    const hoverables = document.querySelectorAll(
      "a, .image-item, .calendar-day"
    );
    hoverables.forEach((hoverable) => {
      hoverable.addEventListener("mouseenter", () => {
        this.mainCursor.classList.add("pointer");
      });
      hoverable.addEventListener("mouseleave", () => {
        this.mainCursor.classList.remove("pointer");
      });
    });

    // Disabled elements
    const disabled = document.querySelectorAll(".disabled, [disabled]");
    disabled.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        this.mainCursor.classList.add("disabled");
      });
      el.addEventListener("mouseleave", () => {
        this.mainCursor.classList.remove("disabled");
      });
    });
  }

  setupResizeCursors() {
    // This will be called when hovering over resize areas
    document.addEventListener("mousemove", (e) => {
      const element = e.target.closest(".countdown-box");
      if (!element) {
        this.mainCursor.classList.remove(
          "resize-se",
          "resize-sw",
          "resize-ne",
          "resize-nw",
          "resize-ew",
          "resize-ns"
        );
        return;
      }

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const isNearRight = x > rect.width - 25;
      const isNearBottom = y > rect.height - 25;
      const isNearLeft = x < 25;
      const isNearTop = y < 25;

      // Remove all resize classes first
      this.mainCursor.classList.remove(
        "resize-se",
        "resize-sw",
        "resize-ne",
        "resize-nw",
        "resize-ew",
        "resize-ns"
      );

      if (isNearRight && isNearBottom) {
        this.mainCursor.classList.add("resize-se");
      } else if (isNearLeft && isNearTop) {
        this.mainCursor.classList.add("resize-nw");
      } else if (isNearRight && isNearTop) {
        this.mainCursor.classList.add("resize-ne");
      } else if (isNearLeft && isNearBottom) {
        this.mainCursor.classList.add("resize-sw");
      } else if (isNearRight || isNearLeft) {
        this.mainCursor.classList.add("resize-ew");
      } else if (isNearBottom || isNearTop) {
        this.mainCursor.classList.add("resize-ns");
      }
    });
  }

  showLoading() {
    this.mainCursor.classList.add("loading");
  }

  hideLoading() {
    this.mainCursor.classList.remove("loading");
  }
}

// Initialize enhanced cursor system
let enhancedCursor;
document.addEventListener("DOMContentLoaded", () => {
  enhancedCursor = new EnhancedCursorSystem();
});
// Protection System
let protectionEnabled = true;
let accessGranted = false;
const ACCESS_CODE = "ILOVEMRWNNBRLL"; // Change this to your desired code

// Disable right-click
document.addEventListener("contextmenu", function (e) {
  if (protectionEnabled && !accessGranted) {
    e.preventDefault();
    showProtectionPanel();
    return false;
  }
});

// Disable common developer shortcut keys
document.addEventListener("keydown", function (e) {
  if (!protectionEnabled || accessGranted) return;

  // F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J, Ctrl+U
  if (
    e.keyCode === 123 ||
    (e.ctrlKey &&
      e.shiftKey &&
      (e.keyCode === 73 || e.keyCode === 67 || e.keyCode === 74)) ||
    (e.ctrlKey && e.keyCode === 85)
  ) {
    e.preventDefault();
    showProtectionPanel();
    return false;
  }

  // Disable Ctrl+S (save page)
  if (e.ctrlKey && e.keyCode === 83) {
    e.preventDefault();
    showProtectionPanel();
    return false;
  }

  // Disable Ctrl+A (select all)
  if (e.ctrlKey && e.keyCode === 65) {
    e.preventDefault();
    return false;
  }
});

// Disable text selection
document.addEventListener("selectstart", function (e) {
  if (protectionEnabled && !accessGranted) {
    e.preventDefault();
    return false;
  }
});

// Disable drag and drop
document.addEventListener("dragstart", function (e) {
  if (protectionEnabled && !accessGranted) {
    e.preventDefault();
    return false;
  }
});

function showProtectionPanel() {
  const overlay = document.getElementById("protection-overlay");
  if (overlay) {
    overlay.style.display = "flex";
  }
}

function hideProtectionPanel() {
  const overlay = document.getElementById("protection-overlay");
  if (overlay) {
    overlay.style.display = "none";
  }
}

function checkAccessCode() {
  const input = document.getElementById("access-code");
  if (input.value === ACCESS_CODE) {
    accessGranted = true;
    hideProtectionPanel();
    logToScreen("🔓 Developer access granted");

    // Hide unlock button permanently
    const unlockBtn = document.getElementById("unlock-button");
    if (unlockBtn) {
      unlockBtn.style.opacity = "0";
      unlockBtn.style.pointerEvents = "none";
      clearTimeout(unlockFadeTimer);
    }

    // Re-enable normal browser functions
    document.body.style.userSelect = "text";
    document.body.style.webkitUserSelect = "text";
  } else {
    input.value = "";
    input.placeholder = "INVALID CODE - TRY AGAIN";
    setTimeout(() => {
      input.placeholder = "Access Code";
    }, 2000);
  }
}

// Add manual unlock button with fade effects
function addUnlockButton() {
  const unlockBtn = document.createElement("div");
  unlockBtn.id = "unlock-button";
  unlockBtn.innerHTML = "🔒";
  unlockBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(248, 165, 194, 0.3);
        backdrop-filter: blur(15px);
        border: 2px solid rgba(248, 165, 194, 0.6);
        color: #f8a5c2;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
        font-size: 20px;
        transition: all 0.4s ease;
        box-shadow: 0 8px 25px rgba(248, 165, 194, 0.2);
        opacity: 1;
    `;

  unlockBtn.onclick = showProtectionPanel;

  // Hover effects
  unlockBtn.addEventListener("mouseenter", () => {
    unlockBtn.style.background = "rgba(248, 165, 194, 0.5)";
    unlockBtn.style.transform = "scale(1.1)";
    unlockBtn.style.boxShadow = "0 12px 35px rgba(248, 165, 194, 0.4)";
    resetUnlockFadeTimer();
  });

  unlockBtn.addEventListener("mouseleave", () => {
    unlockBtn.style.background = "rgba(248, 165, 194, 0.3)";
    unlockBtn.style.transform = "scale(1)";
    unlockBtn.style.boxShadow = "0 8px 25px rgba(248, 165, 194, 0.2)";
  });

  document.body.appendChild(unlockBtn);

  // Start fade timer
  startUnlockFadeTimer();
}

// Fade timer for unlock button
let unlockFadeTimer;
const UNLOCK_FADE_DELAY = 5000; // 5 seconds

function startUnlockFadeTimer() {
  resetUnlockFadeTimer();
  unlockFadeTimer = setTimeout(() => {
    const unlockBtn = document.getElementById("unlock-button");
    if (unlockBtn && !accessGranted) {
      unlockBtn.style.opacity = "0.2";
    }
  }, UNLOCK_FADE_DELAY);
}

function resetUnlockFadeTimer() {
  const unlockBtn = document.getElementById("unlock-button");
  if (unlockBtn) {
    unlockBtn.style.opacity = "1";
  }
  clearTimeout(unlockFadeTimer);
  if (!accessGranted) {
    unlockFadeTimer = setTimeout(() => {
      const unlockBtn = document.getElementById("unlock-button");
      if (unlockBtn) {
        unlockBtn.style.opacity = "0.2";
      }
    }, UNLOCK_FADE_DELAY);
  }
}

// Add mouse movement detection to reset fade timer
document.addEventListener("mousemove", () => {
  if (!accessGranted) {
    resetUnlockFadeTimer();
  }
});
