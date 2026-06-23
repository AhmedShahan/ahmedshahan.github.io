// ===== TYPED.JS — rotating roles (only on pages with .multiple-text + Typed loaded) =====
const typedEl = document.querySelector('.multiple-text');
if (typedEl && typeof Typed !== 'undefined') {
  var typed = new Typed('.multiple-text', {
    strings: [
      'Artificial Neural Networks',
      'Machine Learning',
      'Deep Learning',
      'AI Engineering',
      'Teaching & Education',
    ],
    typeSpeed: 60,
    backSpeed: 40,
    backDelay: 1800,
    loop: true,
  });
}

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileOverlay = document.getElementById('mobileMenuOverlay');

function toggleMobileMenu(open) {
  const isOpen = open !== undefined ? open : !mobileMenu.classList.contains('open');
  mobileMenu.classList.toggle('open', isOpen);
  mobileOverlay.classList.toggle('open', isOpen);
  hamburger.classList.toggle('active', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

hamburger.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleMobileMenu();
});

// Close mobile menu when a link is clicked
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    toggleMobileMenu(false);
  });
});

// Close mobile menu when clicking the overlay
if (mobileOverlay) {
  mobileOverlay.addEventListener('click', () => {
    toggleMobileMenu(false);
  });
}

// Close on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
    toggleMobileMenu(false);
  }
});

// ===== DROPDOWN TOGGLE FOR MOBILE/TOUCH =====
const blogDropBtn = document.getElementById('blogDropBtn');
if (blogDropBtn) {
  blogDropBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const dropdown = blogDropBtn.closest('.dropdown');
    if (dropdown) {
      dropdown.classList.toggle('open');
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = blogDropBtn.closest('.dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

// ===== SCROLL SPY FOR NAVBAR =====
const sections = document.querySelectorAll('section[id], main[id]');
const navLinks = document.querySelectorAll('.nav-links .nav-link, .mobile-menu a');
const navIndicator = document.getElementById('navIndicator');
const allDesktopNavLinks = document.querySelectorAll('.nav-links .nav-link');

function updateIndicator() {
  const activeLink = document.querySelector('.nav-links .nav-link.active');
  if (activeLink && navIndicator) {
    const rect = activeLink.getBoundingClientRect();
    const parentRect = activeLink.parentElement.getBoundingClientRect();
    navIndicator.style.width = `${rect.width}px`;
    navIndicator.style.left = `${rect.left - parentRect.left}px`;
    navIndicator.classList.add('visible');
  } else if (navIndicator) {
    navIndicator.classList.remove('visible');
  }
}

function setActiveSection(currentId) {
  // First check if ANY nav link matches this section
  let matched = false;
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === '#' + currentId || (currentId === 'home' && href === 'home.html')) {
      matched = true;
    }
  });
  // Only update active state if there's a matching nav link.
  // Otherwise preserve the hardcoded active (e.g. on volunteering.html).
  if (!matched) return;

  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === '#' + currentId || (currentId === 'home' && href === 'home.html')) {
      link.classList.add('active');
    }
  });
  updateIndicator();
}

// Find which section is nearest to the top of the viewport
function findNearestSection() {
  let nearestId = null;
  let nearestDist = Infinity;

  sections.forEach(section => {
    if (!section.id) return;
    const rect = section.getBoundingClientRect();
    // Distance from viewport top (negative means above viewport)
    const dist = Math.abs(rect.top);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestId = section.id;
    }
  });
  return nearestId;
}

// Observer: wider detection zone + handle nested sections (prefer innermost)
const observerOptions = {
  root: null,
  rootMargin: '-10% 0px -25% 0px',
  threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5]
};

const observer = new IntersectionObserver((entries) => {
  const activeEntries = entries.filter(e => e.isIntersecting && e.target.id);
  
  if (activeEntries.length > 0) {
    // Pick the most specific section: innermost (deepest) in DOM wins
    // This handles #conference nested inside #workshop correctly
    let bestEntry = activeEntries[0];
    for (let i = 1; i < activeEntries.length; i++) {
      const curr = activeEntries[i];
      if (bestEntry.target.contains(curr.target)) { bestEntry = curr; }
      else if (curr.target.contains(bestEntry.target)) { /* best is deeper, keep it */ }
      else if (curr.intersectionRatio > bestEntry.intersectionRatio) { bestEntry = curr; }
    }
    setActiveSection(bestEntry.target.id);
  } else {
    // No section is intersecting within the detection zone.
    // Find nearest section to viewport top as a reliable fallback.
    const nearest = findNearestSection();
    if (nearest) setActiveSection(nearest);
  }
}, observerOptions);

sections.forEach(section => observer.observe(section));

// Keep the indicator positioned correctly on resize
window.addEventListener('resize', updateIndicator);
window.addEventListener('load', () => setTimeout(updateIndicator, 500));
window.addEventListener('orientationchange', () => setTimeout(updateIndicator, 300));

