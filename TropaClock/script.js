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
const loadingScreen = document.getElementById('loading-screen');
const toggleButton = document.getElementById('bg-toggle-button');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const funnyButton = document.getElementById('funny-button');
const burstButton = document.getElementById('burst-button');
const calendarButton = document.getElementById('calendar-button');
const hamburgerButton = document.getElementById('hamburger-button');
const hamburgerDropdown = document.getElementById('hamburger-dropdown');

// New DOM elements for resources popup
const resourcesButton = document.getElementById('resources-button');
const resourcesOverlay = document.getElementById('resources-overlay');
const closeResourcesBtn = document.getElementById('closeResources');
const showBgBtn = document.getElementById('show-bg-btn');
const showRssBtn = document.getElementById('show-rss-btn');
const bgListDiv = document.getElementById('bg-list');
const rssListDiv = document.getElementById('rss-list');
const bgUploadInput = document.getElementById('bg-upload');
const imageUploadInput = document.getElementById('image-upload');
const loadingLogElement = document.getElementById('loading-log');

// Button management for fade effect
const mainNavButtons = document.querySelectorAll('.main-nav-button, #hamburger-button');

const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

let bgSlides = [];
let currentSlide = 0;
const SLIDESHOW_INTERVAL = 6000;
let slideshowInterval;
let isSlideshowPlaying = true;
let availableBackgrounds = [];
let cachedBackgrounds = [];
let lastBgIndex = 0;

// Enhanced image cache system with faster detection
let availableImages = [];
let cachedImages = [];
let lastImageIndex = 0;
let imageIndex = 0;

// Burst functionality
let burstCooldown = false;
const BURST_COOLDOWN_TIME = 30000;
const BURST_COUNT = 15;

// Bubble tracking for clock effects
let activeBubbles = 0;

// Button fading timer
let fadeTimer;
const FADE_DELAY = 5000;

// Function to generate a random color (not black or white)
function getRandomColor() {
    let color = Math.floor(Math.random() * 16777215).toString(16);
    while (color.length < 6 || color === '000000' || color === 'ffffff') {
        color = Math.floor(Math.random() * 16777215).toString(16);
    }
    return `#${color}`;
}

// Enhanced button fading system - only for main navigation
function resetFadeTimer() {
    clearTimeout(fadeTimer);
    mainNavButtons.forEach(btn => btn.classList.remove("translucent"));
    fadeTimer = setTimeout(() => {
        mainNavButtons.forEach(btn => btn.classList.add("translucent"));
    }, FADE_DELAY);
}

// Add hover listeners only to main navigation buttons
mainNavButtons.forEach(button => {
    button.addEventListener("mouseenter", resetFadeTimer);
    button.addEventListener("mousemove", resetFadeTimer);
    button.addEventListener("mouseleave", resetFadeTimer);
});

// Start timer when page loads
resetFadeTimer();

// Enhanced fetch time function
async function fetchTime() {
    if (isFetching) return null;
    isFetching = true;

    try {
        const response = await fetch('https://worldtimeapi.org/api/ip');
        if (!response.ok) throw new Error("API fetch failed");

        const data = await response.json();
        lastKnownTime = new Date(data.datetime);
        lastFetchTime = Date.now();
        logToScreen("✓ Time synchronized with WorldTimeAPI");
        return lastKnownTime;
    } catch (error) {
        logToScreen("⚠ Using local time: API unavailable");
        if (!lastKnownTime) {
            lastKnownTime = new Date();
        }
        return null;
    } finally {
        isFetching = false;
    }
}

// Enhanced clock display with better animations
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

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    const formattedHours = String(displayHours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const formattedYear = String(year).padStart(2, '0');

    dayElement.textContent = dayNames[dayOfWeek];
    clockElement.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
    dateElement.textContent = `${formattedMonth}/${formattedDay}/${formattedYear}`;

    requestAnimationFrame(updateClockDisplay);
}

