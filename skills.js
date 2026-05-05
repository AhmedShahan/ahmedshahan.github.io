// ===== SCROLL ANIMATIONS =====
const skillAnimEls = document.querySelectorAll('.scroll-anim');
const skillObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.08,
  rootMargin: '0px 0px -40px 0px'
});

skillAnimEls.forEach(el => skillObserver.observe(el));

// ===== COUNTER ANIMATION =====
const counters = document.querySelectorAll('.stat-num');

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-target'));
      const duration = 1400;
      const step = target / (duration / 16);
      let current = 0;

      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          el.textContent = target;
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(current);
        }
      }, 16);

      countObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

counters.forEach(el => countObserver.observe(el));

// ===== HAMBURGER (reuse from home.js if needed) =====
const hamburgerSkills = document.getElementById('hamburger');
const mobileMenuSkills = document.getElementById('mobileMenu');

if (hamburgerSkills && mobileMenuSkills) {
  hamburgerSkills.addEventListener('click', () => {
    mobileMenuSkills.classList.toggle('open');
  });

  mobileMenuSkills.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuSkills.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (!hamburgerSkills.contains(e.target) && !mobileMenuSkills.contains(e.target)) {
      mobileMenuSkills.classList.remove('open');
    }
  });
}
