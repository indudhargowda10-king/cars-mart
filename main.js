/* ==========================================================================
   0. CINEMATIC LOADING ANIMATION SYSTEM
   ========================================================================== */
(function initCinematicLoader() {
  const loader = document.getElementById('cinematic-loader');
  if (!loader) return;

  const canvas = document.getElementById('loader-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  // Set canvas bounds
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // State Variables
  let isMuted = true;
  let animationCompleted = false;
  let startTime = null;

  // Particle systems
  const smokeParticles = [];
  const sparkParticles = [];
  const speedLines = [];

  // Web Audio Context Synthesizer
  let audioCtx = null;
  let engineOsc = null;
  let filterNode = null;
  let engineGain = null;

  function initAudio() {
    if (audioCtx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
      
      // Create oscillator for low rumble engine sound
      engineOsc = audioCtx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.setValueAtTime(32, audioCtx.currentTime); // low sub base
      
      // Create filter
      filterNode = audioCtx.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(140, audioCtx.currentTime);

      // Create gain
      engineGain = audioCtx.createGain();
      engineGain.gain.setValueAtTime(isMuted ? 0 : 0.05, audioCtx.currentTime);

      // Chain
      engineOsc.connect(filterNode);
      filterNode.connect(engineGain);
      engineGain.connect(audioCtx.destination);

      engineOsc.start();
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  function setEnginePitch(freq, filterFreq, volume, duration) {
    if (!audioCtx || isMuted || !engineOsc) return;
    const curr = audioCtx.currentTime;
    engineOsc.frequency.exponentialRampToValueAtTime(freq, curr + duration);
    filterNode.frequency.exponentialRampToValueAtTime(filterFreq, curr + duration);
    engineGain.gain.linearRampToValueAtTime(volume, curr + duration);
  }

  function playDriftScreech() {
    if (!audioCtx || isMuted) return;
    try {
      const curr = audioCtx.currentTime;
      // Synthesize drift tyre squeal
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, curr);
      osc.frequency.linearRampToValueAtTime(550, curr + 1.0);

      const screechFilter = audioCtx.createBiquadFilter();
      screechFilter.type = 'bandpass';
      screechFilter.frequency.setValueAtTime(800, curr);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.06, curr);
      gain.gain.exponentialRampToValueAtTime(0.001, curr + 1.0);

      osc.connect(screechFilter);
      screechFilter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(curr + 1.0);
    } catch(e){}
  }

  function playBassImpact() {
    if (!audioCtx || isMuted) return;
    try {
      const curr = audioCtx.currentTime;
      const subOsc = audioCtx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(100, curr);
      subOsc.frequency.exponentialRampToValueAtTime(30, curr + 1.5);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.35, curr);
      gain.gain.exponentialRampToValueAtTime(0.001, curr + 1.5);

      subOsc.connect(gain);
      gain.connect(audioCtx.destination);

      subOsc.start();
      subOsc.stop(curr + 1.5);
    } catch(e){}
  }

  // Audio Toggle Button
  const audioToggleBtn = document.getElementById('btn-audio-toggle');
  const audioIcon = document.getElementById('audio-toggle-icon');
  
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      if (!isMuted) {
        audioIcon.className = 'fa-solid fa-volume-high';
        audioToggleBtn.style.borderColor = 'var(--accent-orange)';
        audioToggleBtn.style.color = 'var(--accent-orange)';
        audioToggleBtn.style.background = 'rgba(249, 115, 22, 0.1)';
        
        initAudio();
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        if (engineGain) {
          engineGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        }
      } else {
        audioIcon.className = 'fa-solid fa-volume-xmark';
        audioToggleBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        audioToggleBtn.style.color = '#ffffff';
        audioToggleBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        
        if (engineGain) {
          engineGain.gain.setValueAtTime(0, audioCtx.currentTime);
        }
      }
    });
  }

  // Text Animations via GSAP if available
  const subTag = document.getElementById('loader-subtitle');
  const mainTitle = document.getElementById('loader-title');
  const statusContainer = document.getElementById('loader-status-container');
  const statusText = document.getElementById('loader-status-text');

  setTimeout(() => {
    if (typeof gsap !== 'undefined') {
      gsap.to(subTag, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      gsap.to(mainTitle, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.15 });
      gsap.to(statusContainer, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.3 });
    } else {
      if (subTag) { subTag.style.opacity = '1'; subTag.style.transform = 'translateY(0)'; }
      if (mainTitle) { mainTitle.style.opacity = '1'; mainTitle.style.transform = 'translateY(0)'; }
      if (statusContainer) { statusContainer.style.opacity = '1'; statusContainer.style.transform = 'translateY(0)'; }
    }
  }, 100);

  // Skip button click
  const skipBtn = document.getElementById('btn-skip-loader');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      completeLoading();
    });
  }

  // Helper: Draw sports car front-view
  function drawSportsCar(x, y, carWidth, carHeight, glow, headlightState, driftAngle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(driftAngle);

    // Underglow
    if (glow > 0) {
      let ug = ctx.createRadialGradient(0, carHeight * 0.3, 5, 0, carHeight * 0.3, carWidth * 0.55);
      ug.addColorStop(0, `rgba(249, 115, 22, ${0.75 * glow})`);
      ug.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ug;
      ctx.beginPath();
      ctx.ellipse(0, carHeight * 0.3, carWidth * 0.55, carHeight * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tires
    ctx.fillStyle = '#05070a';
    ctx.beginPath();
    ctx.roundRect(-carWidth * 0.44, carHeight * 0.14, carWidth * 0.11, carHeight * 0.25, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(carWidth * 0.33, carHeight * 0.14, carWidth * 0.11, carHeight * 0.25, 6);
    ctx.fill();

    // Body Diffuser Base shadow
    ctx.fillStyle = '#020304';
    ctx.beginPath();
    ctx.moveTo(-carWidth * 0.42, carHeight * 0.18);
    ctx.lineTo(carWidth * 0.42, carHeight * 0.18);
    ctx.lineTo(carWidth * 0.35, -carHeight * 0.1);
    ctx.lineTo(-carWidth * 0.35, -carHeight * 0.1);
    ctx.closePath();
    ctx.fill();

    // Splitter
    ctx.fillStyle = '#0a0d14';
    ctx.beginPath();
    ctx.moveTo(-carWidth * 0.45, carHeight * 0.18);
    ctx.lineTo(carWidth * 0.45, carHeight * 0.18);
    ctx.lineTo(carWidth * 0.39, carHeight * 0.1);
    ctx.lineTo(-carWidth * 0.39, carHeight * 0.1);
    ctx.closePath();
    ctx.fill();

    // Orange accent splitters
    ctx.fillStyle = 'var(--accent-orange)';
    ctx.beginPath();
    ctx.moveTo(-carWidth * 0.45, carHeight * 0.18);
    ctx.lineTo(-carWidth * 0.43, carHeight * 0.08);
    ctx.lineTo(-carWidth * 0.39, carHeight * 0.1);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(carWidth * 0.45, carHeight * 0.18);
    ctx.lineTo(carWidth * 0.43, carHeight * 0.08);
    ctx.lineTo(carWidth * 0.39, carHeight * 0.1);
    ctx.closePath();
    ctx.fill();

    // Intake Grille
    ctx.fillStyle = '#030508';
    ctx.beginPath();
    ctx.moveTo(-carWidth * 0.33, carHeight * 0.1);
    ctx.lineTo(carWidth * 0.33, carHeight * 0.1);
    ctx.lineTo(carWidth * 0.26, 0);
    ctx.lineTo(-carWidth * 0.26, 0);
    ctx.closePath();
    ctx.fill();

    // Grille mesh lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = -carWidth * 0.26; i <= carWidth * 0.26; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, carHeight * 0.1);
      ctx.lineTo(i * 0.82, 0);
      ctx.stroke();
    }

    // Main Body paint
    let bodyGrad = ctx.createLinearGradient(0, -carHeight * 0.42, 0, carHeight * 0.12);
    bodyGrad.addColorStop(0, '#1f2937');
    bodyGrad.addColorStop(0.3, '#0b0f17');
    bodyGrad.addColorStop(1, '#020305');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.moveTo(-carWidth * 0.44, carHeight * 0.08);
    ctx.bezierCurveTo(-carWidth * 0.41, -carHeight * 0.1, -carWidth * 0.31, -carHeight * 0.21, -carWidth * 0.21, -carHeight * 0.25);
    ctx.lineTo(carWidth * 0.21, -carHeight * 0.25);
    ctx.bezierCurveTo(carWidth * 0.31, -carHeight * 0.21, carWidth * 0.41, -carHeight * 0.1, carWidth * 0.44, carHeight * 0.08);
    ctx.lineTo(carWidth * 0.38, carHeight * 0.12);
    ctx.lineTo(-carWidth * 0.38, carHeight * 0.12);
    ctx.closePath();
    ctx.fill();

    // Crease line highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-carWidth * 0.19, -carHeight * 0.25);
    ctx.lineTo(-carWidth * 0.17, 0);
    ctx.moveTo(carWidth * 0.19, -carHeight * 0.25);
    ctx.lineTo(carWidth * 0.17, 0);
    ctx.stroke();

    // Emblem
    ctx.fillStyle = 'var(--accent-orange)';
    ctx.beginPath();
    ctx.moveTo(0, -carHeight * 0.09);
    ctx.lineTo(3.5, -carHeight * 0.14);
    ctx.lineTo(-3.5, -carHeight * 0.14);
    ctx.closePath();
    ctx.fill();

    // Windshield
    let glassGrad = ctx.createLinearGradient(0, -carHeight * 0.48, 0, -carHeight * 0.25);
    glassGrad.addColorStop(0, '#02060b');
    glassGrad.addColorStop(0.5, '#0b1624');
    glassGrad.addColorStop(1, '#010204');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.moveTo(-carWidth * 0.28, -carHeight * 0.25);
    ctx.lineTo(carWidth * 0.28, -carHeight * 0.25);
    ctx.bezierCurveTo(carWidth * 0.21, -carHeight * 0.41, carWidth * 0.14, -carHeight * 0.47, 0, -carHeight * 0.47);
    ctx.bezierCurveTo(-carWidth * 0.14, -carHeight * 0.47, -carWidth * 0.21, -carHeight * 0.41, -carWidth * 0.28, -carHeight * 0.25);
    ctx.closePath();
    ctx.fill();

    // Glass Reflection streak
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-carWidth * 0.11, -carHeight * 0.44);
    ctx.lineTo(carWidth * 0.08, -carHeight * 0.29);
    ctx.stroke();

    // Roof pillars
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-carWidth * 0.31, -carHeight * 0.25);
    ctx.bezierCurveTo(-carWidth * 0.23, -carHeight * 0.44, -carWidth * 0.15, -carHeight * 0.5, 0, -carHeight * 0.5);
    ctx.bezierCurveTo(carWidth * 0.15, -carHeight * 0.5, carWidth * 0.23, -carHeight * 0.44, carWidth * 0.31, -carHeight * 0.25);
    ctx.stroke();

    // Mirrors
    ctx.fillStyle = '#080c12';
    ctx.beginPath();
    ctx.moveTo(-carWidth * 0.28, -carHeight * 0.35);
    ctx.lineTo(-carWidth * 0.37, -carHeight * 0.33);
    ctx.lineTo(-carWidth * 0.28, -carHeight * 0.31);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(carWidth * 0.28, -carHeight * 0.35);
    ctx.lineTo(carWidth * 0.37, -carHeight * 0.33);
    ctx.lineTo(carWidth * 0.28, -carHeight * 0.31);
    ctx.closePath();
    ctx.fill();

    // Headlight casings and glows
    if (headlightState === 'on' || headlightState === 'bright') {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.8;
      
      // Left headlight
      ctx.beginPath();
      ctx.moveTo(-carWidth * 0.38, carHeight * 0.04);
      ctx.lineTo(-carWidth * 0.24, carHeight * 0.02);
      ctx.lineTo(-carWidth * 0.28, -carHeight * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right headlight
      ctx.beginPath();
      ctx.moveTo(carWidth * 0.38, carHeight * 0.04);
      ctx.lineTo(carWidth * 0.24, carHeight * 0.02);
      ctx.lineTo(carWidth * 0.28, -carHeight * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // DRL LEDs
      ctx.strokeStyle = 'var(--accent-orange)';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'var(--accent-orange)';
      ctx.beginPath();
      ctx.moveTo(-carWidth * 0.37, carHeight * 0.03);
      ctx.lineTo(-carWidth * 0.28, carHeight * 0.015);
      ctx.lineTo(-carWidth * 0.29, -carHeight * 0.02);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(carWidth * 0.37, carHeight * 0.03);
      ctx.lineTo(carWidth * 0.28, carHeight * 0.015);
      ctx.lineTo(carWidth * 0.29, -carHeight * 0.02);
      ctx.stroke();

      // Bright Core Projectors
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(-carWidth * 0.31, carHeight * 0.02, 2.5, 0, Math.PI * 2);
      ctx.arc(-carWidth * 0.34, carHeight * 0.025, 2, 0, Math.PI * 2);
      ctx.arc(carWidth * 0.31, carHeight * 0.02, 2.5, 0, Math.PI * 2);
      ctx.arc(carWidth * 0.34, carHeight * 0.025, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#05070a';
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-carWidth * 0.38, carHeight * 0.04);
      ctx.lineTo(-carWidth * 0.24, carHeight * 0.02);
      ctx.lineTo(-carWidth * 0.28, -carHeight * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(carWidth * 0.38, carHeight * 0.04);
      ctx.lineTo(carWidth * 0.24, carHeight * 0.02);
      ctx.lineTo(carWidth * 0.28, -carHeight * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // Lens Flare streaks (drawn in absolute screen coordinates)
    if (headlightState === 'bright' || glow > 0.8) {
      ctx.save();
      let flareSize = carWidth * (headlightState === 'bright' ? 1.3 : 0.4);
      
      let leftHeadlightX = x - carWidth * 0.325 * Math.cos(driftAngle) + carHeight * 0.02 * Math.sin(driftAngle);
      let leftHeadlightY = y - carWidth * 0.325 * Math.sin(driftAngle) - carHeight * 0.02 * Math.cos(driftAngle);
      
      let rightHeadlightX = x + carWidth * 0.325 * Math.cos(driftAngle) + carHeight * 0.02 * Math.sin(driftAngle);
      let rightHeadlightY = y + carWidth * 0.325 * Math.sin(driftAngle) - carHeight * 0.02 * Math.cos(driftAngle);
      
      drawAnamorphicFlare(leftHeadlightX, leftHeadlightY, flareSize);
      drawAnamorphicFlare(rightHeadlightX, rightHeadlightY, flareSize);
      ctx.restore();
    }
  }

  function drawAnamorphicFlare(hx, hy, size) {
    // Flare core
    let rGrad = ctx.createRadialGradient(hx, hy, 1, hx, hy, size);
    rGrad.addColorStop(0, '#ffffff');
    rGrad.addColorStop(0.04, 'rgba(255, 235, 205, 0.95)');
    rGrad.addColorStop(0.12, 'rgba(249, 115, 22, 0.4)');
    rGrad.addColorStop(0.35, 'rgba(249, 115, 22, 0.06)');
    rGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rGrad;
    ctx.beginPath();
    ctx.arc(hx, hy, size, 0, Math.PI * 2);
    ctx.fill();

    // Streak horizontal line
    let lGrad = ctx.createLinearGradient(hx - size * 2.2, hy, hx + size * 2.2, hy);
    lGrad.addColorStop(0, 'rgba(0,0,0,0)');
    lGrad.addColorStop(0.35, 'rgba(249,115,22,0.06)');
    lGrad.addColorStop(0.5, 'rgba(255,255,255,0.92)');
    lGrad.addColorStop(0.65, 'rgba(249,115,22,0.06)');
    lGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lGrad;
    ctx.beginPath();
    ctx.ellipse(hx, hy, size * 2.2, size * 0.02, 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  // Animation Loop
  function tick(timestamp) {
    if (animationCompleted) return;

    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    // Reset canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Perspective point
    const horizonX = width / 2;
    const horizonY = height * 0.45;

    // 1. Draw Road Lanes
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.15)';
    ctx.lineWidth = 2;
    
    // Draw road side boundaries
    ctx.beginPath();
    ctx.moveTo(horizonX - 10, horizonY);
    ctx.lineTo(-width * 0.2, height);
    ctx.moveTo(horizonX + 10, horizonY);
    ctx.lineTo(width * 1.2, height);
    ctx.stroke();

    // Moving lane dividers
    let speedMult = 0;
    if (elapsed > 1200 && elapsed <= 2800) {
      speedMult = Math.pow((elapsed - 1200) / 1600, 3) * 80;
    } else if (elapsed > 2800 && elapsed <= 3800) {
      speedMult = Math.max(0, (1 - (elapsed - 2800) / 1000)) * 80;
    } else if (elapsed <= 1200) {
      speedMult = 1.5; // slow idle roll
    }

    const timeFactor = (timestamp * 0.005 * (speedMult + 1)) % 100;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([40, 60]);
    ctx.beginPath();
    ctx.moveTo(horizonX, horizonY);
    ctx.lineTo(horizonX, height);
    ctx.lineDashOffset = -timeFactor * 4;
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // Road subtle surface noise
    if (elapsed > 1200) {
      ctx.fillStyle = `rgba(249, 115, 22, ${Math.min(0.04, (elapsed - 1200) / 50000)})`;
      ctx.fillRect(0, horizonY, width, height - horizonY);
    }

    // 2. Manage Particle Systems
    // Spawn ambient smoke initially
    if (elapsed < 1200 && Math.random() < 0.05) {
      smokeParticles.push({
        x: Math.random() * width,
        y: horizonY + Math.random() * (height - horizonY),
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.4,
        size: 15 + Math.random() * 30,
        alpha: 0,
        maxLife: 3000 + Math.random() * 2000,
        life: 0
      });
    }

    // Update Smoke
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
      let p = smokeParticles[i];
      p.life += 16.6; // approx 60fps frame duration
      p.x += p.vx;
      p.y += p.vy;
      
      // Easing alpha
      if (p.life < p.maxLife * 0.2) {
        p.alpha = (p.life / (p.maxLife * 0.2)) * 0.15;
      } else {
        p.alpha = 0.15 * (1 - (p.life - p.maxLife * 0.2) / (p.maxLife * 0.8));
      }

      p.size += 0.2;

      ctx.fillStyle = `rgba(30, 41, 59, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      if (p.life >= p.maxLife) {
        smokeParticles.splice(i, 1);
      }
    }

    // Spawn sparks during drift (2.8s to 3.8s)
    if (elapsed > 2700 && elapsed < 3700) {
      const count = Math.floor(3 + Math.random() * 6);
      for (let k = 0; k < count; k++) {
        sparkParticles.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.4),
          y: height * 0.72 + (Math.random() - 0.5) * 15,
          vx: (Math.random() - 0.5) * 16 + (Math.random() > 0.5 ? 8 : -8),
          vy: -3 - Math.random() * 8,
          alpha: 1,
          size: 1 + Math.random() * 2,
          gravity: 0.25,
          life: 0,
          maxLife: 300 + Math.random() * 500
        });
      }

      if (Math.random() < 0.75) {
        smokeParticles.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.3),
          y: height * 0.73,
          vx: (Math.random() - 0.5) * 6,
          vy: -1 - Math.random() * 3,
          size: 20 + Math.random() * 25,
          alpha: 0,
          maxLife: 1500 + Math.random() * 1000,
          life: 0
        });
      }
    }

    // Update Sparks
    for (let i = sparkParticles.length - 1; i >= 0; i--) {
      let p = sparkParticles[i];
      p.life += 16.6;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha = 1 - (p.life / p.maxLife);

      ctx.strokeStyle = `rgba(249, 115, 22, ${p.alpha})`;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
      ctx.stroke();

      if (p.life >= p.maxLife) {
        sparkParticles.splice(i, 1);
      }
    }

    // 3. Speed Lines
    if (elapsed > 1200 && elapsed < 2800) {
      if (Math.random() < 0.45) {
        let angle = Math.random() * Math.PI * 2;
        let speed = 25 + Math.random() * 35;
        speedLines.push({
          x: horizonX,
          y: horizonY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          len: 15 + Math.random() * 45,
          alpha: 0.4 + Math.random() * 0.6,
          color: Math.random() > 0.5 ? 'rgba(249, 115, 22,' : 'rgba(255,255,255,'
        });
      }
    }

    // Update Speed Lines
    for (let i = speedLines.length - 1; i >= 0; i--) {
      let p = speedLines[i];
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        speedLines.splice(i, 1);
        continue;
      }

      ctx.strokeStyle = p.color + p.alpha + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.8, p.y - p.vy * 0.8);
      ctx.stroke();
    }

    // 4. Car Position, Scaling and Physics Timeline
    let carX = width / 2;
    let carY = height * 0.58;
    let carScale = 0.01;
    let glow = 0;
    let headlightState = 'off';
    let driftAngle = 0;
    let shakeX = 0;
    let shakeY = 0;

    if (elapsed <= 1200) {
      carScale = 0.05;
      carY = horizonY + 12;
      glow = 0.1;
      headlightState = 'off';
      if (statusText) {
        const pct = Math.floor((elapsed / 1200) * 100);
        statusText.innerText = `INITIALIZING SYSTEMS... ${pct}%`;
      }
    } 
    else if (elapsed > 1200 && elapsed <= 2800) {
      if (statusText) statusText.innerText = `READY TO LAUNCH`;
      
      if (elapsed > 1200 && elapsed < 1250 && audioCtx && !isMuted) {
        setEnginePitch(280, 1600, 0.25, 1.6);
      }

      headlightState = 'bright';
      glow = 1.0;
      
      const progress = (elapsed - 1200) / 1600;
      carScale = 0.05 + Math.pow(progress, 5) * 1.15;
      carY = horizonY + 12 + progress * (height * 0.7 - (horizonY + 12));

      const blurFrames = 4;
      for (let f = 1; f < blurFrames; f++) {
        let subProg = progress - (f * 0.025);
        if (subProg > 0) {
          let sScale = 0.05 + Math.pow(subProg, 5) * 1.15;
          let sY = horizonY + 12 + subProg * (height * 0.7 - (horizonY + 12));
          ctx.save();
          ctx.globalAlpha = 0.18 / f;
          drawSportsCar(carX, sY, width * 0.35 * sScale, height * 0.16 * sScale, glow * 0.5, 'on', 0);
          ctx.restore();
        }
      }

      const shakeIntensity = Math.pow(progress, 4) * 20;
      shakeX = (Math.random() - 0.5) * shakeIntensity;
      shakeY = (Math.random() - 0.5) * shakeIntensity;
    } 
    else if (elapsed > 2800 && elapsed <= 3800) {
      if (statusText) statusText.innerText = `BRAKE DETECTED / SYSTEM REVEAL`;

      if (elapsed > 2800 && elapsed < 2850) {
        playDriftScreech();
        if (audioCtx && !isMuted) {
          setEnginePitch(60, 200, 0.05, 0.8);
        }
      }

      headlightState = 'bright';
      glow = 1.0;

      const progress = (elapsed - 2800) / 1000;
      carScale = 1.2 - Math.sin(progress * Math.PI) * 0.06;
      carY = height * 0.7;

      const driftCycle = (elapsed - 2800) / 1000;
      driftAngle = Math.sin(driftCycle * Math.PI) * 0.11;
      carX = width / 2 + Math.sin(driftCycle * Math.PI * 2) * 22;

      const shakeIntensity = (1 - progress) * 24;
      shakeX = (Math.random() - 0.5) * shakeIntensity;
      shakeY = (Math.random() - 0.5) * shakeIntensity;
    } 
    else if (elapsed > 3800) {
      headlightState = 'bright';
      glow = 1.0;
      carScale = 1.2;
      carY = height * 0.7;
      
      const flashProgress = (elapsed - 3800) / 400;
      
      if (flashProgress >= 1) {
        completeLoading();
        return;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashProgress * 0.95})`;
        ctx.fillRect(0, 0, width, height);
      }
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);
    const finalCarW = width * 0.36 * carScale;
    const finalCarH = height * 0.16 * carScale;
    drawSportsCar(carX, carY, finalCarW, finalCarH, glow, headlightState, driftAngle);
    ctx.restore();

    requestAnimationFrame(tick);
  }

  function completeLoading() {
    if (animationCompleted) return;
    animationCompleted = true;

    playBassImpact();
    loader.classList.add('clip-reveal');

    setTimeout(() => {
      loader.classList.add('fade-out');
      document.body.classList.remove('loading');
      if (typeof lenis !== 'undefined' && lenis) {
        lenis.start();
      }

      animateHeroEntrance();

      setTimeout(() => {
        if (engineOsc) {
          try { engineOsc.stop(); } catch(e){}
          engineOsc = null;
        }
        if (audioCtx) {
          audioCtx.close();
          audioCtx = null;
        }
        loader.style.display = 'none';
      }, 1200);

    }, 600);
  }

  requestAnimationFrame(tick);
})();

/* ==========================================================================
   1. LENIS SMOOTH SCROLL & GSAP TICKER
   ========================================================================== */
let lenis = null;
try {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false
  });

  // Stop scroll if loading overlay is active
  if (document.getElementById('cinematic-loader')) {
    lenis.stop();
  }

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Link Lenis to GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
} catch(e) {
  // Lenis or GSAP not available — native scroll is fine
  lenis = null;
}