// Optimized background loading with better detection
async function loadBackgrounds() {
    clearInterval(slideshowInterval);
    const bgContainer = document.getElementById('bgContainer');
    availableBackgrounds = [];
    lastBgIndex = 0;

    logToScreen("🔍 Scanning for background images...");

    // Batch check backgrounds for better performance
    const bgPromises = [];
    const maxChecks = 30;

    for (let i = 0; i < maxChecks; i++) {
        const bgPath = `./bg/BG${i === 0 ? '' : i}.gif`;
        bgPromises.push(
            fetch(bgPath, { method: 'HEAD' })
                .then(response => response.ok ? bgPath : null)
                .catch(() => null)
        );
    }

    const results = await Promise.all(bgPromises);
    availableBackgrounds = results.filter(path => path !== null);
    
    if (availableBackgrounds.length > 0) {
        lastBgIndex = availableBackgrounds.length - 1;
        logToScreen(`✓ Found ${availableBackgrounds.length} background images`);
    }

    // Add cached backgrounds
    availableBackgrounds = availableBackgrounds.concat(cachedBackgrounds);

    // Clear and recreate slides
    bgContainer.innerHTML = '';
    availableBackgrounds.forEach((bg, index) => {
        const slide = document.createElement('div');
        slide.className = 'bg-slide';
        slide.dataset.index = index;
        slide.style.backgroundImage = `url('${bg}')`;
        if (index === 0) slide.classList.add('active');
        bgContainer.appendChild(slide);
    });

    bgSlides = document.querySelectorAll('.bg-slide');
    currentSlide = 0;
    
    if (isSlideshowPlaying) {
        startSlideshow();
        toggleButton.textContent = 'PAUSE';
        document.querySelectorAll('.navigation').forEach(button => {
            button.style.opacity = '0';
            button.style.pointerEvents = 'none';
        });
    } else {
        toggleButton.textContent = 'PLAY';
        document.querySelectorAll('.navigation').forEach(button => {
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        });
    }
}

function nextSlide() {
    if (bgSlides.length === 0) return;
    
    bgSlides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % bgSlides.length;
    bgSlides[currentSlide].classList.add('active');
}

function prevSlide() {
    if (bgSlides.length === 0) return;
    
    bgSlides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide - 1 + bgSlides.length) % bgSlides.length;
    bgSlides[currentSlide].classList.add('active');
}

function toggleSlideshow() {
    if (isSlideshowPlaying) {
        clearInterval(slideshowInterval);
        toggleButton.textContent = 'PLAY';
        document.querySelectorAll('.navigation').forEach(button => {
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        });
    } else {
        startSlideshow();
        toggleButton.textContent = 'PAUSE';
        document.querySelectorAll('.navigation').forEach(button => {
            button.style.opacity = '0';
            button.style.pointerEvents = 'none';
        });
    }
    isSlideshowPlaying = !isSlideshowPlaying;
}

function startSlideshow() {
    slideshowInterval = setInterval(nextSlide, SLIDESHOW_INTERVAL);
}

function setActiveBackground(index) {
    if (index < 0 || index >= bgSlides.length) {
        console.warn('Invalid background index selected.');
        return;
    }

    bgSlides.forEach(slide => slide.classList.remove('active'));
    bgSlides[index].classList.add('active');
    currentSlide = index;

    if (isSlideshowPlaying) {
        clearInterval(slideshowInterval);
        isSlideshowPlaying = false;
        toggleButton.textContent = 'PLAY';
        document.querySelectorAll('.navigation').forEach(button => {
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        });
    }
}

