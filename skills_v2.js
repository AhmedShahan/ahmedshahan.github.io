// ===== SCROLL ANIMATIONS =====
const skillAnimEls = document.querySelectorAll('.scroll-anim');
const skillObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('show'); obs.unobserve(entry.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
skillAnimEls.forEach(el => skillObserver.observe(el));

// ===== COUNTER ANIMATION =====
const counters = document.querySelectorAll('.stat-num');
const countObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-target'));
      const dur = 1400, step = target / (dur / 16);
      let cur = 0;
      const timer = setInterval(() => {
        cur += step;
        if (cur >= target) { el.textContent = target; clearInterval(timer); }
        else el.textContent = Math.floor(cur);
      }, 16);
      countObs.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(el => countObs.observe(el));

// ===== PROFICIENCY BAR ANIMATION =====
const profBars = document.querySelectorAll('.prof-fill');
const profObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const w = entry.target.getAttribute('data-width');
      entry.target.style.width = w + '%';
      profObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });
profBars.forEach(el => profObs.observe(el));

// ===== MARQUEE TICKER =====
const marqueeTools = [
  'Python', 'PyTorch', 'LangChain', 'LangGraph', 'Docker', 'FastAPI',
  'HuggingFace', 'Ollama', 'BERT', 'Transformers', 'OpenCV', 'YOLO',
  'XGBoost', 'Pandas', 'NumPy', 'Optuna', 'RAG', 'FAISS',
  'Modal', 'Thunder Compute', 'Git', 'Streamlit', 'MLflow', 'Tableau'
];
const track = document.getElementById('marqueeTrack');
if (track) {
  const items = [...marqueeTools, ...marqueeTools];
  track.innerHTML = items.map(t =>
    '<span class="marquee-item"><span class="marquee-dot"></span>' + t + '</span>'
  ).join('');
}

// ===== FILTER BUTTONS =====
const filterBtns = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.skill-card');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.getAttribute('data-filter');
    cards.forEach(card => {
      if (cat === 'all' || card.getAttribute('data-cat') === cat) {
        card.classList.remove('hide');
        card.style.position = '';
        card.style.visibility = '';
      } else {
        card.classList.add('hide');
      }
    });
  });
});

// ===== TOOLTIPS =====
document.querySelectorAll('.tag[data-tip]').forEach(tag => {
  const tip = document.createElement('span');
  tip.className = 'tag-tooltip';
  tip.textContent = tag.getAttribute('data-tip');
  tag.style.position = 'relative';
  tag.appendChild(tip);
});

// ===== HAMBURGER =====
const hb = document.getElementById('hamburger');
const mm = document.getElementById('mobileMenu');
if (hb && mm) {
  hb.addEventListener('click', () => mm.classList.toggle('open'));
  mm.querySelectorAll('a').forEach(l => l.addEventListener('click', () => mm.classList.remove('open')));
  document.addEventListener('click', e => {
    if (!hb.contains(e.target) && !mm.contains(e.target)) mm.classList.remove('open');
  });
}
