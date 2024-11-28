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

document.addEventListener('DOMContentLoaded', () => {
    // Get all resource buttons
    const resourceButtons = document.querySelectorAll('.resource-btn');
    
    // Log to check if buttons are found
    console.log('Found resource buttons:', resourceButtons.length);

    // Add click event listeners to each button
    resourceButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the resource path from the button's data attribute
            const resourcePath = this.getAttribute('data-resource');
            console.log('Attempting to open:', resourcePath);
            
            openResource(resourcePath);
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Get all resource buttons
    const resourceButtons = document.querySelectorAll('.resource-btn');
    
    // Log to check if buttons are found
    console.log('Found resource buttons:', resourceButtons.length);

    // Add click event listeners to each button
    resourceButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the resource path from the button's data attribute
            const resourcePath = this.getAttribute('data-resource');
            console.log('Attempting to open:', resourcePath);
            
            openResource(resourcePath);
        });
    });
});

function openResource(resourcePath) {
    // Validate input
    if (!resourcePath) {
        console.error('No resource path provided');
        return;
    }

    try {
        // Handle PDF files
        if (resourcePath.toLowerCase().endsWith('.pdf')) {
            console.log('Opening PDF:', resourcePath);
            window.open(resourcePath, '_blank', 'noopener,noreferrer');
        } 
        // Handle PowerPoint files
        else if (resourcePath.toLowerCase().match(/\.ppt(x)?$/)) {
            console.log('Opening PowerPoint:', resourcePath);
            const encodedPath = encodeURIComponent(window.location.origin + resourcePath);
            const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedPath}`;
            window.open(viewerUrl, '_blank', 'noopener,noreferrer');
        } else {
            console.error('Unsupported file type');
        }
    } catch (error) {
        console.error('Error opening resource:', error);
    }
}

// Make function available globally
window.openResource = openResource;