// Enhanced bouncing bubble system with better tracking
class BouncingBubble {
    constructor(imageSrc) {
        this.element = document.createElement('div');
        this.element.className = 'funny-container';
        this.element.style.boxShadow = `0 0 10px rgba(255, 255, 255, 0.2)`;

        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = "Bouncing pixel art";
        img.onerror = () => this.destroy();
        this.element.appendChild(img);

        // Physics properties
        this.x = Math.random() * (window.innerWidth - 80);
        this.y = Math.random() * (window.innerHeight - 80);
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        this.size = Math.max(60, Math.min(120, window.innerWidth * 0.08));
        this.lifetime = 8000;

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
            clockContainer.classList.add('bubble-active');
        } else {
            clockContainer.classList.remove('bubble-active');
        }
    }

    animate() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges and change glow color
        let bounced = false;
        if (this.x <= 0 || this.x >= window.innerWidth - this.size) {
            this.vx *= -1.1; // Slight acceleration on bounce
            this.x = Math.max(0, Math.min(window.innerWidth - this.size, this.x));
            bounced = true;
        }
        if (this.y <= 0 || this.y >= window.innerHeight - this.size) {
            this.vy *= -1.1;
            this.y = Math.max(0, Math.min(window.innerHeight - this.size, this.y));
            bounced = true;
        }

        if (bounced) {
            const randomColor = getRandomColor();
            this.element.style.boxShadow = `0 0 20px 8px ${randomColor}`;
        }

        // Add rotation and pulsing effect
        const time = Date.now() * 0.001;
        const rotation = Math.sin(time + this.x * 0.01) * 15;
        const scale = 1 + Math.sin(time * 2 + this.y * 0.01) * 0.1;
        
        this.element.style.transform = `rotate(${rotation}deg) scale(${scale})`;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;

        if (this.element.parentNode) {
            requestAnimationFrame(() => this.animate());
        }
    }

    destroy() {
        if (this.element.parentNode) {
            this.element.remove();
            activeBubbles--;
            this.updateClockEffect();
        }
    }
}

// Optimized image loading with batch processing
async function loadRandomImages() {
    logToScreen("🎭 Loading Tropa images...");
    const images = [];

    // Batch check for better performance
    const imagePromises = [];
    const extensions = ['png', 'jpg', 'jpeg', 'gif', 'jfif'];
    const maxChecks = 100;

    for (let i = 1; i <= maxChecks; i++) {
        for (const ext of extensions) {
            const imagePath = `./rss/image_(${i}).${ext}`;
            imagePromises.push(
                fetch(imagePath, { method: 'HEAD' })
                    .then(response => response.ok ? imagePath : null)
                    .catch(() => null)
            );
        }
    }

    const results = await Promise.all(imagePromises);
    const foundImages = results.filter(path => path !== null);
    
    if (foundImages.length > 0) {
        images.push(...foundImages);
        lastImageIndex = Math.max(lastImageIndex, foundImages.length);
        logToScreen(`✓ Found ${foundImages.length} Tropa images`);
    }

    // Add cached images
    images.push(...cachedImages);

    // Fallback colored squares
    if (images.length === 0) {
        logToScreen("⚠ No images found, using fallback squares");
        const colors = ['ff0080', '00ff41', '40e0d0', 'ffff00', 'ff8040'];
        colors.forEach((color, i) => {
            images.push(`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23${color}"/><rect x="20" y="20" width="60" height="60" fill="%23000"/><rect x="30" y="30" width="40" height="40" fill="%23${color}"/></svg>`);
        });
    }

    return images;
}

// Hamburger menu functionality
function toggleHamburgerMenu() {
    const isActive = hamburgerDropdown.classList.contains('active');
    hamburgerButton.classList.toggle('active', !isActive);
    hamburgerDropdown.classList.toggle('active', !isActive);
}

// Close hamburger menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburgerButton.contains(e.target) && !hamburgerDropdown.contains(e.target)) {
        hamburgerButton.classList.remove('active');
        hamburgerDropdown.classList.remove('active');
    }
});

// Enhanced calendar functionality with year/month selectors
const calendarOverlay = document.getElementById('calendar-overlay');
const calendarGrid = document.getElementById('calendarGrid');
const monthSelector = document.getElementById('monthSelector');
const yearSelector = document.getElementById('yearSelector');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const closeCalendarBtn = document.getElementById('closeCalendar');

let currentCalendarDate = new Date();

// Populate year selector
function populateYearSelector() {
    const currentYear = new Date().getFullYear();
    yearSelector.innerHTML = '';
    
    for (let year = currentYear - 50; year <= currentYear + 50; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentCalendarDate.getFullYear()) {
            option.selected = true;
        }
        yearSelector.appendChild(option);
    }
}

function generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // Update selectors
    monthSelector.value = month;
    yearSelector.value = year;

    calendarGrid.innerHTML = '';

    const dayHeaders = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });

    const prevMonth = new Date(year, month, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = prevMonth.getDate() - i;
        calendarGrid.appendChild(day);
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        if (year === today.getFullYear() &&
            month === today.getMonth() &&
            day === today.getDate()) {
            dayElement.classList.add('today');
        }

        calendarGrid.appendChild(dayElement);
    }

    const remainingCells = 42 - (firstDayOfWeek + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    }
}