// Helper function to scroll to sections smoothly
function scrollToSection(selector) {
  if (lenis) {
    lenis.scrollTo(selector, { offset: -80 });
  } else {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ==========================================================================
   1b. HERO VIDEO BACKGROUND INIT
   ========================================================================== */
(function initHeroVideo() {
  const video = document.querySelector('.hero-video-bg');
  if (!video) return;

  function onReady() {
    try {
      gsap.fromTo(video,
        { opacity: 0, scale: 1 },
        { opacity: 1, duration: 1.8, ease: 'power2.out' }
      );
      gsap.to(video, {
        scale: 1.06,
        duration: 18,
        ease: 'none',
        repeat: -1,
        yoyo: true
      });
    } catch(e) {
      video.style.opacity = '1';
    }
  }

  if (video.readyState >= 2) {
    onReady();
  } else {
    video.addEventListener('canplay', onReady, { once: true });
    setTimeout(() => { video.style.opacity = '1'; }, 2500);
  }
})();


/* ==========================================================================
   2. GSAP SCROLLTRIGGERS & NAVBAR STYLES
   ========================================================================== */
try {
  ScrollTrigger.create({
    start: "top -50",
    end: 99999,
    onToggle: (self) => {
      const navbar = document.getElementById("navbar");
      if (self.isActive) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }
  });
} catch(e) {
  // ScrollTrigger not available, use scroll event fallback
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById("navbar");
    if (window.scrollY > 50) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");
  });
}

