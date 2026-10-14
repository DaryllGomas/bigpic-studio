/**
 * Subtle Search Functionality
 * Makes the search interface more compact and less intrusive
 */

document.addEventListener('DOMContentLoaded', function() {
    // Find the search container
    const searchContainer = document.querySelector('.search-container');
    
    if (searchContainer) {
        // Clear any existing content
        const originalContent = searchContainer.innerHTML;
        
        // Create new structure
        searchContainer.innerHTML = `
            <div class="search-icon">🔍</div>
            <div class="search-content">${originalContent}</div>
        `;
        
        // Get references to elements
        const searchIcon = searchContainer.querySelector('.search-icon');
        const searchContent = searchContainer.querySelector('.search-content');
        const searchInput = searchContent.querySelector('#timeline-search');
        
        // Toggle expanded state when icon is clicked
        searchIcon.addEventListener('click', function() {
            searchContainer.classList.toggle('expanded');
            
            // Focus the input if expanding
            if (searchContainer.classList.contains('expanded')) {
                setTimeout(() => {
                    if (searchInput) searchInput.focus();
                }, 300); // Give time for the animation to complete
            }
        });
        
        // Close when clicking anywhere else on the page
        document.addEventListener('click', function(event) {
            // Skip if clicking inside the container
            if (searchContainer.contains(event.target)) {
                return;
            }
            
            // Check if search is active (has input or results)
            const hasSearchTerm = searchInput && searchInput.value.trim() !== '';
            const resultsContainer = searchContainer.querySelector('.search-results');
            const hasResults = resultsContainer && resultsContainer.style.display !== 'none';
            
            // Only collapse if search is not active
            if (!hasSearchTerm && !hasResults) {
                searchContainer.classList.remove('expanded');
            }
        });
        
        // Close with escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && searchContainer.classList.contains('expanded')) {
                searchContainer.classList.remove('expanded');
            }
        });
    }
});

