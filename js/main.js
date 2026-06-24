/* ==========================================================================
   SALOME — MAIN APPLICATION COORDINATOR (AJAX ROUTER, GSAP, THREE.JS, THEME)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    ThreeParticles.init();
    MouseSpotlight.init();
    NavbarScroll.init();
    SkillCharts.init();
    GSAPAnimations.init();
    ContactForm.init();
    PageRouter.init();
    JourneyTimeline.init();
    checkInitialHash();
});

// Recheck page elements on AJAX load
function initNewPageContent() {
    JourneyTimeline.destroy();
    JourneyTimeline.init();
    SkillCharts.initRadarChart();
    ContactForm.init();
    GSAPAnimations.initScrollReveals();
    NavbarScroll.syncActiveLinks();
    
    // Check if target hash needs scrolling
    const hash = window.location.hash;
    if (hash === '#about') {
        setTimeout(() => {
            const targetSec = document.getElementById('about');
            if (targetSec) {
                window.scrollTo({
                    top: targetSec.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }
}

// Initial direct hash loads scroll trigger helper
function checkInitialHash() {
    if (window.location.hash === '#about') {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const targetSec = document.getElementById('about');
                if (targetSec) {
                    window.scrollTo({
                        top: targetSec.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }, 200);
        });
    }
}

/* ==========================================================================
   1. AJAX PAGE TRANSITION ROUTER (Home + About Scroll Integrator)
   ========================================================================== */
const PageRouter = {
    init() {
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href) return;

            // Bypasses standard triggers
            if (href.startsWith('http') || anchor.hasAttribute('download') || anchor.getAttribute('target') === '_blank') {
                return;
            }

            // About anchors scroll trigger
            if (href === '#about' || href === 'index.html#about') {
                e.preventDefault();
                const path = window.location.pathname;
                const pageName = path.split('/').pop() || 'index.html';
                
                if (pageName === 'index.html' || pageName === '') {
                    // Local scroll
                    const targetSec = document.getElementById('about');
                    if (targetSec) {
                        window.history.pushState(null, '', 'index.html#about');
                        window.scrollTo({
                            top: targetSec.offsetTop - 80,
                            behavior: 'smooth'
                        });
                        NavbarScroll.highlightAboutLink();
                    }
                } else {
                    // AJAX load index.html and then scroll
                    this.loadPage('index.html#about', true);
                }
                return;
            }

            if (href.startsWith('#')) return; // standard local hash clicks

            e.preventDefault();
            this.navigate(href);
        });

        window.addEventListener('popstate', () => {
            this.loadPage(window.location.pathname + window.location.hash, false);
        });
    },

    navigate(url) {
        if (window.location.protocol === 'file:') {
            console.warn("Local file protocol detected. Bypassing AJAX transition router due to CORS sandbox rules.");
            window.location.href = url;
            return;
        }
        this.loadPage(url, true);
    },

    async loadPage(urlWithHash, updateHistory = true) {
        const overlay = document.getElementById('transition-overlay');
        const [url, hash] = urlWithHash.split('#');
        const targetUrl = url || 'index.html';
        
        // Step 1: Fade out current view
        if (overlay) {
            overlay.classList.add('active');
            gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.35 });
        }

        await new Promise(r => setTimeout(r, 400));

        try {
            // Step 2: Fetch target page HTML
            const response = await fetch(targetUrl);
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            const htmlText = await response.text();

            // Step 3: Swap contents
            const parser = new DOMParser();
            const fetchedDoc = parser.parseFromString(htmlText, 'text/html');
            
            const currentWrapper = document.getElementById('page-content');
            const fetchedWrapper = fetchedDoc.getElementById('page-content');

            if (currentWrapper && fetchedWrapper) {
                currentWrapper.innerHTML = fetchedWrapper.innerHTML;
                document.title = fetchedDoc.title;

                const finalHistoryUrl = hash ? `${targetUrl}#${hash}` : targetUrl;
                if (updateHistory) {
                    window.history.pushState(null, '', finalHistoryUrl);
                }

                // Scroll to top by default
                window.scrollTo({ top: 0 });

                // Initialize page-specific scripts
                initNewPageContent();
            }
        } catch (error) {
            console.error("AJAX Routing failure. Redirection fallback triggered.", error);
            window.location.href = urlWithHash;
            return;
        }

        // Step 4: Fade back in
        if (overlay) {
            gsap.fromTo(overlay, { opacity: 1 }, { 
                opacity: 0, 
                duration: 0.35, 
                onComplete: () => {
                    overlay.classList.remove('active');
                } 
            });
        }
    }
};

