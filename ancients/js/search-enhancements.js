/**
 * Enhanced Search & Filtering
 * Provides advanced search capabilities for the timeline
 */

document.addEventListener('DOMContentLoaded', function() {
    // Find the existing search container to enhance
    const existingSearchContainer = document.querySelector('.search-container');
    
    if (existingSearchContainer) {
        // Upgrade the search container
        enhanceSearchContainer(existingSearchContainer);
        
        // Setup event listeners
        setupSearchEvents();
        
        // Initialize range sliders
        initDateRangeSlider();
    }
});

// Enhance the existing search container with new features
function enhanceSearchContainer(container) {
    // Store original content
    const originalContent = container.innerHTML;
    
    // Update container content with enhanced structure
    container.innerHTML = `
        <div class="search-tabs">
            <div class="search-tab active" data-tab="basic">BASIC SEARCH</div>
            <div class="search-tab" data-tab="advanced">ADVANCED SEARCH</div>
        </div>
        
        <div class="search-main">
            <div class="search-box">
                <input type="text" id="timeline-search" placeholder="Search for events, people, places...">
                <button id="search-button">SEARCH</button>
            </div>
            
            <div class="advanced-toggle">
                Advanced Filters <span class="toggle-icon">▼</span>
            </div>
            
            <div class="advanced-filters">
                <div class="range-container">
                    <div class="range-header">
                        <div class="filter-label">DATE RANGE</div>
                        <div class="range-values">
                            <span class="range-min">30,000 BCE</span> — <span class="range-max">2023 CE</span>
                        </div>
                    </div>
                    
                    <div class="range-slider">
                        <div class="slider-track"></div>
                        <div class="slider-range"></div>
                        <div class="slider-thumb thumb-min"></div>
                        <div class="slider-thumb thumb-max"></div>
                    </div>
                </div>
                
                <div class="filter-row">
                    <div class="filter-group">
                        <label class="filter-label">CATEGORY</label>
                        <select class="filter-select" id="category-filter">
                            <option value="all">All Categories</option>
                            <option value="settlement">Settlements & Cities</option>
                            <option value="invention">Inventions & Technology</option>
                            <option value="culture">Cultural Developments</option>
                            <option value="empire">Empires & States</option>
                            <option value="conflict">Wars & Conflicts</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label class="filter-label">REGION</label>
                        <select class="filter-select" id="region-filter">
                            <option value="all">All Regions</option>
                            <option value="africa">Africa</option>
                            <option value="americas">Americas</option>
                            <option value="asia">Asia</option>
                            <option value="europe">Europe</option>
                            <option value="middle-east">Middle East</option>
                            <option value="oceania">Oceania</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label class="filter-label">CONTENT TYPE</label>
                        <select class="filter-select" id="content-filter">
                            <option value="all">All Content</option>
                            <option value="conventional">Conventional History</option>
                            <option value="theoretical">Theoretical History</option>
                        </select>
                    </div>
                </div>
                
                <div class="filter-actions">
                    <button class="filter-button" id="filter-reset">RESET</button>
                    <button class="filter-button" id="filter-apply">APPLY FILTERS</button>
                </div>
            </div>
        </div>
        
        <div class="search-results" style="display: none;">
            <div class="result-summary">
                Found <span class="result-count">0</span> results
                <div class="result-tags"></div>
            </div>
            
            <div class="related-searches" style="display: none;">
                <div class="related-title">RELATED SEARCHES:</div>
                <div class="related-items"></div>
            </div>
        </div>
    `;
}

// Setup event listeners for search and filter elements
function setupSearchEvents() {
    const searchTabs = document.querySelectorAll('.search-tab');
    const advancedToggle = document.querySelector('.advanced-toggle');
    const advancedFilters = document.querySelector('.advanced-filters');
    const searchContainer = document.querySelector('.search-container');
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('timeline-search');
    const resetButton = document.getElementById('filter-reset');
    const applyButton = document.getElementById('filter-apply');
    
    // Tab switching
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active from all tabs
            searchTabs.forEach(t => t.classList.remove('active'));
            
            // Add active to clicked tab
            this.classList.add('active');
            
            // If advanced tab, expand filters
            if (this.dataset.tab === 'advanced') {
                advancedToggle.classList.add('expanded');
                advancedFilters.classList.add('expanded');
                searchContainer.classList.add('expanded');
            } else {
                advancedToggle.classList.remove('expanded');
                advancedFilters.classList.remove('expanded');
                searchContainer.classList.remove('expanded');
            }
        });
    });
    
    // Advanced toggle
    advancedToggle.addEventListener('click', function() {
        this.classList.toggle('expanded');
        advancedFilters.classList.toggle('expanded');
        searchContainer.classList.toggle('expanded');
    });
    
    // Search button
    searchButton.addEventListener('click', function() {
        performSearch();
    });
    
    // Enter key in search input
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Reset button
    resetButton.addEventListener('click', function() {
        // Clear search input
        searchInput.value = '';
        
        // Reset all filters to default
        document.getElementById('category-filter').value = 'all';
        document.getElementById('region-filter').value = 'all';
        document.getElementById('content-filter').value = 'all';
        
        // Reset range slider
        // (This will be implemented in the range slider functionality)
        resetRangeSlider();
        
        // Hide search results
        document.querySelector('.search-results').style.display = 'none';
        
        // Show all timeline sections and items
        showAllTimelineItems();
    });
    
    // Apply filters button
    applyButton.addEventListener('click', function() {
        performSearch();
    });
}

