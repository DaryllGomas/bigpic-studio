/**
 * Timeline Navigation
 * Provides enhanced navigation features for the timeline
 */

document.addEventListener('DOMContentLoaded', function() {
    // Navigation dots have been disabled
    // createTimelineNavigation();
    
    // Create era jump buttons
    createEraJumps();
    
    // Create breadcrumb navigation
    createBreadcrumb();
    
    // Setup scroll event for updating active navigation state
    setupScrollTracking();
});

// Create timeline navigation dots
function createTimelineNavigation() {
    // Create container
    const navContainer = document.createElement('div');
    navContainer.className = 'timeline-nav-container timeline-nav-minimized';
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'timeline-nav-toggle';
    toggleButton.textContent = '⋮';
    toggleButton.title = 'Toggle timeline navigation';
    navContainer.appendChild(toggleButton);
    
    // Create dots container
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'timeline-nav-dots';
    
    // Get all timeline sections
    const timelineSections = document.querySelectorAll('.timeline-section');
    
    // Create a dot for each section
    timelineSections.forEach((section, index) => {
        const dot = document.createElement('div');
        dot.className = 'timeline-nav-dot';
        dot.dataset.index = index;
        
        // Create label
        const label = document.createElement('div');
        label.className = 'timeline-nav-label';
        label.textContent = section.querySelector('.period-title').textContent.split('(')[0].trim();
        dot.appendChild(label);
        
        // Add click event
        dot.addEventListener('click', function() {
            section.scrollIntoView({ behavior: 'smooth' });
        });
        
        dotsContainer.appendChild(dot);
    });
    
    navContainer.appendChild(dotsContainer);
    document.body.appendChild(navContainer);
    
    // Toggle expanded/minimized state
    toggleButton.addEventListener('click', function() {
        navContainer.classList.toggle('timeline-nav-minimized');
        toggleButton.textContent = navContainer.classList.contains('timeline-nav-minimized') ? '⋮' : '×';
    });
}

// Create era jump buttons
function createEraJumps() {
    // Create container
    const jumpContainer = document.createElement('div');
    jumpContainer.className = 'era-jump-container';
    
    // Define era jumps - UPDATED to match current index.html
    const eras = [
        { name: 'PREHISTORIC', target: 'PREHISTORIC PERIOD (300,000 - 10,000 BCE)' },
        { name: 'NEOLITHIC', target: 'EARLY NEOLITHIC REVOLUTION (10,000 - 5,000 BCE)' },
        { name: 'EARLY URBAN', target: 'EARLY URBAN CIVILIZATIONS (5,000 - 3,000 BCE)' },
        { name: 'BRONZE AGE', target: 'BRONZE AGE CIVILIZATIONS (3,000 - 1,200 BCE)' },
        { name: 'IRON/CLASSICAL', target: 'IRON AGE & CLASSICAL PERIOD (1,200 BCE - 500 CE)' },
        { name: 'POST-CLASSICAL', target: 'POST-CLASSICAL PERIOD (500 - 1500 CE)' },
        { name: 'EARLY MODERN', target: 'EARLY MODERN PERIOD (1500 - 1800 CE)' },
        { name: 'MODERN', target: 'MODERN ERA (1800 - PRESENT)' }
    ];
    
    // Create a button for each era
    eras.forEach(era => {
        const button = document.createElement('button');
        button.className = 'era-jump-button';
        button.textContent = era.name;
        
        // Add click event
        button.addEventListener('click', function() {
            // Find the corresponding section
            const sections = document.querySelectorAll('.timeline-section');
            let targetSection = null;
            
            for (let section of sections) {
                const title = section.querySelector('.period-title').textContent;
                if (title.includes(era.target)) { // Match against the full title including dates
                    targetSection = section;
                    break;
                }
            }
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        jumpContainer.appendChild(button);
    });
    
    document.body.appendChild(jumpContainer);
}

// Create breadcrumb navigation
function createBreadcrumb() {
    // Create breadcrumb element
    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'timeline-breadcrumb';
    breadcrumb.innerHTML = `
        <span class="breadcrumb-period">Timeline</span>
        <span class="breadcrumb-year"></span>
    `;
    document.body.appendChild(breadcrumb);
}

// Setup scroll tracking to update navigation state
function setupScrollTracking() {
    // The navDots have been removed
    // const navDots = document.querySelectorAll('.timeline-nav-dot');
    const timelineSections = document.querySelectorAll('.timeline-section');
    const breadcrumb = document.querySelector('.timeline-breadcrumb');
    const breadcrumbPeriod = breadcrumb.querySelector('.breadcrumb-period');
    const breadcrumbYear = breadcrumb.querySelector('.breadcrumb-year');
    
    // Function to check what's in viewport
    function updateNavigationState() {
        let currentSectionIndex = -1;
        let currentItemYear = '';
        
        // Check visible sections
        timelineSections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            // If section is at least partially in viewport
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                currentSectionIndex = index;
                
                // Update breadcrumb period
                const periodTitle = section.querySelector('.period-title').textContent;
                breadcrumbPeriod.textContent = periodTitle.split('(')[0].trim();
                
                // Show breadcrumb
                breadcrumb.classList.add('visible');
            }
        });
        
        // Check visible items to get year
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach(item => {
            const rect = item.getBoundingClientRect();
            // If item is in the middle of viewport
            if (rect.top < window.innerHeight / 2 && rect.bottom > window.innerHeight / 2) {
                const year = item.querySelector('.date h3').textContent;
                currentItemYear = year;
                
                // Update breadcrumb year
                breadcrumbYear.textContent = year;
            }
        });
        
        // We no longer need to update nav dots
        // Update active dot
        // navDots.forEach((dot, index) => {
        //     if (index === currentSectionIndex) {
        //         dot.classList.add('active');
        //     } else {
        //         dot.classList.remove('active');
        //     }
        // });
        
        // Hide breadcrumb if at the top of the page
        if (window.scrollY < 100) {
            breadcrumb.classList.remove('visible');
        }
    }
    
    // Initial update
    updateNavigationState();
    
    // Update on scroll
    window.addEventListener('scroll', updateNavigationState);
}