/* ==========================================================================
   2. THEME MANAGER (Warm Light Theme vs Luxury Burgundy Dark)
   ========================================================================== */
const ThemeManager = {
    init() {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (!toggleBtn) return;

        const savedTheme = localStorage.getItem('portfolio_theme') || 'dark';
        this.setTheme(savedTheme);

        toggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(nextTheme);
        });
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('portfolio_theme', theme);

        const icon = document.querySelector('#theme-toggle-btn i');
        if (icon) {
            if (theme === 'light') {
                icon.className = 'fas fa-moon';
            } else {
                icon.className = 'fas fa-sun';
            }
        }

        // Update radar chart grids
        if (SkillCharts.chartInstance) {
            SkillCharts.initRadarChart();
        }
    }
};

/* ==========================================================================
   3. THREE.JS DUST PARTICLES BACKGROUND
   ========================================================================== */
const ThreeParticles = {
    scene: null,
    camera: null,
    renderer: null,
    points: null,
    mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },

    init() {
        const container = document.getElementById('particles-canvas-container');
        if (!container) return;

        container.innerHTML = '';

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.z = 90;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        const count = 150;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const burgundy = new THREE.Color(0x800020);
        const softWhite = new THREE.Color(0x6e6e73);

        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 180;
            positions[i + 1] = (Math.random() - 0.5) * 180;
            positions[i + 2] = (Math.random() - 0.5) * 120;

            const color = Math.random() > 0.4 ? burgundy : softWhite;
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
        const tex = new THREE.CanvasTexture(canvas);

        const mat = new THREE.PointsMaterial({
            size: 1.2,
            vertexColors: true,
            map: tex,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.points = new THREE.Points(geo, mat);
        this.scene.add(this.points);

        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        this.animate();
    },

    onMouseMove(e) {
        this.mouse.targetX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
        this.mouse.targetY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    },

    onResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.points) {
            this.points.rotation.y += 0.0004;
            this.points.rotation.x += 0.0001;
        }

        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

        if (this.camera && this.scene) {
            this.camera.position.x += (this.mouse.x * 8 - this.camera.position.x) * 0.05;
            this.camera.position.y += (-this.mouse.y * 8 - this.camera.position.y) * 0.05;
            this.camera.lookAt(this.scene.position);
            this.renderer.render(this.scene, this.camera);
        }
    }
};

/* ==========================================================================
   4. CURSOR SPOTLIGHT TRACKING
   ========================================================================== */
const MouseSpotlight = {
    init() {
        window.addEventListener('mousemove', (e) => {
            document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
            document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        });
    }
};

/* ==========================================================================
   5. NAVIGATION ANCHORS HIGHLIGHT
   ========================================================================== */
