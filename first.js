document.addEventListener('DOMContentLoaded', () => {
    const robot = document.querySelector('.robot');
    const textContainer = document.querySelector('.text-container');
    const welcomeText = document.querySelector('.welcome-text');
    const portfolioText = document.querySelector('.portfolio-text');

    robot.addEventListener('animationend', () => {
        // Make text container visible
        textContainer.style.opacity = '1';

        // Add animation classes to text after robot movement completes
        setTimeout(() => {
            welcomeText.classList.add('animate');
        }, 500);

        setTimeout(() => {
            portfolioText.classList.add('animate');
        }, 1000);

        // Redirect to index.html after all animations
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3500);
    });
});