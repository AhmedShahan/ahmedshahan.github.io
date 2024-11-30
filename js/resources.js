document.addEventListener('DOMContentLoaded', () => {
    const resourceButtons = document.querySelectorAll('.resource-btn');
    
    resourceButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const resourcePath = this.getAttribute('data-resource');
            console.log('Attempting to open:', resourcePath);
            
            if (!resourcePath) {
                console.error('No data-resource attribute found');
                return;
            }

            try {
                window.open(resourcePath, '_blank');
            } catch (error) {
                console.error('Error opening resource:', error);
            }
        });
    });
});