const NavbarScroll = {
    init() {
        const toggleBtn = document.getElementById('mobile-nav-toggle');
        const overlay = document.getElementById('mobile-nav-overlay');
        
        if (toggleBtn && overlay) {
            toggleBtn.addEventListener('click', () => {
                const isActive = overlay.classList.toggle('active');
                if (isActive) {
                    toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
                } else {
                    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
                }
            });
        }

        this.syncActiveLinks();
    },

    highlightAboutLink() {
        const anchors = document.querySelectorAll('.nav-anchor, .mobile-overlay-link');
        anchors.forEach(a => {
            const href = a.getAttribute('href');
            if (href === 'about.html' || href === 'index.html#about' || href === '#about') {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    },

    syncActiveLinks() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop() || 'index.html';
        const hash = window.location.hash;
        const anchors = document.querySelectorAll('.nav-anchor, .mobile-overlay-link');
        
        anchors.forEach(a => {
            const href = a.getAttribute('href');
            if (hash === '#about' && (href === 'about.html' || href === 'index.html#about' || href === '#about')) {
                a.classList.add('active');
            } else if (hash !== '#about' && href === pageName) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });

        // Close drawer
        const overlay = document.getElementById('mobile-nav-overlay');
        const toggleBtn = document.getElementById('mobile-nav-toggle');
        if (overlay && overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    }
};

/* ==========================================================================
   6. TECHNICAL radar (Disabled)
   ========================================================================== */
const SkillCharts = {
    chartInstance: null,
    init() {},
    initRadarChart() {}
};

/* ==========================================================================
   7. GSAP TIMELINES & OBSERVERS
   ========================================================================== */
const GSAPAnimations = {
    init() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        
        ScrollTrigger.getAll().forEach(t => t.kill());
        gsap.registerPlugin(ScrollTrigger);

        this.initHeroEntrance();
        this.initScrollReveals();
        this.initAboutActiveTracking();
    },

    initHeroEntrance() {
        const tl = gsap.timeline();
        tl.fromTo('.hero-greeting', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
          .fromTo('.hero-name', { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 1.0, ease: 'power3.out' }, '-=0.5')
          .fromTo('.subtitle-large', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.7')
          .fromTo('.hero-portrait-frame', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.0, ease: 'power3.out' }, '-=0.9')
          .fromTo('.hero-cta-group .btn-premium', { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.15, duration: 0.5 }, '-=0.7');
    },

    initScrollReveals() {
        const headings = document.querySelectorAll('.section-heading');
        headings.forEach(heading => {
            gsap.fromTo(heading, 
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: heading,
                        start: 'top 85%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        });

        const cards = document.querySelectorAll('.stat-card, .timeline-item, .project-showcase-card, .additional-project-box, .cert-card');
        if (cards.length > 0) {
            gsap.fromTo(cards,
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    stagger: 0.1,
                    duration: 0.7,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: cards[0],
                        start: 'top 85%'
                    }
                }
            );
        }
    },

    initAboutActiveTracking() {
        const aboutSec = document.getElementById('about');
        if (!aboutSec) return;

        ScrollTrigger.create({
            trigger: aboutSec,
            start: 'top 40%',
            end: 'bottom 40%',
            onToggle: self => {
                if (self.isActive) {
                    NavbarScroll.highlightAboutLink();
                } else {
                    // check if we scroll back to hero and clear active classes
                    const scrollY = window.scrollY;
                    if (scrollY < aboutSec.offsetTop - 150) {
                        const anchors = document.querySelectorAll('.nav-anchor, .mobile-overlay-link');
                        anchors.forEach(a => a.classList.remove('active'));
                    }
                }
            }
        });
    }
};

/* ==========================================================================
   8. CONTACT FORM VALIDATIONS & ALERTS
   ========================================================================== */
const ContactForm = {
    init() {
        const form = document.getElementById('contact-form');
        const alertBox = document.getElementById('transmission-alert');
        
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isValid = true;
            
            const name = document.getElementById('form-name');
            const email = document.getElementById('form-email');
            const subject = document.getElementById('form-subject');
            const message = document.getElementById('form-message');
            
            const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

            const validateField = (el, condition) => {
                if (condition) {
                    el.classList.remove('is-invalid');
                    el.classList.add('is-valid');
                } else {
                    el.classList.add('is-invalid');
                    el.classList.remove('is-valid');
                    isValid = false;
                }
            };

            if (name) validateField(name, name.value.trim().length > 0);
            if (email) validateField(email, emailPattern.test(email.value.trim()));
            if (subject) validateField(subject, subject.value.trim().length > 0);
            if (message) validateField(message, message.value.trim().length > 0);

            if (isValid) {
                if (alertBox) {
                    alertBox.classList.add('active');
                    setTimeout(() => {
                        alertBox.classList.remove('active');
                    }, 5000);
                }

                form.reset();
                form.querySelectorAll('.form-control').forEach(el => {
                    el.classList.remove('is-valid');
                });
            }
        });

        form.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('input', () => {
                if (input.value.trim()) {
                    input.classList.remove('is-invalid');
                }
            });
        });
    }
};

