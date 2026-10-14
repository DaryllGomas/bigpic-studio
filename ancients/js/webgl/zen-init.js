/**
 * Zen Space Initialization
 * Handles loading of Three.js dependencies and initialization of the WebGL Zen Space
 */

// Initialize with background effects only
document.addEventListener('DOMContentLoaded', function() {
    // Don't initialize WebGL content - using CSS background instead
    /*
    let container = document.getElementById('zen-space-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'zen-space-container';
        container.className = 'zen-space-container';
        document.body.insertBefore(container, document.body.firstChild);
    }
    */
    
    // Add loading indicator
    const loader = document.createElement('div');
    loader.className = 'zen-loader';
    container.appendChild(loader);
    
    // Create portal overlay element
    const portalOverlay = document.createElement('div');
    portalOverlay.className = 'portal-overlay';
    document.body.appendChild(portalOverlay);
    
    // Load Three.js library and related dependencies
    loadScripts([
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.7.7/dat.gui.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.9.1/gsap.min.js'
    ])
    .then(() => loadScripts([
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.min.js',
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.min.js',
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.min.js',
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.min.js'
    ]))
    .then(() => {
        // Remove loader
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
        
        // Initialize ZenSpace
        if (typeof ZenSpace !== 'undefined') {
            ZenSpace.init('zen-space-container');
            
            // Add interactive controls
            addZenControls();
            
            // Setup portal interaction
            setupPortalInteraction();
            
            console.log('ZenSpace initialized successfully');
        } else {
            console.error('ZenSpace not loaded');
            showFallbackContent(container);
        }
    })
    .catch(error => {
        console.error('Error loading dependencies:', error);
        showFallbackContent(container);
    });
});

/**
 * Load scripts sequentially
 * @param {string[]} urls - Array of script URLs to load
 * @returns {Promise} - Promise that resolves when all scripts are loaded
 */
function loadScripts(urls) {
    return new Promise((resolve, reject) => {
        let loaded = 0;
        
        urls.forEach(url => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            
            script.onload = () => {
                loaded++;
                if (loaded === urls.length) {
                    resolve();
                }
            };
            
            script.onerror = (error) => {
                reject(new Error(`Failed to load script: ${url}`));
            };
            
            document.head.appendChild(script);
        });
        
        // If no URLs, resolve immediately
        if (urls.length === 0) {
            resolve();
        }
    });
}

/**
 * Show fallback content if WebGL initialization fails
 * @param {HTMLElement} container - Container element for WebGL content
 */
function showFallbackContent(container) {
    container.innerHTML = `
        <div class="webgl-fallback">
            <h3>Cosmic Zen Space</h3>
            <p>Unable to initialize WebGL experience.</p>
            <p>Please try using a modern browser like Chrome, Firefox, or Edge.</p>
        </div>
    `;
}

/**
 * Add Zen Space controls
 */
function addZenControls() {
    // Create control panel
    const panel = document.createElement('div');
    panel.className = 'zen-control-panel';
    
    // Add toggle button for portal effect intensity
    const portalToggle = document.createElement('div');
    portalToggle.className = 'zen-control-button';
    portalToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>';
    portalToggle.title = 'Toggle Portal Intensity';
    portalToggle.addEventListener('click', () => {
        if (ZenSpace.shaders.portal) {
            const intensity = ZenSpace.shaders.portal.uniforms.uPortalIntensity.value;
            ZenSpace.shaders.portal.uniforms.uPortalIntensity.value = intensity > 0.5 ? 0.3 : 1.0;
        }
    });
    
    // Add fullscreen toggle
    const fullscreenToggle = document.createElement('div');
    fullscreenToggle.className = 'zen-control-button';
    fullscreenToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>';
    fullscreenToggle.title = 'Toggle Fullscreen';
    fullscreenToggle.addEventListener('click', toggleFullscreen);
    
    // Add buttons to panel
    panel.appendChild(portalToggle);
    panel.appendChild(fullscreenToggle);
    
    // Add panel to document
    document.body.appendChild(panel);
}

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

/**
 * Setup portal click interactions
 */
function setupPortalInteraction() {
    // Get portal overlay element
    const portalOverlay = document.querySelector('.portal-overlay');
    if (!portalOverlay) return;
    
    // Add click event to container
    const container = document.getElementById('zen-space-container');
    if (container) {
        container.addEventListener('click', (event) => {
            // Make overlay visible briefly
            portalOverlay.style.opacity = '0';
            portalOverlay.style.transition = 'none';
            
            // Calculate position for the radial gradient
            const x = (event.clientX / window.innerWidth) * 100;
            const y = (event.clientY / window.innerHeight) * 100;
            portalOverlay.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(153, 0, 255, 0.2) 0%, rgba(0, 0, 0, 0) 70%)`;
            
            // Force reflow
            void portalOverlay.offsetWidth;
            
            // Animate in and then out
            portalOverlay.style.transition = 'opacity 1.5s ease';
            portalOverlay.style.opacity = '1';
            
            setTimeout(() => {
                portalOverlay.style.opacity = '0';
            }, 500);
        });
        
        // Add interactive class to allow clicks
        container.classList.add('interactive');
    }
}