function showCalendar() {
    populateYearSelector();
    generateCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
    calendarOverlay.classList.add('active');
    hamburgerButton.classList.remove('active');
    hamburgerDropdown.classList.remove('active');
}

function hideCalendar() {
    calendarOverlay.classList.remove('active');
}

// Resources functions
function showResourcesPopup() {
    resourcesOverlay.classList.add('active');
    showBgList();
    hamburgerButton.classList.remove('active');
    hamburgerDropdown.classList.remove('active');
}

function hideResourcesPopup() {
    resourcesOverlay.classList.remove('active');
}

function createResourceList(container, resources, type) {
    const gridContainer = container.querySelector('.image-grid');
    if (!gridContainer) {
        console.error("Image grid container not found.");
        return;
    }
    gridContainer.innerHTML = '';

    if (resources.length > 0) {
        const defaultBgCount = availableBackgrounds.length - cachedBackgrounds.length;
        const defaultImageCount = availableImages.length - cachedImages.length;

        resources.forEach((res, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'image-item';
            itemDiv.dataset.index = index;

            const img = document.createElement('img');
            img.src = res;
            img.alt = res;
            img.loading = 'lazy';

            const filenameDiv = document.createElement('div');
            filenameDiv.className = 'image-item-filename';
            
            if (type === 'bg') {
                let bgName = `BG${index === 0 ? '' : index}.gif`;
                if (index >= defaultBgCount) {
                    bgName = `BG${lastBgIndex + (index - defaultBgCount) + 1}.gif`;
                }
                filenameDiv.textContent = bgName;
            } else if (type === 'rss') {
                if (index >= defaultImageCount) {
                    const cacheIndex = index - defaultImageCount + 1;
                    filenameDiv.textContent = `image_cache_(${cacheIndex})`;
                } else {
                    filenameDiv.textContent = `image_(${index + 1})`;
                }
            }

            itemDiv.appendChild(img);
            itemDiv.appendChild(filenameDiv);
            gridContainer.appendChild(itemDiv);

            if (type === 'bg') {
                itemDiv.addEventListener('click', () => {
                    setActiveBackground(index);
                    hideResourcesPopup();
                });
            }
        });
    } else {
        gridContainer.innerHTML = '<div>No images found.</div>';
    }
}

function showBgList() {
    bgListDiv.style.display = 'block';
    rssListDiv.style.display = 'none';
    createResourceList(bgListDiv, availableBackgrounds, 'bg');
}

function showRssList() {
    bgListDiv.style.display = 'none';
    rssListDiv.style.display = 'block';
    createResourceList(rssListDiv, availableImages, 'rss');
}

// Burst functionality
function startBurst() {
    if (burstCooldown) return;
    
    burstCooldown = true;
    burstButton.classList.add('disabled');
    
    // Create cooldown indicator
    const cooldownElement = document.createElement('div');
    cooldownElement.className = 'burst-cooldown';
    burstButton.appendChild(cooldownElement);
    
    let timeLeft = BURST_COOLDOWN_TIME / 1000;
    const cooldownInterval = setInterval(() => {
        timeLeft--;
        cooldownElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(cooldownInterval);
            cooldownElement.remove();
            burstCooldown = false;
            burstButton.classList.remove('disabled');
        }
    }, 1000);
    
    cooldownElement.textContent = timeLeft;
    
    // Generate burst of bubbles
    const burstImages = availableImages.length > 0 ? availableImages : [];
    for (let i = 0; i < BURST_COUNT; i++) {
        setTimeout(() => {
            if (burstImages.length > 0) {
                const randomImage = burstImages[Math.floor(Math.random() * burstImages.length)];
                new BouncingBubble(randomImage);
            }
        }, i * 150);
    }
    
    logToScreen(`💥 BURST ACTIVATED! Generated ${BURST_COUNT} bubbles`);
}

// Event listeners
toggleButton.addEventListener('click', toggleSlideshow);
prevButton.addEventListener('click', prevSlide);
nextButton.addEventListener('click', nextSlide);
hamburgerButton.addEventListener('click', toggleHamburgerMenu);
calendarButton.addEventListener('click', showCalendar);
closeCalendarBtn.addEventListener('click', hideCalendar);

