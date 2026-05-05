// ===== SCROLL ANIMATIONS FOR PROFILE PAGE =====
const animElements = document.querySelectorAll('.scroll-anim');
const animObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      observer.unobserve(entry.target); // Trigger only once
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

animElements.forEach(el => {
  animObserver.observe(el);
});
