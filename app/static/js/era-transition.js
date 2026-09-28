/**
 * FutureEra — Quantum Warp & Stage Transition Engine
 * Handles hyperspace jump on "Enter the Era" click & smooth 3D stage entrance.
 */
(function () {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let audioCtx = null;

    /**
     * Procedural Web Audio API sound synthesizer
     */
    function getAudioContext() {
        if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    }

    function playWarpSound() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;

            // 1. Deep sub-bass drop / vortex pulse
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(38, now + 0.65);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.72);

            // 2. High-tech cyber sweep / whoosh
            const biquad = ctx.createBiquadFilter();
            biquad.type = 'bandpass';
            biquad.frequency.setValueAtTime(300, now);
            biquad.frequency.exponentialRampToValueAtTime(2200, now + 0.5);
            biquad.Q.value = 3.5;

            const sweepOsc = ctx.createOscillator();
            const sweepGain = ctx.createGain();
            sweepOsc.type = 'sawtooth';
            sweepOsc.frequency.setValueAtTime(90, now);
            sweepOsc.frequency.exponentialRampToValueAtTime(360, now + 0.6);

            sweepGain.gain.setValueAtTime(0.08, now);
            sweepGain.gain.linearRampToValueAtTime(0.14, now + 0.35);
            sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

            sweepOsc.connect(biquad);
            biquad.connect(sweepGain);
            sweepGain.connect(ctx.destination);

            sweepOsc.start(now);
            sweepOsc.stop(now + 0.7);
        } catch (e) {
            // Audio is optional enhancement; fail silently
        }
    }

    function playArrivalSound() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;

            // Harmonious crystalline confirmation chime
            [587.33, 880].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.06);

                gain.gain.setValueAtTime(0.08, now + i * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + i * 0.06);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.06);
                osc.stop(now + 0.65 + i * 0.06);
            });
        } catch (e) {}
    }

    /**
     * Hyperspace Starfield Canvas Animation
     */
    class WarpStarfield {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.stars = [];
            this.numStars = prefersReducedMotion ? 40 : 160;
            this.speed = 3;
            this.maxSpeed = 38;
            this.running = false;
            this.animId = null;

            this.colors = ['#38bdf8', '#2dd4bf', '#ffffff', '#a7f3d0', '#67e8f9'];
            this.resize();
            this.initStars();
        }

        resize() {
            this.w = this.canvas.width = window.innerWidth;
            this.h = this.canvas.height = window.innerHeight;
            this.cx = this.w / 2;
            this.cy = this.h / 2;
        }

        initStars() {
            this.stars = [];
            for (let i = 0; i < this.numStars; i++) {
                this.stars.push({
                    x: (Math.random() - 0.5) * this.w * 2,
                    y: (Math.random() - 0.5) * this.h * 2,
                    z: Math.random() * this.w,
                    pz: Math.random() * this.w,
                    color: this.colors[Math.floor(Math.random() * this.colors.length)],
                    size: Math.random() * 1.5 + 1
                });
            }
        }

        start() {
            this.running = true;
            this.speed = 3;
            const startTime = performance.now();

            const render = (now) => {
                if (!this.running) return;

                const elapsed = now - startTime;
                // Accelerate warp speed smoothly over 600ms
                this.speed = Math.min(this.maxSpeed, 3 + Math.pow(elapsed / 160, 2.2));

                this.ctx.fillStyle = 'rgba(3, 7, 18, 0.35)';
                this.ctx.fillRect(0, 0, this.w, this.h);

                for (let i = 0; i < this.stars.length; i++) {
                    const star = this.stars[i];
                    star.pz = star.z;
                    star.z -= this.speed;

                    if (star.z <= 0) {
                        star.x = (Math.random() - 0.5) * this.w * 2;
                        star.y = (Math.random() - 0.5) * this.h * 2;
                        star.z = this.w;
                        star.pz = this.w;
                    }

                    const k = 250 / star.z;
                    const px = star.x * k + this.cx;
                    const py = star.y * k + this.cy;

                    const prevK = 250 / star.pz;
                    const prevX = star.x * prevK + this.cx;
                    const prevY = star.y * prevK + this.cy;

                    if (px >= 0 && px <= this.w && py >= 0 && py <= this.h) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(prevX, prevY);
                        this.ctx.lineTo(px, py);
                        this.ctx.strokeStyle = star.color;
                        this.ctx.lineWidth = Math.min(4, (1 - star.z / this.w) * 3 + star.size);
                        this.ctx.lineCap = 'round';
                        this.ctx.stroke();
                    }
                }

                this.animId = requestAnimationFrame(render);
            };

            this.animId = requestAnimationFrame(render);
        }

        stop() {
            this.running = false;
            if (this.animId) {
                cancelAnimationFrame(this.animId);
            }
        }
    }

    /**
     * Create the Warp Overlay DOM
     */
    function getOrCreateOverlay() {
        let overlay = document.getElementById('era-warp-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'era-warp-overlay';
            overlay.setAttribute('aria-hidden', 'true');
            overlay.innerHTML = `
                <canvas id="era-warp-canvas"></canvas>
                <div class="era-warp-grid-floor"></div>
                <div class="era-warp-hud">
                    <div class="era-portal-portal-wrap">
                        <div class="era-portal-ring-outer"></div>
                        <div class="era-portal-ring-inner"></div>
                        <div class="era-portal-ring-pulse"></div>
                        <div class="era-portal-core">
                            <svg class="era-portal-bolt" viewBox="0 0 24 24" fill="none" stroke="#5eead4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="url(#boltWarpGrad)" stroke="#5eead4"></polygon>
                                <defs>
                                    <linearGradient id="boltWarpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#ffffff"/>
                                        <stop offset="100%" stop-color="#14b8a6"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                    <div class="era-hud-tag">
                        <span class="era-hud-tag-dot"></span>
                        <span>QUANTUM PATHWAY // 2026</span>
                    </div>
                    <h2 class="era-hud-title">Entering The Era</h2>
                    <p class="era-hud-sub">CALIBRATING NEURAL BLUEPRINTS &bull; STAGE SELECTION</p>
                    <div class="era-hud-progress-wrap">
                        <div class="era-hud-progress-bar" id="era-warp-progress"></div>
                    </div>
                    <div class="era-hud-telemetry">
                        <div><span>DEST:</span> /STAGE</div>
                        <div><span>VELOCITY:</span> 0.99c</div>
                        <div><span>SYS:</span> ACTIVE</div>
                    </div>
                </div>
                <div class="era-warp-flash" id="era-warp-flash"></div>
            `;
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    /**
     * Trigger the full warp jump sequence
     */
    function triggerEraWarp(targetHref, triggerBtn) {
        // Prevent duplicate trigger
        if (document.body.classList.contains('era-body-warping')) return;

        // Button micro-interaction
        if (triggerBtn) {
            triggerBtn.classList.add('btn--warping');
            const rect = triggerBtn.getBoundingClientRect();
            const shockwave = document.createElement('span');
            shockwave.className = 'btn-warp-shockwave';
            triggerBtn.appendChild(shockwave);
            setTimeout(() => shockwave.remove(), 750);
        }

        // Play procedural audio
        playWarpSound();

        // Mark body
        document.body.classList.add('era-body-warping');

        // Setup overlay & canvas
        const overlay = getOrCreateOverlay();
        const canvas = document.getElementById('era-warp-canvas');
        const progressBar = document.getElementById('era-warp-progress');
        const flash = document.getElementById('era-warp-flash');

        const starfield = new WarpStarfield(canvas);
        overlay.classList.add('is-active');
        starfield.start();

        // Animate progress bar
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress = Math.min(100, progress + 12);
            if (progressBar) progressBar.style.width = progress + '%';
            if (progress >= 100) clearInterval(progressInterval);
        }, 55);

        // Record flag in sessionStorage for stage entrance animation
        try {
            sessionStorage.setItem('era_warp_transition', '1');
            sessionStorage.setItem('era_warp_time', Date.now().toString());
        } catch (e) {}

        // Flash portal effect at 600ms
        setTimeout(() => {
            if (flash) flash.classList.add('is-flashing');
        }, 580);

        // Perform navigation at 720ms
        setTimeout(() => {
            starfield.stop();
            window.location.href = targetHref;
        }, 720);

        // Failsafe fallback in case of navigation delay
        setTimeout(() => {
            window.location.href = targetHref;
        }, 1800);
    }

    /**
     * Initialize listeners for "Enter the Era" buttons
     */
    function initTriggerButtons() {
        const triggers = document.querySelectorAll(
            'a[href="/stage"], a[href$="/stage"], [data-era-warp], .btn--solid'
        );

        triggers.forEach((btn) => {
            // Check if this button is specifically for "Enter the Era"
            const text = (btn.textContent || '').trim().toLowerCase();
            const href = btn.getAttribute('href') || '';
            const isEraButton =
                href.includes('/stage') ||
                text.includes('enter the era') ||
                btn.hasAttribute('data-era-warp');

            if (!isEraButton) return;

            // Avoid binding duplicate listeners
            if (btn.dataset.eraBound === 'true') return;
            btn.dataset.eraBound = 'true';

            btn.addEventListener('click', function (e) {
                // Allow standard behavior for middle click or ctrl/cmd click (new tab)
                if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;

                e.preventDefault();
                const target = href || '/stage';
                triggerEraWarp(target, btn);
            });
        });
    }

    /**
     * Initialize Arrival Entrance Animation on /stage
     */
    function initStageArrival() {
        const isStagePage =
            window.location.pathname.includes('/stage') ||
            document.querySelector('.stage-section') ||
            document.querySelector('.stage-container');

        if (!isStagePage) return;

        // Apply animated styling class
        document.documentElement.classList.add('stage-animating');
        document.body.classList.add('stage-animating');

        // Check if user entered via the warp transition
        let cameFromWarp = false;
        try {
            cameFromWarp = sessionStorage.getItem('era_warp_transition') === '1';
            sessionStorage.removeItem('era_warp_transition');
        } catch (e) {}

        // Add arrival veil
        const veil = document.createElement('div');
        veil.className = 'era-arrival-veil';
        veil.setAttribute('aria-hidden', 'true');
        veil.innerHTML = '<div class="era-arrival-shockwave"></div>';
        document.body.appendChild(veil);

        if (cameFromWarp) {
            playArrivalSound();
        }

        // Dissolve veil smoothly
        requestAnimationFrame(() => {
            setTimeout(() => {
                veil.classList.add('is-dissolved');
            }, 60);

            setTimeout(() => {
                if (veil && veil.parentNode) {
                    veil.parentNode.removeChild(veil);
                }
            }, 750);
        });

        // Interactive 3D tilt on stage cards for extra polish
        initStageCardsTilt();
    }

    /**
     * Subtle 3D perspective tilt on stage cards
     */
    function initStageCardsTilt() {
        if (prefersReducedMotion) return;

        const cards = document.querySelectorAll('.stage-card');
        cards.forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -5;
                const rotateY = ((x - centerX) / centerX) * 5;

                card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    /**
     * Handle browser back button (bfcache) restoration
     */
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            // Page restored from cache; clean up any active warp state
            document.body.classList.remove('era-body-warping');
            const overlay = document.getElementById('era-warp-overlay');
            if (overlay) {
                overlay.classList.remove('is-active');
            }
            document.querySelectorAll('.btn--warping').forEach((btn) => {
                btn.classList.remove('btn--warping');
            });
            const shockwave = document.querySelector('.btn-warp-shockwave');
            if (shockwave) shockwave.remove();
        }
    });

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initTriggerButtons();
            initStageArrival();
        });
    } else {
        initTriggerButtons();
        initStageArrival();
    }

    // Expose API for external calls if needed
    window.FutureEraTransition = {
        trigger: triggerEraWarp,
        initButtons: initTriggerButtons,
        initStageArrival: initStageArrival
    };
})();
