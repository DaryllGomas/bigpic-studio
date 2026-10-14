/**
 * Timeline Event Modal
 * Handles the display of detailed event information in a modal popup
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create modal element and append to body
    const modalElement = document.createElement('div');
    modalElement.className = 'event-modal';
    modalElement.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Event Title</h2>
                <p class="modal-subtitle">Year BCE/CE</p>
                <button class="modal-close">×</button>
            </div>
            <div class="modal-body">
                <!-- Content will be dynamically inserted here -->
            </div>
            <div class="modal-footer">
                <button class="modal-nav-button prev-event">← Previous Event</button>
                <button class="modal-nav-button next-event">Next Event →</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalElement);

    // Get modal elements
    const modal = document.querySelector('.event-modal');
    const modalContent = modal.querySelector('.modal-content');
    const modalTitle = modal.querySelector('.modal-title');
    const modalSubtitle = modal.querySelector('.modal-subtitle');
    const modalBody = modal.querySelector('.modal-body');
    const modalClose = modal.querySelector('.modal-close');
    const prevButton = modal.querySelector('.prev-event');
    const nextButton = modal.querySelector('.next-event');

    // Current event tracking
    let currentEventIndex = -1;
    let currentPeriodId = '';
    let currentPeriodEvents = [];

    // Close modal when clicking close button
    modalClose.addEventListener('click', function() {
        closeModal();
    });

    // Close modal when clicking outside content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal when pressing ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Previous event button
    prevButton.addEventListener('click', function() {
        if (currentEventIndex > 0) {
            currentEventIndex--;
            updateModalContent(currentPeriodEvents[currentEventIndex], currentPeriodId);
            updateNavigationButtons();
        }
    });

    // Next event button
    nextButton.addEventListener('click', function() {
        if (currentEventIndex < currentPeriodEvents.length - 1) {
            currentEventIndex++;
            updateModalContent(currentPeriodEvents[currentEventIndex], currentPeriodId);
            updateNavigationButtons();
        }
    });

    // Add click event to all timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(function(item, index) {
        item.addEventListener('click', function() {
            // Find the period this item belongs to
            let section = item.previousElementSibling;
            while (section && !section.classList.contains('timeline-section')) {
                section = section.previousElementSibling;
            }
            
            if (!section) return;
            
            const periodTitle = section.querySelector('.period-title').textContent;
            const isTheoretical = section.classList.contains('theoretical');
            
            // Get period id from title
            const periodId = getPeriodIdFromTitle(periodTitle);
            
            // If valid period found in data
            if (periodId && timelineData[periodId]) {
                currentPeriodId = periodId;
                currentPeriodEvents = timelineData[periodId].events;
                
                // Find this event's index in the data
                const eventTitle = item.querySelector('.content h3').textContent;
                currentEventIndex = currentPeriodEvents.findIndex(event => 
                    event.title.toUpperCase() === eventTitle
                );
                
                if (currentEventIndex !== -1) {
                    openModal(currentPeriodEvents[currentEventIndex], periodId, isTheoretical);
                }
            }
        });
    });

    // Open modal and populate with event data
    function openModal(eventData, periodId, isTheoretical) {
        updateModalContent(eventData, periodId, isTheoretical);
        updateNavigationButtons();
        modal.classList.add('active');
        
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Update modal content based on event data
    function updateModalContent(eventData, periodId, isTheoretical) {
        // Update header
        modalTitle.textContent = eventData.title;
        modalSubtitle.textContent = eventData.year;
        
        if (isTheoretical) {
            // Add theoretical badge if not already present
            if (!modalTitle.querySelector('.theoretical-badge')) {
                const badge = document.createElement('span');
                badge.className = 'theoretical-badge';
                badge.textContent = 'THEORETICAL';
                modalTitle.appendChild(badge);
            }
        } else {
            // Remove theoretical badge if present
            const badge = modalTitle.querySelector('.theoretical-badge');
            if (badge) badge.remove();
        }

        // Generate modal body content
        let bodyContent = `
            <div class="modal-section">
                <h3 class="modal-section-title">OVERVIEW</h3>
                <p class="modal-text">${eventData.description}</p>
            </div>
            
            <div class="modal-section">
                <h3 class="modal-section-title">DETAILS</h3>
                <p class="modal-text">${eventData.details}</p>
            </div>
        `;

        // Add cultural context if available
        if (eventData.culturalContext) {
            bodyContent += `
                <div class="modal-section">
                    <h3 class="modal-section-title">CULTURAL CONTEXT</h3>
                    <p class="modal-text">${eventData.culturalContext}</p>
                </div>
            `;
        }

        // Add key figures if available
        if (eventData.keyFigures && eventData.keyFigures.length > 0) {
            bodyContent += `
                <div class="modal-section">
                    <h3 class="modal-section-title">KEY FIGURES</h3>
                    <p class="modal-text">${eventData.keyFigures.join(', ')}</p>
                </div>
            `;
        }

        // Add location information if available
        if (eventData.locations && eventData.locations.length > 0) {
            bodyContent += `
                <div class="modal-section">
                    <h3 class="modal-section-title">LOCATIONS</h3>
                    <p class="modal-text">${eventData.locations.join(', ')}</p>
                    <div class="modal-location-map">
                        Interactive map will be implemented in Phase 2
                    </div>
                </div>
            `;
        }

        // Add artifacts if available
        if (eventData.artifacts && eventData.artifacts.length > 0) {
            bodyContent += `
                <div class="modal-section">
                    <h3 class="modal-section-title">RELATED ARTIFACTS</h3>
                    <p class="modal-text">${eventData.artifacts.join(', ')}</p>
                </div>
            `;
        }

        // Add placeholder for image gallery
        bodyContent += `
            <div class="modal-section">
                <h3 class="modal-section-title">IMAGES</h3>
                <div class="modal-image-gallery">
                    <img src="images/placeholder.png" alt="Image gallery coming in future update" class="modal-image">
                </div>
            </div>
        `;

        // Add "Did You Know" section
        bodyContent += `
            <div class="modal-section">
                <h3 class="modal-section-title">DID YOU KNOW?</h3>
                <div class="did-you-know">
                    Interesting fact about ${eventData.title} will be added in a future update.
                </div>
            </div>
        `;

        // Add sources section (placeholder for now)
        bodyContent += `
            <div class="modal-sources">
                <h3 class="modal-section-title">SOURCES & REFERENCES</h3>
                <ul class="source-list">
                    <li class="source-item">Sources will be added in a future update.</li>
                </ul>
            </div>
        `;

        // Update modal body
        modalBody.innerHTML = bodyContent;
    }

    // Update navigation buttons based on current event index
    function updateNavigationButtons() {
        prevButton.disabled = currentEventIndex <= 0;
        prevButton.style.opacity = currentEventIndex <= 0 ? '0.5' : '1';
        
        nextButton.disabled = currentEventIndex >= currentPeriodEvents.length - 1;
        nextButton.style.opacity = currentEventIndex >= currentPeriodEvents.length - 1 ? '0.5' : '1';
    }

    // Helper function to get period ID from title text
    function getPeriodIdFromTitle(title) {
        const periodMap = {
            // Map full titles (without dates) to the keys used in timeline-data.js
            'PREHISTORIC PERIOD': 'prehistoric',
            'EARLY NEOLITHIC REVOLUTION': 'earlyNeolithic', // Consolidated Neolithic
            'EARLY URBAN CIVILIZATIONS': 'earlyUrban', // Updated key potentially
            'BRONZE AGE CIVILIZATIONS': 'bronzeAge',
            'IRON AGE & CLASSICAL PERIOD': 'classical',
            'POST-CLASSICAL PERIOD': 'postClassical',
            'EARLY MODERN PERIOD': 'earlyModern',
            'MODERN ERA': 'modern'
            // Note: Ensure these keys ('prehistoric', 'earlyNeolithic', etc.) exactly match 
            // the top-level keys in your timeline-data.js file.
        };
        
        // Extract the period name from the full title (remove dates)
        const periodName = title.split('(')[0].trim();
        
        return periodMap[periodName] || null;
    }
});