/* ==========================================================================
   9. JOURNEY TIMELINE SCROLL MANAGER
   ========================================================================== */
const JourneyTimeline = {
    init() {
        const timeline = document.querySelector('.premium-timeline');
        if (!timeline) return;

        // Ensure the progress line elements exist
        let bg = timeline.querySelector('.timeline-progress-bg');
        let fill = timeline.querySelector('.timeline-progress-fill');
        if (!bg) {
            bg = document.createElement('div');
            bg.className = 'timeline-progress-bg';
            timeline.appendChild(bg);
        }
        if (!fill) {
            fill = document.createElement('div');
            fill.className = 'timeline-progress-fill';
            timeline.appendChild(fill);
        }

        const items = timeline.querySelectorAll('.timeline-item');
        if (items.length === 0) return;

        const onScroll = () => {
            const timelineRect = timeline.getBoundingClientRect();
            const timelineTop = timelineRect.top + window.scrollY;
            
            // Viewport trigger line (e.g. 55% down the screen height)
            const viewportCenter = window.scrollY + window.innerHeight * 0.55;

            let activeIndex = -1;

            // Find current active item
            items.forEach((item, index) => {
                const itemTop = item.offsetTop + timelineTop;
                if (viewportCenter >= itemTop) {
                    activeIndex = index;
                }
            });

            // Set states
            items.forEach((item, index) => {
                if (index < activeIndex) {
                    item.classList.remove('active', 'upcoming');
                    item.classList.add('completed');
                } else if (index === activeIndex) {
                    item.classList.remove('completed', 'upcoming');
                    item.classList.add('active');
                } else {
                    item.classList.remove('completed', 'active');
                    item.classList.add('upcoming');
                }
            });

            // Calculate filling progress height
            if (activeIndex === -1) {
                fill.style.height = '0px';
            } else {
                const firstDot = items[0].querySelector('.timeline-dot');
                const lastDot = items[items.length - 1].querySelector('.timeline-dot');
                
                const startY = firstDot.getBoundingClientRect().top + window.scrollY - timelineTop;
                const endY = lastDot.getBoundingClientRect().top + window.scrollY - timelineTop;
                
                let currentProgressY = startY;

                if (activeIndex >= items.length - 1) {
                    currentProgressY = endY;
                } else {
                    const activeDot = items[activeIndex].querySelector('.timeline-dot');
                    const nextDot = items[activeIndex + 1].querySelector('.timeline-dot');
                    
                    const activeDotY = activeDot.getBoundingClientRect().top + window.scrollY - timelineTop;
                    const nextDotY = nextDot.getBoundingClientRect().top + window.scrollY - timelineTop;
                    
                    const activeCard = items[activeIndex].querySelector('.timeline-card');
                    const cardRect = activeCard.getBoundingClientRect();
                    const cardTop = cardRect.top + window.scrollY;
                    const cardHeight = cardRect.height;
                    
                    const scrollRatio = Math.max(0, Math.min(1, (viewportCenter - cardTop) / (cardHeight + 50)));
                    
                    currentProgressY = activeDotY + (nextDotY - activeDotY) * scrollRatio;
                }

                fill.style.height = `${currentProgressY}px`;
            }
        };

        // Cache listener for cleanup
        this._onScroll = onScroll;
        
        // Run once initially
        onScroll();
        
        window.addEventListener('scroll', onScroll, { passive: true });
    },

    destroy() {
        if (this._onScroll) {
            window.removeEventListener('scroll', this._onScroll);
            this._onScroll = null;
        }
    }
};
