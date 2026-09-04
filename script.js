document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // AUTO FALLBACK GAMBAR LOGO / AVATAR
    // ==========================================
    const fallbackSVG = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpolygon points='50,10 90,85 10,85' fill='%2300f2fe' opacity='0.8'/%3E%3Ccircle cx='50' cy='50' r='20' fill='%23040814'/%3E%3Cpath d='M50 20 L80 80 L20 80 Z' stroke='%2300f2fe' stroke-width='3' fill='none'/%3E%3C/svg%3E";

    document.querySelectorAll('.img-render').forEach(img => {
        img.onerror = () => {
            img.src = fallbackSVG;
        };
    });

    // ==========================================
    // 1. BACKGROUND PARTICLES & THEME SWITCHER
    // ==========================================
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1
    }));

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

        particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = accentColor;
            ctx.fill();

            for (let j = index + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < 110) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = accentColor;
                    ctx.globalAlpha = 1 - dist / 110;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // Theme Switcher Click Handler
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
            e.target.classList.add('active');
            const newColor = e.target.getAttribute('data-color');
            document.documentElement.style.setProperty('--accent', newColor);
            document.documentElement.style.setProperty('--accent-glow', `${newColor}66`);
            playSfx(800, 0.05);
        });
    });

    // ==========================================
    // 2. AUDIO ENGINE & SFX SYSTEM
    // ==========================================
    const bgm = document.getElementById('bgm');
    const playBtn = document.getElementById('playBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const reverbSlider = document.getElementById('reverbSlider');
    const volVal = document.getElementById('volVal');
    const revVal = document.getElementById('revVal');

    let audioCtx = null;

    function initWebAudio() {
        if (audioCtx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }

    function playSfx(freq = 400, duration = 0.1, type = 'sine') {
        try {
            initWebAudio();
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const now = audioCtx.currentTime;

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            console.log("Audio SFX Error: ", e);
        }
    }

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('sfx-btn')) playSfx(600, 0.08);
    });

    playBtn.addEventListener('click', () => {
        initWebAudio();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

        if (bgm.paused) {
            bgm.play().then(() => {
                playBtn.textContent = '⏸';
            }).catch(e => {
                alert("Gagal memutar audio! Pastikan file 'assets/audio/bgm.mp3' ada di foldernya.");
            });
        } else {
            bgm.pause();
            playBtn.textContent = '▶';
        }
    });

    volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        bgm.volume = val;
        volVal.textContent = `${Math.round(val * 100)}%`;
    });

    reverbSlider.addEventListener('input', (e) => {
        revVal.textContent = `${Math.round(parseFloat(e.target.value) * 100)}%`;
    });

    // ==========================================
    // 3. SNIPER ARENA GAME SYSTEM
    // ==========================================
    const loginContent = document.getElementById('loginContent');
    const sniperArena = document.getElementById('sniperArena');
    const scopeOverlay = document.getElementById('scopeOverlay');
    const sniperRifle = document.getElementById('sniperRifle');
    const sniperTarget = document.getElementById('sniperTarget');
    const statusOverlay = document.getElementById('gameStatus');
    const screenFlash = document.getElementById('screenFlash');

    let isScoped = false;
    let mousePos = { x: 0, y: 0 };
    let score = 0;
    let combo = 0;
    let timer = 15;
    let gameInterval = null;

    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // Lacak posisi kursor mouse
    window.addEventListener('mousemove', (e) => {
        mousePos.x = e.clientX;
        mousePos.y = e.clientY;
    });

    // SISTEM LOGIN (TERIMA USERNAME & PASSWORD APAPUN)
    window.handleLoginSubmit = function() {
        const u = document.getElementById('username').value.trim();
        const p = document.getElementById('password').value.trim();
        const err = document.getElementById('loginError');

        if (u !== '' && p !== '') {
            err.style.display = 'none';
            loginContent.style.display = 'none';
            sniperArena.style.display = 'block';
            startSniperGame();
        } else {
            err.querySelector('span').textContent = '⚠️ Silakan isi Username dan Password!';
            err.style.display = 'block';
            playSfx(150, 0.3, 'sawtooth');
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            const loginBox = document.getElementById('loginBox');
            loginBox.classList.remove('shake');
            void loginBox.offsetWidth;
            loginBox.classList.add('shake');
        }
    };

    function startSniperGame() {
        score = 0; combo = 0; timer = 15;
        document.getElementById('gameScore').textContent = score;
        document.getElementById('gameCombo').textContent = `x${combo}`;
        document.getElementById('gameTimer').textContent = timer;
        moveTargetRandomly();

        clearInterval(gameInterval);
        gameInterval = setInterval(() => {
            timer--;
            document.getElementById('gameTimer').textContent = timer;
            
            if (timer <= 0) {
                clearInterval(gameInterval);
                
                if (score >= 1000) {
                    if (statusOverlay) {
                        statusOverlay.textContent = 'MISSION PASSED!';
                        statusOverlay.className = 'status-overlay good';
                    }
                    setTimeout(() => {
                        if (statusOverlay) statusOverlay.className = 'status-overlay';
                        goToSlide(2);
                    }, 1500);
                } else {
                    if (statusOverlay) {
                        statusOverlay.textContent = 'GAGAL! MIN SKOR 1000';
                        statusOverlay.className = 'status-overlay miss';
                    }
                    setTimeout(() => {
                        if (statusOverlay) statusOverlay.className = 'status-overlay';
                        alert(`Skor kamu cuma ${score}. Minimal harus 1000 poin! Ayo coba lagi.`);
                        startSniperGame();
                    }, 1200);
                }
            }
        }, 1000);
    }

    function moveTargetRandomly() {
        const rx = Math.floor(Math.random() * 60) + 20;
        const ry = Math.floor(Math.random() * 50) + 25;
        sniperTarget.style.left = `${rx}%`;
        sniperTarget.style.top = `${ry}%`;
    }

    function enterScope() {
        if (isScoped) return;
        isScoped = true;
        if (scopeOverlay) scopeOverlay.classList.add('active');
        if (sniperRifle) sniperRifle.classList.add('scoping');
    }

    function exitScopeAndShoot() {
        if (!isScoped) return;
        isScoped = false;
        if (scopeOverlay) scopeOverlay.classList.remove('active');
        if (sniperRifle) sniperRifle.classList.remove('scoping');

        playSfx(300, 0.2, 'sawtooth');
        
        if (screenFlash) {
            screenFlash.classList.add('active');
            setTimeout(() => screenFlash.classList.remove('active'), 150);
        }

        const targetRect = sniperTarget.getBoundingClientRect();
        const isHit = (
            mousePos.x >= targetRect.left &&
            mousePos.x <= targetRect.right &&
            mousePos.y >= targetRect.top &&
            mousePos.y <= targetRect.bottom
        );

        if (isHit) {
            combo++;
            score += 100;
            document.getElementById('gameScore').textContent = score;
            document.getElementById('gameCombo').textContent = `x${combo}`;
            
            if (statusOverlay) {
                statusOverlay.textContent = 'GOOD AIM!';
                statusOverlay.className = 'status-overlay good';
            }
            playSfx(800, 0.15, 'sine');
            moveTargetRandomly();
        } else {
            combo = 0;
            document.getElementById('gameCombo').textContent = `x${combo}`;
            
            if (statusOverlay) {
                statusOverlay.textContent = 'MISS!';
                statusOverlay.className = 'status-overlay miss';
            }
            playSfx(120, 0.2, 'sawtooth');
        }

        setTimeout(() => {
            if (statusOverlay) statusOverlay.className = 'status-overlay';
        }, 400);
    }

    sniperArena.addEventListener('mousedown', (e) => {
        if (sniperArena.style.display !== 'none') enterScope();
    });
    
    sniperArena.addEventListener('mouseup', (e) => {
        if (sniperArena.style.display !== 'none') exitScopeAndShoot();
    });

    // ==========================================
    // 4. NAVIGASI SLIDE
    // ==========================================
    window.goToSlide = function(slideNumber) {
        clearInterval(gameInterval);
        const slides = document.querySelectorAll('.slide');
        slides.forEach(slide => slide.classList.remove('active'));

        const targetSlide = document.getElementById(`slide-${slideNumber}`);
        if (targetSlide) targetSlide.classList.add('active');

        if (slideNumber === 1) {
            loginContent.style.display = 'grid';
            sniperArena.style.display = 'none';
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            document.getElementById('loginError').style.display = 'none';
            isScoped = false;
        }

        if (slideNumber === 4) {
            animateStatsCounter();
        }
    };

    window.goToShootingSlide = function() {
        const slides = document.querySelectorAll('.slide');
        slides.forEach(slide => slide.classList.remove('active'));
        document.getElementById('slide-1').classList.add('active');

        loginContent.style.display = 'none';
        sniperArena.style.display = 'block';
        startSniperGame();
    };

    function animateStatsCounter() {
        const counters = document.querySelectorAll('.stat-value[data-target]');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            let count = 0;
            const timer = setInterval(() => {
                count++;
                counter.textContent = count;
                if (count >= target) clearInterval(timer);
            }, 50);
        });
    }
});