document.addEventListener('DOMContentLoaded', () => {
    // Redirect to index.html after animations complete
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 4000); // 4 seconds to allow all animations to complete
});