// Initialize date range slider
function initDateRangeSlider() {
    // This is a placeholder for the full range slider implementation
    // In a complete implementation, we would:
    // 1. Set up touch/mouse events for the range thumbs
    // 2. Implement the drag functionality to adjust min/max values
    // 3. Update the displayed values and filter accordingly
    
    // For now, we'll update the track visually
    updateSliderTrack();
}

// Update the slider track visuals
function updateSliderTrack() {
    const track = document.querySelector('.slider-track');
    const range = document.querySelector('.slider-range');
    const thumbMin = document.querySelector('.thumb-min');
    const thumbMax = document.querySelector('.thumb-max');
    
    // Get track dimensions
    const trackRect = track.getBoundingClientRect();
    const trackWidth = trackRect.width;
    
    // Set range and thumb positions (placeholder values)
    const minPct = 10; // 10% from left
    const maxPct = 90; // 90% from left
    
    range.style.left = `${minPct}%`;
    range.style.width = `${maxPct - minPct}%`;
    
    thumbMin.style.left = `${minPct}%`;
    thumbMax.style.left = `${maxPct}%`;
}

// Reset range slider to default values
function resetRangeSlider() {
    const rangeMin = document.querySelector('.range-min');
    const rangeMax = document.querySelector('.range-max');
    
    // Reset displayed values
    rangeMin.textContent = '30,000 BCE';
    rangeMax.textContent = '2023 CE';
    
    // Reset slider positions
    updateSliderTrack();
}