// Hero text entrance animations — defined as a function triggered after loader
function animateHeroEntrance() {
  try {
    gsap.fromTo(".hero-title",
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.2 }
    );
    gsap.fromTo(".hero-subtitle",
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.4 }
    );
    gsap.fromTo(".hero-buttons",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.6 }
    );
  } catch(e) {
    // GSAP not available — elements are visible by default via CSS
  }
}

// Trigger entrance animation immediately only if loader is absent
if (!document.getElementById('cinematic-loader')) {
  animateHeroEntrance();
}


/* ==========================================================================
   3. VEHICLE INVENTORY DATA (8 PREMIUM PRE-OWNED VEHICLES)
   ========================================================================== */
const carsData = [
  {
    id: 1,
    brand: "Toyota",
    model: "Fortuner 2.8 4x2",
    category: "SUV",
    year: 2020,
    km: "45,000 km",
    fuel: "Diesel",
    transmission: "Automatic",
    image: "public/images/fortuner.png"
  },
  {
    id: 2,
    brand: "Toyota",
    model: "Glanza V",
    category: "Hatchback",
    year: 2022,
    km: "15,000 km",
    fuel: "Petrol",
    transmission: "Automatic",
    image: "public/images/glanza.png"
  },
  {
    id: 3,
    brand: "Toyota",
    model: "Innova Crysta 2.4 GX",
    category: "MUV",
    year: 2020,
    km: "65,000 km",
    fuel: "Diesel",
    transmission: "Manual",
    image: "public/images/innova.png"
  },
  {
    id: 4,
    brand: "Tata",
    model: "Harrier XZ+",
    category: "SUV",
    year: 2022,
    km: "22,000 km",
    fuel: "Diesel",
    transmission: "Manual",
    image: "public/images/harrier.png"
  },
  {
    id: 5,
    brand: "Hyundai",
    model: "Creta SX",
    category: "SUV",
    year: 2021,
    km: "34,200 km",
    fuel: "Petrol",
    transmission: "Manual",
    image: "public/images/creta.png"
  },
  {
    id: 6,
    brand: "Hyundai",
    model: "Verna SX(O)",
    category: "Sedan",
    year: 2021,
    km: "32,000 km",
    fuel: "Petrol",
    transmission: "Manual",
    image: "public/images/verna.png"
  },
  {
    id: 7,
    brand: "Honda",
    model: "City V MT",
    category: "Sedan",
    year: 2019,
    km: "41,000 km",
    fuel: "Petrol",
    transmission: "Manual",
    image: "public/images/city.png"
  },
  {
    id: 8,
    brand: "Mahindra",
    model: "XUV500 W7",
    category: "SUV",
    year: 2018,
    km: "72,000 km",
    fuel: "Diesel",
    transmission: "Manual",
    image: "public/images/xuv500.png"
  }
];

