document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.querySelector('.gallery-wrapper');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let currentIndex = 0;

    function updateGallery() {
        gallery.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateGallery();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < gallery.children.length - 1) {
            currentIndex++;
            updateGallery();
        }
    });
});