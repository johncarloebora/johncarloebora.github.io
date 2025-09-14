// Create floating shapes
const shapesContainer = document.getElementById('shapes');
const numberOfShapes = 30; // Increased number of shapes

for (let i = 0; i < numberOfShapes; i++) {
    const shape = document.createElement('div');
    shape.className = 'shape';
    
    const size = Math.random() * 100 + 20; // Increased size variation
    shape.style.width = `${size}px`;
    shape.style.height = `${size}px`;
    
    shape.style.left = `${Math.random() * 100}%`;
    shape.style.top = `${Math.random() * 100}%`;
    
    const moveX = (Math.random() - 0.5) * 300; // Increased movement range
    const moveY = (Math.random() - 0.5) * 300;
    shape.style.setProperty('--moveX', `${moveX}px`);
    shape.style.setProperty('--moveY', `${moveY}px`);
    
    shape.style.animationDelay = `${Math.random() * -30}s`; // Increased animation variation
    
    shapesContainer.appendChild(shape);
}

// Intersection Observer for animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1
});

// Observe all animated elements
document.querySelectorAll('.project-card, .about-text, .about-image, .contact-form').forEach(element => {
    observer.observe(element);
});

// Smooth scroll navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        const navHeight = document.querySelector('.nav-header').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        this.classList.add('active');
    });
});

// Hide/show navigation on scroll
let lastScroll = 0;
const nav = document.querySelector('.nav-header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll && currentScroll > 100) {
        nav.classList.add('hidden');
    } else {
        nav.classList.remove('hidden');
    }
    
    lastScroll = currentScroll;

    // Update active nav link based on scroll position
    const sections = document.querySelectorAll('section, header');
    const navLinks = document.querySelectorAll('.nav-link');

    sections.forEach(section => {
        const sectionTop = section.offsetTop - nav.offsetHeight - 100;
        const sectionBottom = sectionTop + section.offsetHeight;
        
        if (currentScroll >= sectionTop && currentScroll < sectionBottom) {
            const targetLink = document.querySelector(`.nav-link[href="#${section.id}"]`);
            navLinks.forEach(link => link.classList.remove('active'));
            if (targetLink) targetLink.classList.add('active');
        }
    });
});

// Add to your existing JavaScript
const navToggle = document.querySelector(".mobile-nav-toggle");
const primaryNav = document.querySelector(".nav-container");

navToggle.addEventListener("click", () => {
    const visibility = primaryNav.getAttribute("data-visible");
    
    if (visibility === "false" || !visibility) {
        primaryNav.setAttribute("data-visible", true);
        navToggle.setAttribute("aria-expanded", true);
        document.body.classList.add("nav-active");
    } else {
        primaryNav.setAttribute("data-visible", false);
        navToggle.setAttribute("aria-expanded", false);
        document.body.classList.remove("nav-active");
    }
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
    if (!primaryNav.contains(e.target) && !navToggle.contains(e.target)) {
        primaryNav.setAttribute("data-visible", false);
        navToggle.setAttribute("aria-expanded", false);
        document.body.classList.remove("nav-active");
    }
});

// Close menu when pressing Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        primaryNav.setAttribute("data-visible", false);
        navToggle.setAttribute("aria-expanded", false);
        document.body.classList.remove("nav-active");
    }
});

const checkViewport = () => {
    if (window.innerWidth <= 480) {
        primaryNav.setAttribute("data-mobile", true);
    } else {
        primaryNav.setAttribute("data-mobile", false);
        primaryNav.setAttribute("data-visible", false);
        navToggle.setAttribute("aria-expanded", false);
        document.body.classList.remove("nav-active");
    }
};

window.addEventListener('resize', checkViewport);
window.addEventListener('load', checkViewport);