// Active Filters State
let currentFilteredCars = [...carsData];

/* ==========================================================================
   4. RENDER MARKETPLACE GRID CARDS
   ========================================================================== */
function renderCarsGrid(carsList) {
  const container = document.getElementById("cars-grid-container");
  if (!container) return;
  container.innerHTML = "";
  
  if (carsList.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--accent-orange); margin-bottom: 1rem;"></i>
        <h3>No Cars Found</h3>
        <p style="color: var(--text-muted);">Try adjusting your search filters to find available verified cars.</p>
        <button class="btn-card-detail" style="margin-top: 1.5rem;" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }
  
  carsList.forEach(car => {
    const card = document.createElement("div");
    card.className = "car-card";
    card.innerHTML = `
      <div class="car-card-img-wrap" onclick="triggerCarModal(${car.id})">
        <span class="inspected-badge"><i class="fa-solid fa-circle-check"></i> Inspected</span>
        <img src="${car.image}" alt="${car.brand} ${car.model}">
      </div>
      <div class="car-card-content">
        <h3 class="car-card-title">${car.brand} ${car.model}</h3>
        <div class="car-card-specs">
          <span>${car.year}</span>
          <span>${car.km}</span>
          <span>${car.fuel}</span>
          <span>${car.transmission}</span>
        </div>
        <div class="car-card-footer">
          <div class="car-card-price-wrap">
            <span class="car-card-price" style="font-size: 1.05rem; display: flex; align-items: center; gap: 0.35rem;">
              <i class="fa-solid fa-certificate" style="color: var(--accent-orange);"></i> Certified Premium
            </span>
          </div>
        </div>
        <div class="car-card-actions">
          <button class="btn-card-detail" onclick="triggerCarModal(${car.id})">Details</button>
          <button class="btn-card-whatsapp" onclick="sendWhatsAppInquiry(${car.id})"><i class="fa-brands fa-whatsapp"></i> Inquiry</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  
  // Car-card entrance is handled by CSS @keyframes fadeInUp
}

// Initial Grid Render
renderCarsGrid(carsData);

/* ==========================================================================
   5. SEARCH FILTER LOGIC
   ========================================================================== */
function handleSearchSubmit() {
  const brand = document.getElementById("search-brand").value;
  const fuel = document.getElementById("search-fuel").value;
  const transmission = document.getElementById("search-transmission").value;
  const year = document.getElementById("search-year").value;
  
  currentFilteredCars = carsData.filter(car => {
    if (brand && car.brand !== brand) return false;
    if (fuel && car.fuel !== fuel) return false;
    if (transmission && car.transmission !== transmission) return false;
    if (year && car.year < parseInt(year)) return false;
    return true;
  });
  
  // Highlight search filter state
  updateFilterPills(null);
  
  renderCarsGrid(currentFilteredCars);
  scrollToSection("#featured-cars");
}

function filterByCategory(category) {
  currentFilteredCars = carsData.filter(car => car.category === category);
  
  // Highlight active filter pill
  updateFilterPills(category);
  
  renderCarsGrid(currentFilteredCars);
  scrollToSection("#featured-cars");
}

function resetFilters() {
  currentFilteredCars = [...carsData];
  
  // Reset form inputs
  const form = document.getElementById("search-form");
  if (form) form.reset();
  
  // Reset active filter pills
  updateFilterPills("all");
  
  renderCarsGrid(carsData);
}

function updateFilterPills(activeCategory) {
  const pills = {
    all: document.getElementById("btn-filter-all"),
    Hatchback: document.getElementById("btn-filter-hatch"),
    Sedan: document.getElementById("btn-filter-sedan"),
    SUV: document.getElementById("btn-filter-suv")
  };
  
  Object.keys(pills).forEach(key => {
    if (pills[key]) {
      pills[key].style.background = "transparent";
      pills[key].style.color = "var(--primary)";
      pills[key].style.borderColor = "var(--primary)";
    }
  });
  
  if (activeCategory && pills[activeCategory]) {
    pills[activeCategory].style.background = "var(--primary)";
    pills[activeCategory].style.color = "#FFF";
    pills[activeCategory].style.borderColor = "var(--primary)";
  }
}

/* ==========================================================================
   6. WHITE CAR SLIDER LOGIC
   ========================================================================== */
let activeSlideIndex = 0;
const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".slider-dot");
let isSliderTransitioning = false;

function slideTo(index) {
  if (isSliderTransitioning || index === activeSlideIndex || !slides.length) return;
  isSliderTransitioning = true;
  
  const currentSlide = slides[activeSlideIndex];
  const nextSlide = slides[index];
  
  // Update Dot Classes
  if (dots[activeSlideIndex]) dots[activeSlideIndex].classList.remove("active");
  if (dots[index]) dots[index].classList.add("active");
  
  // Transition old out, new in
  const directionClass = index > activeSlideIndex ? "exit-left" : "exit-right";
  
  currentSlide.classList.add(directionClass);
  currentSlide.classList.remove("active");
  
  nextSlide.style.transform = index > activeSlideIndex ? "translateX(100px)" : "translateX(-100px)";
  nextSlide.style.opacity = "0";
  nextSlide.classList.add("active");
  
  // Small timeout to allow reflow, then animate new
  setTimeout(() => {
    nextSlide.style.transform = "translateX(0)";
    nextSlide.style.opacity = "1";
    
    // GSAP Spec text stagger entry
    const title = nextSlide.querySelector(".slide-car-name");
    const badge = nextSlide.querySelector(".slide-car-badge") || nextSlide.querySelector(".slide-car-price");
    const specs = nextSlide.querySelector(".slide-specs-grid");
    const button = nextSlide.querySelector(".btn-slide-detail");
    const img = nextSlide.querySelector(".slide-image-right img");
    
    const animElements = [title, badge, specs, button].filter(Boolean);
    
    try {
      gsap.fromTo(animElements, 
        { opacity: 0, x: -30 }, 
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }
      );
      gsap.fromTo(img, 
        { opacity: 0, scale: 0.9, x: 40 }, 
        { opacity: 1, scale: 1, x: 0, duration: 0.8, ease: "power3.out" }
      );
    } catch(e) {
      // Graceful fallback if GSAP fails
    }
    
    // Clean exit classes after transition completes
    setTimeout(() => {
      currentSlide.classList.remove("exit-left", "exit-right");
      activeSlideIndex = index;
      isSliderTransitioning = false;
    }, 600);
  }, 50);
}

function slideNext() {
  if (!slides.length) return;
  let nextIndex = (activeSlideIndex + 1) % slides.length;
  slideTo(nextIndex);
}

function slidePrev() {
  if (!slides.length) return;
  let prevIndex = (activeSlideIndex - 1 + slides.length) % slides.length;
  slideTo(prevIndex);
}


/* ==========================================================================
   7. VALUATION LEAD FORM LOGIC & MODALS
   ========================================================================== */
function handleSellSubmit() {
  const name = document.getElementById("sell-name").value;
  const phone = document.getElementById("sell-phone").value;
  const brand = document.getElementById("sell-brand").value;
  const model = document.getElementById("sell-model").value;
  const year = document.getElementById("sell-year").value;
  const remarks = document.getElementById("sell-remarks") ? document.getElementById("sell-remarks").value : "";
  
  const message = `Valuation request received for ${name}'s ${year} ${brand} ${model}.
  <br><br>
  <strong>Car Remarks/Condition:</strong> ${remarks || "None provided"}
  <br><br>
  We have sent a text notification to <strong>${phone}</strong>. Our inspector will call you shortly to arrange a free doorstep inspection.`;
  
  document.getElementById("success-message").innerHTML = message;
  document.getElementById("success-modal").classList.add("active");
  
  const form = document.getElementById("sell-form");
  if (form) form.reset();
}

function closeSuccessModal() {
  document.getElementById("success-modal").classList.remove("active");
}

/* ==========================================================================
   8. CAR DETAILS SPEC MODAL
   ========================================================================== */
function triggerCarModal(carId) {
  const car = carsData.find(c => c.id === carId);
  if (!car) return;
  
  document.getElementById("modal-car-name").innerText = `${car.brand} ${car.model}`;
  document.getElementById("modal-car-img").src = car.image;
  document.getElementById("modal-car-year").innerText = car.year;
  document.getElementById("modal-car-km").innerText = car.km;
  document.getElementById("modal-car-fuel").innerText = car.fuel;
  document.getElementById("modal-car-transmission").innerText = car.transmission;
  
  const statusEl = document.getElementById("modal-car-status");
  const warrantyEl = document.getElementById("modal-car-warranty");
  if (statusEl) statusEl.innerText = "Available";
  if (warrantyEl) warrantyEl.innerText = "1-Year Warranty Included";
  
  // Custom WhatsApp message (no price references)
  const waMessage = `Hi Car Mart, I am interested in the verified used ${car.brand} ${car.model} (${car.year}). Please share availability and details.`;
  const waLink = document.getElementById("modal-whatsapp-link");
  if (waLink) waLink.href = `https://wa.me/919008740899?text=${encodeURIComponent(waMessage)}`;
  
  document.getElementById("car-modal").classList.add("active");
}

function closeCarModal() {
  document.getElementById("car-modal").classList.remove("active");
}

function sendWhatsAppInquiry(carId) {
  const car = carsData.find(c => c.id === carId);
  if (!car) return;
  
  const waMessage = `Hi Car Mart, I am interested in inquiring about the verified used ${car.brand} ${car.model} (${car.year}).`;
  window.open(`https://wa.me/919008740899?text=${encodeURIComponent(waMessage)}`, '_blank');
}

// Close modals when clicking overlay background
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", function(e) {
    if (e.target === this) {
      this.classList.remove("active");
    }
  });
});