calendarOverlay.addEventListener('click', (e) => {
    if (e.target === calendarOverlay) hideCalendar();
});

// Calendar navigation
prevMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    generateCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
});

nextMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    generateCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
});

// Month and year selector changes
monthSelector.addEventListener('change', (e) => {
    currentCalendarDate.setMonth(parseInt(e.target.value));
    generateCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
});

yearSelector.addEventListener('change', (e) => {
    currentCalendarDate.setFullYear(parseInt(e.target.value));
    generateCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
});

// Tropa and Burst buttons
funnyButton.addEventListener('click', async () => {
    if (availableImages.length === 0) {
        availableImages = await loadRandomImages();
    }

    const randomImage = availableImages[imageIndex % availableImages.length];
    imageIndex++;

    new BouncingBubble(randomImage);
});

burstButton.addEventListener('click', startBurst);

// Resources
resourcesButton.addEventListener('click', showResourcesPopup);
closeResourcesBtn.addEventListener('click', hideResourcesPopup);
showBgBtn.addEventListener('click', showBgList);
showRssBtn.addEventListener('click', showRssList);

resourcesOverlay.addEventListener('click', (e) => {
    if (e.target === resourcesOverlay) hideResourcesPopup();
});

// Enhanced file upload handlers
bgUploadInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const uploadedImageURL = e.target.result;
            cachedBackgrounds.push(uploadedImageURL);
            logToScreen(`✓ New background uploaded: ${file.name}`);
            
            const wasPlaying = isSlideshowPlaying;
            await loadBackgrounds();
            
            if (wasPlaying !== isSlideshowPlaying) {
                toggleSlideshow();
            }
            
            showBgList();
        };
        reader.readAsDataURL(file);
        event.target.value = ''; // Reset file input
    }
});

imageUploadInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const uploadedImageURL = e.target.result;
            cachedImages.push(uploadedImageURL);
            
            availableImages = await loadRandomImages();
            
            logToScreen(`✓ New image uploaded: ${file.name} -> image_cache_(${cachedImages.length})`);
            
            if (rssListDiv.style.display !== 'none') {
                showRssList();
            }
        };
        reader.readAsDataURL(file);
        event.target.value = ''; // Reset file input
    }
});

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'Escape':
            hideCalendar();
            hideResourcesPopup();
            hamburgerButton.classList.remove('active');
            hamburgerDropdown.classList.remove('active');
            break;
        case ' ':
            e.preventDefault();
            toggleSlideshow();
            break;
        case 'ArrowLeft':
            if (!isSlideshowPlaying) prevSlide();
            break;
        case 'ArrowRight':
            if (!isSlideshowPlaying) nextSlide();
            break;
        case 'c':
        case 'C':
            if (!calendarOverlay.classList.contains('active')) {
                showCalendar();
            }
            break;
        case 'Enter':
            funnyButton.click();
            break;
        case 'b':
        case 'B':
            if (!burstCooldown) {
                burstButton.click();
            }
            break;
        case 'm':
        case 'M':
            toggleHamburgerMenu();
            break;
    }
});

// Function for enhanced logging
function logToScreen(message) {
    if (loadingLogElement) {
        const logLine = document.createElement('div');
        logLine.textContent = `> ${message}`;
        logLine.style.opacity = '0';
        logLine.style.transform = 'translateY(10px)';
        loadingLogElement.appendChild(logLine);
        
        // Animate in
        setTimeout(() => {
            logLine.style.transition = 'all 0.3s ease';
            logLine.style.opacity = '1';
            logLine.style.transform = 'translateY(0)';
        }, 50);
        
        loadingLogElement.scrollTop = loadingLogElement.scrollHeight;
        
        // Remove old log entries to prevent overflow
        const logEntries = loadingLogElement.children;
        if (logEntries.length > 20) {
            logEntries[0].remove();
        }
    }
}