// Initialize EmailJS
(function() {
            emailjs.init('l9FengsYbeILidGxh');
        })();

        document.getElementById('contact-form').addEventListener('submit', async function(event) {
            event.preventDefault();

            const recaptchaResponse = grecaptcha.getResponse();
            if (!recaptchaResponse) {
                alert('Please complete the reCAPTCHA.');
                return;
            }

            try {
                const response = await emailjs.send('service_ansc2g4', 'template_g5u73sh', {
                    from_name: document.getElementById('name').value, 
                    to_email: document.getElementById('email').value,
                    message: document.getElementById('message').value,
                    'g-recaptcha-response': recaptchaResponse
                });

                document.getElementById('contact-form').reset();
                grecaptcha.reset();
                alert('Message sent successfully!');
            } catch (error) {
                console.error('Failed to send message:', error);
                alert('Failed to send message. Please try again later.');
            }
        });

document.addEventListener('DOMContentLoaded', () => {
    const projectThumbnail = document.querySelector('.project-thumbnail');
    const galleryModal = document.querySelector('.gallery-modal');
    const previewModal = document.querySelector('.preview-modal');
    const galleryGrid = document.querySelector('.gallery-grid');
    const previewImage = document.querySelector('.preview-image');
    let currentImages = [];
    let currentIndex = 0;
    let lastGalleryIndex = 0;  // Store the last gallery image index.

    function lockScroll() {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        document.body.classList.add('modal-open');
    }

    function unlockScroll() {
        document.body.style.paddingRight = '';
        document.body.classList.remove('modal-open');
    }

    function showGallery() {
        previewModal.classList.remove('active');
        galleryModal.classList.add('active');
        lockScroll();
    }

    function showPreview(index) {
        currentIndex = index;
        const image = currentImages[currentIndex];
        previewImage.classList.remove('loaded');
        previewImage.src = image.src;
        previewImage.alt = image.alt;

        previewImage.onload = () => {
            requestAnimationFrame(() => {
                previewImage.classList.add('loaded');
            });
        };

        galleryModal.classList.remove('active');
        previewModal.classList.add('active');
    }

    function closeAllModals() {
        galleryModal.classList.remove('active');
        previewModal.classList.remove('active');
        unlockScroll();
    }

    function navigate(direction) {
        previewImage.classList.remove('loaded');
        currentIndex = (currentIndex + direction + currentImages.length) % currentImages.length;
        showPreview(currentIndex);
    }

    // Event Listeners
    projectThumbnail.addEventListener('click', () => {
        const images = Array.from(projectThumbnail.querySelector('.hidden-gallery').children);
        currentImages = images.map(img => ({
            src: img.src,
            alt: img.alt
        }));

        galleryGrid.innerHTML = currentImages.map((img, index) => `
            <div class="gallery-item" data-index="${index}">
                <img src="${img.src}" alt="${img.alt}">
            </div>
        `).join('');

        showGallery();
    });

    galleryGrid.addEventListener('click', (e) => {
        const item = e.target.closest('.gallery-item');
        if (item) {
            lastGalleryIndex = parseInt(item.dataset.index); // Remember the index of the last clicked gallery item
            showPreview(lastGalleryIndex);
        }
    });

    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => {
            if (previewModal.classList.contains('active')) {
                // Return to the gallery and remember where we were
                showGallery();
            } else {
                // Close all modals
                closeAllModals();
            }
        });
    });

    document.querySelector('.preview-prev').addEventListener('click', () => navigate(-1));
    document.querySelector('.preview-next').addEventListener('click', () => navigate(1));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (previewModal.classList.contains('active')) {
                // Pressing ESC when in preview brings you back to the gallery
                showGallery();
            } else if (galleryModal.classList.contains('active')) {
                // Pressing ESC when in gallery closes the modal
                closeAllModals();
            }
        } else if (e.key === 'ArrowLeft' && previewModal.classList.contains('active')) {
            navigate(-1);
        } else if (e.key === 'ArrowRight' && previewModal.classList.contains('active')) {
            navigate(1);
        }
    });

    // Make sure we return to the same position in the gallery when reopening it
    window.addEventListener('popstate', () => {
        if (galleryModal.classList.contains('active')) {
            const item = galleryGrid.querySelector(`.gallery-item[data-index="${lastGalleryIndex}"]`);
            if (item) {
                item.scrollIntoView();
            }
        }
    });
});
        
        

