/**
 * Timeline Enhancement Features
 * Adds interactive functionality to the Ancient History timeline
 */

document.addEventListener('DOMContentLoaded', function() {
    // ===== SEARCH & FILTER FUNCTIONALITY =====
    // Create and insert search UI
    const timelineSection = document.getElementById('timeline');
    const timelineContainer = document.querySelector('.timeline-container');
    
    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
        <div class="search-box">
            <input type="text" id="timeline-search" placeholder="Search historical events...">
            <button id="search-button">Search</button>
        </div>
        <div class="filter-options">
            <select id="era-filter">
                <option value="all">All Eras</option>
                <option value="Prehistoric Period">Prehistoric</option>
                <option value="Early Neolithic Revolution">Neolithic</option>
                <option value="Early Urban Civilizations">Early Urban</option>
                <option value="Bronze Age Civilizations">Bronze Age</option>
                <option value="Iron Age & Classical Period">Classical</option>
                <option value="Post-Classical Period">Post-Classical</option>
                <option value="Early Modern Period">Early Modern</option>
                <option value="Modern Era">Modern</option>
            </select>
            <button id="reset-filters">Reset</button>
        </div>
    `;
    
    // Insert search container after the subtitle
    const subtitle = timelineSection.querySelector('.subtitle');
    subtitle.parentNode.insertBefore(searchContainer, subtitle.nextSibling);
    
    // ===== SEARCH FUNCTIONALITY =====
    const searchInput = document.getElementById('timeline-search');
    const searchButton = document.getElementById('search-button');
    const eraFilter = document.getElementById('era-filter');
    const resetButton = document.getElementById('reset-filters');
    
    // Get all timeline items and sections
    const timelineItems = document.querySelectorAll('.timeline-item');
    const timelineSections = document.querySelectorAll('.timeline-section');
    
    // Search function
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedEra = eraFilter.value;
        
        let hasVisibleItems = false;
        let currentSection = null;
        let sectionHasVisibleItems = false;
        
        // First hide all items
        timelineItems.forEach(item => {
            item.style.display = 'none';
        });
        
        // Hide all sections initially
        timelineSections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Show items that match search criteria
        timelineItems.forEach(item => {
            const itemText = item.textContent.toLowerCase();
            const dateHeading = item.querySelector('.date h3')?.textContent || '';
            const contentHeading = item.querySelector('.content h3')?.textContent || '';
            const contentText = item.querySelector('.content p')?.textContent || '';
            
            // Find the section this item belongs to
            let section = item.previousElementSibling;
            while (section && !section.classList.contains('timeline-section')) {
                section = section.previousElementSibling;
            }
            
            const sectionTitle = section ? section.querySelector('.period-title').textContent : '';
            
            // Check if item matches search term and era filter
            const matchesSearch = searchTerm === '' || 
                                 itemText.includes(searchTerm) || 
                                 dateHeading.toLowerCase().includes(searchTerm) || 
                                 contentHeading.toLowerCase().includes(searchTerm) || 
                                 contentText.toLowerCase().includes(searchTerm);
                                 
            const matchesEra = selectedEra === 'all' || sectionTitle.includes(selectedEra);
            
            if (matchesSearch && matchesEra) {
                item.style.display = 'flex';
                hasVisibleItems = true;
                
                // Show the section this item belongs to
                if (section) {
                    section.style.display = 'block';
                }
            }
        });
        
        // Show message if no results
        let noResultsMessage = document.getElementById('no-results-message');
        
        if (!hasVisibleItems) {
            if (!noResultsMessage) {
                noResultsMessage = document.createElement('div');
                noResultsMessage.id = 'no-results-message';
                noResultsMessage.className = 'no-results';
                noResultsMessage.textContent = 'No historical events found matching your search.';
                timelineContainer.appendChild(noResultsMessage);
            }
            noResultsMessage.style.display = 'block';
        } else if (noResultsMessage) {
            noResultsMessage.style.display = 'none';
        }
    }
    
    // Event listeners for search
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    eraFilter.addEventListener('change', performSearch);
    
    // Reset filters
    resetButton.addEventListener('click', function() {
        searchInput.value = '';
        eraFilter.value = 'all';
        
        // Show all items and sections
        timelineItems.forEach(item => {
            item.style.display = 'flex';
        });
        
        timelineSections.forEach(section => {
            section.style.display = 'block';
        });
        
        // Hide no results message
        const noResultsMessage = document.getElementById('no-results-message');
        if (noResultsMessage) {
            noResultsMessage.style.display = 'none';
        }
    });
    
    // ===== SMOOTH SCROLLING NAVIGATION =====
    // Enhance the existing smooth scrolling with progress indicator
    const timelineNavigation = document.createElement('div');
    timelineNavigation.className = 'timeline-navigation';
    timelineNavigation.innerHTML = `
        <div class="nav-arrow nav-up">↑</div>
        <div class="nav-progress">
            <div class="progress-bar"></div>
        </div>
        <div class="nav-arrow nav-down">↓</div>
    `;
    
    document.body.appendChild(timelineNavigation);
    
    // Progress bar functionality
    const progressBar = document.querySelector('.progress-bar');
    const navUp = document.querySelector('.nav-up');
    const navDown = document.querySelector('.nav-down');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.scrollY;
        const docHeight = document.body.offsetHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.height = scrollPercent + '%';
    });
    
    // Navigation arrows functionality
    navUp.addEventListener('click', function() {
        window.scrollBy({
            top: -window.innerHeight,
            behavior: 'smooth'
        });
    });
    
    navDown.addEventListener('click', function() {
        window.scrollBy({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    });
});