// Enhanced initialization
async function initialize() {
    logToScreen("🚀 Initializing TropaClock System...");
    logToScreen("⚡ Loading core components...");

    try {
        logToScreen("🎨 Scanning background directory...");
        await loadBackgrounds();
        logToScreen("✓ Background system initialized");

        logToScreen("🎭 Loading Tropa image library...");
        availableImages = await loadRandomImages();
        logToScreen(`✓ Image system ready (${availableImages.length} images)`);

        logToScreen("⏰ Synchronizing with time servers...");
        await fetchTime();
        lastUpdateTime = Date.now();
        requestAnimationFrame(updateClockDisplay);
        logToScreen("✓ Time synchronization complete");

        logToScreen("🎮 Initializing user interface...");
        logToScreen("✓ Navigation controls ready");
        logToScreen("✓ Calendar system loaded");
        logToScreen("✓ Resource manager active");
        logToScreen("✓ Burst system armed");
        
        logToScreen("🌟 TropaClock fully operational!");
        logToScreen("Ready for pixel perfection...");
        
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 2000);

    } catch (error) {
        logToScreen("⚠ Warning: Some features may use fallback mode");
        logToScreen("✓ System operational with limited functionality");
        console.error("Initialization error:", error);
        
        // Ensure basic functionality
        if (!lastKnownTime) {
            lastKnownTime = new Date();
            lastUpdateTime = Date.now();
            requestAnimationFrame(updateClockDisplay);
        }
        
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 1500);
    }
}

// Performance optimizations
setInterval(() => {
    const bubbles = document.querySelectorAll('.funny-container');
    if (bubbles.length > 20) {
        for (let i = 0; i < bubbles.length - 15; i++) {
            bubbles[i].remove();
            activeBubbles--;
        }
    }
}, 5000);

// Enhanced window resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const bubbles = document.querySelectorAll('.funny-container');
        bubbles.forEach(bubble => {
            const rect = bubble.getBoundingClientRect();
            const maxX = window.innerWidth - parseInt(bubble.style.width);
            const maxY = window.innerHeight - parseInt(bubble.style.height);
            
            if (rect.left > maxX) {
                bubble.style.left = maxX + 'px';
            }
            if (rect.top > maxY) {
                bubble.style.top = maxY + 'px';
            }
        });
    }, 250);
});

// Enhanced Konami code easter egg
let konami = [];
const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
document.addEventListener('keydown', (e) => {
    konami.push(e.keyCode);
    if (konami.length > konamiCode.length) {
        konami.shift();
    }
    if (JSON.stringify(konami) === JSON.stringify(konamiCode)) {
        logToScreen("🎊 KONAMI CODE ACTIVATED!");
        logToScreen("🌟 MEGA BURST SEQUENCE INITIATED!");
        
        for (let i = 0; i < 25; i++) {
            setTimeout(() => {
                if (availableImages.length > 0) {
                    const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
                    new BouncingBubble(randomImage);
                }
            }, i * 100);
        }
        konami = [];
    }
});

// Touch support for mobile
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
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
}, { passive: true });

// Start the enhanced application
initialize();

// Image Preview System
const imagePreviewOverlay = document.getElementById('image-preview-overlay');
const previewImage = document.getElementById('preview-image');
const closePreviewBtn = document.getElementById('closePreview');
const prevImageBtn = document.getElementById('prevImage');
const nextImageBtn = document.getElementById('nextImage');
const downloadImageLink = document.getElementById('downloadImage');

let currentPreviewIndex = -1;

// Open preview when clicking a Tropa image
function openImagePreview(index) {
    if (index < 0 || index >= availableImages.length) return;
    currentPreviewIndex = index;
    previewImage.src = availableImages[index];
    downloadImageLink.href = availableImages[index];
    imagePreviewOverlay.classList.add('active');
}

// Close preview
function closeImagePreview() {
    imagePreviewOverlay.classList.remove('active');
    currentPreviewIndex = -1;
}

// Navigate
function showPrevImage() {
    if (currentPreviewIndex > 0) {
        openImagePreview(currentPreviewIndex - 1);
    } else {
        openImagePreview(availableImages.length - 1); // loop around
    }
}

function showNextImage() {
    if (currentPreviewIndex < availableImages.length - 1) {
        openImagePreview(currentPreviewIndex + 1);
    } else {
        openImagePreview(0); // loop around
    }
}

// Event listeners
closePreviewBtn.addEventListener('click', closeImagePreview);
prevImageBtn.addEventListener('click', showPrevImage);
nextImageBtn.addEventListener('click', showNextImage);

