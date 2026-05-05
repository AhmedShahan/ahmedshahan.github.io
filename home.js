// ===== TYPED.JS — rotating roles =====
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

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

// Close mobile menu when a link is clicked
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
  });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
  if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
    mobileMenu.classList.remove('open');
  }
});

// ===== SCROLL SPY FOR NAVBAR =====
const sections = document.querySelectorAll('section, main, .workshop-page');
const navLinks = document.querySelectorAll('.nav-links .nav-link, .mobile-menu a');
const navIndicator = document.getElementById('navIndicator');

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

const observerOptions = {
  root: null,
  rootMargin: '-30% 0px -50% 0px',
  threshold: 0
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const currentId = entry.target.getAttribute('id');
      if (currentId) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          const href = link.getAttribute('href');
          if (href === '#' + currentId || (currentId === 'home' && href === 'home.html')) {
            link.classList.add('active');
          }
        });
        updateIndicator();
      }
    }
  });
}, observerOptions);

sections.forEach(section => {
  observer.observe(section);
});

// Update on resize and initial load
window.addEventListener('resize', updateIndicator);
window.addEventListener('load', () => {
  setTimeout(updateIndicator, 500); // Small delay to ensure styles are applied
});

