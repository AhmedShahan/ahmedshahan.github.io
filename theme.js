/* ================================================================
   theme.js — Theme Switcher (Default ↔ ReGrowth)
   ================================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'shahan-theme';
  const DEFAULT_THEME = 'default';

  // ── DOM refs ──
  const root = document.documentElement;
  const bubbles = document.querySelectorAll('.theme-bubble');

  // ── Apply theme ──
  function setTheme(theme) {
    if (theme === 'regrowth') {
      root.setAttribute('data-theme', 'regrowth');
    } else {
      root.removeAttribute('data-theme');
    }

    // Update active bubble
    bubbles.forEach((b) => {
      const isActive = b.dataset.theme === theme;
      b.classList.toggle('active', isActive);
    });

    // Persist
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) { /* ignore */ }
  }

  // ── Init from stored preference ──
  function init() {
    let saved;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (_) { /* ignore */ }

    // Validate
    if (saved !== 'default' && saved !== 'regrowth') {
      saved = DEFAULT_THEME;
    }

    setTheme(saved);

    // Attach click handlers
    bubbles.forEach((b) => {
      b.addEventListener('click', () => {
        const theme = b.dataset.theme;
        if (theme) setTheme(theme);
      });
    });
  }

  // ── Run ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