imagePreviewOverlay.addEventListener('click', (e) => {
    if (e.target === imagePreviewOverlay) closeImagePreview();
});

// Hook into resource list creation (only for 'rss' images)
function createResourceList(container, resources, type) {
    const gridContainer = container.querySelector('.image-grid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    if (resources.length > 0) {
        const defaultImageCount = availableImages.length - cachedImages.length;

        resources.forEach((res, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'image-item';
            itemDiv.dataset.index = index;

            const img = document.createElement('img');
            img.src = res;
            img.alt = res;
            img.loading = 'lazy';

            const filenameDiv = document.createElement('div');
            filenameDiv.className = 'image-item-filename';

            if (type === 'rss') {
                if (index >= defaultImageCount) {
                    const cacheIndex = index - defaultImageCount + 1;
                    filenameDiv.textContent = `image_cache_(${cacheIndex})`;
                } else {
                    filenameDiv.textContent = `image_(${index + 1})`;
                }
            }

            itemDiv.appendChild(img);
            itemDiv.appendChild(filenameDiv);
            gridContainer.appendChild(itemDiv);

            if (type === 'bg') {
                itemDiv.addEventListener('click', () => {
                    setActiveBackground(index);
                    hideResourcesPopup();
                });
            } else if (type === 'rss') {
                itemDiv.addEventListener('click', () => {
                    openImagePreview(index);
                });
            }
        });
    } else {
        gridContainer.innerHTML = '<div>No images found.</div>';
    }
}