/* ==========================================================================
   9. PREMIUM SHOWROOM GALLERY DYNAMIC INTERACTIONS
   ========================================================================== */
function filterGallery(category, buttonEl) {
  // Update active state of button tabs
  const filterBtns = document.querySelectorAll(".gallery-filter-btn");
  filterBtns.forEach(btn => btn.classList.remove("active"));
  if (buttonEl) {
    buttonEl.classList.add("active");
  }

  const items = document.querySelectorAll(".gallery-item");
  let visibleCount = 0;

  // Scale and fade out items, filter, then scale and fade in matching items
  gsap.to(items, {
    opacity: 0,
    scale: 0.94,
    y: 20,
    duration: 0.35,
    stagger: 0.02,
    ease: "power2.inOut",
    onComplete: () => {
      items.forEach(item => {
        const itemCat = item.getAttribute("data-category");
        if (category === "All" || itemCat === category) {
          item.style.display = ""; // Show
          visibleCount++;
        } else {
          item.style.display = "none"; // Hide
        }
      });

      // Update counter text
      const totalCount = items.length;
      const countTextEl = document.getElementById("gallery-count-text");
      if (countTextEl) {
        countTextEl.innerText = `Showing ${visibleCount} of ${totalCount} premium vehicles`;
      }

      // Filter to retrieve only matching visible items
      const visibleItems = Array.from(items).filter(item => item.style.display !== "none");

      gsap.to(visibleItems, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.03,
        ease: "power3.out",
        clearProps: "scale,y,opacity" // Keep CSS parameters clean for subsequent mouse tilts
      });
    }
  });
}

// Self-invoking showroom mouse tracker and 3D parallax tilt controller
(function initShowroomInteractions() {
  const galleryItems = document.querySelectorAll(".gallery-item");
  if (!galleryItems.length) return;

  galleryItems.forEach(item => {
    // Mouse hover mouse tracker coordinates
    item.addEventListener("mousemove", (e) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      item.style.setProperty("--mouse-x", `${x}px`);
      item.style.setProperty("--mouse-y", `${y}px`);

      // 3D Parallax Tilt Calculation
      const width = rect.width;
      const height = rect.height;
      const centerX = rect.left + width / 2;
      const centerY = rect.top + height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      const maxRotateX = 6;
      const maxRotateY = 6;

      const rotateX = -1 * (mouseY / (height / 2)) * maxRotateX;
      const rotateY = (mouseX / (width / 2)) * maxRotateY;

      item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.025, 1.025, 1.025)`;
    });

    // Reset rotations smoothly when mouse leaves the card bounds
    item.addEventListener("mouseleave", () => {
      item.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      item.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)";
    });

    // Clear smooth reset transitions when mouse re-enters so tilt responds instantly
    item.addEventListener("mouseenter", () => {
      item.style.transition = "none";
    });
  });
})();