// Perform search with current filters
function performSearch() {
    // Get search term
    const searchTerm = document.getElementById('timeline-search').value.toLowerCase();
    
    // Get filter values
    const categoryFilter = document.getElementById('category-filter').value;
    const regionFilter = document.getElementById('region-filter').value;
    const contentFilter = document.getElementById('content-filter').value;
    
    // Show search results container
    const resultsContainer = document.querySelector('.search-results');
    resultsContainer.style.display = 'block';
    
    // Get all timeline items and sections
    const timelineItems = document.querySelectorAll('.timeline-item');
    const timelineSections = document.querySelectorAll('.timeline-section');
    
    // Track visible items
    let visibleCount = 0;
    
    // Hide all items initially
    timelineItems.forEach(item => {
        item.style.display = 'none';
    });
    
    // Hide all sections initially
    timelineSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Filter and show matching items
    timelineItems.forEach(item => {
        // Check if item matches search term
        const itemText = item.textContent.toLowerCase();
        const matchesSearch = searchTerm === '' || itemText.includes(searchTerm);
        
        // Check if item matches content filter (theoretical vs conventional)
        const isTheoretical = item.classList.contains('theoretical');
        const matchesContent = 
            contentFilter === 'all' || 
            (contentFilter === 'theoretical' && isTheoretical) || 
            (contentFilter === 'conventional' && !isTheoretical);
        
        // For this demo, we won't implement full category and region filtering
        // since we would need more structured data to accurately determine these
        // We'll assume all items match these filters for now
        const matchesCategory = true;
        const matchesRegion = true;
        
        // If item matches all filters
        if (matchesSearch && matchesContent && matchesCategory && matchesRegion) {
            // Show the item
            item.style.display = 'flex';
            visibleCount++;
            
            // Find the section this item belongs to
            let section = item.previousElementSibling;
            while (section && !section.classList.contains('timeline-section')) {
                section = section.previousElementSibling;
            }
            
            // Show the section
            if (section) {
                section.style.display = 'block';
            }
            
            // Highlight search term if present
            if (searchTerm) {
                highlightSearchTerm(item, searchTerm);
            } else {
                // Remove any existing highlights
                removeHighlights(item);
            }
        }
    });
    
    // Update result count
    document.querySelector('.result-count').textContent = visibleCount;
    
    // Show/generate filter tags
    updateFilterTags(searchTerm, categoryFilter, regionFilter, contentFilter);
    
    // Show/generate related searches
    updateRelatedSearches(searchTerm);
    
    // Scroll to first result if any found
    if (visibleCount > 0) {
        const firstVisibleItem = document.querySelector('.timeline-item[style*="display: flex"]');
        if (firstVisibleItem) {
            firstVisibleItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// Show all timeline items and sections
function showAllTimelineItems() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    const timelineSections = document.querySelectorAll('.timeline-section');
    
    // Show all items
    timelineItems.forEach(item => {
        item.style.display = 'flex';
        removeHighlights(item);
    });
    
    // Show all sections
    timelineSections.forEach(section => {
        section.style.display = 'block';
    });
}

// Highlight search term in item text
function highlightSearchTerm(item, searchTerm) {
    // Elements that contain text to highlight
    const textElements = [
        item.querySelector('.date p'),
        item.querySelector('.content h3'),
        item.querySelector('.content p')
    ];
    
    // Process each text element
    textElements.forEach(element => {
        if (!element) return;
        
        // Store original text if not already stored
        if (!element.dataset.originalText) {
            element.dataset.originalText = element.textContent;
        }
        
        // Get original text
        const originalText = element.dataset.originalText;
        
        // Create highlighted version
        const highlightedText = originalText.replace(
            new RegExp(searchTerm, 'gi'),
            match => `<span class="highlighted-text">${match}</span>`
        );
        
        // Set new content
        element.innerHTML = highlightedText;
    });
}

// Remove highlights from item text
function removeHighlights(item) {
    // Elements that may contain highlights
    const textElements = [
        item.querySelector('.date p'),
        item.querySelector('.content h3'),
        item.querySelector('.content p')
    ];
    
    // Process each text element
    textElements.forEach(element => {
        if (!element) return;
        
        // If original text is stored, restore it
        if (element.dataset.originalText) {
            element.textContent = element.dataset.originalText;
        }
    });
}

// Update filter tags displayed in results
function updateFilterTags(searchTerm, category, region, content) {
    const tagsContainer = document.querySelector('.result-tags');
    tagsContainer.innerHTML = '';
    
    // Add search term tag if present
    if (searchTerm) {
        const tag = document.createElement('div');
        tag.className = 'result-tag';
        tag.textContent = `Search: ${searchTerm}`;
        tag.addEventListener('click', function() {
            document.getElementById('timeline-search').value = '';
            performSearch();
        });
        tagsContainer.appendChild(tag);
    }
    
    // Add category tag if not 'all'
    if (category !== 'all') {
        const tag = document.createElement('div');
        tag.className = 'result-tag';
        tag.textContent = `Category: ${getCategoryLabel(category)}`;
        tag.addEventListener('click', function() {
            document.getElementById('category-filter').value = 'all';
            performSearch();
        });
        tagsContainer.appendChild(tag);
    }
    
    // Add region tag if not 'all'
    if (region !== 'all') {
        const tag = document.createElement('div');
        tag.className = 'result-tag';
        tag.textContent = `Region: ${getRegionLabel(region)}`;
        tag.addEventListener('click', function() {
            document.getElementById('region-filter').value = 'all';
            performSearch();
        });
        tagsContainer.appendChild(tag);
    }
    
    // Add content type tag if not 'all'
    if (content !== 'all') {
        const tag = document.createElement('div');
        tag.className = 'result-tag';
        tag.textContent = `${content.charAt(0).toUpperCase() + content.slice(1)} History`;
        tag.addEventListener('click', function() {
            document.getElementById('content-filter').value = 'all';
            performSearch();
        });
        tagsContainer.appendChild(tag);
    }
}

// Get display label for category value
function getCategoryLabel(category) {
    const labels = {
        'settlement': 'Settlements & Cities',
        'invention': 'Inventions & Technology',
        'culture': 'Cultural Developments',
        'empire': 'Empires & States',
        'conflict': 'Wars & Conflicts'
    };
    
    return labels[category] || category;
}

// Get display label for region value
function getRegionLabel(region) {
    const labels = {
        'africa': 'Africa',
        'americas': 'Americas',
        'asia': 'Asia',
        'europe': 'Europe',
        'middle-east': 'Middle East',
        'oceania': 'Oceania'
    };
    
    return labels[region] || region;
}

// Update related searches based on current search
function updateRelatedSearches(searchTerm) {
    const relatedContainer = document.querySelector('.related-searches');
    const relatedItems = document.querySelector('.related-items');
    
    // If no search term, hide related searches
    if (!searchTerm) {
        relatedContainer.style.display = 'none';
        return;
    }
    
    // Show related searches container
    relatedContainer.style.display = 'block';
    
    // Clear existing related items
    relatedItems.innerHTML = '';
    
    // Generate some related search suggestions
    // In a real implementation, these would be more intelligently generated
    const relatedTerms = [
        searchTerm + ' civilization',
        searchTerm + ' technology',
        'ancient ' + searchTerm,
        searchTerm + ' empire',
        searchTerm + ' origins'
    ];
    
    // Add related terms
    relatedTerms.forEach(term => {
        const item = document.createElement('span');
        item.className = 'related-item';
        item.textContent = term;
        item.addEventListener('click', function() {
            document.getElementById('timeline-search').value = term;
            performSearch();
        });
        relatedItems.appendChild(item);
    });
}