let scrollPosition = 0;

function lockScroll() {
    scrollPosition = window.pageYOffset;
    document.body.classList.add('scroll-lock');
    document.body.style.top = `-${scrollPosition}px`;
}

function unlockScroll() {
    document.body.classList.remove('scroll-lock');
    document.body.style.top = '';
    window.scrollTo(0, scrollPosition);
}

// document.addEventListener('DOMContentLoaded', () => {
//     const galleryModal = document.querySelector('.gallery-modal');
//     const galleryGrid = document.querySelector('.gallery-grid');
//     const closeButton = document.querySelector('.gallery-modal .close-button');
//     const navHeader = document.querySelector('.nav-header');
//     const mobileNavToggle = document.querySelector('.mobile-nav-toggle');

//     document.querySelectorAll('.project-thumbnail[data-gallery]').forEach(thumbnail => {
//         thumbnail.addEventListener('click', () => {
//             const hiddenGallery = thumbnail.querySelector('.hidden-gallery');
//             galleryGrid.innerHTML = hiddenGallery.innerHTML;
//             galleryModal.classList.add('open');
//             navHeader.classList.add('hide');
//             mobileNavToggle.classList.add('hide');
//         });
//     });

//     closeButton.addEventListener('click', () => {
//         galleryModal.classList.remove('open');
//         navHeader.classList.remove('hide');
//         mobileNavToggle.classList.remove('hide');
//     });
// });

// Add to your existing script.js
function handleGalleryNavigation() {
    const navHeader = document.querySelector('.nav-header');
    const mobileNav = document.querySelector('.mobile-nav-toggle');
    const navContainer = document.querySelector('.nav-container');
    const hamburger = document.querySelector('.hamburger');
    const galleryModal = document.querySelector('.gallery-modal');
    const previewModal = document.querySelector('.preview-modal');

    let isDesktopMode = window.innerWidth >= 768;
    let lastGalleryState = false;

    function updateNavigation(hide) {
        const transform = hide ? 'translateY(-100%)' : '';
        navHeader.style.transform = transform;
        mobileNav.style.transform = transform;
        navContainer.style.transform = transform;
        hamburger.style.opacity = isDesktopMode ? '0' : '1';
    }

    function handleModalStates() {
        const isGalleryOpen = galleryModal.classList.contains('active');
        const isPreviewOpen = previewModal.classList.contains('active');
        
        if (isGalleryOpen) {
            lastGalleryState = true;
            updateNavigation(true);
        } else if (!isGalleryOpen && !isPreviewOpen && lastGalleryState) {
            lastGalleryState = false;
            updateNavigation(false);
        }
    }

    window.addEventListener('resize', () => {
        isDesktopMode = window.innerWidth >= 768;
        handleModalStates();
    });

    const observer = new MutationObserver(handleModalStates);
    observer.observe(galleryModal, { attributes: true });
    observer.observe(previewModal, { attributes: true });

    handleModalStates();
}

document.addEventListener('DOMContentLoaded', handleGalleryNavigation);

document.addEventListener('DOMContentLoaded', () => {
    // Disable pinch-to-zoom (mobile only)
    const viewportMetaTag = document.createElement('meta');
    viewportMetaTag.name = "viewport";
    viewportMetaTag.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui";
    document.head.appendChild(viewportMetaTag);

    // Prevent zooming via mouse scroll (when Ctrl is pressed)
    document.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

    // Disable zooming via keyboard (Ctrl + +, Ctrl + -, Ctrl + 0)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
            e.preventDefault();  // Prevent default zooming behavior
        }
    });
});



