// ===== LOADING SCREEN =====
window.addEventListener('load', () => {
  const loadingScreen = document.getElementById('loadingScreen');
  const loadingBar = document.getElementById('loadingBar');
  const loadingText = document.getElementById('loadingText');

  const messages = [
    'Loading your portfolio...',
    'Preparing something special...',
    'Almost ready...',
    'Welcome! 🎓'
  ];

  const loadingBarWrap = document.getElementById('loadingBarWrap');
  const continueBtnWrap = document.getElementById('continueBtnWrap');
  const continueBtn = document.getElementById('continueBtn');

  let progress = 0;
  let msgIndex = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 3 + 2; 
    if (progress > 100) progress = 100;

    loadingBar.style.width = progress + '%';

    // Cycle through messages based on progress
    const newIndex = Math.floor((progress / 100) * messages.length);
    if (newIndex !== msgIndex && newIndex < messages.length) {
      msgIndex = newIndex;
      loadingText.textContent = messages[msgIndex];
    }

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        // Hide loading text and bar
        loadingText.style.display = 'none';
        if(loadingBarWrap) loadingBarWrap.style.display = 'none';
        
        // Show continue button
        if(continueBtnWrap) continueBtnWrap.classList.remove('hidden');
      }, 500);
    }
  }, 150);

  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      // Navigate to the main portfolio page
      window.location.href = 'home.html';
    });
  }
});