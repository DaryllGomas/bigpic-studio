/**
 * WebGL Zen Space with Portal Effect
 * Creates an immersive cosmic portal/depth effect using Three.js
 */

// Define ZenSpace namespace
const ZenSpace = {
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    container: null,
    width: 0,
    height: 0,
    shaders: {},
    meshes: {},
    time: {
        start: Date.now(),
        current: 0,
        elapsed: 0,
        delta: 0
    },
    config: {
        colors: {
            background: 0x000000,
            nebula: [0x3311bb, 0x9900ff, 0x220066],
            energy: [0x66ffff, 0xff66ff, 0xffff66, 0x66ff99]
        },
        bloom: {
            strength: 1.5,
            radius: 0.75,
            threshold: 0.1
        },
        stars: {
            count: 2000,
            size: { min: 0.1, max: 1.0 },
            twinkleSpeed: 0.05
        },
        portal: {
            quality: 'auto', // 'low', 'medium', 'high', or 'auto'
            interactiveCenter: true, // Whether portal center follows mouse
            pulseSpeed: 0.3,
            ringCount: 20,
            depth: 0.5
        }
    },
    interaction: {
        mouse: { x: 0, y: 0 },
        touch: false,
        lastInteraction: 0
    },
    audio: {
        initialized: false,
        enabled: false,
        context: null,
        sources: {}
    },
    
    /**
     * Initialize the WebGL Zen Space
     * @param {string} containerId - ID of the container element
     */
    init: function(containerId) {
        // Store reference to container
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container element not found:', containerId);
            return false;
        }
        
        // Set size based on container
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        
        // Check for WebGL support
        if (!this.checkWebGLSupport()) {
            this.showFallback();
            return false;
        }
        
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            this.width / this.height, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        this.camera.position.z = 50;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(this.config.colors.background, 1);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // Initialize post-processing
        this.initPostProcessing();
        
        // Create scene elements
        this.createNebula();
        this.createPortal(); // Add portal effect
        this.createStars();
        this.createEnergyStreams();
        this.createZenElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize audio (if supported)
        this.initAudio();
        
        // Start animation loop
        this.animate();
        
        return true;
    },
    
    /**
     * Check if WebGL is supported
     * @returns {boolean} - Whether WebGL is supported
     */
    checkWebGLSupport: function() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch(e) {
            return false;
        }
    },
    
    /**
     * Show fallback content if WebGL is not supported
     */
    showFallback: function() {
        console.log('WebGL not supported, showing fallback');
        this.container.innerHTML = `
            <div class="webgl-fallback">
                <h3>Cosmic Zen Space</h3>
                <p>Your browser doesn't support WebGL, which is required for the interactive experience.</p>
                <p>Please try using a modern browser like Chrome, Firefox, or Edge.</p>
            </div>
        `;
    },
    
    /**
     * Create nebula background
     */
    createNebula: function() {
        // Create geometry (simple plane that fills view)
        const geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
        
        // Create shader material for nebula
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(this.width, this.height) },
                uColor1: { value: new THREE.Color(this.config.colors.nebula[0]) },
                uColor2: { value: new THREE.Color(this.config.colors.nebula[1]) },
                uColor3: { value: new THREE.Color(this.config.colors.nebula[2]) }
            },
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec2 uResolution;
                uniform vec3 uColor1;
                uniform vec3 uColor2;
                uniform vec3 uColor3;
                
                varying vec2 vUv;
                
                // Simple noise function
                float noise(vec2 p) {
                    return sin(p.x * 10.0) * sin(p.y * 10.0) * 0.5 + 0.5;
                }
                
                void main() {
                    // Adjust UVs to center
                    vec2 uv = vUv - 0.5;
                    uv.x *= uResolution.x / uResolution.y;
                    
                    // Simple nebula effect
                    float n1 = noise(uv + uTime * 0.01);
                    float n2 = noise(uv * 2.0 - uTime * 0.02);
                    float n3 = noise(uv * 4.0 + uTime * 0.03);
                    
                    // Combine noise to create nebula pattern
                    float nebula = n1 * n2 * n3 * 2.0;
                    
                    // Mix colors based on noise
                    vec3 color = mix(uColor1, uColor2, n1);
                    color = mix(color, uColor3, n2 * n3);
                    
                    // Add some stars
                    float stars = pow(n3, 20.0);
                    color += stars;
                    
                    // Vignette effect
                    float vignette = 1.0 - length(uv) * 0.7;
                    color *= vignette;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.FrontSide
        });
        
        // Store shader material for updates
        this.shaders.nebula = material;
        
        // Create mesh and position it at the back of the scene
        const nebula = new THREE.Mesh(geometry, material);
        nebula.position.z = -50;
        nebula.scale.set(2, 2, 1);
        
        // Add to scene
        this.scene.add(nebula);
    },
    
    /**
     * Create the portal effect
     */
    createPortal: function() {
        // Check if device is likely capable of handling portal shader
        const isLowPerfDevice = 
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            !this.renderer.capabilities.maxVertexUniforms > 4096;
            
        let quality = this.config.portal.quality;
        if (quality === 'auto') {
            quality = isLowPerfDevice ? 'low' : 'high';
        }
        
        // Adjust settings based on quality level
        let ringCount, depthDetails;
        switch(quality) {
            case 'low':
                ringCount = 10;
                depthDetails = 0.3;
                break;
            case 'medium':
                ringCount = 15;
                depthDetails = 0.5;
                break;
            case 'high':
            default:
                ringCount = 20;
                depthDetails = 0.7;
        }
        
        // Create geometry (simple plane that fills view)
        const geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
        
        // Create shader material for portal
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(this.width, this.height) },
                uPortalCenter: { value: new THREE.Vector2(0.5, 0.5) },
                uPortalColor1: { value: new THREE.Color(0x3311bb) }, // Deep blue
                uPortalColor2: { value: new THREE.Color(0x9900ff) }, // Purple
                uPortalColor3: { value: new THREE.Color(0x220066) }, // Dark blue
                uPortalIntensity: { value: 1.0 },
                uRingCount: { value: ringCount },
                uDepthFactor: { value: depthDetails }
            },
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec2 uResolution;
                uniform vec2 uPortalCenter;
                uniform vec3 uPortalColor1;
                uniform vec3 uPortalColor2;
                uniform vec3 uPortalColor3;
                uniform float uPortalIntensity;
                uniform float uRingCount;
                uniform float uDepthFactor;
                
                varying vec2 vUv;
                
                // Utility function for creating circular rings
                float rings(float dist, float time, float count) {
                    return smoothstep(0.1, 0.9, sin(dist * count - time * 0.5) * 0.5 + 0.5);
                }
                
                void main() {
                    // Calculate distance from portal center
                    vec2 center = uPortalCenter;
                    vec2 uv = vUv - center;
                    
                    // Scale aspect ratio
                    uv.x *= uResolution.x / uResolution.y;
                    
                    // Calculate distance from center
                    float dist = length(uv);
                    
                    // Portal effect
                    // 1. Create concentric rings moving toward center
                    float ringPattern = rings(dist, uTime, uRingCount);
                    
                    // 2. Add some distortion 
                    float distortion = sin(dist * 30.0 + uTime) * 0.02;
                    ringPattern += distortion;
                    
                    // 3. Create vortex effect - swirl
                    float angle = atan(uv.y, uv.x);
                    float swirl = sin(angle * 8.0 + uTime + dist * 5.0) * 0.1;
                    ringPattern += swirl;
                    
                    // 4. Apply non-linear depth transformation to simulate tunnel
                    float depth = pow(dist, uDepthFactor); // Non-linear depth effect
                    
                    // Calculate base color based on depth
                    vec3 color = mix(uPortalColor1, uPortalColor2, depth);
                    
                    // Add ring pattern highlights
                    color = mix(color, uPortalColor3, ringPattern * 0.5);
                    
                    // Add brightness at center
                    float centerGlow = smoothstep(0.5, 0.0, dist) * 1.5;
                    color += centerGlow * uPortalColor1;
                    
                    // Create fade at edges for blending with nebula
                    float fade = smoothstep(1.0, 0.4, dist);
                    
                    // Output final color with fade at edges
                    gl_FragColor = vec4(color, fade * uPortalIntensity);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        // Store shader material for updates
        this.shaders.portal = material;
        
        // Create mesh and position it behind nebula but in front of stars
        const portal = new THREE.Mesh(geometry, material);
        portal.position.z = -45; // Between nebula (-50) and stars (-40)
        portal.scale.set(1.5, 1.5, 1);
        
        // Add to scene
        this.scene.add(portal);
        
        // Store reference to portal mesh
        this.meshes.portal = portal;
    },
    
    /**
     * Create star field
     */
    createStars: function() {
        // Create star geometry
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            transparent: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            vertexColors: true
        });
        
        // Create star positions and colors
        const count = this.config.stars.count;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            // Position
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = (Math.random() - 0.5) * 100;
            positions[i3 + 2] = (Math.random() - 0.5) * 60 - 40; // z: between -100 and -40
            
            // Color (slightly random for twinkling effect)
            const starColor = new THREE.Color();
            starColor.setHSL(Math.random() * 0.1 + 0.6, 0.2, Math.random() * 0.2 + 0.8);
            colors[i3] = starColor.r;
            colors[i3 + 1] = starColor.g;
            colors[i3 + 2] = starColor.b;
            
            // Size
            sizes[i] = Math.random() * (this.config.stars.size.max - this.config.stars.size.min) + this.config.stars.size.min;
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create stars mesh
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        
        // Add to scene
        this.scene.add(stars);
        
        // Store reference to stars
        this.meshes.stars = stars;
    },
    
    /**
     * Create energy streams flowing toward the portal
     */
    createEnergyStreams: function() {
        // Create energy streams from different directions
        const streamDirections = [
            { x: -40, y: 20, z: -20 },
            { x: 40, y: 20, z: -20 },
            { x: 40, y: -20, z: -20 },
            { x: -40, y: -20, z: -20 }
        ];
        
        // Set target to portal center
        const target = new THREE.Vector3(0, 0, -45); // Match portal position
        
        // Create each stream
        streamDirections.forEach((position, index) => {
            this.createEnergyStream(
                new THREE.Vector3(position.x, position.y, position.z),
                target,
                this.config.colors.energy[index % this.config.colors.energy.length],
                index
            );
        });
    },
    
    /**
     * Create a single energy stream
     * @param {THREE.Vector3} start - Starting position
     * @param {THREE.Vector3} end - Ending position
     * @param {number} color - Stream color
     * @param {number} index - Stream index
     */
    createEnergyStream: function(start, end, color, index) {
        // Create curve path for the stream
        const curve = new THREE.CatmullRomCurve3([
            start,
            new THREE.Vector3(
                start.x * 0.5, 
                start.y * 0.5,
                (start.z + end.z) * 0.6
            ),
            end
        ]);
        
        // Create tube geometry along curve
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            24, // tubular segments
            0.3, // radius
            8, // radial segments
            false // closed
        );
        
        // Create material for energy stream
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(color) },
                uLength: { value: curve.getLength() },
                uIndex: { value: index }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uLength;
                uniform float uIndex;
                
                varying vec2 vUv;
                varying float vProgress;
                
                void main() {
                    vUv = uv;
                    
                    // Calculate progress along tube (0 to 1)
                    vProgress = position.y / uLength;
                    
                    // Pass to fragment shader
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColor;
                uniform float uIndex;
                
                varying vec2 vUv;
                varying float vProgress;
                
                void main() {
                    // Create flowing energy pulse
                    float pulse = sin((vProgress * 10.0 + uTime * 2.0 + uIndex) * 3.14159) * 0.5 + 0.5;
                    
                    // Fade in as it approaches portal
                    float fade = smoothstep(0.0, 0.2, vProgress) * smoothstep(1.0, 0.8, vProgress);
                    
                    // Radial fade for tube
                    float radialFade = smoothstep(0.0, 0.5, 1.0 - abs(vUv.x - 0.5) * 2.0);
                    
                    // Combine effects
                    float intensity = pulse * fade * radialFade;
                    
                    // Final color with glow
                    vec3 finalColor = uColor * intensity;
                    
                    gl_FragColor = vec4(finalColor, intensity * 0.8);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.FrontSide,
            depthWrite: false
        });
        
        // Store shader material for updates
        if (!this.shaders.energyStreams) {
            this.shaders.energyStreams = [];
        }
        this.shaders.energyStreams.push(material);
        
        // Create mesh
        const tube = new THREE.Mesh(tubeGeometry, material);
        
        // Add to scene
        this.scene.add(tube);
        
        // Store reference to mesh
        if (!this.meshes.energyStreams) {
            this.meshes.energyStreams = [];
        }
        this.meshes.energyStreams.push(tube);
    },
    
    /**
     * Create zen elements (placeholder for additional decorative elements)
     */
    createZenElements: function() {
        // To be implemented - decorative elements
    },
    
    /**
     * Create a ripple effect at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createRipple: function(x, y) {
        // Convert screen coordinates to normalized device coordinates (-1 to +1)
        const ndc = {
            x: (x / this.width) * 2 - 1,
            y: -(y / this.height) * 2 + 1
        };
        
        // Create ripple geometry
        const geometry = new THREE.RingGeometry(0.1, 0.4, 32);
        
        // Create ripple material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0xaaaaff) },
                uMaxSize: { value: 3.0 },
                uDuration: { value: 2.0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uMaxSize;
                
                void main() {
                    // Scale vertices based on time
                    vec3 pos = position;
                    pos.xy *= uTime * uMaxSize;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColor;
                uniform float uDuration;
                
                void main() {
                    // Fade out with time
                    float opacity = 1.0 - (uTime / uDuration);
                    
                    gl_FragColor = vec4(uColor, opacity);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        // Create mesh
        const ripple = new THREE.Mesh(geometry, material);
        
        // Position at click/touch point in 3D space
        // Using a raycast approach would be more accurate,
        // but for this effect, a simple z-position works
        ripple.position.set(ndc.x * 10, ndc.y * 10, 0);
        
        // Look at camera
        ripple.lookAt(this.camera.position);
        
        // Add to scene
        this.scene.add(ripple);
        
        // Animate and remove when complete
        const startTime = this.time.elapsed;
        const duration = 2.0; // seconds
        const update = () => {
            const elapsedTime = this.time.elapsed - startTime;
            if (elapsedTime > duration) {
                // Animation complete, remove ripple
                this.scene.remove(ripple);
                ripple.geometry.dispose();
                ripple.material.dispose();
                return;
            }
            
            // Update time uniform
            ripple.material.uniforms.uTime.value = elapsedTime;
            
            // Continue animation
            requestAnimationFrame(update);
        };
        
        // Start animation
        update();
    },
    
    /**
     * Initialize post-processing effects
     */
    initPostProcessing: function() {
        // Require EffectComposer to be loaded
        if (!THREE.EffectComposer) {
            console.warn('EffectComposer not loaded, skipping post-processing');
            return;
        }
        
        // Create composer for post-processing
        this.composer = new THREE.EffectComposer(this.renderer);
        
        // Add render pass
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Enhanced bloom for portal effect
        if (THREE.UnrealBloomPass) {
            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(this.width, this.height),
                this.config.bloom.strength,
                this.config.bloom.radius,
                this.config.bloom.threshold
            );
            this.composer.addPass(bloomPass);
        }
        
        // Optional: Add depth-of-field effect to enhance depth perception
        if (THREE.BokehPass) {
            const bokehPass = new THREE.BokehPass(this.scene, this.camera, {
                focus: 45,     // Focus at portal depth
                aperture: 0.0025,
                maxblur: 0.01
            });
            this.composer.addPass(bokehPass);
        }
    },
    
    /**
     * Initialize audio system (if supported)
     */
    initAudio: function() {
        // Check if AudioContext is supported
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.warn('AudioContext not supported, audio disabled');
            return;
        }
        
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audio.context = new AudioContext();
        
        // Mark as initialized
        this.audio.initialized = true;
    },
    
    /**
     * Update audio settings and effects
     */
    updateAudio: function() {
        // Skip if audio not initialized or enabled
        if (!this.audio.initialized || !this.audio.enabled) return;
        
        // Portal pulse value (calculated in updateMaterials)
        const portalPulse = (Math.sin(this.time.elapsed * 0.3) * 0.5 + 0.5);
        
        // Apply portal pulse to audio elements
        if (this.audio.sources.ambient) {
            this.audio.sources.ambient.gainNodes.forEach(gain => {
                const baseVolume = gain.userData?.baseVolume || 0.02;
                // Add small portal pulse influence to volume
                gain.gain.value = baseVolume + portalPulse * 0.01;
            });
        }
    },
    
    /**
     * Set up event listeners for interaction
     */
    setupEventListeners: function() {
        // Mouse movement
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        
        // Mouse clicks
        window.addEventListener('click', this.onMouseClick.bind(this));
        
        // Touch events
        window.addEventListener('touchstart', this.onTouchStart.bind(this));
        window.addEventListener('touchmove', this.onTouchMove.bind(this));
        window.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // Window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    },
    
    /**
     * Handle mouse movement
     * @param {Event} event - Mouse event
     */
    onMouseMove: function(event) {
        // Convert mouse position to normalized coordinates (-1 to 1)
        this.interaction.mouse.x = (event.clientX / this.width) * 2 - 1;
        this.interaction.mouse.y = -(event.clientY / this.height) * 2 + 1;
        
        // Update last interaction time
        this.interaction.lastInteraction = this.time.current;
    },
    
    /**
     * Handle mouse clicks
     * @param {Event} event - Mouse event
     */
    onMouseClick: function(event) {
        // Create ripple effect
        this.createRipple(event.clientX, event.clientY);
        
        // Optional: Move camera toward portal on click for immersive effect
        // Calculate the direction vector to move the camera along
        const mouseX = (event.clientX / this.width) * 2 - 1;
        const mouseY = -(event.clientY / this.height) * 2 + 1;
        
        // Create a target position that's closer to the portal
        const targetZ = this.camera.position.z - 2; // Move 2 units closer
        
        // Animate camera movement using GSAP if available, otherwise use simple approach
        if (window.gsap) {
            gsap.to(this.camera.position, {
                x: mouseX * 5, // Exaggerate x movement
                y: mouseY * 5, // Exaggerate y movement
                z: targetZ,
                duration: 1,
                ease: "power2.out",
                onComplete: () => {
                    // Animate camera back to original position
                    gsap.to(this.camera.position, {
                        z: 50, // Original z position
                        duration: 3,
                        ease: "power1.inOut"
                    });
                }
            });
        } else {
            // Simple animation approach without GSAP
            const originalPosition = {
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z
            };
            
            // Store animation timing data
            const animData = {
                startTime: this.time.current,
                zoomInDuration: 1,
                zoomOutDelay: 1,
                zoomOutDuration: 3
            };
            
            // Store animation data for update
            this.cameraAnimation = {
                active: true,
                originalPosition: originalPosition,
                targetPosition: {
                    x: mouseX * 5,
                    y: mouseY * 5,
                    z: targetZ
                },
                timing: animData
            };
        }
    },
    
    /**
     * Handle touch start events
     * @param {Event} event - Touch event
     */
    onTouchStart: function(event) {
        event.preventDefault();
        this.interaction.touch = true;
        
        // Handle like a mouse event
        if (event.touches.length > 0) {
            this.onMouseMove({
                clientX: event.touches[0].clientX,
                clientY: event.touches[0].clientY
            });
        }
    },
    
    /**
     * Handle touch move events
     * @param {Event} event - Touch event
     */
    onTouchMove: function(event) {
        event.preventDefault();
        
        // Handle like a mouse event
        if (event.touches.length > 0) {
            this.onMouseMove({
                clientX: event.touches[0].clientX,
                clientY: event.touches[0].clientY
            });
        }
    },
    
    /**
     * Handle touch end events
     * @param {Event} event - Touch event
     */
    onTouchEnd: function(event) {
        event.preventDefault();
        
        // Create ripple at the last touch position
        if (event.changedTouches.length > 0) {
            this.createRipple(
                event.changedTouches[0].clientX,
                event.changedTouches[0].clientY
            );
            
            // Handle like a mouse click
            this.onMouseClick({
                clientX: event.changedTouches[0].clientX,
                clientY: event.changedTouches[0].clientY
            });
        }
    },
    
    /**
     * Handle window resize
     */
    onWindowResize: function() {
        // Update sizes
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        
        // Update camera
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        // Update renderer and composer
        this.renderer.setSize(this.width, this.height);
        if (this.composer) this.composer.setSize(this.width, this.height);
        
        // Update shader uniforms that depend on resolution
        if (this.shaders.nebula) {
            this.shaders.nebula.uniforms.uResolution.value.set(this.width, this.height);
        }
        
        if (this.shaders.portal) {
            this.shaders.portal.uniforms.uResolution.value.set(this.width, this.height);
        }
    },
    
    /**
     * Update materials and shaders
     */
    updateMaterials: function() {
        // Update nebula shader
        if (this.shaders.nebula) {
            this.shaders.nebula.uniforms.uTime.value = this.time.elapsed;
        }
        
        // Update portal shader
        if (this.shaders.portal) {
            this.shaders.portal.uniforms.uTime.value = this.time.elapsed;
            
            // Optional: Make the portal responsive to mouse movement
            if (this.config.portal.interactiveCenter) {
                const mouseX = this.interaction.mouse.x * 0.5 + 0.5;
                const mouseY = this.interaction.mouse.y * 0.5 + 0.5;
                this.shaders.portal.uniforms.uPortalCenter.value.set(mouseX, mouseY);
            }
        }
        
        // Update energy stream shaders
        if (this.shaders.energyStreams) {
            this.shaders.energyStreams.forEach(material => {
                material.uniforms.uTime.value = this.time.elapsed;
            });
        }
    },
    
    /**
     * Update camera animation
     */
    updateCameraAnimation: function() {
        // Skip if no animation is active
        if (!this.cameraAnimation || !this.cameraAnimation.active) return;
        
        const anim = this.cameraAnimation;
        const elapsed = this.time.current - anim.timing.startTime;
        
        // Phase 1: Zoom in toward portal
        if (elapsed < anim.timing.zoomInDuration) {
            const progress = elapsed / anim.timing.zoomInDuration;
            const easeProgress = progress * (2 - progress); // Simple ease out
            
            this.camera.position.x = anim.originalPosition.x + (anim.targetPosition.x - anim.originalPosition.x) * easeProgress;
            this.camera.position.y = anim.originalPosition.y + (anim.targetPosition.y - anim.originalPosition.y) * easeProgress;
            this.camera.position.z = anim.originalPosition.z + (anim.targetPosition.z - anim.originalPosition.z) * easeProgress;
        } 
        // Phase 2: Waiting at closest point
        else if (elapsed < anim.timing.zoomInDuration + anim.timing.zoomOutDelay) {
            // Hold position
        } 
        // Phase 3: Zoom back out
        else if (elapsed < anim.timing.zoomInDuration + anim.timing.zoomOutDelay + anim.timing.zoomOutDuration) {
            const zoomOutElapsed = elapsed - anim.timing.zoomInDuration - anim.timing.zoomOutDelay;
            const progress = zoomOutElapsed / anim.timing.zoomOutDuration;
            const easeProgress = progress * progress; // Simple ease in
            
            this.camera.position.x = anim.targetPosition.x + (anim.originalPosition.x - anim.targetPosition.x) * easeProgress;
            this.camera.position.y = anim.targetPosition.y + (anim.originalPosition.y - anim.targetPosition.y) * easeProgress;
            this.camera.position.z = anim.targetPosition.z + (anim.originalPosition.z - anim.targetPosition.z) * easeProgress;
        } 
        // Animation complete
        else {
            // Reset camera to original position
            this.camera.position.copy(anim.originalPosition);
            this.cameraAnimation.active = false;
        }
    },
    
    /**
     * Main animation loop
     */
    animate: function() {
        // Request next frame
        requestAnimationFrame(this.animate.bind(this));
        
        // Update time
        const now = Date.now();
        this.time.delta = (now - this.time.current) / 1000; // seconds
        this.time.current = now;
        this.time.elapsed = (now - this.time.start) / 1000; // seconds
        
        // Update materials
        this.updateMaterials();
        
        // Update camera animation
        this.updateCameraAnimation();
        
        // Update audio
        this.updateAudio();
        
        // Render scene
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
};

// Export the ZenSpace object
if (typeof module !== 'undefined') {
    module.exports = ZenSpace;
}