/* ===== Special Countdown JS ===== */
(function(){
    const countdownContainer = document.getElementById('countdown-container');
    const countdownToggle = document.getElementById('countdown-toggle');
    const countdownTimeEl = document.getElementById('countdown-time');
    const countdownDateEl = document.getElementById('countdown-date');
    const countdownSelect = document.getElementById('countdown-select');
  
    const customTimeContainer = document.getElementById('custom-time-container');
    const customStartInput = document.getElementById('customStart');
    const customEndInput = document.getElementById('customEnd');
  
    // Keep track of state
    let isVisible = false;
    let useCustom = false;
    let customStart = null; // {hour, minute}
    let customEnd = null;   // {hour, minute}
  
    // Hook the toggle button
    function showCountdown() {
      countdownContainer.classList.add('active');
      countdownContainer.setAttribute('aria-hidden', 'false');
      countdownToggle.setAttribute('aria-pressed', 'true');
      isVisible = true;
    }
    function hideCountdown() {
      countdownContainer.classList.remove('active');
      countdownContainer.setAttribute('aria-hidden', 'true');
      countdownToggle.setAttribute('aria-pressed', 'false');
      isVisible = false;
    }
  
    countdownToggle.addEventListener('click', () => {
      if (isVisible) hideCountdown(); else showCountdown();
    });
  
    // integrate the fade timer reset so toggle uses the same fading behavior
    try {
      const fadeTargets = document.querySelectorAll('#countdown-toggle');
      fadeTargets.forEach(btn => {
        btn.addEventListener("mouseenter", resetFadeTimer);
        btn.addEventListener("mousemove", resetFadeTimer);
        btn.addEventListener("mouseleave", resetFadeTimer);
      });
    } catch(e){ /* ignore if resetFadeTimer isn't available */ }
  
    // handle preset vs custom
    countdownSelect.addEventListener('change', (e) => {
      const v = e.target.value;
      if (v === 'custom') {
        useCustom = true;
        customTimeContainer.classList.add('active');
        customTimeContainer.setAttribute('aria-hidden','false');
      } else {
        useCustom = false;
        customTimeContainer.classList.remove('active');
        customTimeContainer.setAttribute('aria-hidden','true');
      }
    });
  
    // capture custom time inputs
    customStartInput.addEventListener('input', () => {
      if (!customStartInput.value) { customStart = null; return; }
      const [hh, mm] = customStartInput.value.split(':').map(Number);
      customStart = { hour: hh, minute: mm };
    });
    customEndInput.addEventListener('input', () => {
      if (!customEndInput.value) { customEnd = null; return; }
      const [hh, mm] = customEndInput.value.split(':').map(Number);
      customEnd = { hour: hh, minute: mm };
    });
  
    // utility: Monday (this week) date object (00:00)
    function getMondayOfWeek(someDate){
      const d = new Date(someDate);
      const day = d.getDay(); // 0 sunday .. 6 saturday
      const monday = new Date(d);
      // (day + 6) % 7 yields 0 for monday, 6 for sunday
      monday.setDate(d.getDate() - ((day + 6) % 7));
      monday.setHours(0,0,0,0);
      return monday;
    }
  
    // compute next start & end times given either preset or custom
    function computeRange(now){
      let monday = getMondayOfWeek(now);
      let startDate = new Date(monday);
      let endDate = new Date(monday);
  
      if (useCustom && customStart && customEnd) {
        // Start = monday + customStart.hour/min
        startDate.setHours(customStart.hour, customStart.minute || 0, 0, 0);
        // End = friday (monday + 4) + customEnd.hour/min
        endDate.setDate(monday.getDate() + 4);
        endDate.setHours(customEnd.hour, customEnd.minute || 0, 0, 0);
      } else {
        // preset selection: 7 => friday 16, 8 => 17, 9 => 18
        const preset = parseInt(countdownSelect.value, 10) || 7;
        startDate.setHours(preset, 0, 0, 0);
        const endHour = preset === 7 ? 16 : (preset === 8 ? 17 : 18);
        endDate.setDate(monday.getDate() + 4);
        endDate.setHours(endHour, 0, 0, 0);
      }
  
      // Determine if the computed start is in the past relative to "now"
      // If 'now' is after the endDate of this week, compute next week's range.
      if (now > endDate) {
        // shift to next week
        monday.setDate(monday.getDate() + 7);
        startDate = new Date(monday);
        endDate = new Date(monday);
        if (useCustom && customStart && customEnd) {
          startDate.setHours(customStart.hour, customStart.minute || 0, 0, 0);
          endDate.setDate(monday.getDate() + 4);
          endDate.setHours(customEnd.hour, customEnd.minute || 0, 0, 0);
        } else {
          const preset = parseInt(countdownSelect.value, 10) || 7;
          startDate.setHours(preset, 0, 0, 0);
          const endHour = preset === 7 ? 16 : (preset === 8 ? 17 : 18);
          endDate.setDate(monday.getDate() + 4);
          endDate.setHours(endHour, 0, 0, 0);
        }
      }
  
      return { startDate, endDate };
    }
  
    // human readable pad
    function pad(n){ return String(n).padStart(2,'0'); }
  
    // main ticking loop (1s)
    function tick(){
      const now = new Date();
      const { startDate, endDate } = computeRange(now);
  
      if (now < startDate) {
        // countdown to start (next monday start)
        const diff = startDate - now;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff / 3600000) % 24);
        const minutes = Math.floor((diff / 60000) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        countdownTimeEl.textContent = `Meron ka pang ${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)} para mamahinga`;
        countdownDateEl.textContent = `Start: ${startDate.toLocaleString()}`;
      } else if (now >= startDate && now <= endDate) {
        // countdown to end (this week's Friday end)
        const diff = endDate - now;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff / 3600000) % 24);
        const minutes = Math.floor((diff / 60000) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        countdownTimeEl.textContent = `Trabaho ka muna ng ${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)} bago hayahay`;
        countdownDateEl.textContent = ` ${endDate.toLocaleString()}`;
      } else {
        // fallback: (shouldn't happen due to computeRange), show message
        countdownTimeEl.textContent = '--:--:--';
        countdownDateEl.textContent = 'Outside range';
      }
    }
  
    // start the 1-second interval
    // ensure only one interval runs
    if (!window.__specialCountdownInterval) {
      tick(); // immediate
      window.__specialCountdownInterval = setInterval(tick, 1000);
    }
  
    // Initialize UI state: if custom is selected by default, show fields
    if (countdownSelect.value === 'custom') {
      customTimeContainer.classList.add('active');
      customTimeContainer.setAttribute('aria-hidden','false');
      useCustom = true;
    }
  
    // expose show/hide functions if needed
    window.showSpecialCountdown = showCountdown;
    window.hideSpecialCountdown = hideCountdown;
  
  })();

  document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("countdown-toggle");
    if (toggleBtn) toggleBtn.classList.add("ready");
  });